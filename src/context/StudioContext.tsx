
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
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

// This context loads static data to restore app functionality.
// Database interactions are disabled.

const parseDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (date.toDate && typeof date.toDate === 'function') return date.toDate(); // Firestore Timestamp
    if (typeof date === 'string' || typeof date === 'number') {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) return parsed;
    }
    return null; // Return null for invalid dates
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

// All action functions are now dummies.
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
    addSpace: (...args: any[]) => void;
    updateSpace: (...args: any[]) => void;
    deleteSpace: (...args: any[]) => void;
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

export function StudioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({
    actividades: [], specialists: [], people: [], sessions: [],
    payments: [], spaces: [], attendance: [], notifications: [],
    tariffs: [], levels: [], loading: true,
  });

  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const openTutorial = useCallback(() => setIsTutorialOpen(true), []);
  const closeTutorial = useCallback(() => {
      setIsTutorialOpen(false);
      try {
        localStorage.setItem('agendia-tutorial-completed', 'true');
      } catch (e) { console.warn("Could not save tutorial state."); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const processedPeople = processData(staticPeople, ['joinDate', 'lastPaymentDate'], [{path: 'vacationPeriods', fields: ['startDate', 'endDate']}]);
      const processedPayments = processData(staticPayments, ['date']);
      const processedNotifications = processData(staticNotifications, ['createdAt']);
      
      setState({
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
      });
    }, 500); 

    return () => clearTimeout(timer);
  }, []);

  const isPersonOnVacation = useCallback((person: Person, date: Date): boolean => {
    if (!person.vacationPeriods) return false;
    const checkDate = new Date(date.setHours(0, 0, 0, 0));
    return person.vacationPeriods.some(period => {
        if (!period.startDate || !period.endDate) return false;
        const startDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);
        return checkDate >= new Date(startDate.setHours(0,0,0,0)) && checkDate <= new Date(endDate.setHours(23,59,59,999));
    });
  }, []);
  
  const contextValue: StudioContextType = useMemo(() => ({
    ...state,
    isPersonOnVacation,
    isTutorialOpen, openTutorial, closeTutorial,
    addActividad: dummyAction('addActividad'), updateActividad: dummyAction('updateActividad'), deleteActividad: dummyAction('deleteActividad'),
    addSpecialist: dummyAction('addSpecialist'), updateSpecialist: dummyAction('updateSpecialist'), deleteSpecialist: dummyAction('deleteSpecialist'),
    addPerson: dummyAction('addPerson'), updatePerson: dummyAction('updatePerson'), deletePerson: dummyAction('deletePerson'),
    recordPayment: dummyAction('recordPayment'), undoLastPayment: dummyAction('undoLastPayment'),
    addSpace: dummyAction('addSpace'), updateSpace: dummyAction('updateSpace'), deleteSpace: dummyAction('deleteSpace'),
    addSession: dummyAction('addSession'), updateSession: dummyAction('updateSession'), deleteSession: dummyAction('deleteSession'),
    enrollPersonInSessions: dummyAction('enrollPersonInSessions'), enrollPeopleInClass: dummyAction('enrollPeopleInClass'),
    saveAttendance: dummyAction('saveAttendance'), addOneTimeAttendee: dummyAction('addOneTimeAttendee'), addJustifiedAbsence: dummyAction('addJustifiedAbsence'),
    addVacationPeriod: dummyAction('addVacationPeriod'), removeVacationPeriod: dummyAction('removeVacationPeriod'),
    addToWaitlist: dummyAction('addToWaitlist'), enrollFromWaitlist: dummyAction('enrollFromWaitlist'), dismissNotification: dummyAction('dismissNotification'),
    addTariff: dummyAction('addTariff'), updateTariff: dummyAction('updateTariff'), deleteTariff: dummyAction('deleteTariff'),
    addLevel: dummyAction('addLevel'), updateLevel: dummyAction('updateLevel'), deleteLevel: dummyAction('deleteLevel'),
  }), [state, isPersonOnVacation, isTutorialOpen, openTutorial, closeTutorial]);

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
