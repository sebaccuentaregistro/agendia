'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Actividad, Specialist, Person, Session, Payment, Space, SessionAttendance, AppNotification, Tariff, Level } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { set, addMonths, differenceInDays, addDays, format as formatDate } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, setDoc, deleteDoc, query, where, writeBatch, getDocs, Timestamp } from 'firebase/firestore';

// --- DIAGNOSTIC CHANGE: Using local data to isolate deployment issues. ---
import { 
    actividades as mockActividades,
    specialists as mockSpecialists,
    people as mockPeople,
    sessions as mockSessions,
    payments as mockPayments,
    spaces as mockSpaces,
    attendance as mockAttendance,
    notifications as mockNotifications,
    tariffs as mockTariffs,
    levels as mockLevels,
} from '@/lib/data';

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
  
  // Using mock data for debugging
  const [actividades, setActividades] = useState<Actividad[]>(mockActividades);
  const [specialists, setSpecialists] = useState<Specialist[]>(mockSpecialists);
  const [spaces, setSpaces] = useState<Space[]>(mockSpaces);
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [people, setPeople] = useState<Person[]>(mockPeople);
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [attendance, setAttendance] = useState<SessionAttendance[]>(mockAttendance);
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);
  const [tariffs, setTariffs] = useState<Tariff[]>(mockTariffs);
  const [levels, setLevels] = useState<Level[]>(mockLevels);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const openTutorial = useCallback(() => setIsTutorialOpen(true), []);
  const closeTutorial = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('agendia-tutorial-completed', 'true');
    }
    setIsTutorialOpen(false);
  }, []);
  
  const isPersonOnVacation = useCallback((person: Person, date: Date): boolean => {
    if (!person.vacationPeriods) return false;
    const checkDate = set(date, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
    
    return person.vacationPeriods.some(period => {
        const startDate = set(period.startDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
        const endDate = set(period.endDate, { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 });
        return checkDate >= startDate && checkDate <= endDate;
    });
  }, []);

  const showDisabledToast = () => toast({ variant: 'destructive', title: 'Función Deshabilitada', description: 'Esta acción se habilitará cuando la app se conecte a la base de datos.' });

  return (
    <StudioContext.Provider value={{ 
        actividades, specialists, people, sessions, payments, spaces, attendance, notifications, tariffs, levels, 
        addActividad: () => showDisabledToast(),
        updateActividad: () => showDisabledToast(),
        deleteActividad: () => showDisabledToast(),
        addSpecialist: () => showDisabledToast(),
        updateSpecialist: () => showDisabledToast(),
        deleteSpecialist: () => showDisabledToast(),
        addPerson: () => showDisabledToast(),
        updatePerson: () => showDisabledToast(),
        deactivatePerson: () => showDisabledToast(),
        reactivatePerson: () => showDisabledToast(),
        recordPayment: () => showDisabledToast(),
        undoLastPayment: () => showDisabledToast(),
        addSpace: () => showDisabledToast(),
        updateSpace: () => showDisabledToast(),
        deleteSpace: () => showDisabledToast(),
        addSession: () => showDisabledToast(),
        updateSession: () => showDisabledToast(),
        deleteSession: () => showDisabledToast(),
        enrollPersonInSessions: () => showDisabledToast(),
        enrollPeopleInClass: () => showDisabledToast(),
        saveAttendance: () => showDisabledToast(),
        addOneTimeAttendee: () => showDisabledToast(),
        addJustifiedAbsence: () => showDisabledToast(),
        addVacationPeriod: () => showDisabledToast(),
        removeVacationPeriod: () => showDisabledToast(),
        isPersonOnVacation, 
        addToWaitlist: () => showDisabledToast(),
        enrollFromWaitlist: () => showDisabledToast(),
        dismissNotification: () => showDisabledToast(),
        addTariff: () => showDisabledToast(),
        updateTariff: () => showDisabledToast(),
        deleteTariff: () => showDisabledToast(),
        addLevel: () => showDisabledToast(),
        updateLevel: () => showDisabledToast(),
        deleteLevel: () => showDisabledToast(),
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
