
import type { Person, Specialist, Actividad, Session, Payment, Space, SessionAttendance, AppNotification, Tariff, Level } from '@/types';

// This file contains initial data for demonstration purposes when not connected to a database.
// As the app is now connected to Firestore, this data is used as a reference but is no longer the primary data source.

// Use a fixed reference date to make initial data deterministic
const refDate = new Date('2024-07-15T10:00:00Z');

export const actividades: Actividad[] = [
  { id: 'spec-1', name: 'Vinyasa Flow' },
  { id: 'spec-2', name: 'Hatha Yoga' },
  { id: 'spec-3', name: 'Ashtanga Yoga' },
  { id: 'spec-4', name: 'Yin Yoga' },
  { id: 'spec-5', name: 'Yoga Restaurativo' },
];

export const levels: Level[] = [
  { id: 'level-1', name: 'Principiante' },
  { id: 'level-2', name: 'Intermedio' },
  { id: 'level-3', name: 'Avanzado' },
  { id: 'level-4', name: 'Multinivel' },
];

export const specialists: Specialist[] = [
  { id: 'inst-1', name: 'Elena Santos', phone: '123-456-7890', actividadIds: ['spec-1', 'spec-2'], avatar: `https://placehold.co/100x100.png` },
  { id: 'inst-2', name: 'Marcus Chen', phone: '234-567-8901', actividadIds: ['spec-3'], avatar: `https://placehold.co/100x100.png` },
  { id: 'inst-3', name: 'Aisha Khan', phone: '345-678-9012', actividadIds: ['spec-4', 'spec-5'], avatar: `https://placehold.co/100x100.png` },
  { id: 'inst-4', name: 'David Miller', phone: '456-789-0123', actividadIds: ['spec-1', 'spec-4'], avatar: `https://placehold.co/100x100.png` },
];

const daysAgo = (days: number): Date => {
  const date = new Date(refDate);
  date.setDate(date.getDate() - days);
  return date;
};

export const people: Person[] = [
  { id: 'stu-1', name: 'Sophia Loren', phone: '555-0101', joinDate: daysAgo(340), membershipType: 'Mensual', lastPaymentDate: daysAgo(40), avatar: `https://placehold.co/100x100.png`, healthInfo: 'Lesión lumbar crónica. Evitar torsiones profundas.', status: 'active', levelId: 'level-2', notes: 'Prefiere usar su propio mat.' },
  { id: 'stu-2', name: 'Liam Gallagher', phone: '555-0102', joinDate: daysAgo(275), membershipType: 'Mensual', lastPaymentDate: daysAgo(15), avatar: `https://placehold.co/100x100.png`, healthInfo: 'Hipertensión. Controlar la intensidad.', status: 'active', levelId: 'level-2' },
  { id: 'stu-5', name: 'Olivia Martinez', phone: '555-0105', joinDate: daysAgo(185), membershipType: 'Diario', lastPaymentDate: daysAgo(2), avatar: `https://placehold.co/100x100.png`, healthInfo: 'Embarazo de 5 meses. Adaptar posturas.', status: 'active', levelId: 'level-1' },
  { id: 'stu-16', name: 'Logan Wilson', phone: '555-0116', joinDate: daysAgo(35), membershipType: 'Mensual', lastPaymentDate: daysAgo(4), avatar: `https://placehold.co/100x100.png`, status: 'active', levelId: 'level-1' },
  { id: 'stu-9', name: 'Isabella Garcia', phone: '555-0109', joinDate: daysAgo(125), membershipType: 'Mensual', lastPaymentDate: daysAgo(35), avatar: `https://placehold.co/100x100.png`, status: 'inactive', cancellationDate: daysAgo(5), cancellationReason: 'Se mudó' },
];

export const spaces: Space[] = [
  { id: 'space-1', name: 'Sala Sol', capacity: 20, operatingHoursStart: '07:00', operatingHoursEnd: '22:00' },
  { id: 'space-2', name: 'Sala Luna', capacity: 15, operatingHoursStart: '08:00', operatingHoursEnd: '21:00' },
];

export const sessions: Session[] = [
  { id: 'cls-1', instructorId: 'inst-1',ividadId: 'spec-1', spaceId: 'space-1', dayOfWeek: 'Lunes', time: '07:00', sessionType: 'Grupal', personIds: [], waitlistPersonIds: [], levelId: 'level-4' },
  { id: 'cls-2', instructorId: 'inst-1',ividadId: 'spec-2', spaceId: 'space-2', dayOfWeek: 'Martes', time: '09:00', sessionType: 'Grupal', personIds: [], waitlistPersonIds: [], levelId: 'level-1' },
  { id: 'cls-3', instructorId: 'inst-2',ividadId: 'spec-3', spaceId: 'space-1', dayOfWeek: 'Miércoles', time: '18:00', sessionType: 'Grupal', personIds: [], waitlistPersonIds: [], levelId: 'level-3' },
  { id: 'cls-4', instructorId: 'inst-3',ividadId: 'spec-4', spaceId: 'space-2', dayOfWeek: 'Jueves', time: '19:30', sessionType: 'Grupal', personIds: [], waitlistPersonIds: [], levelId: 'level-2' },
  { id: 'cls-5', instructorId: 'inst-4',ividadId: 'spec-1', spaceId: 'space-1', dayOfWeek: 'Viernes', time: '18:30', sessionType: 'Grupal', personIds: [], waitlistPersonIds: [], levelId: 'level-1' },
  { id: 'cls-6', instructorId: 'inst-3',ividadId: 'spec-5', spaceId: 'space-2', dayOfWeek: 'Sábado', time: '11:00', sessionType: 'Grupal', personIds: [], waitlistPersonIds: [], levelId: 'level-4' },
];

export const payments: Payment[] = [
  { id: 'pay-1', personId: 'stu-1', date: daysAgo(40), months: 1 },
  { id: 'pay-2', personId: 'stu-2', date: daysAgo(15), months: 1 },
  { id: 'pay-3', personId: 'stu-5', date: daysAgo(2), months: 1 },
  { id: 'pay-4', personId: 'stu-16', date: daysAgo(4), months: 1 },
  { id: 'pay-5', personId: 'stu-9', date: daysAgo(35), months: 1 },
];

export const attendance: SessionAttendance[] = [];

export const notifications: AppNotification[] = [];

export const tariffs: Tariff[] = [
  { id: 'tariff-1', name: 'Clase Individual', price: 2500, description: 'Valor por una única clase (drop-in).', isIndividual: true },
  { id: 'tariff-2', name: '1 vez por semana', price: 8000, description: 'Plan mensual.', frequency: 1 },
  { id: 'tariff-3', name: '2 veces por semana', price: 12000, description: 'Plan mensual.', frequency: 2 },
  { id: 'tariff-4', name: '3 veces por semana', price: 15000, description: 'Plan mensual.', frequency: 3 },
  { id: 'tariff-5', name: 'Pase Libre', price: 18000, description: 'Acceso ilimitado a clases grupales.', frequency: 5 },
];
    