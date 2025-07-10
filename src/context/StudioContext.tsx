'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Actividad, Specialist, Person, Session, Payment, Space, SessionAttendance, AppNotification, Tariff, Level, VacationPeriod } from '@/types';
import * as demoData from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { format, addMonths } from 'date-fns';

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
export function StudioProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const [state, setState] = useState<State>({
    actividades: demoData.actividades,
    specialists: demoData.specialists,
    people: demoData.people,
    sessions: demoData.sessions,
    payments: demoData.payments,
    spaces: demoData.spaces,
    attendance: demoData.attendance,
    notifications: demoData.notifications,
    tariffs: demoData.tariffs,
    levels: demoData.levels,
  });
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
        return checkDate >= new Date(period.startDate.setHours(0,0,0,0)) && checkDate <= new Date(period.endDate.setHours(23,59,59,999));
    });
  }, []);

  const showToast = (action: string, success: boolean, message?: string) => {
    toast({
      title: success ? `${action} con éxito` : `Error en ${action}`,
      description: message || (success ? 'La operación se completó correctamente.' : 'Ocurrió un error.'),
      variant: success ? 'default' : 'destructive',
    });
  };

  const createEntity = <T extends { id: string }>(
    collectionKey: keyof State,
    data: Omit<T, 'id'>
  ): T => {
    const newId = `${collectionKey}-${Date.now()}`;
    const newItem = { ...data, id: newId } as T;
    setState(prev => ({
      ...prev,
      [collectionKey]: [...(prev[collectionKey] as T[]), newItem],
    }));
    return newItem;
  };

  const updateEntity = <T extends { id: string }>(
    collectionKey: keyof State,
    data: T
  ) => {
    setState(prev => ({
      ...prev,
      [collectionKey]: (prev[collectionKey] as T[]).map(item =>
        item.id === data.id ? data : item
      ),
    }));
  };

  const deleteEntity = (collectionKey: keyof State, id: string) => {
    setState(prev => ({
      ...prev,
      [collectionKey]: (prev[collectionKey] as any[]).filter(item => item.id !== id),
    }));
  };
  
  const checkUsage = (id: string, checks: { collection: keyof State, field: string, label: string, type?: 'array' }[]) => {
      const messages = [];
      for (const check of checks) {
          const found = (state[check.collection] as any[]).filter(item => 
              check.type === 'array' ? item[check.field]?.includes(id) : item[check.field] === id
          );
          if (found.length > 0) {
              messages.push(`No se puede eliminar. Está en uso por ${found.length} ${check.label}(s).`);
          }
      }
      return messages.join('\n');
  };
  
  const deleteWithUsageCheck = (collectionKey: keyof State, id: string, actionName: string, checks: any[]) => {
      const usageMessage = checkUsage(id, checks);
      if (usageMessage) {
          showToast(`Eliminar ${actionName}`, false, usageMessage);
          return;
      }
      deleteEntity(collectionKey, id);
  }

  const addActividad = async (data: Omit<Actividad, 'id'>) => { createEntity('actividades', data); };
  const updateActividad = async (data: Actividad) => { updateEntity('actividades', data); };
  const deleteActividad = async (id: string) => {
      deleteWithUsageCheck('actividades', id, 'actividad', [
          { collection: 'sessions', field: 'actividadId', label: 'Sesión' },
          { collection: 'specialists', field: 'actividadIds', label: 'Especialista', type: 'array' },
      ]);
  };
  
  const addLevel = async (data: Omit<Level, 'id'>) => { createEntity('levels', data); };
  const updateLevel = async (data: Level) => { updateEntity('levels', data); };
  const deleteLevel = async (id: string) => {
      deleteWithUsageCheck('levels', id, 'nivel', [
          { collection: 'sessions', field: 'levelId', label: 'Sesión' },
          { collection: 'people', field: 'levelId', label: 'Persona' },
      ]);
  };
  
  const addSpace = async (data: Omit<Space, 'id'>) => { createEntity('spaces', data); };
  const updateSpace = async (data: Space) => { updateEntity('spaces', data); };
  const deleteSpace = async (id: string) => {
      deleteWithUsageCheck('spaces', id, 'espacio', [{ collection: 'sessions', field: 'spaceId', label: 'Sesión' }]);
  };
  
  const addTariff = async (data: Omit<Tariff, 'id'>) => { createEntity('tariffs', data); };
  const updateTariff = async (data: Tariff) => { updateEntity('tariffs', data); };
  const deleteTariff = async (id: string) => {
      deleteWithUsageCheck('tariffs', id, 'arancel', [{ collection: 'people', field: 'tariffId', label: 'Persona' }]);
  };

  const addSpecialist = async (data: Omit<Specialist, 'id' | 'avatar'>) => {
    createEntity('specialists', { ...data, avatar: `https://placehold.co/100x100.png` });
  };
  const updateSpecialist = async (data: Specialist) => { updateEntity('specialists', data); };
  const deleteSpecialist = async (id: string) => {
      deleteWithUsageCheck('specialists', id, 'especialista', [{ collection: 'sessions', field: 'instructorId', label: 'Sesión' }]);
  };
  
  const addPerson = async (data: Omit<Person, 'id' | 'avatar' | 'joinDate' | 'lastPaymentDate' | 'vacationPeriods'>) => {
    const now = new Date();
    createEntity('people', { 
        ...data, 
        joinDate: now, 
        lastPaymentDate: addMonths(now, 1), 
        avatar: `https://placehold.co/100x100.png`,
        vacationPeriods: []
    });
  };
  const updatePerson = async (data: Person) => { updateEntity('people', data); };
  const deletePerson = async (id: string) => {
      // Remove person from sessions
      setState(prev => ({
          ...prev,
          sessions: prev.sessions.map(s => ({
              ...s,
              personIds: s.personIds.filter(pid => pid !== id),
              waitlistPersonIds: s.waitlistPersonIds?.filter(pid => pid !== id)
          }))
      }));
      deleteEntity('people', id);
  };
  
  const recordPayment = async (personId: string) => {
    const person = state.people.find(p => p.id === personId);
    if (!person) return;
    const newExpiryDate = addMonths(person.lastPaymentDate || new Date(), 1);
    updateEntity('people', { ...person, lastPaymentDate: newExpiryDate });
    createEntity('payments', { personId, date: new Date(), months: 1 });
  };

  const undoLastPayment = async (personId: string) => {
    const person = state.people.find(p => p.id === personId);
    if (!person || !person.lastPaymentDate) return;
    const lastPayment = [...state.payments].filter(p => p.personId === personId).sort((a,b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))[0];
    if (lastPayment) {
        deleteEntity('payments', lastPayment.id);
        updateEntity('people', { ...person, lastPaymentDate: addMonths(person.lastPaymentDate, -1) });
    } else {
        showToast('Deshacer pago', false, 'No hay pagos para deshacer.');
    }
  };
  
  const addSession = async (data: Omit<Session, 'id'| 'personIds' | 'waitlistPersonIds'>) => {
    createEntity('sessions', { ...data, personIds: [], waitlistPersonIds: [] });
  };
  const updateSession = async (data: Session) => { updateEntity('sessions', data); };
  const deleteSession = async (id: string) => {
    const session = state.sessions.find(s => s.id === id);
    if(session && session.personIds.length > 0) {
        showToast('Eliminar sesión', false, 'No se puede eliminar una sesión con personas inscriptas.');
        return;
    }
    deleteEntity('sessions', id);
  };
  
  const enrollPeopleInClass = async (sessionId: string, personIds: string[]) => {
    const session = state.sessions.find(s => s.id === sessionId);
    if(session) updateEntity('sessions', { ...session, personIds });
  };
  
  const saveAttendance = async (sessionId: string, presentIds: string[], absentIds: string[], justifiedAbsenceIds: string[]) => {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const existingRecord = state.attendance.find(a => a.sessionId === sessionId && a.date === dateStr);
    const record = { id: existingRecord?.id || '', sessionId, date: dateStr, presentIds, absentIds, justifiedAbsenceIds };
    if (existingRecord) {
        updateEntity('attendance', record);
    } else {
        createEntity('attendance', record);
    }
  };

  const addOneTimeAttendee = async (sessionId: string, personId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = state.attendance.find(a => a.sessionId === sessionId && a.date === dateStr);
    if (record) {
        const updatedAttendees = Array.from(new Set([...(record.oneTimeAttendees || []), personId]));
        updateEntity('attendance', {...record, oneTimeAttendees: updatedAttendees});
    } else {
        createEntity('attendance', { sessionId, date: dateStr, presentIds:[], absentIds:[], oneTimeAttendees: [personId] });
    }
  };

  const addVacationPeriod = async (personId: string, startDate: Date, endDate: Date) => {
    const person = state.people.find(p => p.id === personId);
    if (!person) return;
    const newVacation: VacationPeriod = { id: `vac-${Date.now()}`, startDate, endDate };
    const updatedVacations = [...(person.vacationPeriods || []), newVacation];
    updateEntity('people', { ...person, vacationPeriods: updatedVacations });
  };
  
  const removeVacationPeriod = async (personId: string, vacationId: string) => {
    const person = state.people.find(p => p.id === personId);
    if (!person || !person.vacationPeriods) return;
    const updatedVacations = person.vacationPeriods.filter(v => v.id !== vacationId);
    updateEntity('people', { ...person, vacationPeriods: updatedVacations });
  };

  const enrollFromWaitlist = async (notificationId: string, sessionId: string, personId: string) => {
    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) return;
    const newPersonIds = Array.from(new Set([...session.personIds, personId]));
    const newWaitlist = session.waitlistPersonIds?.filter(id => id !== personId) || [];
    updateEntity('sessions', { ...session, personIds: newPersonIds, waitlistPersonIds: newWaitlist });
    deleteEntity('notifications', notificationId);
  };
  
  const dismissNotification = async (id: string) => {
    deleteEntity('notifications', id);
  };

  const contextValue: StudioContextType = {
    ...state,
    loading: false, // Set to false as we are using local data
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
