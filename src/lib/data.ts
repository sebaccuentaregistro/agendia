import type { Student, Specialist, Actividad, YogaClass, Payment, Space } from '@/types';

export const actividades: Actividad[] = [
  { id: 'spec-1', name: 'Vinyasa Flow' },
  { id: 'spec-2', name: 'Hatha Yoga' },
  { id: 'spec-3', name: 'Ashtanga Yoga' },
  { id: 'spec-4', name: 'Yin Yoga' },
  { id: 'spec-5', name: 'Yoga Restaurativo' },
];

export const specialists: Specialist[] = [
  { id: 'inst-1', name: 'Elena Santos', phone: '123-456-7890', actividadIds: ['spec-1', 'spec-2'], avatar: `https://placehold.co/100x100.png` },
  { id: 'inst-2', name: 'Marcus Chen', phone: '234-567-8901', actividadIds: ['spec-3'], avatar: `https://placehold.co/100x100.png` },
  { id: 'inst-3', name: 'Aisha Khan', phone: '345-678-9012', actividadIds: ['spec-4', 'spec-5'], avatar: `https://placehold.co/100x100.png` },
  { id: 'inst-4', name: 'David Miller', phone: '456-789-0123', actividadIds: ['spec-1', 'spec-4'], avatar: `https://placehold.co/100x100.png` },
];

// Helper to create dates in the past
const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

export const students: Student[] = [
  { id: 'stu-1', name: 'Sophia Loren', phone: '555-0101', joinDate: daysAgo(180), membershipType: 'Mensual', lastPaymentDate: daysAgo(25), avatar: `https://placehold.co/100x100.png` },
  { id: 'stu-2', name: 'Liam Gallagher', phone: '555-0102', joinDate: daysAgo(150), membershipType: 'Mensual', lastPaymentDate: daysAgo(45), avatar: `https://placehold.co/100x100.png` },
  { id: 'stu-3', name: 'Chloe Kim', phone: '555-0103', joinDate: daysAgo(120), membershipType: 'Diario', lastPaymentDate: daysAgo(5), avatar: `https://placehold.co/100x100.png` },
  { id: 'stu-4', name: 'Benjamin Carter', phone: '555-0104', joinDate: daysAgo(90), membershipType: 'Mensual', lastPaymentDate: daysAgo(10), avatar: `https://placehold.co/100x100.png` },
  { id: 'stu-5', name: 'Olivia Martinez', phone: '555-0105', joinDate: daysAgo(60), membershipType: 'Diario', lastPaymentDate: daysAgo(2), avatar: `https://placehold.co/100x100.png` },
  { id: 'stu-6', name: 'Noah Rodriguez', phone: '555-0106', joinDate: daysAgo(30), membershipType: 'Mensual', lastPaymentDate: daysAgo(29), avatar: `https://placehold.co/100x100.png` },
];

export const spaces: Space[] = [
  { id: 'space-1', name: 'Sala Sol', capacity: 20 },
  { id: 'space-2', name: 'Sala Luna', capacity: 15 },
  { id: 'space-3', name: 'Área de Máquinas', capacity: 10 },
];

export const yogaClasses: YogaClass[] = [
  { id: 'cls-1', instructorId: 'inst-1', actividadId: 'spec-1', spaceId: 'space-1', dayOfWeek: 'Lunes', time: '07:00', capacity: 15, studentIds: ['stu-1', 'stu-4'] },
  { id: 'cls-2', instructorId: 'inst-1', actividadId: 'spec-2', spaceId: 'space-2', dayOfWeek: 'Martes', time: '09:00', capacity: 15, studentIds: ['stu-2', 'stu-5', 'stu-6'] },
  { id: 'cls-3', instructorId: 'inst-2', actividadId: 'spec-3', spaceId: 'space-1', dayOfWeek: 'Miércoles', time: '18:00', capacity: 12, studentIds: ['stu-1', 'stu-3'] },
  { id: 'cls-4', instructorId: 'inst-3', actividadId: 'spec-4', spaceId: 'space-2', dayOfWeek: 'Jueves', time: '19:30', capacity: 15, studentIds: ['stu-2', 'stu-4'] },
  { id: 'cls-5', instructorId: 'inst-4', actividadId: 'spec-1', spaceId: 'space-1', dayOfWeek: 'Viernes', time: '18:30', capacity: 15, studentIds: ['stu-5', 'stu-6'] },
  { id: 'cls-6', instructorId: 'inst-3', actividadId: 'spec-5', spaceId: 'space-2', dayOfWeek: 'Sábado', time: '11:00', capacity: 15, studentIds: ['stu-1', 'stu-2', 'stu-3', 'stu-4'] },
];

export const payments: Payment[] = [
  { id: 'pay-1', studentId: 'stu-1', amount: 95.00, date: daysAgo(25) },
  { id: 'pay-2', studentId: 'stu-2', amount: 95.00, date: daysAgo(45) },
  { id: 'pay-3', studentId: 'stu-3', amount: 15.00, date: daysAgo(5) },
  { id: 'pay-4', studentId: 'stu-4', amount: 95.00, date: daysAgo(10) },
  { id: 'pay-5', studentId: 'stu-5', amount: 15.00, date: daysAgo(2) },
  { id: 'pay-6', studentId: 'stu-6', amount: 95.00, date: daysAgo(29) },
  { id: 'pay-7', studentId: 'stu-1', amount: 95.00, date: daysAgo(55) },
  { id: 'pay-8', studentId: 'stu-2', amount: 95.00, date: daysAgo(75) },
];
