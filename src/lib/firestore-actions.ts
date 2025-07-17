

// This file contains all the functions that interact with Firestore.
// It is separated from the React context to avoid issues with Next.js Fast Refresh.
import { collection, addDoc, doc, setDoc, deleteDoc, query, where, writeBatch, getDocs, Timestamp, CollectionReference, DocumentReference, orderBy, limit } from 'firebase/firestore';
import type { Person, Session, SessionAttendance, Tariff, VacationPeriod, Actividad, Specialist, Space, Level, Payment, NewPersonData, AuditLog, Operator } from '@/types';
import { db } from './firebase';
import { format as formatDate, addMonths, subMonths, startOfDay, isBefore } from 'date-fns';
import { calculateNextPaymentDate } from './utils';

// Helper function to remove undefined fields from an object before Firestore operations.
const cleanDataForFirestore = (data: any) => {
    const cleanData = { ...data };
    for (const key in cleanData) {
        if (cleanData[key] === undefined) {
            delete cleanData[key];
        }
    }
    return cleanData;
};


// Generic Actions
export const addEntity = async (collectionRef: CollectionReference, data: any) => {
    const cleanData = cleanDataForFirestore(data);
    return await addDoc(collectionRef, cleanData);
};

export const updateEntity = async (docRef: any, data: any) => {
    const { id, ...updateDataRaw } = data; // Don't save the id inside the document
    const updateData = cleanDataForFirestore(updateDataRaw);
    return await setDoc(docRef, updateData, { merge: true });
};

export const deleteEntity = async (docRef: any) => {
    return await deleteDoc(docRef);
};


// Specific Actions
export const addPersonAction = async (peopleRef: CollectionReference, personData: NewPersonData, auditLogRef: CollectionReference, operator: Operator) => {
    
    const newPerson = {
        name: personData.name,
        phone: personData.phone,
        tariffId: personData.tariffId,
        levelId: personData.levelId,
        healthInfo: personData.healthInfo,
        notes: personData.notes,
        joinDate: personData.joinDate || new Date(),
        lastPaymentDate: personData.lastPaymentDate || null, // Allow setting initial due date
        avatar: `https://placehold.co/100x100.png`,
        vacationPeriods: [],
        outstandingPayments: personData.lastPaymentDate ? 0 : 1, // Start with 1 outstanding payment if no due date is set
    };
    
    const batch = writeBatch(db);
    const now = new Date();

    // Create the person document
    const personDocRef = doc(peopleRef);
    batch.set(personDocRef, cleanDataForFirestore(newPerson));

    // Add to audit log
    batch.set(doc(auditLogRef), {
        operatorId: operator.id,
        operatorName: operator.name,
        action: 'CREAR_PERSONA',
        entityType: 'persona',
        entityId: personDocRef.id,
        entityName: personData.name,
        timestamp: now,
    } as Omit<AuditLog, 'id'>);
    
    return await batch.commit();
};

export const deletePersonAction = async (sessionsRef: CollectionReference, peopleRef: CollectionReference, personId: string, personName: string, auditLogRef: CollectionReference, operator: Operator) => {
    const batch = writeBatch(db);
    const now = new Date();

    // Add to audit log
    batch.set(doc(auditLogRef), {
        operatorId: operator.id,
        operatorName: operator.name,
        action: 'ELIMINAR_PERSONA',
        entityType: 'persona',
        entityId: personId,
        entityName: personName,
        timestamp: now,
    } as Omit<AuditLog, 'id'>);

    // Remove person from all sessions they are enrolled in
    const personSessionsQuery = query(sessionsRef, where('personIds', 'array-contains', personId));
    const personSessionsSnap = await getDocs(personSessionsQuery);
    
    personSessionsSnap.forEach(sessionDoc => {
        const sessionData = sessionDoc.data() as Session;
        const updatedPersonIds = sessionData.personIds.filter(id => id !== personId);
        batch.update(sessionDoc.ref, { personIds: updatedPersonIds });
    });

    // Also remove from waitlists
    const personWaitlistQuery = query(sessionsRef, where('waitlistPersonIds', 'array-contains', personId));
    const personWaitlistSnap = await getDocs(personWaitlistQuery);
    personWaitlistSnap.forEach(sessionDoc => {
        const sessionData = sessionDoc.data() as Session;
        const updatedWaitlistIds = (sessionData.waitlistPersonIds || []).filter(id => id !== personId);
        batch.update(sessionDoc.ref, { waitlistPersonIds: updatedWaitlistIds });
    });

    // Delete the person document
    const personRef = doc(peopleRef, personId);
    batch.delete(personRef);

    return await batch.commit();
};


export const recordPaymentAction = async (paymentsRef: CollectionReference, personRef: DocumentReference, person: Person, tariff: Tariff, auditLogRef: CollectionReference, operator: Operator) => {
    const now = new Date();
    
    // Decrease the number of outstanding payments by one.
    const newOutstandingPayments = Math.max(0, (person.outstandingPayments || 0) - 1);

    // The due date only advances if the person is fully paid up.
    let newExpiryDate = person.lastPaymentDate;
    if (newOutstandingPayments === 0) {
        newExpiryDate = calculateNextPaymentDate(person.lastPaymentDate || now, person.joinDate, tariff);
    }
    
    const paymentRecord = {
        personId: person.id,
        date: now,
        amount: tariff.price,
        tariffId: tariff.id,
        timestamp: now,
    };
    const batch = writeBatch(db);

    const paymentRef = doc(paymentsRef);
    batch.set(paymentRef, paymentRecord);
    
    batch.update(personRef, { 
        lastPaymentDate: newExpiryDate,
        outstandingPayments: newOutstandingPayments,
     });
     
    // Create audit log
    batch.set(doc(auditLogRef), {
        operatorId: operator.id,
        operatorName: operator.name,
        action: 'REGISTRO_PAGO',
        entityType: 'pago',
        entityId: person.id,
        entityName: person.name,
        timestamp: now,
        details: {
            amount: tariff.price,
            tariffName: tariff.name
        }
    } as Omit<AuditLog, 'id'>);

    return await batch.commit();
};

export const revertLastPaymentAction = async (paymentsRef: CollectionReference, personRef: DocumentReference, personId: string, currentPerson: Person, auditLogRef: CollectionReference, operator: Operator) => {
    const batch = writeBatch(db);
    const now = new Date();

    // 1. Find all payments for the person
    const q = query(paymentsRef, where('personId', '==', personId));
    const paymentsSnap = await getDocs(q);

    if (paymentsSnap.empty) {
        throw new Error("No hay pagos para revertir para esta persona.");
    }

    // 2. Sort payments by date locally to find the latest one
    const allPayments = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment))
        .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

    const lastPayment = allPayments[0];
    
    // Determine the new state
    let newLastPaymentDate: Date | null = currentPerson.lastPaymentDate;
    const newOutstandingPayments = (currentPerson.outstandingPayments || 0) + 1;
    
    // 3. Delete the most recent payment document
    const lastPaymentRef = doc(paymentsRef, lastPayment.id);
    batch.delete(lastPaymentRef);

    // 4. Update the person's document
    batch.update(personRef, { 
        lastPaymentDate: newLastPaymentDate,
        outstandingPayments: newOutstandingPayments,
    });
    
    // 5. Create audit log for the reversion
     batch.set(doc(auditLogRef), {
        operatorId: operator.id,
        operatorName: operator.name,
        action: 'REVERTIR_PAGO',
        entityType: 'pago',
        entityId: currentPerson.id,
        entityName: currentPerson.name,
        timestamp: now,
        details: {
            amount: lastPayment.amount,
            paymentDate: lastPayment.date
        }
    } as Omit<AuditLog, 'id'>);

    return await batch.commit();
};


export const enrollPersonInSessionsAction = async (sessionsRef: CollectionReference, personId: string, sessionIds: string[]) => {
    const batch = writeBatch(db);
    
    // First, find all sessions the person is currently enrolled in
    const currentEnrollmentsQuery = query(sessionsRef, where('personIds', 'array-contains', personId));
    const currentEnrollmentsSnap = await getDocs(currentEnrollmentsQuery);
    const currentSessionIds = currentEnrollmentsSnap.docs.map(d => d.id);

    // Determine which sessions to remove the person from
    const sessionsToRemoveFrom = currentSessionIds.filter(id => !sessionIds.includes(id));
    sessionsToRemoveFrom.forEach(sessionId => {
        const sessionRef = doc(sessionsRef, sessionId);
        const sessionDoc = currentEnrollmentsSnap.docs.find(d => d.id === sessionId);
        if (sessionDoc) {
            const sessionData = sessionDoc.data() as Session;
            const updatedPersonIds = sessionData.personIds.filter(id => id !== personId);
            batch.update(sessionRef, { personIds: updatedPersonIds });
        }
    });

    // Determine which sessions to add the person to
    const sessionsToAddTo = sessionIds.filter(id => !currentSessionIds.includes(id));
    for (const sessionId of sessionsToAddTo) {
        const sessionRef = doc(sessionsRef, sessionId);
        // We need to fetch the session to safely add the person without removing others
        // A simple getDoc would be more efficient if we know the doc exists
        const sessionDocSnap = await getDocs(query(sessionsRef, where('__name__', '==', sessionId), limit(1)));
        if (!sessionDocSnap.empty) {
            const sessionData = sessionDocSnap.docs[0].data() as Session;
            const updatedPersonIds = Array.from(new Set([...sessionData.personIds, personId]));
            batch.update(sessionRef, { personIds: updatedPersonIds });
        }
    }
    
    return await batch.commit();
};


export const enrollPeopleInClassAction = async (sessionRef: any, personIds: string[]) => {
    return await updateEntity(sessionRef, { personIds });
};


export const saveAttendanceAction = async (attendanceRef: CollectionReference, sessionId: string, presentIds: string[], absentIds: string[], justifiedAbsenceIds: string[]) => {
    const dateStr = formatDate(new Date(), 'yyyy-MM-dd');
    const attendanceQuery = query(attendanceRef, where('sessionId', '==', sessionId), where('date', '==', dateStr));
    
    const snap = await getDocs(attendanceQuery);
    
    if (snap.empty) {
        const record = { sessionId, date: dateStr, presentIds, absentIds, justifiedAbsenceIds };
        await addEntity(attendanceRef, record);
    } else {
        const docRef = snap.docs[0].ref;
        const existingData = snap.docs[0].data() as SessionAttendance;
        const updatedData = { 
            ...existingData, 
            presentIds, 
            absentIds, 
            justifiedAbsenceIds 
        };
        await updateEntity(docRef, updatedData);
    }
};

export const addJustifiedAbsenceAction = async (attendanceRef: CollectionReference, personId: string, sessionId: string, date: Date) => {
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    const attendanceQuery = query(attendanceRef, where('sessionId', '==', sessionId), where('date', '==', dateStr));
    
    const snap = await getDocs(attendanceQuery);
    if (snap.empty) {
        await addEntity(attendanceRef, { sessionId, date: dateStr, presentIds: [], absentIds: [], justifiedAbsenceIds: [personId] });
    } else {
        const record = snap.docs[0].data() as SessionAttendance;
        const updatedJustified = Array.from(new Set([...(record.justifiedAbsenceIds || []), personId]));
        await updateEntity(snap.docs[0].ref, { justifiedAbsenceIds: updatedJustified });
    }
};

export const addOneTimeAttendeeAction = async (attendanceRef: CollectionReference, sessionId: string, personId: string, date: Date) => {
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    const attendanceQuery = query(attendanceRef, where('sessionId', '==', sessionId), where('date', '==', dateStr));

    const snap = await getDocs(attendanceQuery);
    if (snap.empty) {
        await addEntity(attendanceRef, { sessionId, date: dateStr, presentIds: [], absentIds: [], justifiedAbsenceIds: [], oneTimeAttendees: [personId] });
    } else {
        const record = snap.docs[0].data() as SessionAttendance;
        const updatedAttendees = Array.from(new Set([...(record.oneTimeAttendees || []), personId]));
        await updateEntity(snap.docs[0].ref, { oneTimeAttendees: updatedAttendees });
    }
};

export const addVacationPeriodAction = async (personDocRef: any, person: Person, startDate: Date, endDate: Date) => {
    const newVacation: VacationPeriod = { id: `vac-${Date.now()}`, startDate, endDate };
    const updatedVacations = [...(person.vacationPeriods || []), newVacation];
    return updateEntity(personDocRef, { vacationPeriods: updatedVacations });
};

export const removeVacationPeriodAction = async (personDocRef: any, person: Person, vacationId: string) => {
    if (!person.vacationPeriods) return;
    const updatedVacations = person.vacationPeriods.filter(v => v.id !== vacationId);
    return updateEntity(personDocRef, { vacationPeriods: updatedVacations });
};

export const addToWaitlistAction = async (sessionDocRef: any, session: Session, personId: string) => {
    const updatedWaitlist = Array.from(new Set([...(session.waitlistPersonIds || []), personId]));
    return updateEntity(sessionDocRef, { waitlistPersonIds: updatedWaitlist });
};

export const enrollFromWaitlistAction = async (sessionsRef: CollectionReference, notificationsRef: CollectionReference, notificationId: string, sessionId: string, personId: string, session: Session) => {
    const batch = writeBatch(db);
    const sessionRef = doc(sessionsRef, sessionId);
    const newPersonIds = Array.from(new Set([...session.personIds, personId]));
    const newWaitlist = session.waitlistPersonIds?.filter(id => id !== personId) || [];
    batch.update(sessionRef, { personIds: newPersonIds, waitlistPersonIds: newWaitlist });
    
    const notifRef = doc(notificationsRef, notificationId);
    batch.delete(notifRef);
    
    return await batch.commit();
};

type AllDataContext = {
    sessions: Session[];
    people: Person[];
    actividades: Actividad[];
    specialists: Specialist[];
    spaces: Space[];
    levels: Level[];
};

export const deleteWithUsageCheckAction = async (
    entityId: string,
    checks: { collection: string; field: string; label: string, type?: 'array' }[],
    collectionRefs: Record<string, CollectionReference>,
    allDataForMessages: AllDataContext
) => {
    const usageMessages: string[] = [];

    for (const check of checks) {
        const collectionToCheckRef = collectionRefs[check.collection];
        if (!collectionToCheckRef) {
            console.warn(`Collection reference not found for: ${check.collection}`);
            continue;
        }

        const fieldToCheck = check.field;
        const q = check.type === 'array'
            ? query(collectionToCheckRef, where(fieldToCheck, 'array-contains', entityId))
            : query(collectionToCheckRef, where(fieldToCheck, '==', entityId));
        
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const itemsInUse = snapshot.docs.map(d => d.data());
            let details = '';
            
            if (check.collection === 'sessions') {
                details = itemsInUse.map(s => {
                    const actividad = allDataForMessages.actividades.find(a => a.id === s.actividadId);
                    return `- ${actividad?.name || 'Clase'} (${s.dayOfWeek} ${s.time})`;
                }).join('\n');
                usageMessages.push(`Está asignado a ${itemsInUse.length} sesión(es):\n${details}`);
            } else if (check.collection === 'people') {
                 details = itemsInUse.map(p => `- ${p.name}`).join('\n');
                 usageMessages.push(`Está asignado a ${itemsInUse.length} persona(s):\n${details}`);
            } else if (check.collection === 'specialists') {
                 details = itemsInUse.map(s => `- ${s.name}`).join('\n');
                 usageMessages.push(`Está asignado a ${itemsInUse.length} especialista(s):\n${details}`);
            } else {
                usageMessages.push(`Está en uso por ${itemsInUse.length} ${check.label}(s).`);
            }
        }
    }

    if (usageMessages.length > 0) {
        throw new Error(usageMessages.join('\n\n'));
    }
};

export const updateOverdueStatusesAction = async (peopleRef: CollectionReference, people: Person[], tariffs: Tariff[], operator: Operator, auditLogRef: CollectionReference) => {
    const batch = writeBatch(db);
    const today = startOfDay(new Date());
    let updatedCount = 0;

    for (const person of people) {
        if (!person.lastPaymentDate || !(person.lastPaymentDate instanceof Date)) continue;

        const tariff = tariffs.find(t => t.id === person.tariffId);
        if (!tariff) continue;
        
        const dueDate = startOfDay(person.lastPaymentDate);

        // Check if the person is already overdue
        if (isBefore(dueDate, today)) {
            let cyclesMissed = 0;
            let dateCursor = dueDate;
            
            // Calculate how many payment cycles have been missed since the due date
            while (isBefore(dateCursor, today)) {
                cyclesMissed++;
                dateCursor = calculateNextPaymentDate(dateCursor, person.joinDate, tariff);
            }
            
            if (cyclesMissed > 0) {
                 const currentOutstanding = person.outstandingPayments || 0;
                 const newOutstandingPayments = currentOutstanding + cyclesMissed;
                 
                 updatedCount++;
                 const personDocRef = doc(peopleRef, person.id);
                 // We DO NOT update lastPaymentDate here. That only happens on payment.
                 // We only update the debt counter.
                 batch.update(personDocRef, { outstandingPayments: newOutstandingPayments });
            }
        }
    }
    
    if (updatedCount > 0) {
        batch.set(doc(auditLogRef), {
            operatorId: operator.id,
            operatorName: operator.name,
            action: 'ACTUALIZAR_DEUDAS',
            entityType: 'sistema',
            entityName: `Se actualizaron ${updatedCount} deudores.`,
            timestamp: new Date(),
        } as Omit<AuditLog, 'id'>);
    }

    if (updatedCount > 0) {
        await batch.commit();
    }
    
    return updatedCount;
};
