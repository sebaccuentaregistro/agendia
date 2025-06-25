'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Actividad, Specialist, Person, Session, Payment, Space } from '@/types';
import { 
  actividades as initialActividades, 
  specialists as initialSpecialists,
  people as initialPeople,
  sessions as initialSessions,
  payments as initialPayments,
  spaces as initialSpaces
} from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import * as Utils from '@/lib/utils';

interface StudioContextType {
  actividades: Actividad[];
  specialists: Specialist[];
  people: Person[];
  sessions: Session[];
  payments: Payment[];
  spaces: Space[];
  addActividad: (actividad: Omit<Actividad, 'id'>) => void;
  updateActividad: (actividad: Actividad) => void;
  deleteActividad: (actividadId: string) => void;
  addSpecialist: (specialist: Omit<Specialist, 'id' | 'avatar'>) => void;
  updateSpecialist: (specialist: Specialist) => void;
  deleteSpecialist: (specialistId: string) => void;
  addPerson: (person: Omit<Person, 'id' | 'avatar' | 'joinDate' | 'lastPaymentDate'>) => void;
  updatePerson: (person: Person) => void;
  deletePerson: (personId: string) => void;
  recordPayment: (personId: string) => void;
  undoLastPayment: (personId: string) => void;
  addSpace: (space: Omit<Space, 'id'>) => void;
  updateSpace: (space: Space) => void;
  deleteSpace: (spaceId: string) => void;
  addSession: (session: Omit<Session, 'id' | 'personIds'>) => void;
  updateSession: (session: Session) => void;
  deleteSession: (sessionId: string) => void;
  enrollPersonInSessions: (personId: string, sessionIds: string[]) => void;
  enrollPeopleInClass: (sessionId: string, personIds: string[]) => void;
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
          return parsed.map((p: any) => ({ ...p, joinDate: new Date(p.joinDate), lastPaymentDate: p.lastPaymentDate ? new Date(p.lastPaymentDate) : new Date(p.joinDate) }));
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
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on client-side mount to avoid hydration errors
  useEffect(() => {
    setActividades(loadFromLocalStorage('yoga-actividades', initialActividades));
    setSpecialists(loadFromLocalStorage('yoga-specialists', initialSpecialists));
    setSpaces(loadFromLocalStorage('yoga-spaces', initialSpaces));
    setSessions(loadFromLocalStorage('yoga-sessions', initialSessions));
    setPeople(loadFromLocalStorage('yoga-people', initialPeople));
    setPayments(loadFromLocalStorage('yoga-payments', initialPayments));
    setIsInitialized(true); // Mark as initialized
  }, []);

  // Persist to localStorage whenever data changes, but only after initialization
  useEffect(() => { if(isInitialized) localStorage.setItem('yoga-actividades', JSON.stringify(actividades)); }, [actividades, isInitialized]);
  useEffect(() => { if(isInitialized) localStorage.setItem('yoga-specialists', JSON.stringify(specialists)); }, [specialists, isInitialized]);
  useEffect(() => { if(isInitialized) localStorage.setItem('yoga-people', JSON.stringify(people)); }, [people, isInitialized]);
  useEffect(() => { if(isInitialized) localStorage.setItem('yoga-sessions', JSON.stringify(sessions)); }, [sessions, isInitialized]);
  useEffect(() => { if(isInitialized) localStorage.setItem('yoga-payments', JSON.stringify(payments)); }, [payments, isInitialized]);
  useEffect(() => { if(isInitialized) localStorage.setItem('yoga-spaces', JSON.stringify(spaces)); }, [spaces, isInitialized]);

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

  const addPerson = (person: Omit<Person, 'id' | 'avatar' | 'joinDate' | 'lastPaymentDate'>) => {
    if (people.some(p => p.phone.trim() === person.phone.trim())) {
        toast({ variant: "destructive", title: "Teléfono Duplicado", description: "Ya existe una persona con este número de teléfono." });
        return;
    }
    const now = new Date();
    const newPerson: Person = { ...person, id: `person-${Date.now()}`, avatar: `https://placehold.co/100x100.png`, joinDate: now, lastPaymentDate: now };
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
    setPeople(prev => prev.filter(p => p.id !== id));
    setSessions(prev => prev.map(c => ({ ...c, personIds: c.personIds.filter(pid => pid !== id) })));
    setPayments(prev => prev.filter(p => p.personId !== id));
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
      toast({ variant: "destructive", title: "Error de Capacidad", description: "La nueva capacidad es menor que los inscritos en una o más sesiones. Reasigna personas antes de cambiar la capacidad." });
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

  const addSession = (session: Omit<Session, 'id' | 'personIds'>) => {
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
    setSessions(prev => [...prev, { ...session, id: `session-${Date.now()}`, personIds: [] }]);
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
    setSessions(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const deleteSession = (id: string) => {
    const sessionToDelete = sessions.find(c => c.id === id);
    if (sessionToDelete && sessionToDelete.personIds.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Sesión con Inscritos',
        description: `No se puede eliminar. Hay ${sessionToDelete.personIds.length} persona(s) inscrita(s). Mueve o desinscribe a las personas primero.`,
        duration: 6000,
      });
      return;
    }
    setSessions(prev => prev.filter(c => c.id !== id));
  };

  const enrollPersonInSessions = (personId: string, newSessionIds: string[]) => {
    const uniqueNewSessionIds = [...new Set(newSessionIds)];

    for (const sessionId of uniqueNewSessionIds) {
        const sessionToEnroll = sessions.find(c => c.id === sessionId);
        if (!sessionToEnroll) continue; 
        
        const isAlreadyEnrolled = sessionToEnroll.personIds.includes(personId);
        if (isAlreadyEnrolled) continue;

        const space = spaces.find(s => s.id === sessionToEnroll.spaceId);
        const capacity = sessionToEnroll.sessionType === 'Individual' ? 1 : space?.capacity ?? 0;
        
        if (sessionToEnroll.personIds.length >= capacity) {
            const actividad = actividades.find(a => a.id === sessionToEnroll.actividadId);
            toast({
                variant: "destructive",
                title: sessionToEnroll.sessionType === 'Individual' ? "Sesión Individual Ocupada" : "Sesión Llena",
                description: `No se puede inscribir en "${actividad?.name}". La sesión ha alcanzado su capacidad máxima.`,
                duration: 5000,
            });
            return; // Abort the entire operation
        }
    }

    let sessionsToUpdate = [...sessions];
    sessionsToUpdate = sessionsToUpdate.map(c => ({...c, personIds: c.personIds.filter(pid => pid !== personId)}));
    
    for (const sessionId of uniqueNewSessionIds) {
      const sessionIndex = sessionsToUpdate.findIndex(c => c.id === sessionId);
      if (sessionIndex !== -1) {
        sessionsToUpdate[sessionIndex].personIds.push(personId);
      }
    }
    setSessions(sessionsToUpdate);
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

  return (
    <StudioContext.Provider value={{ actividades, specialists, people, sessions, payments, spaces, addActividad, updateActividad, deleteActividad, addSpecialist, updateSpecialist, deleteSpecialist, addPerson, updatePerson, deletePerson, recordPayment, undoLastPayment, addSpace, updateSpace, deleteSpace, addSession, updateSession, deleteSession, enrollPersonInSessions, enrollPeopleInClass }}>
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
