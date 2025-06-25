import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Person } from "@/types";
import { differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStudentPaymentStatus(person: Person, referenceDate: Date): 'Al día' | 'Atrasado' {
  if (person.membershipType === 'Diario') {
    return 'Al día';
  }
  
  // Logic for 'Mensual'
  const lastPayment = new Date(person.lastPaymentDate);
  const today = new Date(referenceDate);
  
  // Calculates the number of full days between the two dates.
  const daysSinceLastPayment = differenceInDays(today, lastPayment);

  // If more than 30 days have passed, the payment is overdue.
  return daysSinceLastPayment > 30 ? 'Atrasado' : 'Al día';
}
