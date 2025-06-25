
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
const loadFromLocalStorage = (key: string, defaultValue: any[]) => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

export function StudioProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Initialize with default data. This runs on server and client's first render.
  const [actividades, setActividades] = useState<Actividad[]>(initialActividades);
  const [specialists, setSpecialists] = useState<Specialist[]>(initialSpecialists);
  const [spaces, setSpaces] = useState<Space[]>(initialSpaces);
  const [yogaClasses, setYogaClasses] = useState<YogaClass[]>(initialYogaClasses);
  const [people, setPeople] = useState<Person[]>(() => initialPeople.map(p => ({ ...p, joinDate: new Date(p.joinDate), lastPaymentDate: new Date(p.lastPaymentDate) })));
  const [payments, setPayments] = useState<Payment[]>(() => initialPayments.map(p => ({ ...p, date: new Date(p.date) })));
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on client-side mount to avoid hydration errors
  useEffect(() => {
    setActividades(loadFromLocalStorage('yoga-actividades', initialActividades));
    setSpecialists(loadFromLocalStorage('yoga-specialists', initialSpecialists));
    setSpaces(loadFromLocalStorage('yoga-spaces', initialSpaces));
    setYogaClasses(loadFromLocalStorage('yoga-classes', initialYogaClasses));

    const storedPeople = loadFromLocalStorage('yoga-people', initialPeople);
    setPeople(storedPeople.map((p: any) => ({ ...p, joinDate: new Date(p.joinDate), lastPaymentDate: new Date(p.lastPaymentDate) })));

    const storedPayments = loadFromLocalStorage('yoga-payments', initialPayments);
    setPayments(storedPayments.map((p: any) => ({ ...p, date: new Date(p.date) })));
    
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
    setActividades(prev => [...prev, { ...actividad, id: `act-${Date.now()}` }]);
  };
  const updateActividad = (updated: Actividad) => {
    setActividades(prev => prev.map(a => a.id === updated.id ? updated : a));
  };
  const deleteActividad = (id: string) => {
    if (yogaClasses.some(c => c.actividadId === id) || specialists.some(s => s.actividadIds.includes(id))) {
      toast({ variant: "destructive", title: "Error", description: "No se puede eliminar una actividad en uso." });
      return;
    }
    setActividades(prev => prev.filter(a => a.id !== id));
  };

  const addSpecialist = (specialist: Omit<Specialist, 'id' | 'avatar'>) => {
    setSpecialists(prev => [...prev, { ...specialist, id: `spc-${Date.now()}`, avatar: `https://placehold.co/100x100.png` }]);
  };
  const updateSpecialist = (updated: Specialist) => {
    setSpecialists(prev => prev.map(s => s.id === updated.id ? updated : s));
  };
  const deleteSpecialist = (id: string) => {
    if (yogaClasses.some(c => c.instructorId === id)) {
      toast({ variant: "destructive", title: "Error", description: "No se puede eliminar un especialista asignado a clases." });
      return;
    }
    setSpecialists(prev => prev.filter(s => s.id !== id));
  };

  const addPerson = (person: Omit<Person, 'id' | 'avatar' | 'joinDate' | 'lastPaymentDate'>) => {
    const now = new Date();
    const newPerson: Person = { ...person, id: `person-${Date.now()}`, avatar: `https://placehold.co/100x100.png`, joinDate: now, lastPaymentDate: now };
    setPeople(prev => [newPerson, ...prev]);
    if (newPerson.membershipType === 'Mensual') {
      const newPayment: Payment = { id: `pay-${Date.now()}`, personId: newPerson.id, date: now };
      setPayments(prev => [newPayment, ...prev]);
    }
  };
  const updatePerson = (updated: Person) => {
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
    setSpaces(prev => [...prev, { ...space, id: `space-${Date.now()}` }]);
  };
  const updateSpace = (updated: Space) => {
    const classesAffected = yogaClasses.filter(c => c.spaceId === updated.id && c.personIds.length > updated.capacity);
    if (classesAffected.length > 0) {
      toast({ variant: "destructive", title: "Error", description: "La nueva capacidad es menor que los inscritos en una clase." });
      return;
    }
    setSpaces(prev => prev.map(s => s.id === updated.id ? updated : s));
  };
  const deleteSpace = (id: string) => {
    if (yogaClasses.some(c => c.spaceId === id)) {
      toast({ variant: "destructive", title: "Error", description: "No se puede eliminar un espacio en uso." });
      return;
    }
    setSpaces(prev => prev.filter(s => s.id !== id));
  };

  const addYogaClass = (yogaClass: Omit<YogaClass, 'id' | 'personIds'>) => {
    const conflict = yogaClasses.some(c => c.dayOfWeek === yogaClass.dayOfWeek && c.time === yogaClass.time && (c.instructorId === yogaClass.instructorId || c.spaceId === yogaClass.spaceId));
    if (conflict) {
      toast({ variant: "destructive", title: "Conflicto de Horario", description: "El especialista o el espacio ya están ocupados a esa hora." });
      return;
    }
    setYogaClasses(prev => [...prev, { ...yogaClass, id: `class-${Date.now()}`, personIds: [] }]);
  };
  const updateYogaClass = (updated: YogaClass) => {
    const conflict = yogaClasses.some(c => c.id !== updated.id && c.dayOfWeek === updated.dayOfWeek && c.time === updated.time && (c.instructorId === updated.instructorId || c.spaceId === updated.spaceId));
    if (conflict) {
      toast({ variant: "destructive", title: "Conflicto de Horario", description: "El especialista o el espacio ya están ocupados a esa hora." });
      return;
    }
    setYogaClasses(prev => prev.map(c => c.id === updated.id ? updated : c));
  };
  const deleteYogaClass = (id: string) => {
    const classToDelete = yogaClasses.find(c => c.id === id);
    if(classToDelete?.personIds.length > 0){
        toast({ variant: "destructive", title: "Error", description: "No se puede eliminar una clase con personas inscritas." });
        return;
    }
    setYogaClasses(prev => prev.filter(c => c.id !== id));
  };

  const enrollPersonInClasses = (personId: string, newClassIds: string[]) => {
    let classesToUpdate = [...yogaClasses];
    // Un-enroll from all classes first
    classesToUpdate = classesToUpdate.map(c => ({...c, personIds: c.personIds.filter(id => id !== personId)}));
    // Enroll in new classes
    for (const classId of newClassIds) {
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
