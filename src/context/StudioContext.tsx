'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
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

export function StudioProvider({ children }: { children: ReactNode }) {
  const [actividades, setActividades] = useState<Actividad[]>(initialActividades);
  const [specialists, setSpecialists] = useState<Specialist[]>(initialSpecialists);
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [yogaClasses, setYogaClasses] = useState<YogaClass[]>(initialYogaClasses);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [spaces, setSpaces] = useState<Space[]>(initialSpaces);
  const { toast } = useToast();


  const addActividad = (actividad: Omit<Actividad, 'id'>) => {
    const nameExists = actividades.some(a => a.name.trim().toLowerCase() === actividad.name.trim().toLowerCase());
    if (nameExists) {
      toast({
        variant: "destructive",
        title: "Nombre Duplicado",
        description: `Ya existe una actividad con el nombre "${actividad.name}".`,
      });
      return;
    }
    const newActividad: Actividad = {
      id: `spec-${Date.now()}`,
      ...actividad,
    };
    setActividades(prev => [...prev, newActividad]);
  };

  const updateActividad = (updatedActividad: Actividad) => {
    const nameExists = actividades.some(a => a.id !== updatedActividad.id && a.name.trim().toLowerCase() === updatedActividad.name.trim().toLowerCase());
    if (nameExists) {
      toast({
        variant: "destructive",
        title: "Nombre Duplicado",
        description: `Ya existe otra actividad con el nombre "${updatedActividad.name}".`,
      });
      return;
    }
    setActividades(prev =>
      prev.map(a => (a.id === updatedActividad.id ? updatedActividad : a))
    );
  };

  const deleteActividad = (actividadId: string) => {
    const isActivityInUse = yogaClasses.some(cls => cls.actividadId === actividadId);

    if (isActivityInUse) {
      toast({
        variant: "destructive",
        title: "Actividad en Uso",
        description: "No se puede eliminar. Esta actividad está en uso en una o más clases. Por favor, elimina o reasigna esas clases primero.",
      });
      return;
    }

    setActividades(prev => prev.filter(a => a.id !== actividadId));
    setSpecialists(prevSpecialists =>
      prevSpecialists.map(specialist => ({
        ...specialist,
       actividadIds: specialist.actividadIds.filter(id => id !== actividadId),
      }))
    );
  };

  const addSpecialist = (specialist: Omit<Specialist, 'id'| 'avatar'>) => {
    const nameExists = specialists.some(s => s.name.trim().toLowerCase() === specialist.name.trim().toLowerCase());
    if (nameExists) {
        toast({
            variant: "destructive",
            title: "Nombre Duplicado",
            description: `Ya existe un especialista con el nombre "${specialist.name}".`,
        });
        return;
    }
    const newSpecialist: Specialist = {
      id: `inst-${Date.now()}`,
      avatar: `https://placehold.co/100x100.png`,
      ...specialist,
    };
    setSpecialists(prev => [...prev, newSpecialist]);
  };

  const updateSpecialist = (updatedSpecialist: Specialist) => {
    const nameExists = specialists.some(s => s.id !== updatedSpecialist.id && s.name.trim().toLowerCase() === updatedSpecialist.name.trim().toLowerCase());
    if (nameExists) {
        toast({
            variant: "destructive",
            title: "Nombre Duplicado",
            description: `Ya existe otro especialista con el nombre "${updatedSpecialist.name}".`,
        });
        return;
    }

    const originalSpecialist = specialists.find(s => s.id === updatedSpecialist.id);
    if (originalSpecialist) {
        const removedActividadIds = originalSpecialist.actividadIds.filter(
            id => !updatedSpecialist.actividadIds.includes(id)
        );

        if (removedActividadIds.length > 0) {
            const affectedClasses = yogaClasses.filter(
                cls => cls.instructorId === updatedSpecialist.id && removedActividadIds.includes(cls.actividadId)
            );

            if (affectedClasses.length > 0) {
                const affectedActividadNames = removedActividadIds
                    .map(id => actividades.find(a => a.id === id)?.name)
                    .filter(Boolean)
                    .join(', ');
                
                toast({
                    variant: "destructive",
                    title: "No se puede actualizar el especialista",
                    description: `Este especialista imparte clases de "${affectedActividadNames}" que quedarían sin una actividad válida. Por favor, reasigna o elimina esas clases primero.`,
                });
                return;
            }
        }
    }

    setSpecialists(prev =>
      prev.map(s => (s.id === updatedSpecialist.id ? updatedSpecialist : s))
    );
  };

  const deleteSpecialist = (specialistId: string) => {
    const isSpecialistInUse = yogaClasses.some(cls => cls.instructorId === specialistId);

    if (isSpecialistInUse) {
      toast({
        variant: "destructive",
        title: "Especialista en Uso",
        description: "No se puede eliminar. Este especialista está asignado a una o más clases. Por favor, reasigna o elimina esas clases primero.",
      });
      return;
    }
    
    setSpecialists(prev => prev.filter(s => s.id !== specialistId));
  };

  const addPerson = (person: Omit<Person, 'id' | 'avatar' | 'joinDate' | 'lastPaymentDate'>) => {
    const newPerson: Person = {
      id: `stu-${Date.now()}`,
      avatar: `https://placehold.co/100x100.png`,
      joinDate: new Date(),
      lastPaymentDate: new Date(),
      ...person,
    };
    setPeople(prev => [newPerson, ...prev]);
    // Also create a corresponding payment record
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      personId: newPerson.id,
      date: new Date(),
    };
    setPayments(prev => [newPayment, ...prev]);
  };

  const updatePerson = (updatedPerson: Person) => {
    setPeople(prev => 
      prev.map(p => (p.id === updatedPerson.id ? updatedPerson : p))
    );
  };

  const deletePerson = (personId: string) => {
    // Unenroll from all classes first
    setYogaClasses(prevClasses =>
      prevClasses.map(cls => ({
        ...cls,
        personIds: cls.personIds.filter(id => id !== personId),
      }))
    );
    setPeople(prev => prev.filter(p => p.id !== personId));
    // Also delete associated payments
    setPayments(prev => prev.filter(p => p.personId !== personId));
  };

  const recordPayment = (personId: string) => {
    let personToUpdate: Person | undefined;
    setPeople(prevPeople =>
      prevPeople.map(p => {
        if (p.id === personId) {
          personToUpdate = p;
          return { ...p, lastPaymentDate: new Date() };
        }
        return p;
      })
    );

    if (personToUpdate) {
      const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        personId: personToUpdate.id,
        date: new Date(),
      };
      setPayments(prev => [newPayment, ...prev].sort((a,b) => b.date.getTime() - a.date.getTime()));
    }
  };

  const undoLastPayment = (personId: string) => {
    const studentPayments = payments
      .filter(p => p.personId === personId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    if (studentPayments.length > 0) {
      const lastPaymentId = studentPayments[0].id;
      setPayments(prev => prev.filter(p => p.id !== lastPaymentId));
      
      const newLastPaymentDate = studentPayments.length > 1 
        ? studentPayments[1].date 
        : new Date(0); // Set to epoch to guarantee overdue status

      setPeople(prevPeople =>
        prevPeople.map(p => {
          if (p.id === personId) {
            return { ...p, lastPaymentDate: newLastPaymentDate };
          }
          return p;
        })
      );
    }
  };

  const addSpace = (space: Omit<Space, 'id'>) => {
    const nameExists = spaces.some(s => s.name.trim().toLowerCase() === space.name.trim().toLowerCase());
    if (nameExists) {
        toast({
            variant: "destructive",
            title: "Nombre Duplicado",
            description: `Ya existe un espacio con el nombre "${space.name}".`,
        });
        return;
    }
    const newSpace: Space = {
      id: `space-${Date.now()}`,
      ...space,
    };
    setSpaces(prev => [...prev, newSpace]);
  };

  const updateSpace = (updatedSpace: Space) => {
    const nameExists = spaces.some(s => s.id !== updatedSpace.id && s.name.trim().toLowerCase() === updatedSpace.name.trim().toLowerCase());
    if (nameExists) {
        toast({
            variant: "destructive",
            title: "Nombre Duplicado",
            description: `Ya existe otro espacio con el nombre "${updatedSpace.name}".`,
        });
        return;
    }
    setSpaces(prev =>
      prev.map(s => (s.id === updatedSpace.id ? updatedSpace : s))
    );
  };

  const deleteSpace = (spaceId: string) => {
    const isSpaceInUse = yogaClasses.some(cls => cls.spaceId === spaceId);

    if (isSpaceInUse) {
      toast({
        variant: "destructive",
        title: "Espacio en Uso",
        description: "No se puede eliminar. Este espacio está asignado a una o más clases. Por favor, reasigna o elimina esas clases primero.",
      });
      return;
    }
    setSpaces(prev => prev.filter(s => s.id !== spaceId));
  };
  
  const addYogaClass = (yogaClass: Omit<YogaClass, 'id' | 'personIds'>) => {
    const specialistConflict = yogaClasses.find(
      (c) =>
        c.instructorId === yogaClass.instructorId &&
        c.dayOfWeek === yogaClass.dayOfWeek &&
        c.time === yogaClass.time
    );

    if (specialistConflict) {
      toast({
        variant: "destructive",
        title: "Conflicto de Horario",
        description: "El especialista ya tiene otra clase programada para ese mismo día y hora.",
      });
      return;
    }

    const spaceConflict = yogaClasses.find(
      (c) =>
        c.spaceId === yogaClass.spaceId &&
        c.dayOfWeek === yogaClass.dayOfWeek &&
        c.time === yogaClass.time
    );

    if (spaceConflict) {
      toast({
        variant: "destructive",
        title: "Conflicto de Espacio",
        description: "El espacio ya está ocupado por otra clase en ese mismo día y hora.",
      });
      return;
    }
    
    const selectedSpace = spaces.find(s => s.id === yogaClass.spaceId);
    if (selectedSpace && yogaClass.capacity > selectedSpace.capacity) {
      toast({
        variant: "destructive",
        title: "Capacidad Excedida",
        description: `La capacidad de la clase (${yogaClass.capacity}) no puede ser mayor que la capacidad del espacio "${selectedSpace.name}" (${selectedSpace.capacity}).`,
      });
      return;
    }


    const newYogaClass: YogaClass = {
      id: `cls-${Date.now()}`,
      personIds: [],
      ...yogaClass,
    };
    setYogaClasses(prev => [...prev, newYogaClass]);
  };

  const updateYogaClass = (updatedYogaClass: YogaClass) => {
    const specialistConflict = yogaClasses.find(
      (c) =>
        c.id !== updatedYogaClass.id &&
        c.instructorId === updatedYogaClass.instructorId &&
        c.dayOfWeek === updatedYogaClass.dayOfWeek &&
        c.time === updatedYogaClass.time
    );

    if (specialistConflict) {
      toast({
        variant: "destructive",
        title: "Conflicto de Horario",
        description: "El especialista ya tiene otra clase programada para ese mismo día y hora.",
      });
      return;
    }

    const spaceConflict = yogaClasses.find(
      (c) =>
        c.id !== updatedYogaClass.id &&
        c.spaceId === updatedYogaClass.spaceId &&
        c.dayOfWeek === updatedYogaClass.dayOfWeek &&
        c.time === updatedYogaClass.time
    );

    if (spaceConflict) {
      toast({
        variant: "destructive",
        title: "Conflicto de Espacio",
        description: "El espacio ya está ocupado por otra clase en ese mismo día y hora.",
      });
      return;
    }

    if (updatedYogaClass.capacity < updatedYogaClass.personIds.length) {
      toast({
        variant: "destructive",
        title: "Capacidad Inválida",
        description: `No se puede establecer la capacidad a ${updatedYogaClass.capacity} porque ya hay ${updatedYogaClass.personIds.length} asistentes inscritos.`,
      });
      return;
    }
    
    const selectedSpace = spaces.find(s => s.id === updatedYogaClass.spaceId);
    if (selectedSpace && updatedYogaClass.capacity > selectedSpace.capacity) {
      toast({
        variant: "destructive",
        title: "Capacidad Excedida",
        description: `La capacidad de la clase (${updatedYogaClass.capacity}) no puede ser mayor que la capacidad del espacio "${selectedSpace.name}" (${selectedSpace.capacity}).`,
      });
      return;
    }


    setYogaClasses(prev =>
      prev.map(c => (c.id === updatedYogaClass.id ? updatedYogaClass : c))
    );
  };

  const deleteYogaClass = (yogaClassId: string) => {
    setYogaClasses(prev => prev.filter(c => c.id !== yogaClassId));
  };

  const enrollPersonInClasses = (personId: string, newClassIds: string[]) => {
    const oldClassIds = yogaClasses
      .filter(c => c.personIds.includes(personId))
      .map(c => c.id);
      
    const joiningClassIds = newClassIds.filter(id => !oldClassIds.includes(id));
    const leavingClassIds = oldClassIds.filter(id => !newClassIds.includes(id));

    let availableSwapSlots = leavingClassIds.length;

    for (const classId of joiningClassIds) {
      const cls = yogaClasses.find(c => c.id === classId);
      if (cls) {
        // Check if the class is full
        if (cls.personIds.length >= cls.capacity) {
          // If it's full, we need a "swap slot" from a class the person is leaving.
          if (availableSwapSlots > 0) {
            availableSwapSlots--; // Use up a swap slot.
          } else {
            // Class is full and no swap slots are available.
            const actividadName = actividades.find(a => a.id === cls.actividadId)?.name || 'Clase';
            toast({
              variant: "destructive",
              title: "Clase Llena",
              description: `No se pudo inscribir en "${actividadName}" porque no hay cupos disponibles.`,
            });
            return; // Abort the entire operation.
          }
        }
      }
    }

    // If all checks pass, apply the changes.
    const updatedClasses = yogaClasses.map(cls => {
      const shouldBeEnrolled = newClassIds.includes(cls.id);
      const isEnrolled = cls.personIds.includes(personId);

      if (shouldBeEnrolled && !isEnrolled) {
        return { ...cls, personIds: [...cls.personIds, personId] };
      }
      if (!shouldBeEnrolled && isEnrolled) {
        return { ...cls, personIds: cls.personIds.filter(id => id !== personId) };
      }
      return cls;
    });

    setYogaClasses(updatedClasses);
    toast({
      title: "Inscripciones Actualizadas",
      description: "Se han guardado los cambios en las clases de la persona.",
    });
  };


  return (
    <StudioContext.Provider
      value={{
        actividades,
        specialists,
        people,
        yogaClasses,
        payments,
        spaces,
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
        addYogaClass,
        updateYogaClass,
        deleteYogaClass,
        enrollPersonInClasses,
      }}
    >
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
