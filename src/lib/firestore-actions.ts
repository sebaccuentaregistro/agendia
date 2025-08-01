

// This file contains all the functions that interact with Firestore.
// It is separated from the React context to avoid issues with Next.js Fast Refresh.
import { collection, addDoc, doc, setDoc, deleteDoc, query, where, writeBatch, getDocs, Timestamp, CollectionReference, DocumentReference, orderBy, limit, updateDoc, arrayUnion, runTransaction, getDoc, deleteField, arrayRemove } from 'firebase/firestore';
import type { Person, Session, SessionAttendance, Tariff, VacationPeriod, Actividad, Specialist, Space, Payment, NewPersonData, AuditLog, Operator, AppNotification, WaitlistEntry, WaitlistProspect, RecoveryCredit } from '@/types';
import { db } from './firebase';
import { format as formatDate, addMonths, subMonths, startOfDay, isBefore, parse, isWithinInterval, addDays, isAfter, differenceInDays, differenceInWeeks, differenceInCalendarMonths } from 'date-fns';
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
    const docRef = await addDoc(collectionRef, cleanData);
    return docRef.id;
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
export const addPersonAction = async (
    peopleRef: CollectionReference,
    personData: NewPersonData,
    tariffs: Tariff[],
    paymentsRef: CollectionReference,
    auditLogRef: CollectionReference,
    operator: Operator
) => {
    const now = new Date();
    const batch = writeBatch(db);
    const personDocRef = doc(peopleRef);
    const tariff = tariffs.find(t => t.id === personData.tariffId);
    if (!tariff) throw new Error("Arancel seleccionado no encontrado.");
    
    let outstandingPayments = 0;
    
    // If a past due date is set, they start with 1 outstanding payment.
    if (personData.lastPaymentDate && isBefore(startOfDay(personData.lastPaymentDate), startOfDay(now))) {
        outstandingPayments = 1;
    }

    const newPerson: Omit<Person, 'id'> = {
        name: personData.name,
        phone: personData.phone,
        tariffId: personData.tariffId,
        healthInfo: personData.healthInfo,
        notes: personData.notes,
        joinDate: personData.joinDate || now,
        lastPaymentDate: personData.lastPaymentDate || null,
        avatar: `https://placehold.co/100x100.png`,
        vacationPeriods: [],
        outstandingPayments: outstandingPayments,
        status: 'active',
        inactiveDate: null,
        recoveryCredits: [],
    };
    
    batch.set(personDocRef, cleanDataForFirestore(newPerson));

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


export const deactivatePersonAction = async (sessionsRef: CollectionReference, peopleRef: CollectionReference, personId: string, personName: string, auditLogRef: CollectionReference, operator: Operator) => {
    const batch = writeBatch(db);
    const now = new Date();
    const affectedSessionIds: string[] = [];

    // Add to audit log for deactivation
    batch.set(doc(auditLogRef), {
        operatorId: operator.id,
        operatorName: operator.name,
        action: 'DESACTIVAR_PERSONA',
        entityType: 'persona',
        entityId: personId,
        entityName: personName,
        timestamp: now,
    } as Omit<AuditLog, 'id'>);

    // Get all sessions to check both personIds and waitlist
    const allSessionsSnap = await getDocs(sessionsRef);
    
    allSessionsSnap.forEach(sessionDoc => {
        const sessionData = sessionDoc.data() as Session;
        let wasModified = false;

        // Check if person is in the main enrollment list
        if (sessionData.personIds?.includes(personId)) {
            const updatedPersonIds = sessionData.personIds.filter(id => id !== personId);
            batch.update(sessionDoc.ref, { personIds: updatedPersonIds });
            wasModified = true;
        }

        // Check if person is in the waitlist (as an ID)
        if (sessionData.waitlist?.some(entry => typeof entry === 'string' && entry === personId)) {
            const updatedWaitlist = sessionData.waitlist.filter(entry => {
                return !(typeof entry === 'string' && entry === personId);
            });
            batch.update(sessionDoc.ref, { waitlist: updatedWaitlist });
            wasModified = true;
        }

        if (wasModified && !affectedSessionIds.includes(sessionDoc.id)) {
            affectedSessionIds.push(sessionDoc.id);
        }
    });

    // Update the person's status to inactive
    const personRef = doc(peopleRef, personId);
    batch.update(personRef, { status: 'inactive', inactiveDate: now });

    await batch.commit();
    return affectedSessionIds;
};

export const reactivatePersonAction = async (
    personRef: DocumentReference,
    personName: string,
    auditLogRef: CollectionReference,
    operator: Operator
) => {
    const batch = writeBatch(db);
    const now = new Date();

    // Update person's status to active and clear inactive date
    batch.update(personRef, { status: 'active', inactiveDate: null });

    // Add to audit log for reactivation
    batch.set(doc(auditLogRef), {
        operatorId: operator.id,
        operatorName: operator.name,
        action: 'REACTIVAR_PERSONA',
        entityType: 'persona',
        entityId: personRef.id,
        entityName: personName,
        timestamp: now,
    } as Omit<AuditLog, 'id'>);

    await batch.commit();
};


export const recordPaymentAction = async (
    personRef: DocumentReference,
    person: Person,
    tariff: Tariff,
    operator: Operator,
    paymentsRef: CollectionReference,
    auditLogRef: CollectionReference
) => {
    const now = new Date();
    const batch = writeBatch(db);

    // 1. Calculate new state for the person
    const newOutstandingPayments = Math.max(0, (person.outstandingPayments || 0) - 1);
    
    let newExpiryDate: Date;

    if (newOutstandingPayments > 0) {
        // If there's still debt, advance the due date by one cycle from the *previous* due date
        newExpiryDate = calculateNextPaymentDate(person.lastPaymentDate || now, person.joinDate, tariff);
    } else {
        // If the debt is now zero, the new cycle starts from today
        newExpiryDate = calculateNextPaymentDate(now, person.joinDate, tariff);
    }

    // 2. Create the new payment record
    const paymentRecord: Omit<Payment, 'id'> = {
        personId: person.id,
        date: now,
        amount: tariff.price,
        tariffId: tariff.id,
        createdAt: now,
        timestamp: now,
    };
    const paymentDocRef = doc(paymentsRef);
    batch.set(paymentDocRef, cleanDataForFirestore(paymentRecord));

    // 3. Update the person's document
    const personUpdate = {
        lastPaymentDate: newExpiryDate,
        outstandingPayments: newOutstandingPayments,
    };
    batch.update(personRef, personUpdate);

    // 4. Create an audit log record
    const auditLogRecord: Omit<AuditLog, 'id'> = {
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
    };
    const auditLogDocRef = doc(auditLogRef);
    batch.set(auditLogDocRef, cleanDataForFirestore(auditLogRecord));

    // 5. Commit all batched writes
    try {
        await batch.commit();
    } catch (error) {
        console.error(`[DEBUG] Error al confirmar el guardado del pago:`, error);
        throw error;
    }
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
    const allPayments = paymentsSnap.docs.map(docSnap => {
            const data = docSnap.data();
            return { 
                id: docSnap.id, 
                ...data,
                // Ensure `date` is a JS Date object
                date: data.date instanceof Timestamp ? data.date.toDate() : null 
            } as Payment;
        })
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

    await batch.commit();
};


export const enrollPersonInSessionsAction = async (sessionsRef: CollectionReference, personId: string, desiredSessionIds: string[]) => {
    const batch = writeBatch(db);
    const affectedSessionIds: string[] = [];

    const currentEnrollmentsQuery = query(sessionsRef, where('personIds', 'array-contains', personId));
    const currentEnrollmentsSnap = await getDocs(currentEnrollmentsQuery);
    const currentSessionIds = new Set(currentEnrollmentsSnap.docs.map(d => d.id));

    const sessionsToRemoveFrom = Array.from(currentSessionIds).filter(id => !desiredSessionIds.includes(id));
    for (const sessionId of sessionsToRemoveFrom) {
        const sessionRef = doc(sessionsRef, sessionId);
        const sessionData = currentEnrollmentsSnap.docs.find(d => d.id === sessionId)?.data() as Session;
        if (sessionData) {
            const updatedPersonIds = sessionData.personIds.filter(id => id !== personId);
            batch.update(sessionRef, { personIds: updatedPersonIds });
            if (!affectedSessionIds.includes(sessionId)) {
              affectedSessionIds.push(sessionId);
            }
        }
    }

    const sessionsToAddTo = desiredSessionIds.filter(id => !currentSessionIds.has(id));
    for (const sessionId of sessionsToAddTo) {
        const sessionRef = doc(sessionsRef, sessionId);
        batch.update(sessionRef, { personIds: arrayUnion(personId) });
    }
    
    await batch.commit();
    return affectedSessionIds;
};


export const enrollPeopleInClassAction = async (sessionRef: DocumentReference, personIds: string[]) => {
    // This is a transactional update to prevent race conditions.
    return runTransaction(db, async (transaction) => {
        const sessionDoc = await transaction.get(sessionRef);
        if (!sessionDoc.exists()) {
            throw new Error("La sesión que intentas modificar ya no existe.");
        }
        transaction.update(sessionRef, { personIds });
    });
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
    
    const record = { sessionId, date: dateStr, presentIds, absentIds, justifiedAbsenceIds, status: 'active' };
    let docRef;

    if (snap.empty) {
        // If it doesn't exist, create a new doc reference
        docRef = doc(attendanceRef);
    } else {
        // If it exists, use the existing doc reference
        docRef = snap.docs[0].ref;
    }
    
    // Use set with merge to either create or update the document atomically.
    await setDoc(docRef, record, { merge: true });
    
    // Check for churn risk for each absent person
    for (const personId of absentIds) {
        await checkForChurnRisk(personId, allPersonSessions, allAttendance, notificationsRef);
    }
};

export const cancelSessionForDayAction = async (
  attendanceRef: CollectionReference,
  peopleRef: CollectionReference,
  sessionId: string,
  date: Date,
  enrolledPeopleIds: string[],
  grantRecoveryCredits: boolean,
  auditLogRef: CollectionReference,
  operator: Operator,
  activityName: string
) => {
  const dateStr = formatDate(date, 'yyyy-MM-dd');
  const batch = writeBatch(db);
  const cancellationId = `cancel-${sessionId}-${dateStr}`;

  // 1. Mark the session as cancelled in the attendance collection
  const attendanceQuery = query(attendanceRef, where('sessionId', '==', sessionId), where('date', '==', dateStr));
  const snap = await getDocs(attendanceQuery);

  const newRecord: Partial<SessionAttendance> = {
    sessionId,
    date: dateStr,
    status: 'cancelled',
    cancellationId, // Guardar el ID de cancelación
    presentIds: [],
    absentIds: [],
    justifiedAbsenceIds: [],
  };

  let docRef;
  if (snap.empty) {
    docRef = doc(attendanceRef);
  } else {
    docRef = snap.docs[0].ref;
  }
  batch.set(docRef, newRecord, { merge: true });

  // 2. Grant recovery credits if toggled
  if (grantRecoveryCredits && enrolledPeopleIds.length > 0) {
    for (const personId of enrolledPeopleIds) {
      const personDocRef = doc(peopleRef, personId);
      const newCredit: RecoveryCredit = {
        id: `credit-${Date.now()}-${personId}`,
        reason: 'class_cancellation',
        grantedAt: new Date(),
        expiresAt: addMonths(new Date(), 1),
        status: 'available',
        originalSessionId: sessionId,
        originalSessionDate: dateStr,
        cancellationId, // Vincular el crédito a la cancelación
      };
      batch.update(personDocRef, {
        recoveryCredits: arrayUnion(newCredit)
      });
    }
  }
  
  // 3. Create an audit log for the cancellation
  batch.set(doc(auditLogRef), {
    operatorId: operator.id,
    operatorName: operator.name,
    action: 'CANCELAR_SESION',
    entityType: 'clase',
    entityId: sessionId,
    entityName: `Clase de ${activityName}`,
    timestamp: new Date(),
    details: { date: dateStr, grantedCredits: grantRecoveryCredits, affectedPeople: enrolledPeopleIds.length }
  } as Omit<AuditLog, 'id'>);

  await batch.commit();
};

export const reactivateCancelledSessionAction = async (
    attendanceRef: CollectionReference,
    peopleRef: CollectionReference,
    sessionId: string,
    date: Date,
    auditLogRef: CollectionReference,
    operator: Operator,
    activityName: string
) => {
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    const batch = writeBatch(db);

    const attendanceQuery = query(attendanceRef, where('sessionId', '==', sessionId), where('date', '==', dateStr), where('status', '==', 'cancelled'));
    const snap = await getDocs(attendanceQuery);

    if (snap.empty) {
        throw new Error("No se encontró una sesión cancelada para reactivar en esta fecha.");
    }
    const attendanceDoc = snap.docs[0];
    const attendanceData = attendanceDoc.data() as SessionAttendance;
    const cancellationId = attendanceData.cancellationId;

    // 1. Delete the attendance record for the cancelled session
    batch.delete(attendanceDoc.ref);

    // 2. If a cancellationId exists, find and remove the corresponding 'available' credits
    if (cancellationId) {
        // Since we can't query objects in arrays, we get all people and filter locally.
        const allPeopleSnap = await getDocs(peopleRef);
        allPeopleSnap.forEach(personDoc => {
            const personData = personDoc.data() as Person;
            if (personData.recoveryCredits && personData.recoveryCredits.length > 0) {
                const creditsToKeep = personData.recoveryCredits.filter(credit => 
                    !(credit.cancellationId === cancellationId && credit.status === 'available')
                );
                
                // Only update if the credits array has changed.
                if (creditsToKeep.length < personData.recoveryCredits.length) {
                    batch.update(personDoc.ref, { recoveryCredits: creditsToKeep });
                }
            }
        });
    }
    
    // 3. Create audit log
    batch.set(doc(auditLogRef), {
        operatorId: operator.id,
        operatorName: operator.name,
        action: 'REACTIVAR_SESION',
        entityType: 'clase',
        entityId: sessionId,
        entityName: `Clase de ${activityName}`,
        timestamp: new Date(),
        details: { date: dateStr }
    } as Omit<AuditLog, 'id'>);

    await batch.commit();
};


export const addJustifiedAbsenceAction = async (
    peopleRef: CollectionReference,
    attendanceRef: CollectionReference,
    personId: string,
    sessionId: string,
    date: Date
) => {
    const personDocRef = doc(peopleRef, personId);

    // Create the new credit
    const newCredit: RecoveryCredit = {
        id: `credit-${Date.now()}-${personId}`,
        reason: 'justified_absence',
        grantedAt: new Date(),
        expiresAt: addMonths(new Date(), 1),
        status: 'available',
        originalSessionId: sessionId,
        originalSessionDate: formatDate(date, 'yyyy-MM-dd'),
    };

    const batch = writeBatch(db);

    // 1. Add the credit to the person's document
    batch.update(personDocRef, {
        recoveryCredits: arrayUnion(newCredit)
    });

    // 2. Mark the person as absent in the attendance record for that day
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    const attendanceQuery = query(attendanceRef, where('sessionId', '==', sessionId), where('date', '==', dateStr));
    const snap = await getDocs(attendanceQuery);
    
    if (snap.empty) {
        // If no record exists, create one with the person as absent
        const attendanceRecord: Omit<SessionAttendance, 'id'> = {
            sessionId: sessionId,
            date: dateStr,
            presentIds: [],
            absentIds: [personId],
            justifiedAbsenceIds: [],
            status: 'active',
        };
        batch.set(doc(attendanceRef), attendanceRecord);
    } else {
        // If a record exists, add the person to the absent list
        const attendanceDocRef = snap.docs[0].ref;
        batch.update(attendanceDocRef, {
            absentIds: arrayUnion(personId),
            // Ensure they are not in present or justified lists
            presentIds: arrayRemove(personId),
            justifiedAbsenceIds: arrayRemove(personId),
        });
    }

    await batch.commit();
};

export const addOneTimeAttendeeAction = async (
    attendanceRef: CollectionReference,
    peopleRef: CollectionReference,
    sessionId: string,
    personId: string,
    date: Date
) => {
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    const attendanceQuery = query(attendanceRef, where('sessionId', '==', sessionId), where('date', '==', dateStr));

    return runTransaction(db, async (transaction) => {
        // --- READS FIRST ---
        const personDocRef = doc(peopleRef, personId);
        const personSnap = await transaction.get(personDocRef);
        if (!personSnap.exists()) throw new Error("La persona no existe.");

        const attendanceSnapshot = await getDocs(attendanceQuery);
        let attendanceDocRef: DocumentReference;
        let currentAttendanceData: Partial<SessionAttendance> = {};

        if (attendanceSnapshot.empty) {
            attendanceDocRef = doc(attendanceRef); // Define ref for new doc
        } else {
            attendanceDocRef = attendanceSnapshot.docs[0].ref;
            const attendanceSnap = await transaction.get(attendanceDocRef);
            currentAttendanceData = attendanceSnap.data() || {};
        }

        // --- LOGIC ---
        const personData = personSnap.data() as Person;
        const availableCredit = (personData.recoveryCredits || []).find(c => c.status === 'available');

        if (!availableCredit) {
            throw new Error("La persona no tiene créditos de recupero disponibles.");
        }

        const updatedCredits = (personData.recoveryCredits || []).map(c => 
            c.id === availableCredit.id 
                ? { ...c, status: 'used', usedInSessionId: sessionId, usedOnDate: dateStr } 
                : c
        );

        const oneTimeAttendees = Array.from(new Set([...(currentAttendanceData.oneTimeAttendees || []), personId]));
        const presentIds = Array.from(new Set([...(currentAttendanceData.presentIds || []), personId]));

        // --- WRITES LAST ---
        transaction.update(personDocRef, { recoveryCredits: updatedCredits });
        
        transaction.set(attendanceDocRef, {
            ...currentAttendanceData,
            sessionId: sessionId,
            date: dateStr,
            oneTimeAttendees,
            presentIds,
            status: 'active',
        }, { merge: true });
    });
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

export const removeOneTimeAttendeeAction = async (attendanceRef: CollectionReference, sessionId: string, personId: string, date: string) => {
    const q = query(attendanceRef, where('sessionId', '==', sessionId), where('date', '==', date));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.warn("No attendance record found to remove one-time attendee from.");
        return;
    }

    const docRef = querySnapshot.docs[0].ref;
    const data = querySnapshot.docs[0].data() as SessionAttendance;

    const updatedOneTimeAttendees = (data.oneTimeAttendees || []).filter(id => id !== personId);
    const updatedPresentIds = (data.presentIds || []).filter(id => id !== personId);

    return updateDoc(docRef, { 
        oneTimeAttendees: updatedOneTimeAttendees,
        presentIds: updatedPresentIds,
    });
};

export const removePersonFromSessionAction = async (sessionDocRef: DocumentReference, personId: string) => {
  return updateDoc(sessionDocRef, {
    personIds: arrayRemove(personId)
  });
};


export const findVacationConflicts = async (person: Person, sessions: Session[], attendance: SessionAttendance[], people: Person[], newVacationPeriods: VacationPeriod[]) => {
    const originalPeriods = person.vacationPeriods || [];
    const personSessionIds = new Set(sessions.filter(s => s.personIds.includes(person.id)).map(s => s.id));
    if (personSessionIds.size === 0) return []; // No enrolled sessions, no conflicts.

    const findPeriodById = (id: string, periods: VacationPeriod[]) => periods.find(p => p.id === id);

    const conflicts: { date: string; attendeeName: string; sessionId: string, attendeeId: string }[] = [];

    // Find deleted or shortened periods
    for (const originalPeriod of originalPeriods) {
        const newPeriod = findPeriodById(originalPeriod.id, newVacationPeriods);
        let reactivatedStart: Date | null = null;
        let reactivatedEnd: Date | null = null;

        if (!newPeriod) { // Period was deleted entirely
            reactivatedStart = originalPeriod.startDate;
            reactivatedEnd = originalPeriod.endDate;
        } else if (originalPeriod.endDate && newPeriod.endDate && isBefore(newPeriod.endDate, originalPeriod.endDate)) { // Period was shortened from the end
            reactivatedStart = addDays(newPeriod.endDate, 1);
            reactivatedEnd = originalPeriod.endDate;
        } else if (originalPeriod.startDate && newPeriod.startDate && isAfter(newPeriod.startDate, originalPeriod.startDate)) { // Period was shortened from the beginning
            reactivatedStart = originalPeriod.startDate;
            reactivatedEnd = addDays(newPeriod.startDate, -1);
        }

        if (reactivatedStart && reactivatedEnd) {
            // Find one-time attendees in this person's slots during the now-active period
            const conflictingAttendance = attendance.filter(att => 
                personSessionIds.has(att.sessionId) &&
                att.oneTimeAttendees &&
                att.oneTimeAttendees.length > 0 &&
                isWithinInterval(parse(att.date, 'yyyy-MM-dd', new Date()), { start: reactivatedStart!, end: reactivatedEnd! })
            );

            for (const record of conflictingAttendance) {
                for (const attendeeId of record.oneTimeAttendees!) {
                    const attendee = people.find(p => p.id === attendeeId);
                    conflicts.push({
                        date: record.date,
                        attendeeName: attendee?.name || 'Desconocido',
                        attendeeId: attendeeId,
                        sessionId: record.sessionId,
                    });
                }
            }
        }
    }

    return conflicts;
};



export const addToWaitlistAction = async (
    sessionDocRef: DocumentReference,
    entry: WaitlistEntry,
) => {
    return runTransaction(db, async (transaction) => {
        const freshSessionSnap = await transaction.get(sessionDocRef);
        if (!freshSessionSnap.exists()) {
             throw new Error("La sesión no existe.");
        }
        const session = freshSessionSnap.data() as Session;

        const newWaitlist = [...(session.waitlist || []), entry];
        transaction.update(sessionDocRef, { waitlist: newWaitlist });
    });
};

export const removeFromWaitlistAction = async (
    sessionDocRef: DocumentReference,
    entryToRemove: WaitlistEntry,
) => {
    return runTransaction(db, async (transaction) => {
        const freshSessionSnap = await transaction.get(sessionDocRef);
        if (!freshSessionSnap.exists()) {
             throw new Error("La sesión no existe.");
        }
        const session = freshSessionSnap.data() as Session;

        const updatedWaitlist = (session.waitlist || []).filter(entry => {
            if (typeof entry === 'string' && typeof entryToRemove === 'string') {
                return entry !== entryToRemove;
            }
            if (typeof entry !== 'string' && typeof entryToRemove !== 'string') {
                // Compare prospect objects by name and phone
                return entry.name !== entryToRemove.name || entry.phone !== entryToRemove.phone;
            }
            return true; // Should not happen with consistent data
        });

        transaction.update(sessionDocRef, { waitlist: updatedWaitlist });
    });
};


export const enrollFromWaitlistAction = async (
    sessionDocRef: DocumentReference,
    personIdToEnroll: string,
    spacesRef: CollectionReference
) => {
    return runTransaction(db, async (transaction) => {
        const sessionSnap = await transaction.get(sessionDocRef);
        if (!sessionSnap.exists()) throw new Error("La sesión no existe.");
        const session = sessionSnap.data() as Session;
        
        const spaceRef = doc(spacesRef, session.spaceId);
        const spaceSnap = await transaction.get(spaceRef);
        if (!spaceSnap.exists()) throw new Error("El espacio de la sesión no existe.");
        const space = spaceSnap.data() as Space;

        if (session.personIds.length >= space.capacity) {
            console.warn(`Attempted to enroll from waitlist into a full class (Session: ${session.id})`);
            return;
        }
        
        // Add the person to the session's main roster
        const newPersonIds = Array.from(new Set([...session.personIds, personIdToEnroll]));

        // Remove the person from the waitlist
        const newWaitlist = (session.waitlist || []).filter(entry => {
            return entry !== personIdToEnroll;
        });
        
        transaction.update(sessionDocRef, { personIds: newPersonIds, waitlist: newWaitlist });
    });
};


export const enrollProspectFromWaitlistAction = async (
    sessionDocRef: DocumentReference,
    prospect: WaitlistProspect,
    newPersonId: string,
    spacesRef: CollectionReference
) => {
    return runTransaction(db, async (transaction) => {
        const sessionSnap = await transaction.get(sessionDocRef);
        if (!sessionSnap.exists()) throw new Error("La sesión no existe.");
        const session = sessionSnap.data() as Session;
        
        const spaceRef = doc(spacesRef, session.spaceId);
        const spaceSnap = await transaction.get(spaceRef);
        if (!spaceSnap.exists()) throw new Error("El espacio de la sesión no existe.");
        const space = spaceSnap.data() as Space;

        if (session.personIds.length >= space.capacity) {
             console.warn(`Attempted to enroll a prospect from waitlist into a full class (Session: ${session.id})`);
             return;
        }
        
        // Add the new person to the session's main roster
        const newPersonIds = Array.from(new Set([...session.personIds, newPersonId]));

        // Remove the prospect from the waitlist
        const newWaitlist = (session.waitlist || []).filter(entry => {
            if (typeof entry !== 'string') {
                return entry.name !== prospect.name || entry.phone !== prospect.phone;
            }
            return true;
        });
        
        transaction.update(sessionDocRef, { personIds: newPersonIds, waitlist: newWaitlist });
    });
};

type AllDataContext = {
    sessions: Session[];
    people: Person[];
    actividades: Actividad[];
    specialists: Specialist[];
    spaces: Space[];
};

export const deleteWithUsageCheckAction = async (
    collectionRefs: Record<string, CollectionReference>,
    entityId: string,
    collectionKey: string,
    checks: { collection: string; field: string; type?: 'array' }[],
    allDataForMessages: AllDataContext
) => {
    const usageMessages: string[] = [];

    // Special check for sessions: they can't be deleted if personIds is not empty.
    if (collectionKey === 'sessions') {
        const sessionDoc = await getDoc(doc(collectionRefs.sessions, entityId));
        if (sessionDoc.exists()) {
            const sessionData = sessionDoc.data() as Session;
            if (sessionData.personIds && sessionData.personIds.length > 0) {
                 const peopleData = allDataForMessages.people || [];
                 const personNames = sessionData.personIds.map(id => peopleData.find(p => p.id === id)?.name || id);
                 usageMessages.push(`La sesión tiene ${sessionData.personIds.length} persona(s) inscrita(s): ${personNames.join(', ')}.`);
            }
        }
    }


    for (const check of checks) {
        if (collectionKey === 'sessions' && check.collection === 'people') continue;

        const collectionToCheckRef = collectionRefs[check.collection];
        if (!collectionToCheckRef) {
            console.warn(`Collection reference not found for: ${check.collection}`);
            continue;
        }

        const fieldToCheck = check.field;
        const operator = check.type === 'array' ? 'array-contains' : '==';
        const q = query(collectionToCheckRef, where(fieldToCheck, operator, entityId));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            const names = snapshot.docs.map(d => d.data().name || 'un elemento').slice(0, 3);
            usageMessages.push(`Está en uso por ${snapshot.size} ${check.collection}: ${names.join(', ')}...`);
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
