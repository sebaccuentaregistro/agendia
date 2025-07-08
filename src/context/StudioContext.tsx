
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import type { Actividad, Specialist, Person, Session, Payment, Space, SessionAttendance, AppNotification, Tariff, Level, VacationPeriod } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { set, addMonths, format as formatDate } from 'date-fns';
import * as StaticData from '@/lib/data';

// Helper function to create a deep copy
const deepCopy = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

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
  addPerson: (person: Omit<Person, 'id' | 'avatar' | 'joinDate' | 'lastPaymentDate' | 'vacationPeriods'>) => void;
  updatePerson: (person: Person) => void;
  deletePerson: (personId: string) => void;
  recordPayment: (personId: string) => void;
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

// In this local mode, we'll manage the state entirely within React.
export function StudioProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Initialize state with static data
  const [actividades, setActividades] = useState<Actividad[]>(deepCopy(StaticData.actividades));
  const [specialists, setSpecialists] = useState<Specialist[]>(deepCopy(StaticData.specialists));
  const [people, setPeople] = useState<Person[]>(() => deepCopy(StaticData.people).map(p => ({ ...p, joinDate: new Date(p.joinDate), lastPaymentDate: new Date(p.lastPaymentDate) })));
  const [sessions, setSessions] = useState<Session[]>(deepCopy(StaticData.sessions));
  const [payments, setPayments] = useState<Payment[]>(() => deepCopy(StaticData.payments).map(p => ({ ...p, date: new Date(p.date) })));
  const [spaces, setSpaces] = useState<Space[]>(deepCopy(StaticData.spaces));
  const [attendance, setAttendance] = useState<SessionAttendance[]>(deepCopy(StaticData.attendance));
  const [notifications, setNotifications] = useState<AppNotification[]>(deepCopy(StaticData.notifications));
  const [tariffs, setTariffs] = useState<Tariff[]>(deepCopy(StaticData.tariffs));
  const [levels, setLevels] = useState<Level[]>(deepCopy(StaticData.levels));
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const openTutorial = useCallback(() => setIsTutorialOpen(true), []);
  const closeTutorial = useCallback(() => setIsTutorialOpen(false), []);

  const showSuccessToast = (description: string) => toast({ title: 'Éxito', description: `${description} (Los datos no se guardan en modo local).`});

  const isPersonOnVacation = useCallback((person: Person, date: Date): boolean => {
    if (!person.vacationPeriods) return false;
    const checkDate = set(date, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
    return person.vacationPeriods.some(period => {
        const startDate = set(new Date(period.startDate), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
        const endDate = set(new Date(period.endDate), { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 });
        return checkDate >= startDate && checkDate <= endDate;
    });
  }, []);

  // CRUD operations implemented locally
  const addPerson = (personData: Omit<Person, 'id' | 'avatar' | 'joinDate' | 'lastPaymentDate' | 'vacationPeriods'>) => {
    const now = new Date();
    const newPerson: Person = {
        ...personData,
        id: `person-${Date.now()}`,
        joinDate: now,
        lastPaymentDate: addMonths(now, 1),
        avatar: `https://placehold.co/100x100.png`,
        vacationPeriods: [],
    };
    setPeople(prev => [...prev, newPerson]);
    showSuccessToast('Persona añadida.');
  };

  const updatePerson = (updatedPerson: Person) => {
    setPeople(prev => prev.map(p => p.id === updatedPerson.id ? updatedPerson : p));
    showSuccessToast('Persona actualizada.');
  };
  
  const deletePerson = (personId: string) => {
    setSessions(prev => prev.map(s => ({
        ...s,
        personIds: s.personIds.filter(id => id !== personId),
    })));
    setPeople(prev => prev.filter(p => p.id !== personId));
    showSuccessToast('Persona eliminada.');
  };
  
  const addActividad = (data: Omit<Actividad, 'id'>) => {
    const newActividad = { ...data, id: `actividad-${Date.now()}` };
    setActividades(prev => [...prev, newActividad]);
    showSuccessToast('Actividad añadida.');
  }
  const updateActividad = (data: Actividad) => {
    setActividades(prev => prev.map(a => a.id === data.id ? data : a));
    showSuccessToast('Actividad actualizada.');
  }
  const deleteActividad = (id: string) => {
    setActividades(prev => prev.filter(a => a.id !== id));
    showSuccessToast('Actividad eliminada.');
  }
  
  const addSpecialist = (data: Omit<Specialist, 'id' | 'avatar'>) => {
    const newSpecialist = { ...data, id: `specialist-${Date.now()}`, avatar: `https://placehold.co/100x100.png` };
    setSpecialists(prev => [...prev, newSpecialist]);
    showSuccessToast('Especialista añadido.');
  }
  const updateSpecialist = (data: Specialist) => {
    setSpecialists(prev => prev.map(s => s.id === data.id ? data : s));
    showSuccessToast('Especialista actualizado.');
  }
  const deleteSpecialist = (id: string) => {
    setSpecialists(prev => prev.filter(s => s.id !== id));
    showSuccessToast('Especialista eliminado.');
  }

  const recordPayment = (personId: string) => {
    const newPayment: Payment = { id: `payment-${Date.now()}`, personId, date: new Date(), months: 1 };
    setPayments(prev => [...prev, newPayment]);
    setPeople(prev => prev.map(p => {
        if (p.id === personId) {
            return { ...p, lastPaymentDate: addMonths(p.lastPaymentDate, 1) };
        }
        return p;
    }));
    showSuccessToast('Pago registrado.');
  }

  const undoLastPayment = (personId: string) => {
    const personPayments = payments.filter(p => p.personId === personId).sort((a,b) => b.date.getTime() - a.date.getTime());
    if (personPayments.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'No hay pagos para deshacer.' });
      return;
    }
    const lastPaymentId = personPayments[0].id;
    setPayments(prev => prev.filter(p => p.id !== lastPaymentId));
    setPeople(prev => prev.map(p => {
        if (p.id === personId) {
            return { ...p, lastPaymentDate: addMonths(p.lastPaymentDate, -1) };
        }
        return p;
    }));
    showSuccessToast('Último pago deshecho.');
  }
  
  const addSpace = (data: Omit<Space, 'id'>) => {
      setSpaces(prev => [...prev, { ...data, id: `space-${Date.now()}` }]);
      showSuccessToast('Espacio añadido.');
  }
  const updateSpace = (data: Space) => {
      setSpaces(prev => prev.map(s => s.id === data.id ? data : s));
      showSuccessToast('Espacio actualizado.');
  }
  const deleteSpace = (id: string) => {
      setSpaces(prev => prev.filter(s => s.id !== id));
      showSuccessToast('Espacio eliminado.');
  }

  const addSession = (data: Omit<Session, 'id' | 'personIds' | 'waitlistPersonIds'>) => {
      setSessions(prev => [...prev, { ...data, id: `session-${Date.now()}`, personIds: [], waitlistPersonIds: [] }]);
      showSuccessToast('Sesión añadida.');
  }
  const updateSession = (data: Session) => {
      setSessions(prev => prev.map(s => s.id === data.id ? data : s));
      showSuccessToast('Sesión actualizada.');
  }
  const deleteSession = (id: string) => {
      setSessions(prev => prev.filter(s => s.id !== id));
      showSuccessToast('Sesión eliminada.');
  }

  const enrollPeopleInClass = (sessionId: string, personIds: string[]) => {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, personIds } : s));
      showSuccessToast('Inscripciones actualizadas.');
  }
  
  const enrollPersonInSessions = (personId: string, newSessionIds: string[]) => {
      setSessions(prevSessions => {
          const sessionsWithPerson = prevSessions.filter(s => s.personIds.includes(personId)).map(s => s.id);
          const sessionsToRemoveFrom = sessionsWithPerson.filter(id => !newSessionIds.includes(id));
          const sessionsToAddTo = newSessionIds.filter(id => !sessionsWithPerson.includes(id));

          return prevSessions.map(session => {
              if (sessionsToRemoveFrom.includes(session.id)) {
                  return { ...session, personIds: session.personIds.filter(id => id !== personId) };
              }
              if (sessionsToAddTo.includes(session.id)) {
                  return { ...session, personIds: [...session.personIds, personId] };
              }
              return session;
          });
      });
      showSuccessToast('Inscripciones de la persona actualizadas.');
  };

  const saveAttendance = (sessionId: string, presentIds: string[], absentIds: string[], justifiedAbsenceIds: string[]) => {
      const dateStr = formatDate(new Date(), 'yyyy-MM-dd');
      setAttendance(prev => {
          const existingRecordIndex = prev.findIndex(a => a.sessionId === sessionId && a.date === dateStr);
          const newRecord: SessionAttendance = {
              id: `att-${Date.now()}`,
              sessionId,
              date: dateStr,
              presentIds,
              absentIds,
              justifiedAbsenceIds,
          };
          if (existingRecordIndex > -1) {
              const updated = [...prev];
              updated[existingRecordIndex] = { ...updated[existingRecordIndex], ...newRecord };
              return updated;
          }
          return [...prev, newRecord];
      });
      showSuccessToast('Asistencia guardada.');
  }

  const addOneTimeAttendee = (sessionId: string, personId: string, date: Date) => {
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    setAttendance(prev => {
        const existingRecordIndex = prev.findIndex(a => a.sessionId === sessionId && a.date === dateStr);
        if (existingRecordIndex > -1) {
            const updated = [...prev];
            const record = updated[existingRecordIndex];
            record.oneTimeAttendees = Array.from(new Set([...(record.oneTimeAttendees || []), personId]));
            return updated;
        }
        return [...prev, { id: `att-${dateStr}-${sessionId}`, sessionId, date: dateStr, presentIds: [], absentIds: [], oneTimeAttendees: [personId] }];
    });
    showSuccessToast('Asistente puntual añadido.');
  }
  
  const addJustifiedAbsence = (personId: string, sessionId: string, date: Date) => {
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    setAttendance(prev => {
        const existingRecordIndex = prev.findIndex(a => a.sessionId === sessionId && a.date === dateStr);
        if (existingRecordIndex > -1) {
            const updated = [...prev];
            const record = updated[existingRecordIndex];
            record.justifiedAbsenceIds = Array.from(new Set([...(record.justifiedAbsenceIds || []), personId]));
            return updated;
        }
        return [...prev, { id: `att-${dateStr}-${sessionId}`, sessionId, date: dateStr, presentIds: [], absentIds: [], justifiedAbsenceIds: [personId] }];
    });
    showSuccessToast('Ausencia justificada.');
  }
  
  const addVacationPeriod = (personId: string, startDate: Date, endDate: Date) => {
    setPeople(prev => prev.map(p => {
      if (p.id === personId) {
        const newVacation: VacationPeriod = { id: `vac-${Date.now()}`, startDate, endDate };
        return { ...p, vacationPeriods: [...(p.vacationPeriods || []), newVacation] };
      }
      return p;
    }));
    showSuccessToast('Período de vacaciones añadido.');
  }
  
  const removeVacationPeriod = (personId: string, vacationId: string) => {
    setPeople(prev => prev.map(p => {
      if (p.id === personId) {
        return { ...p, vacationPeriods: (p.vacationPeriods || []).filter(v => v.id !== vacationId) };
      }
      return p;
    }));
    showSuccessToast('Período de vacaciones eliminado.');
  }

  const addToWaitlist = (sessionId: string, personId: string) => {
      setSessions(prev => prev.map(s => {
          if (s.id === sessionId) {
              return { ...s, waitlistPersonIds: Array.from(new Set([...(s.waitlistPersonIds || []), personId])) };
          }
          return s;
      }));
      showSuccessToast('Anotado en lista de espera.');
  }

  const enrollFromWaitlist = (notificationId: string, sessionId: string, personId: string) => {
      setSessions(prev => prev.map(s => {
          if (s.id === sessionId) {
              return { 
                  ...s, 
                  personIds: Array.from(new Set([...s.personIds, personId])),
                  waitlistPersonIds: (s.waitlistPersonIds || []).filter(id => id !== personId)
              };
          }
          return s;
      }));
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      showSuccessToast('Inscrito desde lista de espera.');
  }
  const dismissNotification = (id: string) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      showSuccessToast('Notificación descartada.');
  }

  const addTariff = (data: Omit<Tariff, 'id'>) => {
      setTariffs(prev => [...prev, { ...data, id: `tariff-${Date.now()}` }]);
      showSuccessToast('Arancel añadido.');
  }
  const updateTariff = (data: Tariff) => {
      setTariffs(prev => prev.map(t => t.id === data.id ? data : t));
      showSuccessToast('Arancel actualizado.');
  }
  const deleteTariff = (id: string) => {
      setTariffs(prev => prev.filter(t => t.id !== id));
      showSuccessToast('Arancel eliminado.');
  }
  
  const addLevel = (data: Omit<Level, 'id'>) => {
      setLevels(prev => [...prev, { ...data, id: `level-${Date.now()}` }]);
      showSuccessToast('Nivel añadido.');
  }
  const updateLevel = (data: Level) => {
      setLevels(prev => prev.map(l => l.id === data.id ? data : l));
      showSuccessToast('Nivel actualizado.');
  }
  const deleteLevel = (id: string) => {
      setLevels(prev => prev.filter(l => l.id !== id));
      showSuccessToast('Nivel eliminado.');
  }
  
  return (
    <StudioContext.Provider value={{ 
        actividades, specialists, people, sessions, payments, spaces, attendance, notifications, tariffs, levels,
        isPersonOnVacation, isTutorialOpen, openTutorial, closeTutorial, 
        addActividad, updateActividad, deleteActividad,
        addSpecialist, updateSpecialist, deleteSpecialist,
        addPerson, updatePerson, deletePerson,
        recordPayment, undoLastPayment,
        addSpace, updateSpace, deleteSpace,
        addSession, updateSession, deleteSession,
        enrollPeopleInClass, enrollPersonInSessions,
        saveAttendance, addOneTimeAttendee, addJustifiedAbsence,
        addVacationPeriod, removeVacationPeriod,
        addToWaitlist, enrollFromWaitlist, dismissNotification,
        addTariff, updateTariff, deleteTariff,
        addLevel, updateLevel, deleteLevel,
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
