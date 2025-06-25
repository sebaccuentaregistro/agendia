import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Person } from "@/types";
import { set, isBefore, addMonths, isAfter } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// This function determines the next billing date based on the last payment.
export function getNextPaymentDate(person: Person): Date | null {
  if (person.membershipType === 'Diario') {
    return null;
  }

  const lastPayment = person.lastPaymentDate;
  const joinDay = person.joinDate.getDate();

  // Determine the due date for the month of the last payment.
  // We reset time to midnight to ensure date-only comparisons are accurate.
  const dueDateInLastPaymentMonth = set(lastPayment, { 
    date: joinDay,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0 
  });

  const lastPaymentDay = set(lastPayment, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });

  // If the last payment was made before the due date in that month, the next due date is that very date.
  if (isBefore(lastPaymentDay, dueDateInLastPaymentMonth)) {
    return dueDateInLastPaymentMonth;
  }
  
  // Otherwise, the next due date is the same day but in the following month.
  return addMonths(dueDateInLastPaymentMonth, 1);
}

// This function checks if a person's payment is up-to-date.
export function getStudentPaymentStatus(person: Person, referenceDate: Date): 'Al día' | 'Atrasado' {
  if (person.membershipType === 'Diario') {
    return 'Al día';
  }

  const nextDueDate = getNextPaymentDate(person);
  if (!nextDueDate) {
    return 'Al día'; // Should not happen for 'Mensual' members
  }
  
  const today = set(referenceDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });

  // A person is considered 'Atrasado' (overdue) if today is strictly after their next due date.
  // If today is the due date, they are still 'Al día'.
  return isAfter(today, nextDueDate) ? 'Atrasado' : 'Al día';
}
