
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { Actividad, Specialist, Person, Session, Payment, Space, SessionAttendance, AppNotification, Tariff, Level } from '@/types';
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

// This context loads static data to prevent any database-related issues and ensure the app loads.

/**
 * Parses different date formats (Date object, Firestore Timestamp, string, number)
 * into a valid Date object. Returns null if the date is invalid.
 */
const parseDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    // Handle Firestore Timestamps
    if (date.toDate && typeof date.toDate === 'function') {
        return date.toDate();
    }
    // Handle strings or numbers
    if (typeof date === 'string' || typeof date === 'number') {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
    }
    console.warn("Could not parse date:", date);
    return null; // Return null for invalid or unparseable dates
};

/**
 * Processes an array of data, converting specified fields into Date objects.
 * This is crucial for ensuring data consistency within the app.
 */
const processData = (data: any[], dateFields: string[], nestedDateFields: {path: string, fields: string[]}[] = []) => {
  return data.map(item => {
    const newItem = { ...item };
    // Process top-level date fields
    dateFields.forEach(field => {
      if (newItem[field]) {
        newItem[field] = parseDate(newItem[field]);
      }
    });
    // Process date fields within nested arrays (e.g., vacationPeriods in people)
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

// All action functions are now dummies that log to the console.
const dummyAction = (name: string) => (...args: any[]) => {
    console.log(`Action "${name}" called, but the app is in read-only mode.`, args);
};

interface StudioContextType extends State {
    addActividad: (...args: any[]) => void;
    updateActividad: (...args: any[]) => void;
    deleteActividad: (...args: any[]) => void;
    addSpecialist: (...args: any[]) => void;
    updateSpecialist: (...args: any[]) => void;
    deleteSpecialist: (...args: any[]) => void;
    addPerson: (...args: any[]) => void;
    updatePerson: (...args: any[]) => void;
    deletePerson: (...args: any[]) => void;
    recordPayment: (...args: any[]) => void;
    undoLastPayment: (...args: any[]) => void;
    addSpace: (spaceData: Omit<Space, 'id'>) => void;
    updateSpace: (spaceToUpdate: Space) => void;
    deleteSpace: (spaceId: string) => void;
    addSession: (...args: any[]) => void;
    updateSession: (...args: any[]) => void;
    deleteSession: (...args: any[]) => void;
    enrollPersonInSessions: (...args: any[]) => void;
    enrollPeopleInClass: (...args: any[]) => void;
    saveAttendance: (...args: any[]) => void;
    addOneTimeAttendee: (...args: any[]) => void;
    addJustifiedAbsence: (...args: any[]) => void;
    addVacationPeriod: (...args: any[]) => void;
    removeVacationPeriod: (...args: any[]) => void;
    isPersonOnVacation: (person: Person, date: Date) => boolean;
    addToWaitlist: (...args: any[]) => void;
    enrollFromWaitlist: (...args: any[]) => void;
    dismissNotification: (...args: any[]) => void;
    addTariff: (...args: any[]) => void;
    updateTariff: (...args: any[]) => void;
    deleteTariff: (...args: any[]) => void;
    addLevel: (...args: any[]) => void;
    updateLevel: (...args: any[]) => void;
    deleteLevel: (...args: any[]) => void;
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
    notifications: staticNotifications,
    tariffs: staticTariffs,
    levels: staticLevels,
    loading: false, 
};


export function StudioProvider({ children, instituteId }: { children: ReactNode, instituteId: string }) {
  const [state, setState] = useState<State>(initialAppState);

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
  
  const addSpace = useCallback((spaceData: Omit<Space, 'id'>) => {
    setState(currentState => {
      const newSpace: Space = {
        id: `space-${Date.now()}-${Math.random()}`,
        ...spaceData,
      };
      return {
        ...currentState,
        spaces: [...currentState.spaces, newSpace],
      };
    });
  }, []);

  const updateSpace = useCallback((spaceToUpdate: Space) => {
    setState(currentState => ({
      ...currentState,
      spaces: currentState.spaces.map(space =>
        space.id === spaceToUpdate.id ? { ...space, ...spaceToUpdate } : space
      ),
    }));
  }, []);
  
  const deleteSpace = useCallback((spaceId: string) => {
    const isUsed = state.sessions.some(session => session.spaceId === spaceId);
    if (isUsed) {
        alert('No se puede eliminar el espacio porque está asignado a una o más sesiones.');
        return;
    }

    setState(currentState => ({
        ...currentState,
        spaces: currentState.spaces.filter(space => space.id !== spaceId),
    }));
  }, [state.sessions]);

  const contextValue: StudioContextType = useMemo(() => ({
    ...state,
    isPersonOnVacation,
    isTutorialOpen, openTutorial, closeTutorial,
    addSpace,
    updateSpace,
    deleteSpace,
    addActividad: dummyAction('addActividad'), updateActividad: dummyAction('updateActividad'), deleteActividad: dummyAction('deleteActividad'),
    addSpecialist: dummyAction('addSpecialist'), updateSpecialist: dummyAction('updateSpecialist'), deleteSpecialist: dummyAction('deleteSpecialist'),
    addPerson: dummyAction('addPerson'), updatePerson: dummyAction('updatePerson'), deletePerson: dummyAction('deletePerson'),
    recordPayment: dummyAction('recordPayment'), undoLastPayment: dummyAction('undoLastPayment'),
    addSession: dummyAction('addSession'), updateSession: dummyAction('updateSession'), deleteSession: dummyAction('deleteSession'),
    enrollPersonInSessions: dummyAction('enrollPersonInSessions'), enrollPeopleInClass: dummyAction('enrollPeopleInClass'),
    saveAttendance: dummyAction('saveAttendance'), addOneTimeAttendee: dummyAction('addOneTimeAttendee'), addJustifiedAbsence: dummyAction('addJustifiedAbsence'),
    addVacationPeriod: dummyAction('addVacationPeriod'), removeVacationPeriod: dummyAction('removeVacationPeriod'),
    addToWaitlist: dummyAction('addToWaitlist'), enrollFromWaitlist: dummyAction('enrollFromWaitlist'), dismissNotification: dummyAction('dismissNotification'),
    addTariff: dummyAction('addTariff'), updateTariff: dummyAction('updateTariff'), deleteTariff: dummyAction('deleteTariff'),
    addLevel: dummyAction('addLevel'), updateLevel: dummyAction('updateLevel'), deleteLevel: dummyAction('deleteLevel'),
  }), [state, isPersonOnVacation, isTutorialOpen, openTutorial, closeTutorial, addSpace, updateSpace, deleteSpace]);

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
