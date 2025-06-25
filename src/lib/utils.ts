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

  // The next due date is always the next occurrence of the join day of the month,
  // calculated from the month of the last payment.
  // This correctly handles advance and late payments, anchoring the billing cycle
  // to the original join day.

  // 1. Get the date of the last payment.
  const lastPayment = person.lastPaymentDate;
  
  // 2. Get the original day of the month for billing (e.g., the 15th).
  const joinDay = person.joinDate.getDate();

  // 3. Determine the anchor due date in the same month as the last payment,
  //    and reset the time to midnight for accurate comparisons.
  //    e.g., if last payment was August 10th and join day is 15th, this will be August 15th.
  //    e.g., if last payment was August 20th and join day is 15th, this will be August 15th.
  const baseDueDate = set(lastPayment, { 
    date: joinDay,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0 
  });
  
  // 4. The next payment is due one month after this base date.
  //    This works whether the payment was early or late.
  //    e.g., Paid Aug 10 -> base is Aug 15 -> next is Sep 15.
  //    e.g., Paid Aug 20 -> base is Aug 15 -> next is Sep 15.
  return addMonths(baseDueDate, 1);
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
