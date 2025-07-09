
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import type { Actividad, Specialist, Person, Session, Payment, Space, SessionAttendance, AppNotification, Tariff, Level, VacationPeriod } from '@/types';
import { 
    actividades as staticActividades, 
    specialists as staticSpecialists,
    people as staticPeople,
    sessions as staticSessions,
    payments as staticPayments,
    spaces as staticSpaces,
    attendance as staticAttendance,
    notifications as staticNotifications,
    tariffs as staticTariffs,
    levels as staticLevels
} from '@/lib/data';
import { addMonths, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const parseDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (date.toDate && typeof date.toDate === 'function') {
        return date.toDate();
    }
    if (typeof date === 'string' || typeof date === 'number') {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
    }
    console.warn("Could not parse date:", date);
    return null;
};

const processData = (data: any[], dateFields: string[], nestedDateFields: {path: string, fields: string[]}[] = []) => {
  return data.map(item => {
    const newItem = { ...item };
    dateFields.forEach(field => {
      if (newItem[field]) {
        newItem[field] = parseDate(newItem[field]);
      }
    });
    nestedDateFields.forEach(nested => {
        if (newItem[nested.path] && Array.isArray(newItem[nested.path])) {
            newItem[nested.path] = newItem[nested.path].map((subItem: any) => {
                const newSubItem = {...subItem};
                nested.fields.forEach(field => {
                    if (newSubItem[field]) {
                        newSubItem[field] = parseDate(newSubItem[field]);
                    }
                });
                return newSubItem;
            });
        }
    });
    return newItem;
  });
};

type State = {
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
  loading: boolean;
};

interface StudioContextType extends State {
    addActividad: (data: Omit<Actividad, 'id'>) => void;
    updateActividad: (data: Actividad) => void;
    deleteActividad: (id: string) => void;
    addSpecialist: (data: Omit<Specialist, 'id' | 'avatar'>) => void;
    updateSpecialist: (data: Specialist) => void;
    deleteSpecialist: (id: string) => void;
    addPerson: (data: Omit<Person, 'id' | 'avatar' | 'joinDate' | 'lastPaymentDate' | 'vacationPeriods'>) => void;
    updatePerson: (data: Person) => void;
    deletePerson: (id: string) => void;
    recordPayment: (personId: string) => void;
    undoLastPayment: (personId: string) => void;
    addSpace: (data: Omit<Space, 'id'>) => void;
    updateSpace: (data: Space) => void;
    deleteSpace: (id: string) => void;
    addSession: (data: Omit<Session, 'id'| 'personIds' | 'waitlistPersonIds'>) => void;
    updateSession: (data: Session) => void;
    deleteSession: (id: string) => void;
    enrollPeopleInClass: (sessionId: string, personIds: string[]) => void;
    saveAttendance: (sessionId: string, presentIds: string[], absentIds: string[], justifiedAbsenceIds: string[]) => void;
    addOneTimeAttendee: (sessionId: string, personId: string, date: Date) => void;
    addVacationPeriod: (personId: string, startDate: Date, endDate: Date) => void;
    removeVacationPeriod: (personId: string, vacationId: string) => void;
    isPersonOnVacation: (person: Person, date: Date) => boolean;
    enrollFromWaitlist: (notificationId: string, sessionId: string, personId: string) => void;
    dismissNotification: (id: string) => void;
    addTariff: (data: Omit<Tariff, 'id'>) => void;
    updateTariff: (data: Tariff) => void;
    deleteTariff: (id: string) => void;
    addLevel: (data: Omit<Level, 'id'>) => void;
    updateLevel: (data: Level) => void;
    deleteLevel: (id: string) => void;
    isTutorialOpen: boolean;
    openTutorial: () => void;
    closeTutorial: () => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

const processedPeople = processData(staticPeople, ['joinDate', 'lastPaymentDate'], [{path: 'vacationPeriods', fields: ['startDate', 'endDate']}]);
const processedPayments = processData(staticPayments, ['date']);
const processedNotifications = processData(staticNotifications, ['createdAt']);

const initialAppState: State = {
    actividades: staticActividades,
    specialists: staticSpecialists,
    people: processedPeople,
    sessions: staticSessions,
    payments: processedPayments,
    spaces: staticSpaces,
    attendance: staticAttendance,
    notifications: processedNotifications,
    tariffs: staticTariffs,
    levels: staticLevels,
    loading: false,
};

export function StudioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialAppState);
  const { toast } = useToast();

  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const openTutorial = useCallback(() => setIsTutorialOpen(true), []);
  const closeTutorial = useCallback(() => {
      setIsTutorialOpen(false);
      try {
        localStorage.setItem('agendia-tutorial-completed', 'true');
      } catch (e) { console.warn("Could not save tutorial state."); }
  }, []);

  const isPersonOnVacation = useCallback((person: Person, date: Date): boolean => {
    if (!person.vacationPeriods) return false;
    const checkDate = new Date(date.setHours(0, 0, 0, 0));
    return person.vacationPeriods.some(period => {
        if (!period.startDate || !period.endDate) return false;
        const startDate = parseDate(period.startDate);
        const endDate = parseDate(period.endDate);
        if (!startDate || !endDate) return false;
        return checkDate >= new Date(startDate.setHours(0,0,0,0)) && checkDate <= new Date(endDate.setHours(23,59,59,999));
    });
  }, []);

  // --- Generic CRUD Functions ---

  const updateCollection = useCallback(<T extends { id: string }>(key: keyof Omit<State, 'loading'>, item: T) => {
    setState(current => ({
      ...current,
      [key]: (current[key] as T[]).map(i => (i.id === item.id ? item : i)),
    }));
  }, []);

  const addToCollection = useCallback(<T extends { id: string }>(key: keyof Omit<State, 'loading'>, itemData: Omit<T, 'id'>, defaultValues: Partial<T> = {}) => {
      const newItem: T = {
        id: `${key.toString().slice(0, -1)}-${Date.now()}`,
        ...defaultValues,
        ...itemData,
      } as T;
      setState(current => ({
        ...current,
        [key]: [...(current[key] as T[]), newItem],
      }));
  }, []);

  const deleteFromCollection = useCallback((key: keyof Omit<State, 'loading'>, id: string, usageChecks: { collection: keyof State, field: string, label: string, type?: 'array' }[]) => {
    for (const check of usageChecks) {
        const collectionToCheck = state[check.collection] as any[];
        const isUsed = collectionToCheck.some(item => 
            check.type === 'array' 
            ? item[check.field]?.includes(id) 
            : item[check.field] === id
        );
        if (isUsed) {
            toast({
                title: 'Error al eliminar',
                description: `No se puede eliminar porque está en uso por al menos un(a) ${check.label}.`,
                variant: 'destructive',
            });
            return;
        }
    }
    setState(current => ({
      ...current,
      [key]: (current[key] as any[]).filter(i => i.id !== id),
    }));
  }, [state, toast]);

  // Actividades
  const addActividad = useCallback((data: Omit<Actividad, 'id'>) => addToCollection('actividades', data), [addToCollection]);
  const updateActividad = useCallback((data: Actividad) => updateCollection('actividades', data), [updateCollection]);
  const deleteActividad = useCallback((id: string) => deleteFromCollection('actividades', id, [
    { collection: 'sessions', field: 'actividadId', label: 'Sesión' },
    { collection: 'specialists', field: 'actividadIds', label: 'Especialista', type: 'array' },
  ]), [deleteFromCollection]);

  // Levels
  const addLevel = useCallback((data: Omit<Level, 'id'>) => addToCollection('levels', data), [addToCollection]);
  const updateLevel = useCallback((data: Level) => updateCollection('levels', data), [updateCollection]);
  const deleteLevel = useCallback((id: string) => deleteFromCollection('levels', id, [
      { collection: 'sessions', field: 'levelId', label: 'Sesión' },
      { collection: 'people', field: 'levelId', label: 'Persona' },
  ]), [deleteFromCollection]);

  // Spaces
  const addSpace = useCallback((data: Omit<Space, 'id'>) => addToCollection('spaces', data), [addToCollection]);
  const updateSpace = useCallback((data: Space) => updateCollection('spaces', data), [updateCollection]);
  const deleteSpace = useCallback((id: string) => deleteFromCollection('spaces', id, [
      { collection: 'sessions', field: 'spaceId', label: 'Sesión' }
  ]), [deleteFromCollection]);

  // Tariffs
  const addTariff = useCallback((data: Omit<Tariff, 'id'>) => addToCollection('tariffs', data), [addToCollection]);
  const updateTariff = useCallback((data: Tariff) => updateCollection('tariffs', data), [updateCollection]);
  const deleteTariff = useCallback((id: string) => deleteFromCollection('tariffs', id, [
      { collection: 'people', field: 'tariffId', label: 'Persona' }
  ]), [deleteFromCollection]);

  // Specialists
  const addSpecialist = useCallback((data: Omit<Specialist, 'id' | 'avatar'>) => addToCollection('specialists', data, { avatar: `https://placehold.co/100x100.png` }), [addToCollection]);
  const updateSpecialist = useCallback((data: Specialist) => updateCollection('specialists', data), [updateCollection]);
  const deleteSpecialist = useCallback((id: string) => deleteFromCollection('specialists', id, [
      { collection: 'sessions', field: 'instructorId', label: 'Sesión' }
  ]), [deleteFromCollection]);

  // Sessions
  const addSession = useCallback((data: Omit<Session, 'id'| 'personIds' | 'waitlistPersonIds'>) => addToCollection('sessions', data, { personIds: [], waitlistPersonIds: [] }), [addToCollection]);
  const updateSession = useCallback((data: Session) => updateCollection('sessions', data), [updateCollection]);
  const deleteSession = useCallback((id: string) => {
    const session = state.sessions.find(s => s.id === id);
    if(session && session.personIds.length > 0) {
        toast({ title: 'Error al eliminar', description: 'No se puede eliminar una sesión con personas inscriptas.', variant: 'destructive' });
        return;
    }
    deleteFromCollection('sessions', id, []);
  }, [state.sessions, deleteFromCollection, toast]);
  
  const enrollPeopleInClass = useCallback((sessionId: string, personIds: string[]) => {
    setState(current => ({
        ...current,
        sessions: current.sessions.map(s => s.id === sessionId ? { ...s, personIds } : s)
    }));
  }, []);

  // People
  const addPerson = useCallback((data: Omit<Person, 'id' | 'avatar' | 'joinDate' | 'lastPaymentDate' | 'vacationPeriods'>) => {
    const now = new Date();
    addToCollection('people', data, {
        joinDate: now,
        lastPaymentDate: addMonths(now, 1),
        avatar: `https://placehold.co/100x100.png`,
        vacationPeriods: [],
    });
  }, [addToCollection]);
  const updatePerson = useCallback((data: Person) => updateCollection('people', data), [updateCollection]);
  const deletePerson = useCallback((id: string) => {
    setState(current => {
        const newSessions = current.sessions.map(s => ({
            ...s,
            personIds: s.personIds.filter(pId => pId !== id),
            waitlistPersonIds: s.waitlistPersonIds?.filter(pId => pId !== id)
        }));
        const newPeople = current.people.filter(p => p.id !== id);
        return { ...current, people: newPeople, sessions: newSessions };
    });
  }, []);
  const recordPayment = useCallback((personId: string) => {
    setState(current => {
      const person = current.people.find(p => p.id === personId);
      if (!person) return current;
      const newExpiryDate = addMonths(person.lastPaymentDate || new Date(), 1);
      const newPayment: Payment = { id: `pay-${Date.now()}`, personId, date: new Date(), months: 1 };
      return {
        ...current,
        people: current.people.map(p => p.id === personId ? { ...p, lastPaymentDate: newExpiryDate } : p),
        payments: [...current.payments, newPayment]
      };
    });
  }, []);
  const undoLastPayment = useCallback((personId: string) => {
    setState(current => {
      const lastPayment = current.payments.filter(p => p.personId === personId).sort((a,b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))[0];
      if (!lastPayment) return current;
      const person = current.people.find(p => p.id === personId);
      if (!person || !person.lastPaymentDate) return current;
      const previousExpiryDate = addMonths(person.lastPaymentDate, -1);
      return {
        ...current,
        people: current.people.map(p => p.id === personId ? { ...p, lastPaymentDate: previousExpiryDate } : p),
        payments: current.payments.filter(p => p.id !== lastPayment.id)
      }
    })
  }, []);

  const saveAttendance = useCallback((sessionId: string, presentIds: string[], absentIds: string[], justifiedAbsenceIds: string[]) => {
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      setState(current => {
          const newAttendance = [...current.attendance];
          const recordIndex = newAttendance.findIndex(a => a.sessionId === sessionId && a.date === dateStr);
          const oneTimeAttendees = recordIndex > -1 ? newAttendance[recordIndex].oneTimeAttendees : [];
          const record = { sessionId, date: dateStr, presentIds, absentIds, justifiedAbsenceIds, oneTimeAttendees };
          if (recordIndex > -1) {
              newAttendance[recordIndex] = { ...newAttendance[recordIndex], ...record };
          } else {
              newAttendance.push({ id: `att-${Date.now()}`, ...record });
          }
          return { ...current, attendance: newAttendance };
      });
  }, []);
  
  const addOneTimeAttendee = useCallback((sessionId: string, personId: string, date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      setState(current => {
          const newAttendance = [...current.attendance];
          const recordIndex = newAttendance.findIndex(a => a.sessionId === sessionId && a.date === dateStr);
          if (recordIndex > -1) {
              const updatedRecord = { ...newAttendance[recordIndex] };
              updatedRecord.oneTimeAttendees = Array.from(new Set([...(updatedRecord.oneTimeAttendees || []), personId]));
              newAttendance[recordIndex] = updatedRecord;
          } else {
              newAttendance.push({
                  id: `att-${Date.now()}`,
                  sessionId,
                  date: dateStr,
                  presentIds: [],
                  absentIds: [],
                  justifiedAbsenceIds: [],
                  oneTimeAttendees: [personId]
              });
          }
          return { ...current, attendance: newAttendance };
      });
  }, []);

  const addVacationPeriod = useCallback((personId: string, startDate: Date, endDate: Date) => {
    const newVacation: VacationPeriod = { id: `vac-${Date.now()}`, startDate, endDate };
    setState(current => ({
        ...current,
        people: current.people.map(p => p.id === personId ? {...p, vacationPeriods: [...(p.vacationPeriods || []), newVacation]} : p)
    }));
  }, []);
  
  const removeVacationPeriod = useCallback((personId: string, vacationId: string) => {
    setState(current => ({
        ...current,
        people: current.people.map(p => p.id === personId ? {...p, vacationPeriods: p.vacationPeriods?.filter(v => v.id !== vacationId)} : p)
    }));
  }, []);
  
  const enrollFromWaitlist = useCallback((notificationId: string, sessionId: string, personId: string) => {
      setState(current => {
          const session = current.sessions.find(s => s.id === sessionId);
          if (!session) return current;

          const newPersonIds = Array.from(new Set([...session.personIds, personId]));
          const newWaitlist = session.waitlistPersonIds?.filter(id => id !== personId) || [];

          return {
              ...current,
              sessions: current.sessions.map(s => s.id === sessionId ? {...s, personIds: newPersonIds, waitlistPersonIds: newWaitlist} : s),
              notifications: current.notifications.filter(n => n.id !== notificationId),
          };
      });
  }, []);

  const dismissNotification = useCallback((id: string) => setState(current => ({ ...current, notifications: current.notifications.filter(n => n.id !== id)})), []);

  const contextValue = useMemo(() => ({
    ...state,
    addActividad, updateActividad, deleteActividad,
    addSpecialist, updateSpecialist, deleteSpecialist,
    addPerson, updatePerson, deletePerson,
    recordPayment, undoLastPayment,
    addSpace, updateSpace, deleteSpace,
    addSession, updateSession, deleteSession,
    enrollPeopleInClass, saveAttendance, addOneTimeAttendee,
    addVacationPeriod, removeVacationPeriod,
    enrollFromWaitlist, dismissNotification,
    addTariff, updateTariff, deleteTariff,
    addLevel, updateLevel, deleteLevel,
    isPersonOnVacation, isTutorialOpen, openTutorial, closeTutorial,
  }), [state, addActividad, updateActividad, deleteActividad, addSpecialist, updateSpecialist, deleteSpecialist, addPerson, updatePerson, deletePerson, recordPayment, undoLastPayment, addSpace, updateSpace, deleteSpace, addSession, updateSession, deleteSession, enrollPeopleInClass, saveAttendance, addOneTimeAttendee, addVacationPeriod, removeVacationPeriod, enrollFromWaitlist, dismissNotification, addTariff, updateTariff, deleteTariff, addLevel, updateLevel, deleteLevel, isPersonOnVacation, isTutorialOpen, openTutorial, closeTutorial]);

  return (
    <StudioContext.Provider value={contextValue}>
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
