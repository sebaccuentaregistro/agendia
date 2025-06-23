import type { Student, Instructor, Specialization, YogaClass, Payment } from '@/types';

export const specializations: Specialization[] = [
  { id: 'spec-1', name: 'Vinyasa Flow', description: 'Secuencias dinámicas y fluidas de posturas.' },
  { id: 'spec-2', name: 'Hatha Yoga', description: 'Una introducción suave a las posturas básicas de yoga.' },
  { id: 'spec-3', name: 'Ashtanga Yoga', description: 'Una serie de posturas desafiante y de ritmo rápido.' },
  { id: 'spec-4', name: 'Yin Yoga', description: 'Estilo de ritmo lento con asanas mantenidas por períodos más largos.' },
  { id: 'spec-5', name: 'Yoga Restaurativo', description: 'Se centra en la relajación y la curación.' },
];

export const instructors: Instructor[] = [
  { id: 'inst-1', name: 'Elena Santos', email: 'elena.s@example.com', phone: '123-456-7890', specializationIds: ['spec-1', 'spec-2'], avatar: `https://placehold.co/100x100.png` },
  { id: 'inst-2', name: 'Marcus Chen', email: 'marcus.c@example.com', phone: '234-567-8901', specializationIds: ['spec-3'], avatar: `https://placehold.co/100x100.png` },
  { id: 'inst-3', name: 'Aisha Khan', email: 'aisha.k@example.com', phone: '345-678-9012', specializationIds: ['spec-4', 'spec-5'], avatar: `https://placehold.co/100x100.png` },
  { id: 'inst-4', name: 'David Miller', email: 'david.m@example.com', phone: '456-789-0123', specializationIds: ['spec-1', 'spec-4'], avatar: `https://placehold.co/100x100.png` },
];

export const students: Student[] = [
  { id: 'stu-1', name: 'Sophia Loren', email: 'sophia.l@example.com', joinDate: new Date('2023-01-15'), status: 'Activo', paymentStatus: 'Pagado', avatar: `https://placehold.co/100x100.png` },
  { id: 'stu-2', name: 'Liam Gallagher', email: 'liam.g@example.com', joinDate: new Date('2023-02-20'), status: 'Activo', paymentStatus: 'Atrasado', avatar: `https://placehold.co/100x100.png` },
  { id: 'stu-3', name: 'Chloe Kim', email: 'chloe.k@example.com', joinDate: new Date('2023-03-10'), status: 'Inactivo', paymentStatus: 'Pagado', avatar: `https://placehold.co/100x100.png` },
  { id: 'stu-4', name: 'Benjamin Carter', email: 'ben.c@example.com', joinDate: new Date('2023-04-05'), status: 'Activo', paymentStatus: 'Pendiente', avatar: `https://placehold.co/100x100.png` },
  { id: 'stu-5', name: 'Olivia Martinez', email: 'olivia.m@example.com', joinDate: new Date('2023-05-22'), status: 'Activo', paymentStatus: 'Pagado', avatar: `https://placehold.co/100x100.png` },
  { id: 'stu-6', name: 'Noah Rodriguez', email: 'noah.r@example.com', joinDate: new Date('2023-06-30'), status: 'Activo', paymentStatus: 'Pagado', avatar: `https://placehold.co/100x100.png` },
];

export const yogaClasses: YogaClass[] = [
  { id: 'cls-1', name: 'Vinyasa Matutino', instructorId: 'inst-1', specializationId: 'spec-1', dayOfWeek: 'Lunes', time: '07:00 AM', capacity: 15, studentsEnrolled: 12 },
  { id: 'cls-2', name: 'Hatha Suave', instructorId: 'inst-1', specializationId: 'spec-2', dayOfWeek: 'Martes', time: '09:00 AM', capacity: 20, studentsEnrolled: 18 },
  { id: 'cls-3', name: 'Ashtanga Potente', instructorId: 'inst-2', specializationId: 'spec-3', dayOfWeek: 'Miércoles', time: '06:00 PM', capacity: 12, studentsEnrolled: 12 },
  { id: 'cls-4', name: 'Yin de Estiramiento Profundo', instructorId: 'inst-3', specializationId: 'spec-4', dayOfWeek: 'Jueves', time: '07:30 PM', capacity: 18, studentsEnrolled: 15 },
  { id: 'cls-5', name: 'Flow de Tarde', instructorId: 'inst-4', specializationId: 'spec-1', dayOfWeek: 'Viernes', time: '06:30 PM', capacity: 15, studentsEnrolled: 10 },
  { id: 'cls-6', name: 'Restaurativo de Fin de Semana', instructorId: 'inst-3', specializationId: 'spec-5', dayOfWeek: 'Sábado', time: '11:00 AM', capacity: 20, studentsEnrolled: 14 },
];

export const payments: Payment[] = students.map((student, index) => ({
  id: `pay-${index + 1}`,
  studentId: student.id,
  amount: 95.00,
  date: new Date(new Date(student.joinDate).setDate(new Date(student.joinDate).getDate() + 30 * index)),
  status: student.paymentStatus,
}));
