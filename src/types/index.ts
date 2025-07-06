

export type LoginCredentials = {
  email: string;
  password: string;
};

export type Institute = {
  id: string;
  name: string;
  ownerId: string;
};

export type Actividad = {
  id: string;
  name: string;
};

export type Level = {
  id: string;
  name: string;
};

export type Specialist = {
  id: string;
  name: string;
  phone: string;
  actividadIds: string[];
  avatar: string;
};

export type VacationPeriod = {
  id: string;
  startDate: Date;
  endDate: Date;
};

export type Person = {
  id: string;
  name: string;
  phone: string;
  joinDate: Date;
  membershipType: 'Mensual' | 'Diario';
  lastPaymentDate: Date;
  avatar: string;
  vacationPeriods?: VacationPeriod[];
  healthInfo?: string;
  levelId?: string;
  notes?: string;
};

export type Session = {
  id: string;
  instructorId: string;
  actividadId: string;
  spaceId: string;
  dayOfWeek: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  time: string; // Format "HH:mm"
  sessionType: 'Grupal' | 'Individual';
  personIds: string[];
  waitlistPersonIds?: string[];
  levelId?: string;
};

export type Payment = {
  id:string;
  personId: string;
  date: Date; // The actual date the payment was recorded
  months: number;
};

export type Space = {
  id: string;
  name: string;
  capacity: number;
  operatingHoursStart?: string; // Format "HH:mm"
  operatingHoursEnd?: string; // Format "HH:mm"
};

export type SessionAttendance = {
  id: string;
  sessionId: string;
  date: string; // YYYY-MM-DD
  presentIds: string[];
  absentIds: string[];
  justifiedAbsenceIds?: string[];
  oneTimeAttendees?: string[]; // People added just for this day for a specific reason (e.g., recovery)
};

export type AppNotification = {
  id: string;
  type: 'waitlist' | 'churnRisk';
  sessionId?: string;
  personId: string; // The person from the waitlist or at risk
  createdAt: string; // ISO string
};

export type Tariff = {
  id: string;
  name: string;
  price: number;
  description?: string;
  frequency?: number;
  isIndividual?: boolean;
};
    
