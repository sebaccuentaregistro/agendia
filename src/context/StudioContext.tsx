
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Actividad, Specialist, Person, Session, Payment, Space, SessionAttendance, AppNotification, Tariff, Level, VacationPeriod } from '@/types';
import * as firestoreActions from '@/lib/firestore-actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { addMonths } from 'date-fns';
import { 
  actividades as demoActividades, 
  specialists as demoSpecialists, 
  people as demoPeople,
  sessions as demoSessions,
  payments as demoPayments,
  spaces as demoSpaces,
  attendance as demoAttendance,
  notifications as demoNotifications,
  tariffs as demoTariffs,
  levels as demoLevels
} from '@/lib/data';

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
    addActividad: (data: Omit<Actividad, 'id'>) => Promise<void>;
    updateActividad: (data: Actividad) => Promise<void>;
    deleteActividad: (id: string) => Promise<void>;
    addSpecialist: (data: Omit<Specialist, 'id' | 'avatar'>) => Promise<void>;
    updateSpecialist: (data: Specialist) => Promise<void>;
    deleteSpecialist: (id: string) => Promise<void>;
    addPerson: (data: Omit<Person, 'id' | 'avatar' | 'joinDate' | 'lastPaymentDate' | 'vacationPeriods'>) => Promise<void>;
    updatePerson: (data: Person) => Promise<void>;
    deletePerson: (id: string) => Promise<void>;
    recordPayment: (personId: string) => Promise<void>;
    undoLastPayment: (personId: string) => Promise<void>;
    addSpace: (data: Omit<Space, 'id'>) => Promise<void>;
    updateSpace: (data: Space) => Promise<void>;
    deleteSpace: (id: string) => Promise<void>;
    addSession: (data: Omit<Session, 'id'| 'personIds' | 'waitlistPersonIds'>) => Promise<void>;
    updateSession: (data: Session) => Promise<void>;
    deleteSession: (id: string) => Promise<void>;
    enrollPeopleInClass: (sessionId: string, personIds: string[]) => Promise<void>;
    saveAttendance: (sessionId: string, presentIds: string[], absentIds: string[], justifiedAbsenceIds: string[]) => Promise<void>;
    addOneTimeAttendee: (sessionId: string, personId: string, date: Date) => Promise<void>;
    addVacationPeriod: (personId: string, startDate: Date, endDate: Date) => Promise<void>;
    removeVacationPeriod: (personId: string, vacationId: string) => Promise<void>;
    isPersonOnVacation: (person: Person, date: Date) => boolean;
    enrollFromWaitlist: (notificationId: string, sessionId: string, personId: string) => Promise<void>;
    dismissNotification: (id: string) => Promise<void>;
    addTariff: (data: Omit<Tariff, 'id'>) => Promise<void>;
    updateTariff: (data: Tariff) => Promise<void>;
    deleteTariff: (id: string) => Promise<void>;
    addLevel: (data: Omit<Level, 'id'>) => Promise<void>;
    updateLevel: (data: Level) => Promise<void>;
    deleteLevel: (id: string) => Promise<void>;
    isTutorialOpen: boolean;
    openTutorial: () => void;
    closeTutorial: () => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

// This is the main provider for the application's business logic and state.
// NOTE: This version uses local demo data and does NOT connect to Firestore.
export function StudioProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, userProfile, loading: authLoading } = useAuth();

  const [state, setState] = useState<State>({
    actividades: demoActividades, specialists: demoSpecialists, people: demoPeople, sessions: demoSessions,
    payments: demoPayments, spaces: demoSpaces, attendance: demoAttendance, notifications: demoNotifications, tariffs: demoTariffs, levels: demoLevels,
  });
  const [loading, setLoading] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // In this local version, we don't need useEffect to fetch data.
  // The state is initialized with the demo data directly.

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
        return checkDate >= new Date(period.startDate.setHours(0,0,0,0)) && checkDate <= new Date(period.endDate.setHours(23,59,59,999));
    });
  }, []);

  const showToast = (action: string, success: boolean, message?: string) => {
    toast({
      title: success ? `${action} con éxito` : `Error en ${action}`,
      description: message || (success ? 'La operación se completó correctamente.' : 'Ocurrió un error (operando en modo local).'),
      variant: success ? 'default' : 'destructive',
    });
  };

  const performLocalAction = (actionName: string, updateFn: (prevState: State) => State) => {
    try {
      setState(updateFn);
      showToast(actionName, true);
    } catch (error: any) {
      console.error(`Error in ${actionName}:`, error);
      showToast(actionName, false, error.message);
    }
  };

  // --- CRUD operations are now simulated locally ---

  const addActividad = async (data: Omit<Actividad, 'id'>) => {
    performLocalAction('Añadir actividad', prev => ({ ...prev, actividades: [...prev.actividades, { ...data, id: `act-${Date.now()}` }] }));
  };
  const updateActividad = async (data: Actividad) => {
    performLocalAction('Actualizar actividad', prev => ({ ...prev, actividades: prev.actividades.map(a => a.id === data.id ? data : a) }));
  };
  const deleteActividad = async (id: string) => {
     performLocalAction('Eliminar actividad', prev => ({ ...prev, actividades: prev.actividades.filter(a => a.id !== id) }));
  };
  
  const addLevel = async (data: Omit<Level, 'id'>) => {
    performLocalAction('Añadir nivel', prev => ({ ...prev, levels: [...prev.levels, { ...data, id: `lvl-${Date.now()}` }] }));
  };
  const updateLevel = async (data: Level) => {
    performLocalAction('Actualizar nivel', prev => ({ ...prev, levels: prev.levels.map(l => l.id === data.id ? data : l) }));
  };
  const deleteLevel = async (id: string) => {
    performLocalAction('Eliminar nivel', prev => ({ ...prev, levels: prev.levels.filter(l => l.id !== id) }));
  };

  const addSpace = async (data: Omit<Space, 'id'>) => {
    performLocalAction('Añadir espacio', prev => ({ ...prev, spaces: [...prev.spaces, { ...data, id: `spc-${Date.now()}` }] }));
  };
  const updateSpace = async (data: Space) => {
    performLocalAction('Actualizar espacio', prev => ({ ...prev, spaces: prev.spaces.map(s => s.id === data.id ? data : s) }));
  };
  const deleteSpace = async (id: string) => {
    performLocalAction('Eliminar espacio', prev => ({ ...prev, spaces: prev.spaces.filter(s => s.id !== id) }));
  };
  
  const addTariff = async (data: Omit<Tariff, 'id'>) => {
     performLocalAction('Añadir arancel', prev => ({ ...prev, tariffs: [...prev.tariffs, { ...data, id: `tff-${Date.now()}` }] }));
  };
  const updateTariff = async (data: Tariff) => {
    performLocalAction('Actualizar arancel', prev => ({ ...prev, tariffs: prev.tariffs.map(t => t.id === data.id ? data : t) }));
  };
  const deleteTariff = async (id: string) => {
     performLocalAction('Eliminar arancel', prev => ({ ...prev, tariffs: prev.tariffs.filter(t => t.id !== id) }));
  };

  const addSpecialist = async (data: Omit<Specialist, 'id' | 'avatar'>) => {
     performLocalAction('Añadir especialista', prev => ({ ...prev, specialists: [...prev.specialists, { ...data, id: `spec-${Date.now()}`, avatar: `https://placehold.co/100x100.png` }] }));
  };
  const updateSpecialist = async (data: Specialist) => {
     performLocalAction('Actualizar especialista', prev => ({ ...prev, specialists: prev.specialists.map(s => s.id === data.id ? data : s) }));
  };
  const deleteSpecialist = async (id: string) => {
    performLocalAction('Eliminar especialista', prev => ({ ...prev, specialists: prev.specialists.filter(s => s.id !== id) }));
  };
  
  const addPerson = async (data: Omit<Person, 'id' | 'avatar' | 'joinDate' | 'lastPaymentDate' | 'vacationPeriods'>) => {
    const newPerson: Person = {
      ...data,
      id: `person-${Date.now()}`,
      joinDate: new Date(),
      lastPaymentDate: addMonths(new Date(), 1),
      avatar: `https://placehold.co/100x100.png`,
      vacationPeriods: [],
    };
    performLocalAction('Añadir persona', prev => ({ ...prev, people: [...prev.people, newPerson] }));
  };
  const updatePerson = async (data: Person) => {
    performLocalAction('Actualizar persona', prev => ({ ...prev, people: prev.people.map(p => p.id === data.id ? data : p) }));
  };
  const deletePerson = async (id: string) => {
    performLocalAction('Eliminar persona', prev => ({ ...prev, people: prev.people.filter(p => p.id !== id) }));
  };
  
  const recordPayment = async (personId: string) => {
    performLocalAction('Registrar pago', prev => {
      const person = prev.people.find(p => p.id === personId);
      if (!person) return prev;
      const newExpiryDate = addMonths(person.lastPaymentDate || new Date(), 1);
      const newPayment = { id: `pay-${Date.now()}`, personId, date: new Date(), months: 1 };
      return {
        ...prev,
        people: prev.people.map(p => p.id === personId ? { ...p, lastPaymentDate: newExpiryDate } : p),
        payments: [...prev.payments, newPayment]
      }
    });
  };

  const undoLastPayment = async (personId: string) => {
     performLocalAction('Deshacer pago', prev => {
        const person = prev.people.find(p => p.id === personId);
        if (!person || !person.lastPaymentDate) return prev;

        const personPayments = prev.payments.filter(p => p.personId === personId).sort((a,b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
        if (personPayments.length === 0) return prev;
        
        const lastPaymentId = personPayments[0].id;
        const previousExpiryDate = addMonths(person.lastPaymentDate, -1);
        
        return {
            ...prev,
            people: prev.people.map(p => p.id === personId ? { ...p, lastPaymentDate: previousExpiryDate } : p),
            payments: prev.payments.filter(p => p.id !== lastPaymentId)
        }
    });
  };
  
  const addSession = async (data: Omit<Session, 'id'| 'personIds' | 'waitlistPersonIds'>) => {
    const newSession = { ...data, id: `session-${Date.now()}`, personIds: [], waitlistPersonIds: [] };
    performLocalAction('Añadir sesión', prev => ({...prev, sessions: [...prev.sessions, newSession]}));
  };
  const updateSession = async (data: Session) => {
    performLocalAction('Actualizar sesión', prev => ({...prev, sessions: prev.sessions.map(s => s.id === data.id ? data : s)}));
  };
  const deleteSession = async (id: string) => {
    performLocalAction('Eliminar sesión', prev => ({...prev, sessions: prev.sessions.filter(s => s.id !== id)}));
  };
  
  const enrollPeopleInClass = async (sessionId: string, personIds: string[]) => {
    performLocalAction('Inscribir personas', prev => ({ ...prev, sessions: prev.sessions.map(s => s.id === sessionId ? {...s, personIds} : s)}));
  };
  
  const saveAttendance = async (sessionId: string, presentIds: string[], absentIds:string[], justifiedAbsenceIds:string[]) => {
    // This is complex to simulate locally without a proper database, so we'll just log it.
    console.log("Saving attendance (local mode):", { sessionId, presentIds, absentIds, justifiedAbsenceIds });
    showToast('Guardar asistencia', true);
  };

  const addOneTimeAttendee = async (sessionId: string, personId: string, date: Date) => {
    console.log("Adding one-time attendee (local mode):", { sessionId, personId, date });
    showToast('Añadir asistente puntual', true);
  };

  const addVacationPeriod = async (personId: string, startDate: Date, endDate: Date) => {
     performLocalAction('Añadir vacaciones', prev => {
        const newVacation: VacationPeriod = { id: `vac-${Date.now()}`, startDate, endDate };
        return {
            ...prev,
            people: prev.people.map(p => p.id === personId ? { ...p, vacationPeriods: [...(p.vacationPeriods || []), newVacation] } : p)
        }
     });
  };
  
  const removeVacationPeriod = async (personId: string, vacationId: string) => {
    performLocalAction('Eliminar vacaciones', prev => ({
        ...prev,
        people: prev.people.map(p => p.id === personId ? { ...p, vacationPeriods: p.vacationPeriods?.filter(v => v.id !== vacationId) } : p)
    }));
  };

  const enrollFromWaitlist = async (notificationId: string, sessionId: string, personId: string) => {
    console.log("Enrolling from waitlist (local mode)", { notificationId, sessionId, personId });
    showToast('Inscribir desde lista de espera', true);
  };
  
  const dismissNotification = async (id: string) => {
    performLocalAction('Descartar notificación', prev => ({...prev, notifications: prev.notifications.filter(n => n.id !== id)}));
  };

  if (authLoading || loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="space-y-8 w-full max-w-5xl p-8">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-auto w-full rounded-xl aspect-square" />)}
                </div>
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
      </div>
    );
  }

  const contextValue: StudioContextType = {
    ...state,
    loading,
    addActividad,
    updateActividad,
    deleteActividad,
    addSpecialist,
    updateSpecialist,
    deleteSpecialist,
    addPerson,
    updatePerson,
    deletePerson,
    recordPayment,
    undoLastPayment,
    addSpace,
    updateSpace,
    deleteSpace,
    addSession,
    updateSession,
    deleteSession,
    enrollPeopleInClass,
    saveAttendance,
    addOneTimeAttendee,
    addVacationPeriod,
    removeVacationPeriod,
    enrollFromWaitlist,
    dismissNotification,
    addTariff,
    updateTariff,
    deleteTariff,
    addLevel,
    updateLevel,
    deleteLevel,
    isPersonOnVacation,
    isTutorialOpen,
    openTutorial,
    closeTutorial,
  };

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
