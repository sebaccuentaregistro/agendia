'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Actividad, Specialist, Person, Session, Payment, Space, SessionAttendance, AppNotification, Tariff, Level, VacationPeriod } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { set, addMonths, differenceInDays, addDays, format as formatDate } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, setDoc, deleteDoc, query, where, writeBatch, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthContext';


// Helper function to convert Firestore Timestamps to Dates in nested objects
const convertTimestamps = (data: any) => {
    const newData = { ...data };
    for (const key in newData) {
        if (newData[key] instanceof Timestamp) {
            newData[key] = newData[key].toDate();
        } else if (key === 'vacationPeriods' && Array.isArray(newData[key])) {
            newData[key] = newData[key].map(convertTimestamps);
        } else if (typeof newData[key] === 'object' && newData[key] !== null && !Array.isArray(newData[key])) {
            newData[key] = convertTimestamps(newData[key]);
        }
    }
    return newData;
};

interface StudioContextType {
  actividades: Actividad[];
  specialists: Specialist[];
  people: Person[];
  sessions: Session[];
  payments: Payment[];
  spaces: Space[];
  attendance: SessionAttendance[];
  notifications: AppNotification[];
  tariffs: Tariff[];
  levels: Level[];
  addActividad: (actividad: Omit<Actividad, 'id'>) => void;
  updateActividad: (actividad: Actividad) => void;
  deleteActividad: (actividadId: string) => void;
  addSpecialist: (specialist: Omit<Specialist, 'id' | 'avatar'>) => void;
  updateSpecialist: (specialist: Specialist) => void;
  deleteSpecialist: (specialistId: string) => void;
  addPerson: (person: Omit<Person, 'id' | 'avatar' | 'joinDate' | 'lastPaymentDate' | 'vacationPeriods' | 'status' | 'cancellationReason' | 'cancellationDate'>) => void;
  updatePerson: (person: Person) => void;
  deactivatePerson: (personId: string, reason: string) => void;
  reactivatePerson: (personId: string) => void;
  recordPayment: (personId: string, months: number) => void;
  undoLastPayment: (personId: string) => void;
  addSpace: (space: Omit<Space, 'id'>) => void;
  updateSpace: (space: Space) => void;
  deleteSpace: (spaceId: string) => void;
  addSession: (session: Omit<Session, 'id' | 'personIds' | 'waitlistPersonIds'>) => void;
  updateSession: (session: Session) => void;
  deleteSession: (sessionId: string) => void;
  enrollPersonInSessions: (personId: string, sessionIds: string[]) => void;
  enrollPeopleInClass: (sessionId: string, personIds: string[]) => void;
  saveAttendance: (sessionId: string, presentIds: string[], absentIds: string[], justifiedAbsenceIds: string[]) => void;
  addOneTimeAttendee: (sessionId: string, personId: string, date: Date) => void;
  addJustifiedAbsence: (personId: string, sessionId: string, date: Date) => void;
  addVacationPeriod: (personId: string, startDate: Date, endDate: Date) => void;
  removeVacationPeriod: (personId: string, vacationId: string) => void;
  isPersonOnVacation: (person: Person, date: Date) => boolean;
  addToWaitlist: (sessionId: string, personId: string) => void;
  enrollFromWaitlist: (notificationId: string, sessionId: string, personId: string) => void;
  dismissNotification: (notificationId: string) => void;
  addTariff: (tariff: Omit<Tariff, 'id'>) => void;
  updateTariff: (tariff: Tariff) => void;
  deleteTariff: (tariffId: string) => void;
  addLevel: (level: Omit<Level, 'id'>) => void;
  updateLevel: (level: Level) => void;
  deleteLevel: (levelId: string) => void;
  isTutorialOpen: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({ children, instituteId }: { children: ReactNode, instituteId: string | null }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [attendance, setAttendance] = useState<SessionAttendance[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const openTutorial = useCallback(() => setIsTutorialOpen(true), []);
  const closeTutorial = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('agendia-tutorial-completed', 'true');
    }
    setIsTutorialOpen(false);
  }, []);

  useEffect(() => {
    if (!instituteId) return;

    const instituteRef = doc(db, 'institutes', instituteId);

    const collectionsToFetch = [
        { name: 'actividades', setter: setActividades },
        { name: 'specialists', setter: setSpecialists },
        { name: 'people', setter: setPeople },
        { name: 'sessions', setter: setSessions },
        { name: 'payments', setter: setPayments },
        { name: 'spaces', setter: setSpaces },
        { name: 'attendance', setter: setAttendance },
        { name: 'notifications', setter: setNotifications },
        { name: 'tariffs', setter: setTariffs },
        { name: 'levels', setter: setLevels },
    ];

    const unsubscribes = collectionsToFetch.map(({ name, setter }) => {
        const collRef = collection(instituteRef, name);
        return onSnapshot(collRef, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) })) as any[];
            setter(data);
        }, (error) => {
            console.error(`Error fetching ${name}:`, error);
            toast({ variant: 'destructive', title: `Error al cargar ${name}`, description: 'No se pudieron cargar los datos. Intenta recargar la página.' });
        });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [instituteId, toast]);

  const getCollectionRef = useCallback((collectionName: string) => {
      if (!instituteId) throw new Error("No instituteId provided");
      return collection(doc(db, 'institutes', instituteId), collectionName);
  }, [instituteId]);

  const handleFirestoreError = (error: any, context: string) => {
      console.error(`Firestore error in ${context}:`, error);
      toast({ variant: "destructive", title: "Error de base de datos", description: "La operación no se pudo completar. Por favor, inténtalo de nuevo." });
  };
  
  const addEntity = useCallback(async (collectionName: string, data: any, successMessage: string) => {
      // Firestore doesn't accept `undefined` values. We need to clean the object.
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );
      try {
          await addDoc(getCollectionRef(collectionName), cleanData);
          toast({ title: 'Éxito', description: successMessage });
      } catch (error) {
          handleFirestoreError(error, `addEntity (${collectionName})`);
      }
  }, [getCollectionRef, toast]);

  const updateEntity = useCallback(async (collectionName: string, entityId: string, data: any, successMessage: string) => {
      try {
          const { id, ...updateDataRaw } = data; // Don't save the id inside the document
           // Firestore doesn't accept `undefined` values. We need to clean the object.
          const updateData = Object.fromEntries(
              Object.entries(updateDataRaw).filter(([_, v]) => v !== undefined)
          );
          await setDoc(doc(getCollectionRef(collectionName), entityId), updateData, { merge: true });
          toast({ title: 'Éxito', description: successMessage });
      } catch (error) {
          handleFirestoreError(error, `updateEntity (${collectionName})`);
      }
  }, [getCollectionRef, toast]);

  const deleteEntity = useCallback(async (collectionName: string, entityId: string, successMessage: string) => {
      try {
          await deleteDoc(doc(getCollectionRef(collectionName), entityId));
          toast({ title: 'Éxito', description: successMessage });
      } catch (error) {
          handleFirestoreError(error, `deleteEntity (${collectionName})`);
      }
  }, [getCollectionRef, toast]);


  const isPersonOnVacation = useCallback((person: Person, date: Date): boolean => {
    if (!person.vacationPeriods) return false;
    const checkDate = set(date, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
    
    return person.vacationPeriods.some(period => {
        const startDate = set(period.startDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
        const endDate = set(period.endDate, { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 });
        return checkDate >= startDate && checkDate <= endDate;
    });
  }, []);

  const addPerson = useCallback(async (personData: Omit<Person, 'id' | 'avatar' | 'joinDate' | 'lastPaymentDate' | 'vacationPeriods' | 'status' | 'cancellationReason' | 'cancellationDate'>) => {
    const now = new Date();
    const newPerson = {
        ...personData,
        joinDate: now,
        lastPaymentDate: now,
        avatar: `https://placehold.co/100x100.png`,
        status: 'active' as const,
        vacationPeriods: [],
    };
    await addEntity('people', newPerson, 'La persona ha sido añadida correctamente.');
  }, [addEntity]);

  const deactivatePerson = useCallback(async (personId: string, reason: string) => {
      try {
          const batch = writeBatch(db);
          const personRef = doc(getCollectionRef('people'), personId);
          batch.update(personRef, { status: 'inactive', cancellationDate: new Date(), cancellationReason: reason });
          
          const personSessionsQuery = query(getCollectionRef('sessions'), where('personIds', 'array-contains', personId));
          const personSessionsSnap = await getDocs(personSessionsQuery);
          
          personSessionsSnap.forEach(sessionDoc => {
              const sessionData = sessionDoc.data() as Session;
              const updatedPersonIds = sessionData.personIds.filter(id => id !== personId);
              batch.update(sessionDoc.ref, { personIds: updatedPersonIds });
          });

          await batch.commit();
          toast({ title: 'Persona dada de baja', description: 'La persona ha sido marcada como inactiva.' });
      } catch (error) {
          handleFirestoreError(error, 'deactivatePerson');
      }
  }, [getCollectionRef, toast]);

  const reactivatePerson = useCallback(async (personId: string) => {
      const personRef = doc(getCollectionRef('people'), personId);
      try {
          await setDoc(personRef, { status: 'active', cancellationDate: null, cancellationReason: null }, { merge: true });
          toast({ title: 'Persona Reactivada', description: 'La persona ha sido marcada como activa.' });
      } catch (error) {
          handleFirestoreError(error, 'reactivatePerson');
      }
  }, [getCollectionRef, toast]);

  const recordPayment = useCallback(async (personId: string, months: number) => {
      const person = people.find(p => p.id === personId);
      if (!person) return;
      
      const newPayment = {
          personId: personId,
          date: new Date(),
          months,
      };

      try {
          const batch = writeBatch(db);
          const paymentRef = doc(collection(getCollectionRef('payments')));
          batch.set(paymentRef, newPayment);
          
          const personRef = doc(getCollectionRef('people'), personId);
          batch.update(personRef, { lastPaymentDate: newPayment.date });

          await batch.commit();
          toast({ title: 'Pago Registrado', description: 'El pago ha sido registrado con éxito.' });
      } catch (error) {
          handleFirestoreError(error, 'recordPayment');
      }
  }, [people, getCollectionRef, toast]);

  const undoLastPayment = useCallback(async (personId: string) => {
      const personPayments = payments.filter(p => p.personId === personId).sort((a, b) => b.date.getTime() - a.date.getTime());
      if (personPayments.length === 0) {
          toast({ variant: 'destructive', title: 'Error', description: 'No hay pagos para deshacer.' });
          return;
      }
      const lastPayment = personPayments[0];
      const newLastPaymentDate = personPayments.length > 1 ? personPayments[1].date : people.find(p => p.id === personId)?.joinDate || new Date();

      try {
          const batch = writeBatch(db);
          const paymentRef = doc(getCollectionRef('payments'), lastPayment.id);
          batch.delete(paymentRef);

          const personRef = doc(getCollectionRef('people'), personId);
          batch.update(personRef, { lastPaymentDate: newLastPaymentDate });

          await batch.commit();
          toast({ title: 'Pago Deshecho', description: 'Se ha eliminado el último pago registrado.' });
      } catch (error) {
          handleFirestoreError(error, 'undoLastPayment');
      }
  }, [payments, people, getCollectionRef, toast]);
  
  const enrollPersonInSessions = useCallback(async (personId: string, sessionIds: string[]) => {
      try {
          const batch = writeBatch(db);
          // Remove person from all sessions first
          const allSessionsQuery = query(getCollectionRef('sessions'), where('personIds', 'array-contains', personId));
          const currentSessionsSnap = await getDocs(allSessionsQuery);
          currentSessionsSnap.forEach(sessionDoc => {
              const sessionData = sessionDoc.data() as Session;
              const updatedPersonIds = sessionData.personIds.filter(id => id !== personId);
              batch.update(sessionDoc.ref, { personIds: updatedPersonIds });
          });
          // Add person to new selected sessions
          sessionIds.forEach(sessionId => {
              const sessionRef = doc(getCollectionRef('sessions'), sessionId);
              const session = sessions.find(s => s.id === sessionId);
              if (session) {
                  const newPersonIds = Array.from(new Set([...session.personIds, personId]));
                  batch.update(sessionRef, { personIds: newPersonIds });
              }
          });
          await batch.commit();
          toast({ title: 'Inscripción Actualizada', description: 'Se han guardado las nuevas inscripciones.' });
      } catch (error) {
          handleFirestoreError(error, 'enrollPersonInSessions');
      }
  }, [getCollectionRef, sessions, toast]);

  const enrollPeopleInClass = useCallback(async (sessionId: string, personIds: string[]) => {
      try {
          const sessionRef = doc(getCollectionRef('sessions'), sessionId);
          await updateEntity('sessions', sessionId, { personIds }, 'Inscripciones actualizadas.');
      } catch (error) {
          handleFirestoreError(error, 'enrollPeopleInClass');
      }
  }, [getCollectionRef, updateEntity]);
  
  const saveAttendance = useCallback(async (sessionId: string, presentIds: string[], absentIds: string[], justifiedAbsenceIds: string[]) => {
      const dateStr = formatDate(new Date(), 'yyyy-MM-dd');
      const attendanceQuery = query(getCollectionRef('attendance'), where('sessionId', '==', sessionId), where('date', '==', dateStr));
      try {
          const snap = await getDocs(attendanceQuery);
          const record = { sessionId, date: dateStr, presentIds, absentIds, justifiedAbsenceIds };
          if (snap.empty) {
              await addDoc(getCollectionRef('attendance'), record);
          } else {
              await setDoc(snap.docs[0].ref, record, { merge: true });
          }
          toast({ title: "Asistencia Guardada", description: "Se ha registrado la asistencia de hoy." });
      } catch (error) {
          handleFirestoreError(error, 'saveAttendance');
      }
  }, [getCollectionRef, toast]);
  
  const addJustifiedAbsence = useCallback(async (personId: string, sessionId: string, date: Date) => {
      const dateStr = formatDate(date, 'yyyy-MM-dd');
      const attendanceQuery = query(getCollectionRef('attendance'), where('sessionId', '==', sessionId), where('date', '==', dateStr));
      try {
          const snap = await getDocs(attendanceQuery);
          if (snap.empty) {
              await addDoc(getCollectionRef('attendance'), { sessionId, date: dateStr, presentIds: [], absentIds: [], justifiedAbsenceIds: [personId] });
          } else {
              const record = snap.docs[0].data() as SessionAttendance;
              const updatedJustified = Array.from(new Set([...(record.justifiedAbsenceIds || []), personId]));
              await setDoc(snap.docs[0].ref, { justifiedAbsenceIds: updatedJustified }, { merge: true });
          }
          toast({ title: "Ausencia Justificada", description: "Se ha registrado la ausencia y se ha otorgado un recupero." });
      } catch (error) {
          handleFirestoreError(error, 'addJustifiedAbsence');
      }
  }, [getCollectionRef, toast]);

  const addOneTimeAttendee = useCallback(async (sessionId: string, personId: string, date: Date) => {
      const dateStr = formatDate(date, 'yyyy-MM-dd');
      const attendanceQuery = query(getCollectionRef('attendance'), where('sessionId', '==', sessionId), where('date', '==', dateStr));
      try {
          const snap = await getDocs(attendanceQuery);
          if (snap.empty) {
              await addDoc(getCollectionRef('attendance'), { sessionId, date: dateStr, presentIds: [], absentIds: [], oneTimeAttendees: [personId] });
          } else {
              const record = snap.docs[0].data() as SessionAttendance;
              const updatedAttendees = Array.from(new Set([...(record.oneTimeAttendees || []), personId]));
              await setDoc(snap.docs[0].ref, { oneTimeAttendees: updatedAttendees }, { merge: true });
          }
          toast({ title: "Asistente Puntual Añadido", description: "La persona ha sido inscrita para esta fecha." });
      } catch (error) {
          handleFirestoreError(error, 'addOneTimeAttendee');
      }
  }, [getCollectionRef, toast]);
  
  const addVacationPeriod = useCallback(async (personId: string, startDate: Date, endDate: Date) => {
      const person = people.find(p => p.id === personId);
      if (!person) return;
      const newVacation: VacationPeriod = { id: `vac-${Date.now()}`, startDate, endDate };
      const updatedVacations = [...(person.vacationPeriods || []), newVacation];
      await updateEntity('people', personId, { ...person, vacationPeriods: updatedVacations }, "Período de vacaciones añadido.");
  }, [people, updateEntity]);

  const removeVacationPeriod = useCallback(async (personId: string, vacationId: string) => {
      const person = people.find(p => p.id === personId);
      if (!person || !person.vacationPeriods) return;
      const updatedVacations = person.vacationPeriods.filter(v => v.id !== vacationId);
      await updateEntity('people', personId, { ...person, vacationPeriods: updatedVacations }, "Período de vacaciones eliminado.");
  }, [people, updateEntity]);

  const addToWaitlist = useCallback(async (sessionId: string, personId: string) => {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;
      const updatedWaitlist = Array.from(new Set([...(session.waitlistPersonIds || []), personId]));
      await updateEntity('sessions', sessionId, { ...session, waitlistPersonIds: updatedWaitlist }, "Anotado en lista de espera.");
  }, [sessions, updateEntity]);

  const enrollFromWaitlist = useCallback(async (notificationId: string, sessionId: string, personId: string) => {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;
      const newPersonIds = Array.from(new Set([...session.personIds, personId]));
      const newWaitlist = session.waitlistPersonIds?.filter(id => id !== personId) || [];
      
      try {
          const batch = writeBatch(db);
          const sessionRef = doc(getCollectionRef('sessions'), sessionId);
          batch.update(sessionRef, { personIds: newPersonIds, waitlistPersonIds: newWaitlist });
          
          const notifRef = doc(getCollectionRef('notifications'), notificationId);
          batch.delete(notifRef);
          
          await batch.commit();
          toast({ title: '¡Persona inscripta!', description: 'Se ha inscripto a la persona desde la lista de espera.' });
      } catch(error) {
          handleFirestoreError(error, 'enrollFromWaitlist');
      }
  }, [sessions, getCollectionRef, toast]);
  
  const deleteWithUsageCheck = useCallback(async (entityId: string, checks: { collection: string; field: string; label: string }[], deleteCallback: () => Promise<void>) => {
    try {
        for (const check of checks) {
            const q = query(getCollectionRef(check.collection), where(check.field, '==', entityId));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                toast({ variant: 'destructive', title: 'Error al eliminar', description: `No se puede eliminar. Está en uso por ${snapshot.size} ${check.label}(s).` });
                return;
            }
        }
        await deleteCallback();
    } catch (error) {
        handleFirestoreError(error, 'deleteWithUsageCheck');
    }
  }, [getCollectionRef, toast]);
  
  return (
    <StudioContext.Provider value={{ 
        actividades, specialists, people, sessions, payments, spaces, attendance, notifications, tariffs, levels,
        isPersonOnVacation, isTutorialOpen, openTutorial, closeTutorial, 
        addActividad: (data) => addEntity('actividades', data, 'Actividad añadida.'),
        updateActividad: (data) => updateEntity('actividades', data.id, data, 'Actividad actualizada.'),
        deleteActividad: (id) => deleteWithUsageCheck(id, [{collection: 'specialists', field: 'actividadIds', label: 'especialista'}, {collection: 'sessions', field: 'actividadId', label: 'sesión'}], () => deleteEntity('actividades', id, 'Actividad eliminada.')),
        addSpecialist: (data) => addEntity('specialists', {...data, avatar: `https://placehold.co/100x100.png`}, 'Especialista añadido.'),
        updateSpecialist: (data) => updateEntity('specialists', data.id, data, 'Especialista actualizado.'),
        deleteSpecialist: (id) => deleteWithUsageCheck(id, [{collection: 'sessions', field: 'instructorId', label: 'sesión'}], () => deleteEntity('specialists', id, 'Especialista eliminado.')),
        addPerson,
        updatePerson: (data) => updateEntity('people', data.id, data, 'Persona actualizada.'),
        deactivatePerson,
        reactivatePerson,
        recordPayment,
        undoLastPayment,
        addSpace: (data) => addEntity('spaces', data, 'Espacio añadido.'),
        updateSpace: (data) => updateEntity('spaces', data.id, data, 'Espacio actualizado.'),
        deleteSpace: (id) => deleteWithUsageCheck(id, [{collection: 'sessions', field: 'spaceId', label: 'sesión'}], () => deleteEntity('spaces', id, 'Espacio eliminado.')),
        addSession: (data) => addEntity('sessions', {...data, personIds: [], waitlistPersonIds: []}, 'Sesión añadida.'),
        updateSession: (data) => updateEntity('sessions', data.id, data, 'Sesión actualizada.'),
        deleteSession: (id) => deleteWithUsageCheck(id, [], () => deleteEntity('sessions', id, 'Sesión eliminada.')),
        enrollPersonInSessions,
        enrollPeopleInClass,
        saveAttendance,
        addOneTimeAttendee,
        addJustifiedAbsence,
        addVacationPeriod,
        removeVacationPeriod,
        addToWaitlist,
        enrollFromWaitlist,
        dismissNotification: (id) => deleteEntity('notifications', id, 'Notificación descartada.'),
        addTariff: (data) => addEntity('tariffs', data, 'Arancel añadido.'),
        updateTariff: (data) => updateEntity('tariffs', data.id, data, 'Arancel actualizado.'),
        deleteTariff: (id) => deleteEntity('tariffs', id, 'Arancel eliminado.'),
        addLevel: (data) => addEntity('levels', data, 'Nivel añadido.'),
        updateLevel: (data) => updateEntity('levels', data.id, data, 'Nivel actualizado.'),
        deleteLevel: (id) => deleteWithUsageCheck(id, [{collection: 'people', field: 'levelId', label: 'persona'}, {collection: 'sessions', field: 'levelId', label: 'sesión'}], () => deleteEntity('levels', id, 'Nivel eliminado.')),
    }}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (context === undefined) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
}
