export type Actividad = {
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

export type Person = {
  id: string;
  name: string;
  phone: string;
  joinDate: Date;
  membershipType: 'Mensual' | 'Diario';
  lastPaymentDate: Date;
  avatar: string;
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
};

export type Payment = {
  id: string;
  personId: string;
  date: Date;
};

export type Space = {
  id: string;
  name: string;
  capacity: number;
};
