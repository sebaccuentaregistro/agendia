'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import type { Actividad, Specialist, Person, Session, Payment, Space, SessionAttendance, AppNotification, Tariff, Level } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { set, addMonths, differenceInDays, addDays, format as formatDate } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, query, where, getDocs, Timestamp, orderBy, CollectionReference } from 'firebase/firestore';
import * as Actions from '@/lib/firestore-actions';

// Helper function to convert Firestore Timestamps to Dates in nested objects
const convertTimestamps = (data: any) => {
    if (!data) return data;
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

export function StudioProvider({ children, instituteId }: { children: ReactNode, instituteId: string }) {
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

  const collectionRefs = useMemo(() => {
      const instituteRef = doc(db, 'institutes', instituteId);
      return {
          actividades: collection(instituteRef, 'actividades'),
          specialists: collection(instituteRef, 'specialists'),
          people: collection(instituteRef, 'people'),
          sessions: collection(instituteRef, 'sessions'),
          payments: collection(instituteRef, 'payments'),
          spaces: collection(instituteRef, 'spaces'),
          attendance: collection(instituteRef, 'attendance'),
          notifications: collection(instituteRef, 'notifications'),
          tariffs: collection(instituteRef, 'tariffs'),
          levels: collection(instituteRef, 'levels'),
      };
  }, [instituteId]);

  useEffect(() => {
    const collectionsToFetch = [
        { name: 'actividades', setter: setActividades, ref: collectionRefs.actividades },
        { name: 'specialists', setter: setSpecialists, ref: collectionRefs.specialists },
        { name: 'people', setter: setPeople, ref: collectionRefs.people },
        { name: 'sessions', setter: setSessions, ref: collectionRefs.sessions },
        { name: 'payments', setter: setPayments, ref: collectionRefs.payments },
        { name: 'spaces', setter: setSpaces, ref: collectionRefs.spaces },
        { name: 'attendance', setter: setAttendance, ref: collectionRefs.attendance },
        { name: 'notifications', setter: setNotifications, ref: collectionRefs.notifications },
        { name: 'tariffs', setter: setTariffs, ref: collectionRefs.tariffs },
        { name: 'levels', setter: setLevels, ref: collectionRefs.levels },
    ];

    const unsubscribes = collectionsToFetch.map(({ name, setter, ref }) => {
        return onSnapshot(ref, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) })) as any[];
            setter(data);
        }, (error) => {
            console.error(`Error fetching ${name}:`, error);
            toast({ variant: 'destructive', title: `Error al cargar ${name}`, description: 'No se pudieron cargar los datos. Intenta recargar la página.' });
        });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [collectionRefs, toast]);
  
  const handleAction = useCallback(async (action: Promise<any>, successMessage: string) => {
      try {
          await action;
          toast({ title: 'Éxito', description: successMessage });
      } catch (error: any) {
          console.error("Firestore action error:", error);
          toast({ variant: "destructive", title: "Error de base de datos", description: error.message || "La operación no se pudo completar." });
      }
  }, [toast]);

  const isPersonOnVacation = useCallback((person: Person, date: Date): boolean => {
    if (!person.vacationPeriods) return false;
    const checkDate = set(date, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
    
    return person.vacationPeriods.some(period => {
        const startDate = set(period.startDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
        const endDate = set(period.endDate, { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 });
        return checkDate >= startDate && checkDate <= endDate;
    });
  }, []);

  const deleteWithUsageCheck = useCallback(async (entityId: string, checks: { collection: string; field: string; label: string }[], collectionName: string) => {
      try {
          const refs: { [key: string]: CollectionReference } = collectionRefs;
          await Actions.deleteWithUsageCheckAction(refs, entityId, checks);
          await Actions.deleteEntity(doc(refs[collectionName], entityId));
          toast({ title: 'Éxito', description: 'Elemento eliminado correctamente.' });
      } catch (error: any) {
          handleAction(Promise.reject(error), '');
      }
  }, [collectionRefs, handleAction, toast]);
  
  return (
    <StudioContext.Provider value={{ 
        actividades, specialists, people, sessions, payments, spaces, attendance, notifications, tariffs, levels,
        isPersonOnVacation, isTutorialOpen, openTutorial, closeTutorial, 
        addActividad: (data) => handleAction(Actions.addEntity(collectionRefs.actividades, data), 'Actividad añadida.'),
        updateActividad: (data) => handleAction(Actions.updateEntity(doc(collectionRefs.actividades, data.id), data), 'Actividad actualizada.'),
        deleteActividad: (id) => deleteWithUsageCheck(id, [{collection: 'specialists', field: 'actividadIds', label: 'especialista'}, {collection: 'sessions', field: 'actividadId', label: 'sesión'}], 'actividades'),
        addSpecialist: (data) => handleAction(Actions.addEntity(collectionRefs.specialists, {...data, avatar: `https://placehold.co/100x100.png`}), 'Especialista añadido.'),
        updateSpecialist: (data) => handleAction(Actions.updateEntity(doc(collectionRefs.specialists, data.id), data), 'Especialista actualizado.'),
        deleteSpecialist: (id) => deleteWithUsageCheck(id, [{collection: 'sessions', field: 'instructorId', label: 'sesión'}], 'specialists'),
        addPerson: (data) => handleAction(Actions.addPersonAction(collectionRefs.people, data), 'Persona añadida.'),
        updatePerson: (data) => handleAction(Actions.updateEntity(doc(collectionRefs.people, data.id), data), 'Persona actualizada.'),
        deactivatePerson: (id, reason) => handleAction(Actions.deactivatePersonAction(collectionRefs.people, collectionRefs.sessions, id, reason), 'Persona dada de baja.'),
        reactivatePerson: (id) => handleAction(Actions.reactivatePersonAction(collectionRefs.people, id), 'Persona reactivada.'),
        recordPayment: (id, months) => handleAction(Actions.recordPaymentAction(collectionRefs.payments, collectionRefs.people, id, months), 'Pago registrado.'),
        undoLastPayment: (personId) => {
            const personPayments = payments.filter(p => p.personId === personId).sort((a, b) => b.date.getTime() - a.date.getTime());
            if (personPayments.length > 0) {
                const newLastDate = personPayments.length > 1 ? personPayments[1].date : people.find(p => p.id === personId)?.joinDate || new Date();
                handleAction(Actions.undoLastPaymentAction(collectionRefs.payments, collectionRefs.people, personId, personPayments[0], newLastDate), 'Último pago deshecho.');
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'No hay pagos para deshacer.' });
            }
        },
        addSpace: (data) => handleAction(Actions.addEntity(collectionRefs.spaces, data), 'Espacio añadido.'),
        updateSpace: (data) => handleAction(Actions.updateEntity(doc(collectionRefs.spaces, data.id), data), 'Espacio actualizado.'),
        deleteSpace: (id) => deleteWithUsageCheck(id, [{collection: 'sessions', field: 'spaceId', label: 'sesión'}], 'spaces'),
        addSession: (data) => handleAction(Actions.addEntity(collectionRefs.sessions, {...data, personIds: [], waitlistPersonIds: []}), 'Sesión añadida.'),
        updateSession: (data) => handleAction(Actions.updateEntity(doc(collectionRefs.sessions, data.id), data), 'Sesión actualizada.'),
        deleteSession: (id) => deleteWithUsageCheck(id, [], 'sessions'),
        enrollPersonInSessions: (personId, sessionIds) => handleAction(Actions.enrollPersonInSessionsAction(collectionRefs.sessions, personId, sessionIds, sessions), 'Inscripciones actualizadas.'),
        enrollPeopleInClass: (sessionId, personIds) => handleAction(Actions.enrollPeopleInClassAction(doc(collectionRefs.sessions, sessionId), personIds), 'Inscripciones actualizadas.'),
        saveAttendance: (sessionId, presentIds, absentIds, justifiedIds) => handleAction(Actions.saveAttendanceAction(collectionRefs.attendance, sessionId, presentIds, absentIds, justifiedIds), 'Asistencia guardada.'),
        addOneTimeAttendee: (sessionId, personId, date) => handleAction(Actions.addOneTimeAttendeeAction(collectionRefs.attendance, sessionId, personId, date), 'Asistente puntual añadido.'),
        addJustifiedAbsence: (personId, sessionId, date) => handleAction(Actions.addJustifiedAbsenceAction(collectionRefs.attendance, personId, sessionId, date), 'Ausencia justificada.'),
        addVacationPeriod: (personId, startDate, endDate) => {
            const person = people.find(p => p.id === personId);
            if(person) handleAction(Actions.addVacationPeriodAction(doc(collectionRefs.people, personId), person, startDate, endDate), 'Período de vacaciones añadido.');
        },
        removeVacationPeriod: (personId, vacationId) => {
            const person = people.find(p => p.id === personId);
            if(person) handleAction(Actions.removeVacationPeriodAction(doc(collectionRefs.people, personId), person, vacationId), 'Período de vacaciones eliminado.');
        },
        addToWaitlist: (sessionId, personId) => {
            const session = sessions.find(s => s.id === sessionId);
            if(session) handleAction(Actions.addToWaitlistAction(doc(collectionRefs.sessions, sessionId), session, personId), 'Anotado en lista de espera.');
        },
        enrollFromWaitlist: (notificationId, sessionId, personId) => {
            const session = sessions.find(s => s.id === sessionId);
            if(session) handleAction(Actions.enrollFromWaitlistAction(collectionRefs.sessions, collectionRefs.notifications, notificationId, sessionId, personId, session), 'Persona inscripta desde lista de espera.');
        },
        dismissNotification: (id) => handleAction(Actions.deleteEntity(doc(collectionRefs.notifications, id)), 'Notificación descartada.'),
        addTariff: (data) => handleAction(Actions.addEntity(collectionRefs.tariffs, data), 'Arancel añadido.'),
        updateTariff: (data) => handleAction(Actions.updateEntity(doc(collectionRefs.tariffs, data.id), data), 'Arancel actualizado.'),
        deleteTariff: (id) => handleAction(Actions.deleteEntity(doc(collectionRefs.tariffs, id)), 'Arancel eliminado.'),
        addLevel: (data) => handleAction(Actions.addEntity(collectionRefs.levels, data), 'Nivel añadido.'),
        updateLevel: (data) => handleAction(Actions.updateEntity(doc(collectionRefs.levels, data.id), data), 'Nivel actualizado.'),
        deleteLevel: (id) => deleteWithUsageCheck(id, [{collection: 'people', field: 'levelId', label: 'persona'}, {collection: 'sessions', field: 'levelId', label: 'sesión'}], 'levels'),
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
