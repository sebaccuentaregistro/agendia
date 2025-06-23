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
  paymentStatus: 'Al día' | 'Pendiente' | 'Atrasado';
  avatar: string;
};

export type YogaClass = {
  id: string;
  name: string;
  instructorId: string;
  actividadId: string;
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
  status: 'Al día' | 'Pendiente' | 'Atrasado';
};
