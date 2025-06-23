import type { Student, Instructor, Specialization, YogaClass, Payment } from '@/types';

export const specializations: Specialization[] = [
  { id: 'spec-1', name: 'Vinyasa Flow', description: 'Dynamic, flowing sequences of poses.' },
  { id: 'spec-2', name: 'Hatha Yoga', description: 'A gentle introduction to basic yoga postures.' },
  { id: 'spec-3', name: 'Ashtanga Yoga', description: 'A challenging, fast-paced series of postures.' },
  { id: 'spec-4', name: 'Yin Yoga', description: 'Slow-paced style with asanas held for longer periods.' },
  { id: 'spec-5', name: 'Restorative Yoga', description: 'Focuses on relaxation and healing.' },
];

export const instructors: Instructor[] = [
  { id: 'inst-1', name: 'Elena Santos', email: 'elena.s@example.com', phone: '123-456-7890', specializationIds: ['spec-1', 'spec-2'], avatar: `https://placehold.co/100x100.png` },
  { id: 'inst-2', name: 'Marcus Chen', email: 'marcus.c@example.com', phone: '234-567-8901', specializationIds: ['spec-3'], avatar: `https://placehold.co/100x100.png` },
  { id: 'inst-3', name: 'Aisha Khan', email: 'aisha.k@example.com', phone: '345-678-9012', specializationIds: ['spec-4', 'spec-5'], avatar: `https://placehold.co/100x100.png` },
  { id: 'inst-4', name: 'David Miller', email: 'david.m@example.com', phone: '456-789-0123', specializationIds: ['spec-1', 'spec-4'], avatar: `https://placehold.co/100x100.png` },
];

export const students: Student[] = [
  { id: 'stu-1', name: 'Sophia Loren', email: 'sophia.l@example.com', joinDate: new Date('2023-01-15'), status: 'Active', paymentStatus: 'Paid', avatar: `https://placehold.co/100x100.png` },
  { id: 'stu-2', name: 'Liam Gallagher', email: 'liam.g@example.com', joinDate: new Date('2023-02-20'), status: 'Active', paymentStatus: 'Overdue', avatar: `https://placehold.co/100x100.png` },
  { id: 'stu-3', name: 'Chloe Kim', email: 'chloe.k@example.com', joinDate: new Date('2023-03-10'), status: 'Inactive', paymentStatus: 'Paid', avatar: `https://placehold.co/100x100.png` },
  { id: 'stu-4', name: 'Benjamin Carter', email: 'ben.c@example.com', joinDate: new Date('2023-04-05'), status: 'Active', paymentStatus: 'Pending', avatar: `https://placehold.co/100x100.png` },
  { id: 'stu-5', name: 'Olivia Martinez', email: 'olivia.m@example.com', joinDate: new Date('2023-05-22'), status: 'Active', paymentStatus: 'Paid', avatar: `https://placehold.co/100x100.png` },
  { id: 'stu-6', name: 'Noah Rodriguez', email: 'noah.r@example.com', joinDate: new Date('2023-06-30'), status: 'Active', paymentStatus: 'Paid', avatar: `https://placehold.co/100x100.png` },
];

export const yogaClasses: YogaClass[] = [
  { id: 'cls-1', name: 'Morning Vinyasa', instructorId: 'inst-1', specializationId: 'spec-1', dayOfWeek: 'Monday', time: '07:00 AM', capacity: 15, studentsEnrolled: 12 },
  { id: 'cls-2', name: 'Gentle Hatha', instructorId: 'inst-1', specializationId: 'spec-2', dayOfWeek: 'Tuesday', time: '09:00 AM', capacity: 20, studentsEnrolled: 18 },
  { id: 'cls-3', name: 'Power Ashtanga', instructorId: 'inst-2', specializationId: 'spec-3', dayOfWeek: 'Wednesday', time: '06:00 PM', capacity: 12, studentsEnrolled: 12 },
  { id: 'cls-4', name: 'Deep Stretch Yin', instructorId: 'inst-3', specializationId: 'spec-4', dayOfWeek: 'Thursday', time: '07:30 PM', capacity: 18, studentsEnrolled: 15 },
  { id: 'cls-5', name: 'Evening Flow', instructorId: 'inst-4', specializationId: 'spec-1', dayOfWeek: 'Friday', time: '06:30 PM', capacity: 15, studentsEnrolled: 10 },
  { id: 'cls-6', name: 'Weekend Restore', instructorId: 'inst-3', specializationId: 'spec-5', dayOfWeek: 'Saturday', time: '11:00 AM', capacity: 20, studentsEnrolled: 14 },
];

export const payments: Payment[] = students.map((student, index) => ({
  id: `pay-${index + 1}`,
  studentId: student.id,
  amount: 95.00,
  date: new Date(new Date(student.joinDate).setDate(new Date(student.joinDate).getDate() + 30 * index)),
  status: student.paymentStatus,
}));
