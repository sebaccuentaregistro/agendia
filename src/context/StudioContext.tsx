'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Actividad, Specialist, Student, YogaClass, Payment, Space } from '@/types';
import { 
  actividades as initialActividades, 
  specialists as initialSpecialists,
  students as initialStudents,
  yogaClasses as initialYogaClasses,
  payments as initialPayments,
  spaces as initialSpaces
} from '@/lib/data';

interface StudioContextType {
  actividades: Actividad[];
  specialists: Specialist[];
  students: Student[];
  yogaClasses: YogaClass[];
  payments: Payment[];
  spaces: Space[];
  addActividad: (actividad: Omit<Actividad, 'id'>) => void;
  updateActividad: (actividad: Actividad) => void;
  deleteActividad: (actividadId: string) => void;
  addSpecialist: (specialist: Omit<Specialist, 'id' | 'avatar'>) => void;
  updateSpecialist: (specialist: Specialist) => void;
  deleteSpecialist: (specialistId: string) => void;
  addStudent: (student: Omit<Student, 'id' | 'avatar' | 'joinDate' | 'lastPaymentDate'>) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (studentId: string) => void;
  recordPayment: (studentId: string) => void;
  undoLastPayment: (studentId: string) => void;
  addSpace: (space: Omit<Space, 'id'>) => void;
  updateSpace: (space: Space) => void;
  deleteSpace: (spaceId: string) => void;
  addYogaClass: (yogaClass: Omit<YogaClass, 'id' | 'studentsEnrolled'>) => void;
  updateYogaClass: (yogaClass: YogaClass) => void;
  deleteYogaClass: (yogaClassId: string) => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({ children }: { children: ReactNode }) {
  const [actividades, setActividades] = useState<Actividad[]>(initialActividades);
  const [specialists, setSpecialists] = useState<Specialist[]>(initialSpecialists);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [yogaClasses, setYogaClasses] = useState<YogaClass[]>(initialYogaClasses);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [spaces, setSpaces] = useState<Space[]>(initialSpaces);


  const addActividad = (actividad: Omit<Actividad, 'id'>) => {
    const newActividad: Actividad = {
      id: `spec-${Date.now()}`,
      ...actividad,
    };
    setActividades(prev => [...prev, newActividad]);
  };

  const updateActividad = (updatedActividad: Actividad) => {
    setActividades(prev =>
      prev.map(a => (a.id === updatedActividad.id ? updatedActividad : a))
    );
  };

  const deleteActividad = (actividadId: string) => {
    setActividades(prev => prev.filter(a => a.id !== actividadId));
    setSpecialists(prevSpecialists =>
      prevSpecialists.map(specialist => ({
        ...specialist,
        actividadIds: specialist.actividadIds.filter(id => id !== actividadId),
      }))
    );
  };

  const addSpecialist = (specialist: Omit<Specialist, 'id'| 'avatar'>) => {
    const newSpecialist: Specialist = {
      id: `inst-${Date.now()}`,
      avatar: `https://placehold.co/100x100.png`,
      ...specialist,
    };
    setSpecialists(prev => [...prev, newSpecialist]);
  };

  const updateSpecialist = (updatedSpecialist: Specialist) => {
    setSpecialists(prev =>
      prev.map(s => (s.id === updatedSpecialist.id ? updatedSpecialist : s))
    );
  };

  const deleteSpecialist = (specialistId: string) => {
    setSpecialists(prev => prev.filter(s => s.id !== specialistId));
  };

  const addStudent = (student: Omit<Student, 'id' | 'avatar' | 'joinDate' | 'lastPaymentDate'>) => {
    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      avatar: `https://placehold.co/100x100.png`,
      joinDate: new Date(),
      lastPaymentDate: new Date(),
      ...student,
    };
    setStudents(prev => [newStudent, ...prev]);
    // Also create a corresponding payment record
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      studentId: newStudent.id,
      amount: newStudent.membershipType === 'Mensual' ? 95.00 : 15.00,
      date: new Date(),
    };
    setPayments(prev => [newPayment, ...prev]);
  };

  const updateStudent = (updatedStudent: Student) => {
    setStudents(prev => 
      prev.map(s => (s.id === updatedStudent.id ? updatedStudent : s))
    );
  };

  const deleteStudent = (studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    // Also delete associated payments
    setPayments(prev => prev.filter(p => p.studentId !== studentId));
  };

  const recordPayment = (studentId: string) => {
    let studentToUpdate: Student | undefined;
    setStudents(prevStudents =>
      prevStudents.map(s => {
        if (s.id === studentId) {
          studentToUpdate = s;
          return { ...s, lastPaymentDate: new Date() };
        }
        return s;
      })
    );

    if (studentToUpdate) {
      const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        studentId: studentToUpdate.id,
        amount: studentToUpdate.membershipType === 'Mensual' ? 95.00 : 15.00,
        date: new Date(),
      };
      setPayments(prev => [newPayment, ...prev].sort((a,b) => b.date.getTime() - a.date.getTime()));
    }
  };

  const undoLastPayment = (studentId: string) => {
    const studentPayments = payments
      .filter(p => p.studentId === studentId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    if (studentPayments.length > 0) {
      const lastPaymentId = studentPayments[0].id;
      setPayments(prev => prev.filter(p => p.id !== lastPaymentId));
      
      const newLastPaymentDate = studentPayments.length > 1 
        ? studentPayments[1].date 
        : students.find(s => s.id === studentId)?.joinDate;

      if (newLastPaymentDate) {
         setStudents(prevStudents =>
          prevStudents.map(s => {
            if (s.id === studentId) {
              return { ...s, lastPaymentDate: newLastPaymentDate };
            }
            return s;
          })
        );
      }
    }
  };

  const addSpace = (space: Omit<Space, 'id'>) => {
    const newSpace: Space = {
      id: `space-${Date.now()}`,
      ...space,
    };
    setSpaces(prev => [...prev, newSpace]);
  };

  const updateSpace = (updatedSpace: Space) => {
    setSpaces(prev =>
      prev.map(s => (s.id === updatedSpace.id ? updatedSpace : s))
    );
  };

  const deleteSpace = (spaceId: string) => {
    setSpaces(prev => prev.filter(s => s.id !== spaceId));
  };
  
  const addYogaClass = (yogaClass: Omit<YogaClass, 'id' | 'studentsEnrolled'>) => {
    const conflict = yogaClasses.find(
      (c) =>
        c.instructorId === yogaClass.instructorId &&
        c.dayOfWeek === yogaClass.dayOfWeek &&
        c.time === yogaClass.time
    );

    if (conflict) {
      alert(
        'Conflicto de horario: El especialista ya tiene otra clase programada para ese mismo día y hora.'
      );
      return;
    }

    const newYogaClass: YogaClass = {
      id: `cls-${Date.now()}`,
      studentsEnrolled: 0,
      ...yogaClass,
    };
    setYogaClasses(prev => [...prev, newYogaClass]);
  };

  const updateYogaClass = (updatedYogaClass: YogaClass) => {
    const conflict = yogaClasses.find(
      (c) =>
        c.id !== updatedYogaClass.id &&
        c.instructorId === updatedYogaClass.instructorId &&
        c.dayOfWeek === updatedYogaClass.dayOfWeek &&
        c.time === updatedYogaClass.time
    );

    if (conflict) {
      alert(
        'Conflicto de horario: El especialista ya tiene otra clase programada para ese mismo día y hora.'
      );
      return;
    }

    setYogaClasses(prev =>
      prev.map(c => (c.id === updatedYogaClass.id ? updatedYogaClass : c))
    );
  };

  const deleteYogaClass = (yogaClassId: string) => {
    setYogaClasses(prev => prev.filter(c => c.id !== yogaClassId));
  };


  return (
    <StudioContext.Provider
      value={{
        actividades,
        specialists,
        students,
        yogaClasses,
        payments,
        spaces,
        addActividad,
        updateActividad,
        deleteActividad,
        addSpecialist,
        updateSpecialist,
        deleteSpecialist,
        addStudent,
        updateStudent,
        deleteStudent,
        recordPayment,
        undoLastPayment,
        addSpace,
        updateSpace,
        deleteSpace,
        addYogaClass,
        updateYogaClass,
        deleteYogaClass,
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
