export type Specialization = {
  id: string;
  name: string;
  description: string;
};

export type Instructor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  specializationIds: string[];
  avatar: string;
};

export type Student = {
  id: string;
  name: string;
  email: string;
  joinDate: Date;
  status: 'Activo' | 'Inactivo';
  paymentStatus: 'Pagado' | 'Pendiente' | 'Atrasado';
  avatar: string;
};

export type YogaClass = {
  id: string;
  name: string;
  instructorId: string;
  specializationId: string;
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
  status: 'Pagado' | 'Pendiente' | 'Atrasado';
};
