
import type { Person, Specialist, Actividad, Session, Payment, Space, SessionAttendance, AppNotification, Tariff, Level } from '@/types';

// This file contains initial data for the application.
// Most of the demo data has been cleared to provide a clean start.

// Use a fixed reference date to make initial data deterministic
const refDate = new Date('2024-07-15T10:00:00Z');

// Demo data has been cleared to allow for a fresh start.
// You can add your own default data here if needed.
export const actividades: Actividad[] = [];
export const specialists: Specialist[] = [];
export const people: Person[] = [];
export const spaces: Space[] = [];
export const sessions: Session[] = [];
export const payments: Payment[] = [];
export const attendance: SessionAttendance[] = [];
export const notifications: AppNotification[] = [];


// It's useful to keep some base data like Tariffs and Levels.
export const levels: Level[] = [
  { id: 'level-1', name: 'Principiante' },
  { id: 'level-2', name: 'Intermedio' },
  { id: 'level-3', name: 'Avanzado' },
  { id: 'level-4', name: 'Multinivel' },
];

export const tariffs: Tariff[] = [
  { id: 'tariff-1', name: 'Clase Suelta', price: 2500, description: 'Valor por una única clase (drop-in).' },
  { id: 'tariff-2', name: '1 vez por semana', price: 8000, description: 'Plan mensual.', frequency: 1 },
  { id: 'tariff-3', name: '2 veces por semana', price: 12000, description: 'Plan mensual.', frequency: 2 },
  { id: 'tariff-4', name: '3 veces por semana', price: 15000, description: 'Plan mensual.', frequency: 3 },
  { id: 'tariff-5', name: 'Pase Libre', price: 18000, description: 'Acceso ilimitado a clases grupales.', frequency: 5 },
];
