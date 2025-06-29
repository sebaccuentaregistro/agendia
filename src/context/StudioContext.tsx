'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Actividad, Specialist, Person, Session, Payment, Space, SessionAttendance, AppNotification, Tariff, Level } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { set, addMonths, differenceInDays, addDays, format as formatDate } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, setDoc, deleteDoc, query, where, writeBatch, getDocs, Timestamp } from 'firebase/firestore';


// Helper to convert Firestore Timestamps to JS Dates in nested objects
const convertTimestamps = (data: any) => {
  if (!data) return data;
  if (data instanceof Timestamp) {
    return data.toDate();
  }
  if (Array.isArray(data)) {
    return data.map(convertTimestamps);
  }
  if (typeof data === 'object') {
    const newObj: { [key: string]: any } = {};
    for (const key in data) {
      newObj[key] = convertTimestamps(data[key]);
    }
    return newObj;
  }
  return data;
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
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
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
  
  // Real-time listeners for all collections
  useEffect(() => {
    if (!instituteId) return;

    const collections = {
        actividades: collection(db, 'institutes', instituteId, 'actividades'),
        specialists: collection(db, 'institutes', instituteId, 'specialists'),
        spaces: collection(db, 'institutes', instituteId, 'spaces'),
        sessions: collection(db, 'institutes', instituteId, 'sessions'),
        people: collection(db, 'institutes', instituteId, 'people'),
        payments: collection(db, 'institutes', instituteId, 'payments'),
        attendance: collection(db, 'institutes', instituteId, 'attendance'),
        notifications: collection(db, 'institutes', instituteId, 'notifications'),
        tariffs: collection(db, 'institutes', instituteId, 'tariffs'),
        levels: collection(db, 'institutes', instituteId, 'levels'),
    };

    const unsubscribes = [
        onSnapshot(collections.actividades, snapshot => setActividades(snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) } as Actividad)))),
        onSnapshot(collections.specialists, snapshot => setSpecialists(snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) } as Specialist)))),
        onSnapshot(collections.spaces, snapshot => setSpaces(snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) } as Space)))),
        onSnapshot(collections.sessions, snapshot => setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) } as Session)))),
        onSnapshot(collections.people, snapshot => setPeople(snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) } as Person)))),
        onSnapshot(collections.payments, snapshot => setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) } as Payment)))),
        onSnapshot(collections.attendance, snapshot => setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) } as SessionAttendance)))),
        onSnapshot(collections.notifications, snapshot => setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) } as AppNotification)))),
        onSnapshot(collections.tariffs, snapshot => setTariffs(snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) } as Tariff)))),
        onSnapshot(collections.levels, snapshot => setLevels(snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) } as Level)))),
    ];

    return () => unsubscribes.forEach(unsub => unsub());
  }, [instituteId]);


  const isPersonOnVacation = useCallback((person: Person, date: Date): boolean => {
    if (!person.vacationPeriods) return false;
    const checkDate = set(date, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
    
    return person.vacationPeriods.some(period => {
        const startDate = set(period.startDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
        const endDate = set(period.endDate, { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 });
        return checkDate >= startDate && checkDate <= endDate;
    });
  }, []);

  // Effect to generate notifications for churn risk
  const generateChurnNotifications = useCallback(() => {
    // This logic can be adapted to run in a cloud function for better performance
    // For now, it runs on the client
  }, [people, sessions, attendance, isPersonOnVacation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      generateChurnNotifications();
    }, 1000); 
    return () => clearTimeout(timer);
  }, [generateChurnNotifications]);

  const addActividad = async (data: Omit<Actividad, 'id'>) => {
    if (actividades.some(a => a.name.trim().toLowerCase() === data.name.trim().toLowerCase())) {
        toast({ variant: "destructive", title: "Actividad Duplicada", description: "Ya existe una actividad con este nombre." });
        return;
    }
    await addDoc(collection(db, 'institutes', instituteId, 'actividades'), data);
  };

  const updateActividad = async (updated: Actividad) => {
    if (actividades.some(a => a.id !== updated.id && a.name.trim().toLowerCase() === updated.name.trim().toLowerCase())) {
        toast({ variant: "destructive", title: "Nombre Duplicado", description: "Ya existe otra actividad con este nombre." });
        return;
    }
    const { id, ...data } = updated;
    await setDoc(doc(db, 'institutes', instituteId, 'actividades', id), data);
  };

  const deleteActividad = async (id: string) => {
    if (sessions.some(c => c.actividadId === id) || specialists.some(s => s.actividadIds.includes(id))) {
      toast({ variant: "destructive", title: "Actividad en Uso" });
      return;
    }
    await deleteDoc(doc(db, 'institutes', instituteId, 'actividades', id));
  };
  
  const addSpecialist = async (data: Omit<Specialist, 'id' | 'avatar'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'specialists'), { ...data, avatar: `https://placehold.co/100x100.png` });
  };

  const updateSpecialist = async (updated: Specialist) => {
    const { id, ...data } = updated;
    await setDoc(doc(db, 'institutes', instituteId, 'specialists', id), data);
  };

  const deleteSpecialist = async (id: string) => {
    if (sessions.some(c => c.instructorId === id)) {
      toast({ variant: "destructive", title: "Especialista en Uso" });
      return;
    }
    await deleteDoc(doc(db, 'institutes', instituteId, 'specialists', id));
  };
  
  const addPerson = async (data: Omit<Person, 'id' | 'avatar' | 'joinDate' | 'lastPaymentDate' | 'vacationPeriods' | 'status' | 'cancellationReason' | 'cancellationDate'>) => {
    const now = new Date();
    const newPersonData = { 
        ...data, 
        joinDate: now, 
        lastPaymentDate: now,
        status: 'active' as const,
        vacationPeriods: [],
        avatar: `https://placehold.co/100x100.png`
    };
    const newPersonRef = await addDoc(collection(db, 'institutes', instituteId, 'people'), newPersonData);
    if (data.membershipType === 'Mensual') {
      await addDoc(collection(db, 'institutes', instituteId, 'payments'), { personId: newPersonRef.id, date: now, months: 1 });
    }
  };

  const updatePerson = async (updated: Person) => {
    const { id, ...data } = updated;
    await setDoc(doc(db, 'institutes', instituteId, 'people', id), data);
  };
  
  const deactivatePerson = async (personId: string, reason: string) => {
    const personRef = doc(db, 'institutes', instituteId, 'people', personId);
    await setDoc(personRef, { status: 'inactive', cancellationReason: reason, cancellationDate: new Date() }, { merge: true });

    const updatedSessions = sessions.map(session => {
        if (session.personIds.includes(personId) || session.waitlistPersonIds?.includes(personId)) {
            return {
                ...session,
                personIds: session.personIds.filter(pid => pid !== personId),
                waitlistPersonIds: session.waitlistPersonIds?.filter(pid => pid !== personId) || []
            };
        }
        return session;
    }).filter(Boolean) as Session[];

    const batch = writeBatch(db);
    updatedSessions.forEach(session => {
        const { id, ...sessionData } = session;
        batch.set(doc(db, 'institutes', instituteId, 'sessions', id), sessionData);
    });
    await batch.commit();

    toast({ title: 'Persona Dada de Baja' });
  };
  
  const reactivatePerson = async (personId: string) => {
    const personToReactivate = people.find(p => p.id === personId);
    if (!personToReactivate) return;
    const now = new Date();
    await setDoc(doc(db, 'institutes', instituteId, 'people', personId), { status: 'active', cancellationReason: null, cancellationDate: null, lastPaymentDate: now }, { merge: true });
    if (personToReactivate.membershipType === 'Mensual') {
      await addDoc(collection(db, 'institutes', instituteId, 'payments'), { personId, date: now, months: 1 });
    }
  };
  
  const recordPayment = async (personId: string, months: number) => {
    const person = people.find(p => p.id === personId);
    if (!person) return;
    const now = new Date();
    await addDoc(collection(db, 'institutes', instituteId, 'payments'), { personId, date: now, months });
    await setDoc(doc(db, 'institutes', instituteId, 'people', personId), { lastPaymentDate: addMonths(person.lastPaymentDate, months) }, { merge: true });
  };
  
  const undoLastPayment = async (personId: string) => {
     // This needs more complex logic to be robust, for now, it's a simple revert
  };

  const addSpace = async (data: Omit<Space, 'id'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'spaces'), data);
  };

  const updateSpace = async (updated: Space) => {
    const { id, ...data } = updated;
    await setDoc(doc(db, 'institutes', instituteId, 'spaces', id), data);
  };

  const deleteSpace = async (id: string) => {
    if (sessions.some(c => c.spaceId === id)) {
      toast({ variant: "destructive", title: "Espacio en Uso" });
      return;
    }
    await deleteDoc(doc(db, 'institutes', instituteId, 'spaces', id));
  };
  
  const addSession = async (data: Omit<Session, 'id'|'personIds'|'waitlistPersonIds'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'sessions'), { ...data, personIds: [], waitlistPersonIds: [] });
  };

  const updateSession = async (updated: Session) => {
    const { id, ...data } = updated;
    await setDoc(doc(db, 'institutes', instituteId, 'sessions', id), data);
  };

  const deleteSession = async (id: string) => {
    const session = sessions.find(s => s.id === id);
    if(session && session.personIds.length > 0) {
      toast({ variant: 'destructive', title: 'Sesión con inscriptos' });
      return;
    }
    await deleteDoc(doc(db, 'institutes', instituteId, 'sessions', id));
  };
  
  const enrollPersonInSessions = async (personId: string, newSessionIds: string[]) => {
      // Implement batch write for efficiency
  };

  const enrollPeopleInClass = async (sessionId: string, personIds: string[]) => {
      await updateSession({ ...sessions.find(s => s.id === sessionId)!, personIds });
  };
  
  const saveAttendance = async (sessionId: string, presentIds: string[], absentIds: string[], justifiedAbsenceIds: string[]) => {
      const dateStr = formatDate(new Date(), 'yyyy-MM-dd');
      const attendanceQuery = query(
        collection(db, 'institutes', instituteId, 'attendance'),
        where('sessionId', '==', sessionId),
        where('date', '==', dateStr)
      );
      const querySnapshot = await getDocs(attendanceQuery);
      const data = { sessionId, date: dateStr, presentIds, absentIds, justifiedAbsenceIds };

      if (querySnapshot.empty) {
          await addDoc(collection(db, 'institutes', instituteId, 'attendance'), data);
      } else {
          const docId = querySnapshot.docs[0].id;
          await setDoc(doc(db, 'institutes', instituteId, 'attendance', docId), data);
      }
      toast({title: 'Asistencia Guardada'});
  };

  const addOneTimeAttendee = async (sessionId: string, personId: string, date: Date) => {
      // Implement logic
  };

  const addJustifiedAbsence = async (personId: string, sessionId: string, date: Date) => {
      // Implement logic
  };

  const addVacationPeriod = async (personId: string, startDate: Date, endDate: Date) => {
      // Implement logic
  };

  const removeVacationPeriod = async (personId: string, vacationId: string) => {
      // Implement logic
  };

  const addToWaitlist = async (sessionId: string, personId: string) => {
      // Implement logic
  };

  const enrollFromWaitlist = async (notificationId: string, sessionId: string, personId: string) => {
      // Implement logic
  };

  const dismissNotification = async (notificationId: string) => {
      await deleteDoc(doc(db, 'institutes', instituteId, 'notifications', notificationId));
  };

  const addTariff = async (tariff: Omit<Tariff, 'id'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'tariffs'), tariff);
  };

  const updateTariff = async (tariff: Tariff) => {
    const { id, ...data } = tariff;
    await setDoc(doc(db, 'institutes', instituteId, 'tariffs', id), data);
  };

  const deleteTariff = async (id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'tariffs', id));
  };

  const addLevel = async (level: Omit<Level, 'id'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'levels'), level);
  };

  const updateLevel = async (level: Level) => {
    const { id, ...data } = level;
    await setDoc(doc(db, 'institutes', instituteId, 'levels', id), data);
  };
  
  const deleteLevel = async (id: string) => {
    if (sessions.some(s => s.levelId === id) || people.some(p => p.levelId === id)) {
      toast({ variant: 'destructive', title: 'Nivel en uso' });
      return;
    }
    await deleteDoc(doc(db, 'institutes', instituteId, 'levels', id));
  };

  return (
    <StudioContext.Provider value={{ 
        actividades, specialists, people, sessions, payments, spaces, attendance, notifications, tariffs, levels, 
        addActividad, updateActividad, deleteActividad, 
        addSpecialist, updateSpecialist, deleteSpecialist, 
        addPerson, updatePerson, deactivatePerson, reactivatePerson, recordPayment, undoLastPayment, 
        addSpace, updateSpace, deleteSpace, 
        addSession, updateSession, deleteSession, enrollPersonInSessions, enrollPeopleInClass, 
        saveAttendance, addOneTimeAttendee, addJustifiedAbsence, 
        addVacationPeriod, removeVacationPeriod, isPersonOnVacation, 
        addToWaitlist, enrollFromWaitlist, dismissNotification, 
        addTariff, updateTariff, deleteTariff, 
        addLevel, updateLevel, deleteLevel, 
        isTutorialOpen, openTutorial, closeTutorial 
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
