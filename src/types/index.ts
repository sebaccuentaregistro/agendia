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

export type Student = {
  id: string;
  name: string;
  phone: string;
  joinDate: Date;
  membershipType: 'Mensual' | 'Diario';
  lastPaymentDate: Date;
  avatar: string;
};

export type YogaClass = {
  id: string;
  name: string;
  instructorId: string;
  actividadId: string;
  spaceId: string;
  dayOfWeek: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  time: string;
  capacity: number;
  studentsEnrolled: number;
};

export type Payment = {
  id: string;
  studentId: string;
  amount: number;
  date: Date;
};

export type Space = {
  id: string;
  name: string;
};
