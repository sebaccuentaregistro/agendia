

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
  id:string;
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
  startDate: Date | null;
  endDate: Date | null;
};

export type Person = {
  id: string;
  name: string;
  phone: string;
  joinDate: Date | null;
  tariffId?: string;
  lastPaymentDate: Date | null;
  avatar: string;
  vacationPeriods?: VacationPeriod[];
  healthInfo?: string;
  levelId?: string;
  notes?: string;
  paymentHistory?: string[]; // Array of payment IDs
};

export type NewPersonData = {
    name: string;
    phone: string;
    tariffId: string;
    levelId?: string;
    healthInfo?: string;
    notes?: string;
    joinDate: Date;
    altaType: 'nuevo' | 'migracion';
    monthsOwed?: number;
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
  date: Date | null; // The actual date the payment was recorded
  amount: number;
  tariffId: string;
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
  createdAt: Date | null; // ISO string
};

export type Tariff = {
  id: string;
  name: string;
  price: number;
  description?: string;
  frequency?: number;
  isIndividual?: boolean;
};
