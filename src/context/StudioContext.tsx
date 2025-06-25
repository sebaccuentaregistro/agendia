
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Actividad, Specialist, Person, YogaClass, Payment, Space } from '@/types';
import { 
  actividades as initialActividades, 
  specialists as initialSpecialists,
  people as initialPeople,
  yogaClasses as initialYogaClasses,
  payments as initialPayments,
  spaces as initialSpaces
} from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import * as Utils from '@/lib/utils';

interface StudioContextType {
  actividades: Actividad[];
  specialists: Specialist[];
  people: Person[];
  yogaClasses: YogaClass[];
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
  addYogaClass: (yogaClass: Omit<YogaClass, 'id' | 'personIds'>) => void;
  updateYogaClass: (yogaClass: YogaClass) => void;
  deleteYogaClass: (yogaClassId: string) => void;
  enrollPersonInClasses: (personId: string, classIds: string[]) => void;
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
  const [yogaClasses, setYogaClasses] = useState<YogaClass[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on client-side mount to avoid hydration errors
  useEffect(() => {
    setActividades(loadFromLocalStorage('yoga-actividades', initialActividades));
    setSpecialists(loadFromLocalStorage('yoga-specialists', initialSpecialists));
    setSpaces(loadFromLocalStorage('yoga-spaces', initialSpaces));
    setYogaClasses(loadFromLocalStorage('yoga-classes', initialYogaClasses));
    setPeople(loadFromLocalStorage('yoga-people', initialPeople));
    setPayments(loadFromLocalStorage('yoga-payments', initialPayments));
    setIsInitialized(true); // Mark as initialized
  }, []);

  // Persist to localStorage whenever data changes, but only after initialization
  useEffect(() => { if(isInitialized) localStorage.setItem('yoga-actividades', JSON.stringify(actividades)); }, [actividades, isInitialized]);
  useEffect(() => { if(isInitialized) localStorage.setItem('yoga-specialists', JSON.stringify(specialists)); }, [specialists, isInitialized]);
  useEffect(() => { if(isInitialized) localStorage.setItem('yoga-people', JSON.stringify(people)); }, [people, isInitialized]);
  useEffect(() => { if(isInitialized) localStorage.setItem('yoga-classes', JSON.stringify(yogaClasses)); }, [yogaClasses, isInitialized]);
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
    const isUsedInClass = yogaClasses.some(c => c.actividadId === id);
    if (isUsedInClass) {
      toast({
        variant: "destructive",
        title: "Actividad en Uso",
        description: "Esta actividad está siendo utilizada en clases programadas. Debe eliminar o modificar esas clases primero.",
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
        const orphanedClasses = yogaClasses.filter(c => c.instructorId === updated.id && removedActividadIds.includes(c.actividadId));
        
        if (orphanedClasses.length > 0) {
            toast({
                variant: "destructive",
                title: "Clases Inconsistentes",
                description: `No se puede quitar la especialidad. Este especialista todavía tiene ${orphanedClasses.length} clase(s) programada(s) de este tipo. Reasigna o elimina esas clases primero.`,
                duration: 6000,
            });
            return;
        }
    }

    setSpecialists(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const deleteSpecialist = (id: string) => {
    if (yogaClasses.some(c => c.instructorId === id)) {
      toast({ variant: "destructive", title: "Especialista en Uso", description: "Este especialista está asignado a clases. Debe reasignar o eliminar esas clases primero." });
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
    setYogaClasses(prev => prev.map(c => ({ ...c, personIds: c.personIds.filter(pid => pid !== id) })));
    setPayments(prev => prev.filter(p => p.personId !== id));
  };

  const recordPayment = (personId: string) => {
    const person = people.find(p => p.id === personId);
    if (!person) return;

    const paymentStatus = Utils.getStudentPaymentStatus(person, new Date());
    if (paymentStatus === 'Al día') {
      toast({
        variant: "destructive",
        title: "Pago no requerido",
        description: `${person.name} ya se encuentra al día con sus pagos.`,
      });
      return;
    }

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
    const classesAffected = yogaClasses.filter(c => c.spaceId === updated.id && c.personIds.length > updated.capacity);
    if (classesAffected.length > 0) {
      toast({ variant: "destructive", title: "Error de Capacidad", description: "La nueva capacidad es menor que los inscritos en una o más clases. Reasigna personas antes de cambiar la capacidad." });
      return;
    }
    setSpaces(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const deleteSpace = (id: string) => {
    if (yogaClasses.some(c => c.spaceId === id)) {
      toast({ variant: "destructive", title: "Espacio en Uso", description: "No se puede eliminar un espacio con clases programadas. Debe reasignar o eliminar esas clases primero." });
      return;
    }
    setSpaces(prev => prev.filter(s => s.id !== id));
  };

  const addYogaClass = (yogaClass: Omit<YogaClass, 'id' | 'personIds'>) => {
    const specialistConflict = yogaClasses.some(c => c.dayOfWeek === yogaClass.dayOfWeek && c.time === yogaClass.time && c.instructorId === yogaClass.instructorId);
    if (specialistConflict) {
      toast({ variant: "destructive", title: "Conflicto de Horario", description: "Este especialista ya tiene otra clase programada a la misma hora." });
      return;
    }
    const spaceConflict = yogaClasses.some(c => c.dayOfWeek === yogaClass.dayOfWeek && c.time === yogaClass.time && c.spaceId === yogaClass.spaceId);
    if (spaceConflict) {
      toast({ variant: "destructive", title: "Conflicto de Horario", description: "Este espacio ya está en uso a esa hora." });
      return;
    }
    setYogaClasses(prev => [...prev, { ...yogaClass, id: `class-${Date.now()}`, personIds: [] }]);
  };

  const updateYogaClass = (updated: YogaClass) => {
    const specialistConflict = yogaClasses.some(c => c.id !== updated.id && c.dayOfWeek === updated.dayOfWeek && c.time === updated.time && c.instructorId === updated.instructorId);
    if (specialistConflict) {
      toast({ variant: "destructive", title: "Conflicto de Horario", description: "Este especialista ya tiene otra clase programada a la misma hora." });
      return;
    }
    const spaceConflict = yogaClasses.some(c => c.id !== updated.id && c.dayOfWeek === updated.dayOfWeek && c.time === updated.time && c.spaceId === updated.spaceId);
    if (spaceConflict) {
      toast({ variant: "destructive", title: "Conflicto de Horario", description: "Este espacio ya está en uso a esa hora." });
      return;
    }
    setYogaClasses(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const deleteYogaClass = (id: string) => {
    setYogaClasses(prev => prev.filter(c => c.id !== id));
  };

  const enrollPersonInClasses = (personId: string, newClassIds: string[]) => {
    const uniqueNewClassIds = [...new Set(newClassIds)];

    // Before any modifications, check for capacity on newly added classes
    for (const classId of uniqueNewClassIds) {
        const classToEnroll = yogaClasses.find(c => c.id === classId);
        if (!classToEnroll) continue; 
        
        const isAlreadyEnrolled = classToEnroll.personIds.includes(personId);
        // Only check capacity if the person is not already in the class
        if (!isAlreadyEnrolled) {
            const space = spaces.find(s => s.id === classToEnroll.spaceId);
            if (space && classToEnroll.personIds.length >= space.capacity) {
                const actividad = actividades.find(a => a.id === classToEnroll.actividadId);
                toast({
                    variant: "destructive",
                    title: "Clase Llena",
                    description: `No se puede inscribir en "${actividad?.name}". La clase ha alcanzado su capacidad máxima.`,
                    duration: 5000,
                });
                return; // Abort the entire operation
            }
        }
    }

    let classesToUpdate = [...yogaClasses];
    // Un-enroll from all classes first to handle removals cleanly
    classesToUpdate = classesToUpdate.map(c => ({...c, personIds: c.personIds.filter(pid => pid !== personId)}));
    
    // Enroll in the new, unique list of classes
    for (const classId of uniqueNewClassIds) {
      const classIndex = classesToUpdate.findIndex(c => c.id === classId);
      if (classIndex !== -1) {
        classesToUpdate[classIndex].personIds.push(personId);
      }
    }
    setYogaClasses(classesToUpdate);
    toast({ title: "Inscripciones Actualizadas" });
  };

  return (
    <StudioContext.Provider value={{ actividades, specialists, people, yogaClasses, payments, spaces, addActividad, updateActividad, deleteActividad, addSpecialist, updateSpecialist, deleteSpecialist, addPerson, updatePerson, deletePerson, recordPayment, undoLastPayment, addSpace, updateSpace, deleteSpace, addYogaClass, updateYogaClass, deleteYogaClass, enrollPersonInClasses }}>
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
