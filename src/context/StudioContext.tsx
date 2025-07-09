
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

// Helper function to parse dates robustly
const parseDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    // Handle Firestore Timestamps
    if (date.toDate && typeof date.toDate === 'function') {
        return date.toDate();
    }
    // Handle ISO strings or numbers
    if (typeof date === 'string' || typeof date === 'number') {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
    }
    console.warn("Could not parse date:", date);
    return null;
};

// Helper function to process raw data and convert date fields
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
};

interface StudioContextType extends State {
    loading: boolean;
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

// Prepare initial state by processing dates from static data
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
  
  // --- Core State Manipulation Functions (Corrected with functional updates) ---

  const addEntity = useCallback(<T extends { id: string }>(key: keyof State, itemData: Omit<T, 'id'>, defaultValues: Partial<T> = {}) => {
      const newItem: T = {
        id: `${key.toString().slice(0, -1)}-${Date.now()}-${Math.random()}`,
        ...defaultValues,
        ...itemData,
      } as T;
      setState(current => ({
        ...current,
        [key]: [...(current[key] as T[]), newItem],
      }));
  }, []);

  const updateEntity = useCallback(<T extends { id: string }>(key: keyof State, item: T) => {
    setState(current => ({
      ...current,
      [key]: (current[key] as T[]).map(i => (i.id === item.id ? item : i)),
    }));
  }, []);

  const deleteEntity = useCallback((key: keyof State, id: string, usageChecks: { collection: keyof State, field: string, label: string, type?: 'array' }[]) => {
    setState(current => {
        for (const check of usageChecks) {
            const collectionToCheck = current[check.collection] as any[];
            const isUsed = collectionToCheck.some(item =>
                check.type === 'array'
                ? (item[check.field] as string[])?.includes(id)
                : item[check.field] === id
            );
            if (isUsed) {
                toast({
                    title: 'Error al eliminar',
                    description: `No se puede eliminar porque está en uso por al menos un(a) ${check.label}.`,
                    variant: 'destructive',
                });
                return current; // Abort update, return original state
            }
        }
        // If all checks pass, proceed with deletion
        return {
          ...current,
          [key]: (current[key] as any[]).filter(i => i.id !== id),
        };
    });
  }, [toast]);
  
  // --- Wrapper Functions for each data type ---
  
  // Actividades
  const addActividad = useCallback((data: Omit<Actividad, 'id'>) => addEntity('actividades', data), [addEntity]);
  const updateActividad = useCallback((data: Actividad) => updateEntity('actividades', data), [updateEntity]);
  const deleteActividad = useCallback((id: string) => deleteEntity('actividades', id, [
    { collection: 'sessions', field: 'actividadId', label: 'Sesión' },
    { collection: 'specialists', field: 'actividadIds', label: 'Especialista', type: 'array' },
  ]), [deleteEntity]);

  // Levels
  const addLevel = useCallback((data: Omit<Level, 'id'>) => addEntity('levels', data), [addEntity]);
  const updateLevel = useCallback((data: Level) => updateEntity('levels', data), [updateEntity]);
  const deleteLevel = useCallback((id: string) => deleteEntity('levels', id, [
      { collection: 'sessions', field: 'levelId', label: 'Sesión' },
      { collection: 'people', field: 'levelId', label: 'Persona' },
  ]), [deleteEntity]);

  // Spaces
  const addSpace = useCallback((data: Omit<Space, 'id'>) => addEntity('spaces', data), [addEntity]);
  const updateSpace = useCallback((data: Space) => updateEntity('spaces', data), [updateEntity]);
  const deleteSpace = useCallback((id: string) => deleteEntity('spaces', id, [
      { collection: 'sessions', field: 'spaceId', label: 'Sesión' }
  ]), [deleteEntity]);

  // Tariffs
  const addTariff = useCallback((data: Omit<Tariff, 'id'>) => addEntity('tariffs', data), [addEntity]);
  const updateTariff = useCallback((data: Tariff) => updateEntity('tariffs', data), [updateEntity]);
  const deleteTariff = useCallback((id: string) => deleteEntity('tariffs', id, [
      { collection: 'people', field: 'tariffId', label: 'Persona' }
  ]), [deleteEntity]);

  // Specialists
  const addSpecialist = useCallback((data: Omit<Specialist, 'id' | 'avatar'>) => addEntity('specialists', data, { avatar: `https://placehold.co/100x100.png` }), [addEntity]);
  const updateSpecialist = useCallback((data: Specialist) => updateEntity('specialists', data), [updateEntity]);
  const deleteSpecialist = useCallback((id: string) => deleteEntity('specialists', id, [
      { collection: 'sessions', field: 'instructorId', label: 'Sesión' }
  ]), [deleteEntity]);

  // Sessions
  const addSession = useCallback((data: Omit<Session, 'id'| 'personIds' | 'waitlistPersonIds'>) => addEntity('sessions', data, { personIds: [], waitlistPersonIds: [] }), [addEntity]);
  const updateSession = useCallback((data: Session) => updateEntity('sessions', data), [updateEntity]);
  const deleteSession = useCallback((id: string) => {
    setState(current => {
      const session = current.sessions.find(s => s.id === id);
      if(session && session.personIds.length > 0) {
          toast({ title: 'Error al eliminar', description: 'No se puede eliminar una sesión con personas inscriptas.', variant: 'destructive' });
          return current;
      }
      return {...current, sessions: current.sessions.filter(s => s.id !== id)};
    });
  }, [toast]);
  
  const enrollPeopleInClass = useCallback((sessionId: string, personIds: string[]) => {
    setState(current => ({
        ...current,
        sessions: current.sessions.map(s => s.id === sessionId ? { ...s, personIds } : s)
    }));
  }, []);

  // People
  const addPerson = useCallback((data: Omit<Person, 'id' | 'avatar' | 'joinDate' | 'lastPaymentDate' | 'vacationPeriods'>) => {
    const now = new Date();
    addEntity('people', data, {
        joinDate: now,
        lastPaymentDate: addMonths(now, 1),
        avatar: `https://placehold.co/100x100.png`,
        vacationPeriods: [],
    });
  }, [addEntity]);
  const updatePerson = useCallback((data: Person) => updateEntity('people', data), [updateEntity]);
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
      const lastPayment = [...current.payments].filter(p => p.personId === personId).sort((a,b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))[0];
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
    loading: false, // Hardcoded to false
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
  }), [
    state,
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
    isPersonOnVacation, isTutorialOpen, openTutorial, closeTutorial
  ]);

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
