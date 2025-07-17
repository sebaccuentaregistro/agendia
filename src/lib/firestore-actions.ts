

// This file contains all the functions that interact with Firestore.
// It is separated from the React context to avoid issues with Next.js Fast Refresh.
import { collection, addDoc, doc, setDoc, deleteDoc, query, where, writeBatch, getDocs, Timestamp, CollectionReference, DocumentReference, orderBy, limit, updateDoc, arrayUnion, runTransaction, getDoc } from 'firebase/firestore';
import type { Person, Session, SessionAttendance, Tariff, VacationPeriod, Actividad, Specialist, Space, Level, Payment, NewPersonData, AuditLog, Operator, AppNotification, WaitlistEntry } from '@/types';
import { db } from './firebase';
import { format as formatDate, addMonths, subMonths, startOfDay, isBefore, parse } from 'date-fns';
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

async function checkForChurnRisk(personId: string, allPersonSessions: Session[], allAttendance: SessionAttendance[], notificationsRef: CollectionReference) {
    const personSessionIds = new Set(allPersonSessions.map(s => s.id));
    
    // Get all attendance records for this person's sessions, sorted by date descending
    const relevantAttendance = allAttendance
        .filter(a => personSessionIds.has(a.sessionId))
        .sort((a, b) => b.date.localeCompare(a.date));

    let consecutiveAbsences = 0;
    
    // Check the last 3 attendance records for this person's sessions
    for (let i = 0; i < Math.min(relevantAttendance.length, 5); i++) {
        const record = relevantAttendance[i];
        if (record.absentIds?.includes(personId)) {
            consecutiveAbsences++;
        } else if (record.presentIds?.includes(personId) || record.justifiedAbsenceIds?.includes(personId)) {
            // Presence or justified absence breaks the streak
            break;
        }
    }
    
    if (consecutiveAbsences >= 3) {
        // Check if a churn risk notification already exists for this person
        const q = query(notificationsRef, where('personId', '==', personId), where('type', '==', 'churnRisk'));
        const existingNotifs = await getDocs(q);

        if (existingNotifs.empty) {
            const newNotification: Omit<AppNotification, 'id'> = {
                type: 'churnRisk',
                personId: personId,
                createdAt: new Date(),
            };
            await addDoc(notificationsRef, newNotification);
        }
    }
}


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
    
    await batch.commit();

    return personDocRef.id;
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
    const personWaitlistQuery = query(sessionsRef, where('waitlist', 'array-contains', personId));
    const personWaitlistSnap = await getDocs(personWaitlistQuery);
    personWaitlistSnap.forEach(sessionDoc => {
        const sessionData = sessionDoc.data() as Session;
        const updatedWaitlist = (sessionData.waitlist || []).filter(entry => typeof entry === 'string' && entry !== personId);
        batch.update(sessionDoc.ref, { waitlist: updatedWaitlist });
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
    const newOutstandingPayments = (currentPerson.outstandingPayments || 0) + 1;
    
    // 3. Delete the most recent payment document
    const lastPaymentRef = doc(paymentsRef, lastPayment.id);
    batch.delete(lastPaymentRef);

    // 4. Update the person's document
    batch.update(personRef, {
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


export const enrollPersonInSessionsAction = async (sessionsRef: CollectionReference, personId: string, desiredSessionIds: string[]) => {
    // This is a simplified version. For a more robust solution, you would
    // run this inside a transaction to prevent race conditions.
    const batch = writeBatch(db);

    // First, find all sessions the person is currently enrolled in
    const currentEnrollmentsQuery = query(sessionsRef, where('personIds', 'array-contains', personId));
    const currentEnrollmentsSnap = await getDocs(currentEnrollmentsQuery);
    const currentSessionIds = new Set(currentEnrollmentsSnap.docs.map(d => d.id));

    // Determine which sessions to remove the person from
    const sessionsToRemoveFrom = Array.from(currentSessionIds).filter(id => !desiredSessionIds.includes(id));
    for (const sessionId of sessionsToRemoveFrom) {
        const sessionRef = doc(sessionsRef, sessionId);
        const sessionData = currentEnrollmentsSnap.docs.find(d => d.id === sessionId)?.data() as Session;
        if (sessionData) {
            const updatedPersonIds = sessionData.personIds.filter(id => id !== personId);
            batch.update(sessionRef, { personIds: updatedPersonIds });
        }
    }

    // Determine which sessions to add the person to
    const sessionsToAddTo = desiredSessionIds.filter(id => !currentSessionIds.has(id));
    for (const sessionId of sessionsToAddTo) {
        const sessionRef = doc(sessionsRef, sessionId);
        batch.update(sessionRef, { personIds: arrayUnion(personId) });
    }
    
    await batch.commit();
    return sessionsToRemoveFrom; // Return IDs of sessions the person was removed from
};




export const enrollPeopleInClassAction = async (sessionRef: any, personIds: string[]) => {
    return await updateEntity(sessionRef, { personIds });
};


export const saveAttendanceAction = async (
    attendanceRef: CollectionReference,
    sessionId: string,
    presentIds: string[],
    absentIds: string[],
    justifiedAbsenceIds: string[],
    allPersonSessions: Session[],
    allAttendance: SessionAttendance[],
    notificationsRef: CollectionReference
) => {
    const dateStr = formatDate(new Date(), 'yyyy-MM-dd');
    const attendanceQuery = query(attendanceRef, where('sessionId', '==', sessionId), where('date', '==', dateStr));
    const snap = await getDocs(attendanceQuery);
    
    if (snap.empty) {
        const record = { sessionId, date: dateStr, presentIds, absentIds, justifiedAbsenceIds };
        await addEntity(attendanceRef, record);
    } else {
        const docRef = snap.docs[0].ref;
        const existingData = snap.docs[0].data() as SessionAttendance;
        const updatedData = { ...existingData, presentIds, absentIds, justifiedAbsenceIds };
        await updateEntity(docRef, updatedData);
    }
    
    // Check for churn risk for each absent person
    for (const personId of absentIds) {
        await checkForChurnRisk(personId, allPersonSessions, allAttendance, notificationsRef);
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

export const addToWaitlistAction = async (
    sessionDocRef: DocumentReference,
    entry: WaitlistEntry,
    spacesRef: CollectionReference,
    notificationsRef: CollectionReference
) => {
    return runTransaction(db, async (transaction) => {
        const freshSessionSnap = await transaction.get(sessionDocRef);
        if (!freshSessionSnap.exists()) {
             throw new Error("La sesión no existe.");
        }
        const session = freshSessionSnap.data() as Session;

        const spaceSnap = await getDoc(doc(spacesRef, session.spaceId));
        if (!spaceSnap.exists()) {
            throw new Error("El espacio para esta sesión no se encontró.");
        }
        const space = spaceSnap.data() as Space;
        const capacity = space.capacity;

        // Check for available spots right now
        if (session.personIds.length < capacity) {
             const newNotification: Omit<AppNotification, 'id'> = {
                type: 'waitlist',
                sessionId: session.id,
                personId: typeof entry === 'string' ? entry : undefined,
                prospectDetails: typeof entry !== 'string' ? entry : undefined,
                createdAt: new Date(),
            };
            transaction.set(doc(notificationsRef), newNotification);
        } else {
            // Add the new entry to the waitlist if no spot is free
            const newWaitlist = [...(session.waitlist || []), entry];
            transaction.update(sessionDocRef, { waitlist: newWaitlist });
        }
    });
};


export const enrollFromWaitlistAction = async (sessionsRef: CollectionReference, notificationsRef: CollectionReference, notificationId: string, sessionId: string, personId: string, spacesRef: CollectionReference) => {
    const sessionRef = doc(sessionsRef, sessionId);
    
    return runTransaction(db, async (transaction) => {
        const sessionSnap = await transaction.get(sessionRef);
        if (!sessionSnap.exists()) {
            throw new Error("La sesión no existe.");
        }
        
        const session = sessionSnap.data() as Session;
        // The space data is only needed for the capacity check
        const spaceSnap = await getDoc(doc(spacesRef, session.spaceId));
        
        const space = spaceSnap.exists() ? spaceSnap.data() as Space : null;
        const capacity = space?.capacity || 0;

        // Double check there's still a spot
        if (session.personIds.length >= capacity) {
            throw new Error("Lo sentimos, el cupo para esta clase ya fue ocupado.");
        }

        const newPersonIds = Array.from(new Set([...session.personIds, personId]));

        const newWaitlist = (session.waitlist || []).filter(entry => {
            if (typeof entry === 'string') {
                return entry !== personId;
            } else {
                return true;
            }
        });
        
        transaction.update(sessionRef, { personIds: newPersonIds, waitlist: newWaitlist });
        
        const notifRef = doc(notificationsRef, notificationId);
        transaction.delete(notifRef);
    });
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

        if (isBefore(dueDate, today)) {
            let cyclesMissed = 0;
            let dateCursor = dueDate;
            
            while (isBefore(dateCursor, today)) {
                cyclesMissed++;
                dateCursor = calculateNextPaymentDate(dateCursor, person.joinDate, tariff);
            }
            
            const currentOutstanding = person.outstandingPayments || 0;
            if (cyclesMissed > currentOutstanding) {
                 updatedCount++;
                 const personDocRef = doc(peopleRef, person.id);
                 batch.update(personDocRef, { outstandingPayments: cyclesMissed });
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
        await batch.commit();
    }
    
    return updatedCount;
};
