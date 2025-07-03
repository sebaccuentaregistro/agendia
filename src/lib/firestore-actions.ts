// This file contains all the functions that interact with Firestore.
// It is separated from the React context to avoid issues with Next.js Fast Refresh.
import { collection, addDoc, doc, setDoc, deleteDoc, query, where, writeBatch, getDocs, Timestamp, CollectionReference } from 'firebase/firestore';
import type { Person, Session, SessionAttendance, Tariff, VacationPeriod } from '@/types';
import { db } from './firebase';
import { format as formatDate } from 'date-fns';

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
export const addPersonAction = async (collectionRef: CollectionReference, personData: Omit<Person, 'id' | 'avatar' | 'joinDate' | 'lastPaymentDate' | 'vacationPeriods' | 'status' | 'cancellationReason' | 'cancellationDate'>) => {
    const now = new Date();
    const newPerson = {
        ...personData,
        joinDate: now,
        lastPaymentDate: now,
        avatar: `https://placehold.co/100x100.png`,
        status: 'active' as const,
        vacationPeriods: [],
    };
    return addEntity(collectionRef, newPerson);
};

export const deactivatePersonAction = async (peopleRef: CollectionReference, sessionsRef: CollectionReference, personId: string, reason: string) => {
    const batch = writeBatch(db);
    const personRef = doc(peopleRef, personId);
    batch.update(personRef, { status: 'inactive', cancellationDate: new Date(), cancellationReason: reason });
    
    const personSessionsQuery = query(sessionsRef, where('personIds', 'array-contains', personId));
    const personSessionsSnap = await getDocs(personSessionsQuery);
    
    personSessionsSnap.forEach(sessionDoc => {
        const sessionData = sessionDoc.data() as Session;
        const updatedPersonIds = sessionData.personIds.filter(id => id !== personId);
        batch.update(sessionDoc.ref, { personIds: updatedPersonIds });
    });

    return await batch.commit();
};

export const reactivatePersonAction = async (peopleRef: CollectionReference, personId: string) => {
    const personDocRef = doc(peopleRef, personId);
    return await setDoc(personDocRef, { status: 'active', cancellationDate: null, cancellationReason: null }, { merge: true });
};

export const recordPaymentAction = async (paymentsRef: CollectionReference, peopleRef: CollectionReference, personId: string, months: number) => {
    const newPayment = {
        personId: personId,
        date: new Date(),
        months,
    };
    const batch = writeBatch(db);
    const paymentRef = doc(paymentsRef);
    batch.set(paymentRef, newPayment);
    
    const personRef = doc(peopleRef, personId);
    batch.update(personRef, { lastPaymentDate: newPayment.date });

    return await batch.commit();
};

export const undoLastPaymentAction = async (paymentsRef: CollectionReference, peopleRef: CollectionReference, personId: string, lastPayment: any, newLastPaymentDate: Date) => {
    const batch = writeBatch(db);
    const paymentRef = doc(paymentsRef, lastPayment.id);
    batch.delete(paymentRef);

    const personRef = doc(peopleRef, personId);
    batch.update(personRef, { lastPaymentDate: newLastPaymentDate });

    return await batch.commit();
};

export const enrollPersonInSessionsAction = async (sessionsRef: CollectionReference, personId: string, sessionIds: string[], currentSessions: Session[]) => {
    const batch = writeBatch(db);
    
    const personEnrolledSessionsQuery = query(sessionsRef, where('personIds', 'array-contains', personId));
    const currentSessionsSnap = await getDocs(personEnrolledSessionsQuery);
    currentSessionsSnap.forEach(sessionDoc => {
        const sessionData = sessionDoc.data() as Session;
        const updatedPersonIds = sessionData.personIds.filter(id => id !== personId);
        batch.update(sessionDoc.ref, { personIds: updatedPersonIds });
    });

    sessionIds.forEach(sessionId => {
        const sessionRef = doc(sessionsRef, sessionId);
        const session = currentSessions.find(s => s.id === sessionId);
        if (session) {
            const newPersonIds = Array.from(new Set([...session.personIds, personId]));
            batch.update(sessionRef, { personIds: newPersonIds });
        }
    });
    
    return await batch.commit();
};

export const enrollPeopleInClassAction = async (sessionRef: any, personIds: string[]) => {
    return await updateEntity(sessionRef, { personIds });
};


export const saveAttendanceAction = async (attendanceRef: CollectionReference, sessionId: string, presentIds: string[], absentIds: string[], justifiedAbsenceIds: string[]) => {
    const dateStr = formatDate(new Date(), 'yyyy-MM-dd');
    const attendanceQuery = query(attendanceRef, where('sessionId', '==', sessionId), where('date', '==', dateStr));
    
    const snap = await getDocs(attendanceQuery);
    const record = { sessionId, date: dateStr, presentIds, absentIds, justifiedAbsenceIds };
    if (snap.empty) {
        await addEntity(attendanceRef, record);
    } else {
        await updateEntity(snap.docs[0].ref, record);
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
        await addEntity(attendanceRef, { sessionId, date: dateStr, presentIds: [], absentIds: [], oneTimeAttendees: [personId] });
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

export const deleteWithUsageCheckAction = async (collectionRefs: { [key: string]: CollectionReference }, entityId: string, checks: { collection: string; field: string; label: string }[]) => {
    for (const check of checks) {
        const q = query(collectionRefs[check.collection], where(check.field, 'array-contains', entityId));
        const snapshotArray = await getDocs(q);
        if (!snapshotArray.empty) {
            throw new Error(`No se puede eliminar. Está en uso por ${snapshotArray.size} ${check.label}(s) (array).`);
        }
        
        const q2 = query(collectionRefs[check.collection], where(check.field, '==', entityId));
        const snapshotSingle = await getDocs(q2);
        if (!snapshotSingle.empty) {
            throw new Error(`No se puede eliminar. Está en uso por ${snapshotSingle.size} ${check.label}(s).`);
        }
    }
};
