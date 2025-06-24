import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Person } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStudentPaymentStatus(person: Person, referenceDate: Date): 'Al día' | 'Atrasado' {
  if (person.membershipType === 'Diario') {
    return 'Al día';
  }
  
  // Logic for 'Mensual'
  const now = new Date(referenceDate);
  now.setHours(0, 0, 0, 0); // Normalize to start of day

  const lastPaymentDate = new Date(person.lastPaymentDate);
  lastPaymentDate.setHours(0, 0, 0, 0); // Normalize

  const joinDate = person.joinDate;
  const dueDayOfMonth = joinDate.getDate();

  // Determine the most recent due date that has passed
  let lastDueDate = new Date(now.getFullYear(), now.getMonth(), dueDayOfMonth);
  lastDueDate.setHours(0,0,0,0);

  if (now < lastDueDate) {
    // If today is before this month's due date, the last due date was last month.
    lastDueDate.setMonth(lastDueDate.getMonth() - 1);
  }

  // If the last payment was made before the last due date, they are overdue.
  return lastPaymentDate < lastDueDate ? 'Atrasado' : 'Al día';
}
