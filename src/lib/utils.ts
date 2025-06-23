import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Student } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStudentPaymentStatus(student: Student): 'Al día' | 'Atrasado' {
  if (student.membershipType === 'Diario') {
    return 'Al día';
  }
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return student.lastPaymentDate < thirtyDaysAgo ? 'Atrasado' : 'Al día';
}
