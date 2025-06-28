
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Actividad, Specialist, Person, Session, Payment, Space, SessionAttendance, AppNotification } from '@/types';
import { 
  actividades as initialActividades, 
  specialists as initialSpecialists,
  people as initialPeople,
  sessions as initialSessions,
  payments as initialPayments,
  spaces as initialSpaces,
  attendance as initialAttendance,
  notifications as initialNotifications
} from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import * as Utils from '@/lib/utils';
import { format as formatDate, set } from 'date-fns';

interface StudioContextType {
  actividades: Actividad[];
  specialists: Specialist[];
  people: Person[];
  sessions: Session[];
  payments: Payment[];
  spaces: Space[];
  attendance: SessionAttendance[];
  notifications: AppNotification[];
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
  addVacationPeriod: (personId: string, startDate: Date, endDate: Date) => void;
  removeVacationPeriod: (personId: string, vacationId: string) => void;
  isPersonOnVacation: (person: Person, date: Date) => boolean;
  addToWaitlist: (sessionId: string, personId: string) => void;
  enrollFromWaitlist: (notificationId: string, sessionId: string, personId: string) => void;
  dismissNotification: (notificationId: string) => void;
  isTutorialOpen: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

// Helper function to safely parse JSON from localStorage
const loadFromLocalStorage = (key: string, defaultValue: any) => {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const item = window.localStorage.getItem(key);
        if (!item) return defaultValue;

        const parsed = JSON.parse(item);
        
        // Special handling for dates
        if (key === 'yoga-people') {
          return parsed.map((p: any) => ({
             ...p,
             joinDate: new Date(p.joinDate),
             lastPaymentDate: p.lastPaymentDate ? new Date(p.lastPaymentDate) : new Date(p.joinDate),
             vacationPeriods: p.vacationPeriods?.map((v: any) => ({
                 ...v,
                 startDate: new Date(v.startDate),
                 endDate: new Date(v.endDate),
             })) || []
            }));
        }
        if (key === 'yoga-payments') {
            return parsed.map((p: any) => ({ ...p, date: new Date(p.date) }));
        }
        
        return parsed;
    } catch (error) {
        console.warn(`Error reading localStorage key “${key}”:`, error);
        return defaultValue;
    }
};


export function StudioProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<SessionAttendance[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const openTutorial = useCallback(() => setIsTutorialOpen(true), []);
  const closeTutorial = useCallback(() => {
    setIsTutorialOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agendia-tutorial-completed', 'true');
    }
  }, []);

  // Load from localStorage on client-side mount to avoid hydration errors
  useEffect(() => {
    setActividades(loadFromLocalStorage('yoga-actividades', initialActividades));
    setSpecialists(loadFromLocalStorage('yoga-specialists', initialSpecialists));
    setSpaces(loadFromLocalStorage('yoga-spaces', initialSpaces));
    setSessions(loadFromLocalStorage('yoga-sessions', initialSessions));
    setPeople(loadFromLocalStorage('yoga-people', initialPeople));
    setPayments(loadFromLocalStorage('yoga-payments', initialPayments));
    setAttendance(loadFromLocalStorage('yoga-attendance', initialAttendance));
    setNotifications(loadFromLocalStorage('yoga-notifications', initialNotifications));
    setIsInitialized(true); // Mark as initialized
  }, []);

  // Persist to localStorage whenever data changes, but only after initialization
  useEffect(() => { if(isInitialized) localStorage.setItem('yoga-actividades', JSON.stringify(actividades)); }, [actividades, isInitialized]);
  useEffect(() => { if(isInitialized) localStorage.setItem('yoga-specialists', JSON.stringify(specialists)); }, [specialists, isInitialized]);
  useEffect(() => { if(isInitialized) localStorage.setItem('yoga-people', JSON.stringify(people)); }, [people, isInitialized]);
  useEffect(() => { if(isInitialized) localStorage.setItem('yoga-sessions', JSON.stringify(sessions)); }, [sessions, isInitialized]);
  useEffect(() => { if(isInitialized) localStorage.setItem('yoga-payments', JSON.stringify(payments)); }, [payments, isInitialized]);
  useEffect(() => { if(isInitialized) localStorage.setItem('yoga-spaces', JSON.stringify(spaces)); }, [spaces, isInitialized]);
  useEffect(() => { if(isInitialized) localStorage.setItem('yoga-attendance', JSON.stringify(attendance)); }, [attendance, isInitialized]);
  useEffect(() => { if(isInitialized) localStorage.setItem('yoga-notifications', JSON.stringify(notifications)); }, [notifications, isInitialized]);

  const addActividad = (actividad: Omit<Actividad, 'id'>) => {
    if (actividades.some(a => a.name.trim().toLowerCase() === actividad.name.trim().toLowerCase())) {
        toast({ variant: "destructive", title: "Actividad Duplicada", description: "Ya existe una actividad con este nombre." });
        return;
    }
    setActividades(prev => [...prev, { ...actividad, id: `act-${Date.now()}` }]);
  };

  const updateActividad = (updated: Actividad) => {
    if (actividades.some(a => a.id !== updated.id && a.name.trim().toLowerCase() === updated.name.trim().toLowerCase())) {
        toast({ variant: "destructive", title: "Nombre Duplicado", description: "Ya existe otra actividad con este nombre." });
        return;
    }
    setActividades(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  const deleteActividad = (id: string) => {
    const isUsedInSession = sessions.some(c => c.actividadId === id);
    if (isUsedInSession) {
      toast({
        variant: "destructive",
        title: "Actividad en Uso",
        description: "Esta actividad está siendo utilizada en sesiones programadas. Debe eliminar o modificar esas sesiones primero.",
      });
      return;
    }

    const isAssignedToSpecialist = specialists.some(s => s.actividadIds.includes(id));
    if (isAssignedToSpecialist) {
      toast({
        variant: "destructive",
        title: "Actividad Asignada",
        description: "Esta actividad está asignada a uno o más especialistas. Debe quitarla de sus perfiles antes de eliminarla.",
      });
      return;
    }

    setActividades(prev => prev.filter(a => a.id !== id));
  };

  const addSpecialist = (specialist: Omit<Specialist, 'id' | 'avatar'>) => {
    if (specialists.some(s => s.phone.trim() === specialist.phone.trim())) {
        toast({ variant: "destructive", title: "Teléfono Duplicado", description: "Ya existe un especialista con este número de teléfono." });
        return;
    }
    setSpecialists(prev => [...prev, { ...specialist, id: `spc-${Date.now()}`, avatar: `https://placehold.co/100x100.png` }]);
  };

  const updateSpecialist = (updated: Specialist) => {
    if (specialists.some(s => s.id !== updated.id && s.phone.trim() === updated.phone.trim())) {
        toast({ variant: "destructive", title: "Teléfono Duplicado", description: "Ya existe otro especialista con este número de teléfono." });
        return;
    }
    
    const originalSpecialist = specialists.find(s => s.id === updated.id);
    if (originalSpecialist) {
        const removedActividadIds = originalSpecialist.actividadIds.filter(id => !updated.actividadIds.includes(id));
        const orphanedSessions = sessions.filter(c => c.instructorId === updated.id && removedActividadIds.includes(c.actividadId));
        
        if (orphanedSessions.length > 0) {
            toast({
                variant: "destructive",
                title: "Sesiones Inconsistentes",
                description: `No se puede quitar la especialidad. Este especialista todavía tiene ${orphanedSessions.length} sesión(es) programada(s) de este tipo. Reasigna o elimina esas sesiones primero.`,
                duration: 6000,
            });
            return;
        }
    }

    setSpecialists(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const deleteSpecialist = (id: string) => {
    if (sessions.some(c => c.instructorId === id)) {
      toast({ variant: "destructive", title: "Especialista en Uso", description: "Este especialista está asignado a sesiones. Debe reasignar o eliminar esas sesiones primero." });
      return;
    }
    setSpecialists(prev => prev.filter(s => s.id !== id));
  };

  const addPerson = (person: Omit<Person, 'id' | 'avatar' | 'joinDate' | 'lastPaymentDate' | 'vacationPeriods'>) => {
    if (people.some(p => p.phone.trim() === person.phone.trim())) {
        toast({ variant: "destructive", title: "Teléfono Duplicado", description: "Ya existe una persona con este número de teléfono." });
        return;
    }
    const now = new Date();
    const newPerson: Person = { ...person, id: `person-${Date.now()}`, avatar: `https://placehold.co/100x100.png`, joinDate: now, lastPaymentDate: now, vacationPeriods: [] };
    setPeople(prev => [newPerson, ...prev]);
    if (newPerson.membershipType === 'Mensual') {
      const newPayment: Payment = { id: `pay-${Date.now()}`, personId: newPerson.id, date: now };
      setPayments(prev => [newPayment, ...prev]);
    }
  };

  const updatePerson = (updated: Person) => {
    if (people.some(p => p.id !== updated.id && p.phone.trim() === updated.phone.trim())) {
        toast({ variant: "destructive", title: "Teléfono Duplicado", description: "Ya existe otra persona con este número de teléfono." });
        return;
    }
    setPeople(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const deletePerson = (id: string) => {
    // Check if the person actually exists before proceeding
    const personExists = people.some(p => p.id === id);
    if (!personExists) return;

    // Remove person from main list
    setPeople(prev => prev.filter(p => p.id !== id));
    
    // Remove person from all session enrollments (fixed and waitlist)
    setSessions(prev => prev.map(session => ({ 
      ...session, 
      personIds: session.personIds.filter(pid => pid !== id),
      waitlistPersonIds: session.waitlistPersonIds?.filter(pid => pid !== id) || []
    })));
    
    // Remove associated payments
    setPayments(prev => prev.filter(p => p.personId !== id));

    // Remove from all attendance records
    setAttendance(prev => prev.map(record => ({
      ...record,
      presentIds: record.presentIds.filter(pid => pid !== id),
      absentIds: record.absentIds.filter(pid => pid !== id),
      justifiedAbsenceIds: record.justifiedAbsenceIds?.filter(pid => pid !== id) || [],
      oneTimeAttendees: record.oneTimeAttendees?.filter(pid => pid !== id) || [],
    })).filter(record => record.presentIds.length > 0 || record.absentIds.length > 0 || (record.justifiedAbsenceIds && record.justifiedAbsenceIds.length > 0) || (record.oneTimeAttendees && record.oneTimeAttendees.length > 0) ));

    // Remove from any pending notifications
    setNotifications(prev => prev.filter(n => n.personId !== id));

    toast({ title: 'Persona Eliminada', description: 'Se han eliminado todos los datos de la persona.' });
  };

  const recordPayment = (personId: string) => {
    const person = people.find(p => p.id === personId);
    if (!person) return;
    
    const now = new Date();
    setPeople(prev => prev.map(p => p.id === personId ? { ...p, lastPaymentDate: now } : p));
    setPayments(prev => [...prev, { id: `pay-${Date.now()}`, personId, date: now }]);
    toast({ title: "Pago Registrado", description: `Se ha registrado un nuevo pago para ${person.name}.` });
  };

  const undoLastPayment = (personId: string) => {
    const person = people.find(p => p.id === personId);
    if (!person) return;
    const personPayments = payments.filter(p => p.personId === personId).sort((a,b) => b.date.getTime() - a.date.getTime());
    if (personPayments.length > 0) {
      setPayments(prev => prev.filter(p => p.id !== personPayments[0].id));
      const newLastPaymentDate = personPayments.length > 1 ? personPayments[1].date : person.joinDate;
      setPeople(prev => prev.map(p => p.id === personId ? { ...p, lastPaymentDate: newLastPaymentDate } : p));
      toast({ title: "Pago Deshecho", description: `Se ha revertido el último pago para ${person.name}.` });
    }
  };

  const addSpace = (space: Omit<Space, 'id'>) => {
    if (spaces.some(s => s.name.trim().toLowerCase() === space.name.trim().toLowerCase())) {
        toast({ variant: "destructive", title: "Espacio Duplicado", description: "Ya existe un espacio con este nombre." });
        return;
    }
    setSpaces(prev => [...prev, { ...space, id: `space-${Date.now()}` }]);
  };

  const updateSpace = (updated: Space) => {
    if (spaces.some(s => s.id !== updated.id && s.name.trim().toLowerCase() === updated.name.trim().toLowerCase())) {
        toast({ variant: "destructive", title: "Nombre Duplicado", description: "Ya existe otro espacio con este nombre." });
        return;
    }
    const sessionsAffected = sessions.filter(c => c.spaceId === updated.id && c.personIds.length > updated.capacity);
    if (sessionsAffected.length > 0) {
      toast({ variant: "destructive", title: "Error de Capacidad", description: "La nueva capacidad es menor que los inscriptos en una o más sesiones. Reasigna personas antes de cambiar la capacidad." });
      return;
    }
    setSpaces(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const deleteSpace = (id: string) => {
    if (sessions.some(c => c.spaceId === id)) {
      toast({ variant: "destructive", title: "Espacio en Uso", description: "No se puede eliminar un espacio con sesiones programadas. Debe reasignar o eliminar esas sesiones primero." });
      return;
    }
    setSpaces(prev => prev.filter(s => s.id !== id));
  };

  const addSession = (session: Omit<Session, 'id' | 'personIds' | 'waitlistPersonIds'>) => {
    const specialistConflict = sessions.some(c => c.dayOfWeek === session.dayOfWeek && c.time === session.time && c.instructorId === session.instructorId);
    if (specialistConflict) {
      toast({ variant: "destructive", title: "Conflicto de Horario", description: "Este especialista ya tiene otra sesión programada a la misma hora." });
      return;
    }
    const spaceConflict = sessions.some(c => c.dayOfWeek === session.dayOfWeek && c.time === session.time && c.spaceId === session.spaceId);
    if (spaceConflict) {
      toast({ variant: "destructive", title: "Conflicto de Horario", description: "Este espacio ya está en uso a esa hora." });
      return;
    }
    setSessions(prev => [...prev, { ...session, id: `session-${Date.now()}`, personIds: [], waitlistPersonIds: [] }]);
  };

  const updateSession = (updated: Session) => {
    const specialistConflict = sessions.some(c => c.id !== updated.id && c.dayOfWeek === updated.dayOfWeek && c.time === updated.time && c.instructorId === updated.instructorId);
    if (specialistConflict) {
      toast({ variant: "destructive", title: "Conflicto de Horario", description: "Este especialista ya tiene otra sesión programada a la misma hora." });
      return;
    }
    const spaceConflict = sessions.some(c => c.id !== updated.id && c.dayOfWeek === updated.dayOfWeek && c.time === updated.time && c.spaceId === updated.spaceId);
    if (spaceConflict) {
      toast({ variant: "destructive", title: "Conflicto de Horario", description: "Este espacio ya está en uso a esa hora." });
      return;
    }
    const space = spaces.find(s => s.id === updated.spaceId);
    const capacity = updated.sessionType === 'Individual' ? 1 : (space?.capacity ?? 0);
    if (updated.personIds.length > capacity) {
      toast({
        variant: "destructive",
        title: "Capacidad Excedida",
        description: `No se puede guardar el cambio. Hay ${updated.personIds.length} personas inscriptas y la nueva capacidad es de ${capacity}.`,
        duration: 6000
      });
      return;
    }
    setSessions(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const deleteSession = (id: string) => {
    const sessionToDelete = sessions.find(s => s.id === id);
    if (!sessionToDelete) return;

    // A person is considered enrolled only if they exist in the main `people` list.
    const existingEnrolledPeople = sessionToDelete.personIds.filter(personId => 
        people.some(p => p.id === personId)
    );

    if (existingEnrolledPeople.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Sesión con Inscriptos',
        description: `No se puede eliminar. Hay ${existingEnrolledPeople.length} persona(s) inscripta(s). Mueve o desinscribe a las personas primero.`,
        duration: 6000,
      });
      return;
    }
    
    // If we are here, it means there are no *real* people enrolled, so we can delete.
    setSessions(prev => prev.filter(s => s.id !== id));
    setNotifications(prev => prev.filter(n => n.sessionId !== id));
  };

  const enrollPersonInSessions = (personId: string, newSessionIds: string[]) => {
    const uniqueNewSessionIds = [...new Set(newSessionIds)];

    // Check for overbooking first
    const overbookedSession = uniqueNewSessionIds.find(sessionId => {
      const sessionToEnroll = sessions.find(c => c.id === sessionId);
      if (!sessionToEnroll || sessionToEnroll.personIds.includes(personId)) {
        return false; 
      }
      const space = spaces.find(s => s.id === sessionToEnroll.spaceId);
      const capacity = sessionToEnroll.sessionType === 'Individual' ? 1 : space?.capacity ?? 0;
      return sessionToEnroll.personIds.length >= capacity;
    });

    if (overbookedSession) {
      const sessionDetails = sessions.find(s => s.id === overbookedSession);
      const actividad = actividades.find(a => a.id === sessionDetails?.actividadId);
      toast({
          variant: "destructive",
          title: sessionDetails?.sessionType === 'Individual' ? "Sesión Individual Ocupada" : "Sesión Llena",
          description: `No se puede inscribir en "${actividad?.name || 'una sesión'}". La sesión ha alcanzado su capacidad máxima.`,
          duration: 5000,
      });
      return; 
    }
    
    // Process enrollments and un-enrollments
    const previousSessions = sessions.filter(s => s.personIds.includes(personId));
    setSessions(prevSessions => {
      const newSessionIdSet = new Set(uniqueNewSessionIds);

      return prevSessions.map(session => {
        const isEnrolled = session.personIds.includes(personId);
        const shouldBeEnrolled = newSessionIdSet.has(session.id);

        if (isEnrolled && !shouldBeEnrolled) {
          return { ...session, personIds: session.personIds.filter(id => id !== personId) };
        }
        if (!isEnrolled && shouldBeEnrolled) {
          return { ...session, personIds: [...session.personIds, personId] };
        }
        return session;
      });
    });

    // Check for freed spots and generate notifications
    previousSessions.forEach(oldSession => {
      if (!uniqueNewSessionIds.includes(oldSession.id)) { // The person was unenrolled
        if (oldSession.waitlistPersonIds && oldSession.waitlistPersonIds.length > 0) {
          const nextPersonId = oldSession.waitlistPersonIds[0];
          // Check if a notification for this spot already exists
          const notificationExists = notifications.some(n => n.sessionId === oldSession.id);
          if (!notificationExists) {
            const newNotification: AppNotification = {
              id: `notif-${Date.now()}`,
              type: 'waitlist',
              sessionId: oldSession.id,
              personId: nextPersonId,
              createdAt: new Date().toISOString()
            };
            setNotifications(prev => [newNotification, ...prev]);
            toast({ title: '¡Cupo Liberado!', description: `Se ha notificado una oportunidad para la lista de espera.` });
          }
        }
      }
    });

    toast({ title: "Inscripciones Actualizadas" });
  };

  const enrollPeopleInClass = (sessionId: string, personIds: string[]) => {
    const sessionToUpdate = sessions.find(c => c.id === sessionId);
    if (!sessionToUpdate) return;

    const space = spaces.find(s => s.id === sessionToUpdate.spaceId);
    const capacity = sessionToUpdate.sessionType === 'Individual' ? 1 : space?.capacity ?? 0;

    if (personIds.length > capacity) {
      toast({
        variant: "destructive",
        title: "Capacidad excedida",
        description: `Has seleccionado ${personIds.length} personas, pero la capacidad es de ${capacity}.`,
        duration: 5000,
      });
      return;
    }

    setSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === sessionId ? { ...session, personIds: [...new Set(personIds)] } : session
      )
    );

    toast({ title: "Inscripciones actualizadas" });
  };

  const saveAttendance = (sessionId: string, presentIds: string[], absentIds: string[], justifiedAbsenceIds: string[]) => {
    const todayStr = formatDate(new Date(), 'yyyy-MM-dd');
    setAttendance(prev => {
        const existingRecordIndex = prev.findIndex(
            record => record.sessionId === sessionId && record.date === todayStr
        );

        if (existingRecordIndex > -1) {
            const updatedAttendance = [...prev];
            updatedAttendance[existingRecordIndex] = {
                ...updatedAttendance[existingRecordIndex],
                presentIds,
                absentIds,
                justifiedAbsenceIds,
            };
            return updatedAttendance;
        } else {
            const newRecord: SessionAttendance = {
                id: `att-${Date.now()}`,
                sessionId,
                date: todayStr,
                presentIds,
                absentIds,
                justifiedAbsenceIds,
            };
            return [...prev, newRecord];
        }
    });
    toast({ title: "Asistencia Guardada", description: "Se ha registrado la asistencia para la sesión." });
  };
  
  const addOneTimeAttendee = (sessionId: string, personId: string, date: Date) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !personId || !date) {
        toast({ variant: "destructive", title: "Datos incompletos" });
        return;
    };
    const space = spaces.find(s => s.id === session.spaceId);
    if (!space) return;

    const dateStr = formatDate(date, 'yyyy-MM-dd');

    const attendanceRecord = attendance.find(a => a.sessionId === sessionId && a.date === dateStr);
    const oneTimeAttendees = attendanceRecord?.oneTimeAttendees || [];

    const activeRegularsOnDate = session.personIds.filter(pid => {
        const person = people.find(p => p.id === pid);
        return person && !isPersonOnVacation(person, date);
    });

    const currentEnrollmentOnDate = activeRegularsOnDate.length + oneTimeAttendees.length;
    const capacity = session.sessionType === 'Individual' ? 1 : space.capacity;
    
    if (currentEnrollmentOnDate >= capacity) {
        toast({
            variant: "destructive",
            title: "Sesión Completa",
            description: "No hay cupo disponible en esta sesión para la fecha seleccionada."
        });
        return;
    }
    
    if (session.personIds.includes(personId) || oneTimeAttendees.includes(personId)) {
      toast({
            variant: "destructive",
            title: "Persona ya inscripta",
            description: "Esta persona ya figura en esta sesión para la fecha seleccionada."
        });
        return;
    }

    setAttendance(prev => {
        const existingRecordIndex = prev.findIndex(a => a.sessionId === sessionId && a.date === dateStr);
        if (existingRecordIndex > -1) {
            const updatedAttendance = [...prev];
            const record = updatedAttendance[existingRecordIndex];
            record.oneTimeAttendees = [...(record.oneTimeAttendees || []), personId];
            return updatedAttendance;
        } else {
            const newRecord: SessionAttendance = {
                id: `att-${Date.now()}`,
                sessionId,
                date: dateStr,
                presentIds: [],
                absentIds: [],
                justifiedAbsenceIds: [],
                oneTimeAttendees: [personId],
            };
            return [...prev, newRecord];
        }
    });
    
    toast({ title: "Asistente Puntual Añadido", description: "La persona ha sido añadida a la sesión para la fecha seleccionada." });
  };

  const isPersonOnVacation = (person: Person, date: Date): boolean => {
    if (!person.vacationPeriods) return false;
    const checkDate = set(date, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
    
    return person.vacationPeriods.some(period => {
        const startDate = set(period.startDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
        const endDate = set(period.endDate, { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 });
        return checkDate >= startDate && checkDate <= endDate;
    });
  };

  const addVacationPeriod = (personId: string, startDate: Date, endDate: Date) => {
    setPeople(prev => prev.map(p => {
        if (p.id === personId) {
            const newVacation = { id: `vac-${Date.now()}`, startDate, endDate };
            const updatedVacations = [...(p.vacationPeriods || []), newVacation];
            return { ...p, vacationPeriods: updatedVacations };
        }
        return p;
    }));
    toast({ title: "Vacaciones Registradas", description: "El período de vacaciones ha sido añadido." });
  };

  const removeVacationPeriod = (personId: string, vacationId: string) => {
    setPeople(prev => prev.map(p => {
        if (p.id === personId) {
            const updatedVacations = p.vacationPeriods?.filter(v => v.id !== vacationId) || [];
            return { ...p, vacationPeriods: updatedVacations };
        }
        return p;
    }));
    toast({ title: "Vacaciones Eliminadas", description: "El período de vacaciones ha sido eliminado." });
  };

  const addToWaitlist = (sessionId: string, personId: string) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          if (s.personIds.includes(personId) || s.waitlistPersonIds?.includes(personId)) {
            toast({ variant: 'destructive', title: 'Error', description: 'Esta persona ya está inscripta o en la lista de espera.' });
            return s;
          }
          const updatedWaitlist = [...(s.waitlistPersonIds || []), personId];
          toast({ title: 'Añadido a la lista de espera' });
          return { ...s, waitlistPersonIds: updatedWaitlist };
        }
        return s;
      })
    );
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const enrollFromWaitlist = (notificationId: string, sessionId: string, personId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    const space = spaces.find(s => s.id === session?.spaceId);
    if (!session || !space) return;

    const capacity = session.sessionType === 'Individual' ? 1 : space.capacity;
    if (session.personIds.length >= capacity) {
      toast({ variant: 'destructive', title: 'La sesión se ha llenado', description: 'Alguien más ocupó el lugar. Se descarta la notificación.' });
      dismissNotification(notificationId);
      return;
    }

    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            personIds: [...s.personIds, personId],
            waitlistPersonIds: s.waitlistPersonIds?.filter(id => id !== personId) || [],
          };
        }
        return s;
      })
    );
    
    const person = people.find(p => p.id === personId);
    toast({ title: '¡Éxito!', description: `${person?.name || 'La persona'} ha sido inscripta en la sesión.` });
    dismissNotification(notificationId);
  };

  return (
    <StudioContext.Provider value={{ actividades, specialists, people, sessions, payments, spaces, attendance, notifications, addActividad, updateActividad, deleteActividad, addSpecialist, updateSpecialist, deleteSpecialist, addPerson, updatePerson, deletePerson, recordPayment, undoLastPayment, addSpace, updateSpace, deleteSpace, addSession, updateSession, deleteSession, enrollPersonInSessions, enrollPeopleInClass, saveAttendance, addOneTimeAttendee, addVacationPeriod, removeVacationPeriod, isPersonOnVacation, addToWaitlist, enrollFromWaitlist, dismissNotification, isTutorialOpen, openTutorial, closeTutorial }}>
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
