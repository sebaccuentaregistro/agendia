
import type { Person, Specialist, Actividad, Session, Payment, Space, SessionAttendance, AppNotification, Tariff, Level } from '@/types';

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
  { id: 'inst-1', name: 'Elena Santos', phone: '123-456-7890',ividadIds: ['spec-1', 'spec-2'], avatar: `https://placehold.co/100x100.png` },
  { id: 'inst-2', name: 'Marcus Chen', phone: '234-567-8901',ividadIds: ['spec-3'], avatar: `https://placehold.co/100x100.png` },
  { id: 'inst-3', name: 'Aisha Khan', phone: '345-678-9012',ividadIds: ['spec-4', 'spec-5'], avatar: `https://placehold.co/100x100.png` },
  { id: 'inst-4', name: 'David Miller', phone: '456-789-0123',ividadIds: ['spec-1', 'spec-4'], avatar: `https://placehold.co/100x100.png` },
];

const daysAgo = (days: number): Date => {
  const date = new Date(refDate);
  date.setDate(date.getDate() - days);
  return date;
};

export const people: Person[] = [
  // ~11 months ago
  { id: 'stu-1', name: 'Sophia Loren', phone: '555-0101', joinDate: daysAgo(340), membershipType: 'Mensual', lastPaymentDate: daysAgo(25), avatar: `https://placehold.co/100x100.png`, healthInfo: 'Lesión lumbar crónica. Evitar torsiones profundas.', status: 'active', levelId: 'level-2', notes: 'Prefiere usar su propio mat.\nA veces llega 5 minutos tarde.' },
  // ~9 months ago
  { id: 'stu-2', name: 'Liam Gallagher', phone: '555-0102', joinDate: daysAgo(275), membershipType: 'Mensual', lastPaymentDate: daysAgo(15), avatar: `https://placehold.co/100x100.png`, healthInfo: 'Hipertensión. Controlar la intensidad.', status: 'active', levelId: 'level-2' },
  { id: 'stu-3', name: 'Chloe Kim', phone: '555-0103', joinDate: daysAgo(270), membershipType: 'Diario', lastPaymentDate: daysAgo(5), avatar: `https://placehold.co/100x100.png`, status: 'active', levelId: 'level-1' },
  // ~8 months ago
  { id: 'stu-4', name: 'Benjamin Carter', phone: '555-0104', joinDate: daysAgo(245), membershipType: 'Mensual', lastPaymentDate: daysAgo(10), avatar: `https://placehold.co/100x100.png`, status: 'active', levelId: 'level-3' },
  // ~6 months ago
  { id: 'stu-5', name: 'Olivia Martinez', phone: '555-0105', joinDate: daysAgo(185), membershipType: 'Diario', lastPaymentDate: daysAgo(2), avatar: `https://placehold.co/100x100.png`, healthInfo: 'Embarazo de 5 meses. Adaptar posturas.', status: 'active', levelId: 'level-1' },
  // ~5 months ago
  { id: 'stu-6', name: 'Noah Rodriguez', phone: '555-0106', joinDate: daysAgo(155), membershipType: 'Mensual', lastPaymentDate: daysAgo(29), avatar: `https://placehold.co/100x100.png`, status: 'active', levelId: 'level-2' },
  { id: 'stu-7', name: 'Ava Wilson', phone: '555-0107', joinDate: daysAgo(150), membershipType: 'Mensual', lastPaymentDate: daysAgo(20), avatar: `https://placehold.co/100x100.png`, status: 'active', levelId: 'level-1' },
  { id: 'stu-8', name: 'James Smith', phone: '555-0108', joinDate: daysAgo(145), membershipType: 'Diario', lastPaymentDate: daysAgo(8), avatar: `https://placehold.co/100x100.png`, status: 'active' },
  // ~4 months ago
  { id: 'stu-9', name: 'Isabella Garcia', phone: '555-0109', joinDate: daysAgo(125), membershipType: 'Mensual', lastPaymentDate: daysAgo(5), avatar: `https://placehold.co/100x100.png`, status: 'active', levelId: 'level-2' },
  { id: 'stu-10', name: 'Mason Johnson', phone: '555-0110', joinDate: daysAgo(120), membershipType: 'Mensual', lastPaymentDate: daysAgo(22), avatar: `https://placehold.co/100x100.png`, status: 'active' },
  // ~3 months ago
  { id: 'stu-11', name: 'Emma Brown', phone: '555-0111', joinDate: daysAgo(95), membershipType: 'Diario', lastPaymentDate: daysAgo(1), avatar: `https://placehold.co/100x100.png`, status: 'active', levelId: 'level-1' },
  // ~2 months ago
  { id: 'stu-12', name: 'Lucas Williams', phone: '555-0112', joinDate: daysAgo(65), membershipType: 'Mensual', lastPaymentDate: daysAgo(12), avatar: `https://placehold.co/100x100.png`, status: 'active', levelId: 'level-3' },
  { id: 'stu-13', name: 'Mia Jones', phone: '555-0113', joinDate: daysAgo(60), membershipType: 'Mensual', lastPaymentDate: daysAgo(18), avatar: `https://placehold.co/100x100.png`, status: 'active' },
  { id: 'stu-14', name: 'Henry Davis', phone: '555-0114', joinDate: daysAgo(55), membershipType: 'Diario', lastPaymentDate: daysAgo(3), avatar: `https://placehold.co/100x100.png`, status: 'active' },
  { id: 'stu-15', name: 'Evelyn Miller', phone: '555-0115', joinDate: daysAgo(50), membershipType: 'Mensual', lastPaymentDate: daysAgo(28), avatar: `https://placehold.co/100x100.png`, status: 'active', levelId: 'level-2' },
  // ~1 month ago
  { id: 'stu-16', name: 'Logan Wilson', phone: '555-0116', joinDate: daysAgo(35), membershipType: 'Mensual', lastPaymentDate: daysAgo(4), avatar: `https://placehold.co/100x100.png`, status: 'active', levelId: 'level-1' },
  { id: 'stu-17', name: 'Harper Moore', phone: '555-0117', joinDate: daysAgo(25), membershipType: 'Diario', lastPaymentDate: daysAgo(6), avatar: `https://placehold.co/100x100.png`, status: 'active' },
  // this month
  { id: 'stu-18', name: 'Jackson Taylor', phone: '555-0118', joinDate: daysAgo(10), membershipType: 'Mensual', lastPaymentDate: daysAgo(10), avatar: `https://placehold.co/100x100.png`, status: 'active' },
];

export const spaces: Space[] = [
  { id: 'space-1', name: 'Sala Sol', capacity: 20, operatingHoursStart: '07:00', operatingHoursEnd: '22:00' },
  { id: 'space-2', name: 'Sala Luna', capacity: 15, operatingHoursStart: '08:00', operatingHoursEnd: '21:00' },
];

export const sessions: Session[] = [
  { id: 'cls-1', instructorId: 'inst-1',ividadId: 'spec-1', spaceId: 'space-1', dayOfWeek: 'Lunes', time: '07:00', sessionType: 'Grupal', personIds: ['stu-1', 'stu-4', 'stu-12', 'stu-18'], waitlistPersonIds: [], levelId: 'level-4' },
  { id: 'cls-2', instructorId: 'inst-1',ividadId: 'spec-2', spaceId: 'space-2', dayOfWeek: 'Martes', time: '09:00', sessionType: 'Grupal', personIds: ['stu-2', 'stu-5', 'stu-6', 'stu-9', 'stu-16'], waitlistPersonIds: [], levelId: 'level-1' },
  { id: 'cls-3', instructorId: 'inst-2',ividadId: 'spec-3', spaceId: 'space-1', dayOfWeek: 'Miércoles', time: '18:00', sessionType: 'Grupal', personIds: ['stu-1', 'stu-3', 'stu-10', 'stu-15'], waitlistPersonIds: [], levelId: 'level-3' },
  { id: 'cls-4', instructorId: 'inst-3',ividadId: 'spec-4', spaceId: 'space-2', dayOfWeek: 'Jueves', time: '19:30', sessionType: 'Grupal', personIds: ['stu-2', 'stu-4', 'stu-7', 'stu-13'], waitlistPersonIds: [], levelId: 'level-2' },
  { id: 'cls-5', instructorId: 'inst-4',ividadId: 'spec-1', spaceId: 'space-1', dayOfWeek: 'Viernes', time: '18:30', sessionType: 'Grupal', personIds: ['stu-5', 'stu-6', 'stu-11', 'stu-17'], waitlistPersonIds: [], levelId: 'level-1' },
  { id: 'cls-6', instructorId: 'inst-3',ividadId: 'spec-5', spaceId: 'space-2', dayOfWeek: 'Sábado', time: '11:00', sessionType: 'Grupal', personIds: ['stu-1', 'stu-2', 'stu-3', 'stu-4', 'stu-8', 'stu-14'], waitlistPersonIds: [], levelId: 'level-4' },
];

export const payments: Payment[] = [
  // Payments corresponding to lastPaymentDate for each person
  { id: 'pay-1', personId: 'stu-1', date: daysAgo(25), months: 1 },
  { id: 'pay-2', personId: 'stu-2', date: daysAgo(15), months: 1 },
  { id: 'pay-3', personId: 'stu-3', date: daysAgo(5), months: 1 },
  { id: 'pay-4', personId: 'stu-4', date: daysAgo(10), months: 1 },
  { id: 'pay-5', personId: 'stu-5', date: daysAgo(2), months: 1 },
  { id: 'pay-6', personId: 'stu-6', date: daysAgo(29), months: 1 },
  { id: 'pay-7', personId: 'stu-1', date: daysAgo(55), months: 1 },
  { id: 'pay-8', personId: 'stu-2', date: daysAgo(75), months: 1 },
  { id: 'pay-9', personId: 'stu-7', date: daysAgo(20), months: 1 },
  { id: 'pay-10', personId: 'stu-8', date: daysAgo(8), months: 1 },
  { id: 'pay-11', personId: 'stu-9', date: daysAgo(5), months: 1 },
  { id: 'pay-12', personId: 'stu-10', date: daysAgo(22), months: 1 },
  { id: 'pay-13', personId: 'stu-11', date: daysAgo(1), months: 1 },
  { id: 'pay-14', personId: 'stu-12', date: daysAgo(12), months: 1 },
  { id: 'pay-15', personId: 'stu-13', date: daysAgo(18), months: 1 },
  { id: 'pay-16', personId: 'stu-14', date: daysAgo(3), months: 1 },
  { id: 'pay-17', personId: 'stu-15', date: daysAgo(28), months: 1 },
  { id: 'pay-18', personId: 'stu-16', date: daysAgo(4), months: 1 },
  { id: 'pay-19', personId: 'stu-17', date: daysAgo(6), months: 1 },
  { id: 'pay-20', personId: 'stu-18', date: daysAgo(10), months: 1 },
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
    
