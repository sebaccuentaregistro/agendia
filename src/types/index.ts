

export type RecoveryCredit = {
  id: string;
  reason: 'justified_absence' | 'class_cancellation' | 'manual_grant';
  grantedAt: Date;
  expiresAt: Date;
  status: 'available' | 'used' | 'expired';
  originalSessionId?: string; 
  originalSessionDate?: string; 
  usedInSessionId?: string;
  usedOnDate?: string;
  cancellationId?: string; // NUEVO: Vincula el crédito a un evento de cancelación específico
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type SignupCredentials = {
  instituteName: string;
  email: string;
  password: string;
  ownerPin: string;
  recoveryEmail: string;
}

export type UserProfile = {
  instituteId: string;
  status: 'active' | 'pending';
  email: string;
  isSuperAdmin?: boolean;
};

export type Institute = {
  id: string;
  name: string;
  ownerId: string;
  ownerPin?: string;
  recoveryEmail?: string;
  createdAt: Date | null;
  peopleCount?: number;
  sessionsCount?: number;
  actividadesCount?: number;
  lastActivity?: Date | null;
  paymentStatus?: 'pagado' | 'pendiente' | 'vencido';
  nextDueDate?: Date | null;
  planType?: 'esencial' | 'plus' | 'premium'; // NUEVO
  studentLimit?: number; // NUEVO
};

export type Operator = {
  id: string;
  name: string;
  pin: string;
  role: 'admin' | 'staff';
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
  startDate: Date;
  endDate: Date;
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
  recoveryCredits?: RecoveryCredit[];
  healthInfo?: string;
  levelId?: string;
  notes?: string;
  outstandingPayments?: number;
  status?: 'active' | 'inactive';
  inactiveDate?: Date | null;
};

export type NewPersonData = {
    name: string;
    phone: string;
    tariffId: string;
    levelId?: string;
    healthInfo?: string;
    notes?: string;
    joinDate?: Date;
    lastPaymentDate: Date | null;
    paymentOption: 'recordNow' | 'setManually' | 'pending';
    outstandingPayments?: number;
};

export type WaitlistProspect = {
    name: string;
    phone: string;
    isProspect: true;
};

export type WaitlistEntry = string | WaitlistProspect;

export type Session = {
  id: string;
  instructorId: string;
  actividadId: string;
  spaceId: string;
  dayOfWeek: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  time: string; // Format "HH:mm"
  personIds: string[];
  waitlist: WaitlistEntry[];
  levelId?: string;
};

export type Payment = {
  id:string;
  personId: string;
  date: Date | null; // The actual date the payment was recorded
  amount: number;
  tariffId: string;
  createdAt: Date | null;
  timestamp?: Date;
};

export type PaymentStatusInfo = {
  status: 'Al día' | 'Atrasado' | 'Pendiente de Pago' | 'Próximo a Vencer';
  daysOverdue?: number;
  daysUntilDue?: number;
};

export type PaymentReminderInfo = {
  person: Person;
  dueDate: Date;
  daysUntilDue: number;
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
  status?: 'active' | 'cancelled';
  cancellationId?: string; // NUEVO: ID único para el evento de cancelación
};

export type AppNotification = {
  id: string;
  type: 'waitlist' | 'churnRisk';
  sessionId?: string;
  personId?: string; // The person from the waitlist or at risk
  prospectDetails?: WaitlistProspect;
  createdAt: Date | null;
};

export type Tariff = {
  id: string;
  name: string;
  price: number;
  description?: string;
  frequency?: number;
  paymentCycle?: 'weekly' | 'biweekly' | 'monthly' | 'bimonthly';
};

export type AuditLog = {
    id?: string;
    operatorId: string;
    operatorName: string;
    action: string; // e.g., 'REGISTRO_PAGO', 'ELIMINAR_PERSONA'
    entityType: 'persona' | 'pago' | 'clase' | 'asistencia' | 'sistema'; // The type of entity affected
    entityId?: string; // ID of the person, payment, etc.
    entityName?: string; // Name of the person, class, etc. for quick display
    timestamp: Date;
    details?: Record<string, any>; // e.g., { amount: 8000, tariffName: 'Plan Mensual' }
};
