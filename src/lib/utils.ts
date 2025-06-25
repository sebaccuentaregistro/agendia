import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Person } from "@/types";
import { set, isBefore, subMonths, addMonths } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStudentPaymentStatus(person: Person, referenceDate: Date): 'Al día' | 'Atrasado' {
  if (person.membershipType === 'Diario') {
    return 'Al día';
  }

  // Logic for 'Mensual'
  const today = referenceDate;
  const lastPayment = person.lastPaymentDate;
  const joinDay = person.joinDate.getDate();

  // Determine the due date for the current month.
  let currentMonthDueDate = set(today, { date: joinDay });

  let mostRecentDueDate;
  if (isBefore(today, currentMonthDueDate)) {
    // If we haven't reached this month's due date yet, the last due date was last month.
    mostRecentDueDate = subMonths(currentMonthDueDate, 1);
  } else {
    // Otherwise, the due date for this month is the most recent one.
    mostRecentDueDate = currentMonthDueDate;
  }
  
  // A person is overdue if their last payment was before their most recent due date.
  const lastPaymentDay = set(lastPayment, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
  const dueDateDay = set(mostRecentDueDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
  
  return isBefore(lastPaymentDay, dueDateDay) ? 'Atrasado' : 'Al día';
}

export function getNextPaymentDate(person: Person): Date | null {
  if (person.membershipType === 'Diario') {
    return null;
  }

  const lastPayment = person.lastPaymentDate;
  const joinDay = person.joinDate.getDate();

  // The potential due date in the same month as the last payment.
  const potentialDueDateInMonthOfLastPayment = set(lastPayment, { date: joinDay });
  
  // If the last payment was made on or after the due date for that month, the next payment is next month.
  // We compare just the dates, ignoring time.
  const lastPaymentDay = set(lastPayment, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });

  if (isBefore(lastPaymentDay, potentialDueDateInMonthOfLastPayment)) {
    // Example: Joined on 15th. Last paid June 10th. Next payment is June 15th.
    return potentialDueDateInMonthOfLastPayment;
  } else {
    // Example: Joined on 15th. Last paid June 15th (or June 20th). Next payment is July 15th.
    return addMonths(potentialDueDateInMonthOfLastPayment, 1);
  }
}
