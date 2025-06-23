'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Actividad, Specialist, Student, YogaClass, Payment } from '@/types';
import { 
  actividades as initialActividades, 
  specialists as initialSpecialists,
  students as initialStudents,
  yogaClasses as initialYogaClasses,
  payments as initialPayments
} from '@/lib/data';

interface StudioContextType {
  actividades: Actividad[];
  specialists: Specialist[];
  students: Student[];
  yogaClasses: YogaClass[];
  payments: Payment[];
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
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({ children }: { children: ReactNode }) {
  const [actividades, setActividades] = useState<Actividad[]>(initialActividades);
  const [specialists, setSpecialists] = useState<Specialist[]>(initialSpecialists);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [yogaClasses, setYogaClasses] = useState<YogaClass[]>(initialYogaClasses);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);


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

  return (
    <StudioContext.Provider
      value={{
        actividades,
        specialists,
        students,
        yogaClasses,
        payments,
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
