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
  status: 'Active' | 'Inactive';
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
  avatar: string;
};

export type YogaClass = {
  id: string;
  name: string;
  instructorId: string;
  specializationId: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  time: string;
  capacity: number;
  studentsEnrolled: number;
};

export type Payment = {
  id: string;
  studentId: string;
  amount: number;
  date: Date;
  status: 'Paid' | 'Pending' | 'Overdue';
};
