

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Person, Tariff } from "@/types";
import { set, isBefore, addMonths, addDays, isAfter, differenceInDays, format, getDate, getDaysInMonth, startOfDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates the next payment date based on a starting date and a tariff's payment cycle.
 * It correctly handles monthly cycles by anchoring to the original join date's day.
 * @param fromDate The date to calculate from (e.g., the current expiry date or today).
 * @param joinDate The original date the person joined, used to anchor the day of the month for monthly cycles. (Optional)
 * @param tariff The tariff object, which may contain a paymentCycle property.
 * @returns The new calculated payment date.
 */
export function calculateNextPaymentDate(fromDate: Date, joinDate: Date | null | undefined, tariff: Tariff): Date {
  const cycle = tariff.paymentCycle || 'monthly';

  switch (cycle) {
    case 'weekly':
      return addDays(fromDate, 7);
    case 'biweekly':
      return addDays(fromDate, 14);
    case 'bimonthly':
      return addMonths(fromDate, 2);
    case 'monthly':
    default:
      // Always calculate from the *previous* due date to maintain the payment day.
      const fromDateInFuture = addMonths(fromDate, 1);
      
      // Use the join date to anchor the day of the month.
      const anchorDate = joinDate || fromDate;
      let targetDay = getDate(anchorDate);
      
      const daysInNewMonth = getDaysInMonth(fromDateInFuture);
      
      // If the target day is greater than the number of days in the new month (e.g., joining on 31st, next month is Feb),
      // set it to the last day of that month.
      if (targetDay > daysInNewMonth) {
        targetDay = daysInNewMonth;
      }
      return set(fromDateInFuture, { date: targetDay });
  }
}


export type PaymentStatus = {
  status: 'Al día' | 'Atrasado' | 'Pendiente de Pago';
  daysOverdue?: number;
};

export function getStudentPaymentStatus(person: Person, referenceDate: Date): PaymentStatus {
  const nextDueDate = person.lastPaymentDate;
  
  if (!nextDueDate) {
    return { status: 'Pendiente de Pago' };
  }
  
  if (!(nextDueDate instanceof Date) || isNaN(nextDueDate.getTime())) {
    console.warn(`Invalid 'lastPaymentDate' for person ${person.id}:`, nextDueDate);
    return { status: 'Atrasado', daysOverdue: 999 };
  }
  
  const today = startOfDay(referenceDate);
  const dueDateAtStartOfDay = startOfDay(nextDueDate);

  // A person is overdue if today is AT or AFTER the due date.
  const isOverdue = !isBefore(today, dueDateAtStartOfDay);
  
  if (isOverdue) {
    const daysOverdue = differenceInDays(today, dueDateAtStartOfDay);
    return { status: 'Atrasado', daysOverdue: Math.max(0, daysOverdue) }; // Ensure it's not negative if paid on the same day
  }
  
  return { status: 'Al día' };
}


/**
 * Exports an array of objects to a CSV file.
 * @param filename - The desired name for the CSV file.
 * @param data - An array of objects to export.
 * @param headers - An object mapping data keys to user-friendly column headers.
 */
export function exportToCsv(filename: string, data: Record<string, any>[], headers: Record<string, string>) {
  if (!data || data.length === 0) {
    console.warn("No data provided to export.");
    return;
  }

  const separator = ',';
  const headerKeys = Object.keys(headers);
  const headerValues = Object.values(headers);

  const csvRows = [
    headerValues.join(separator),
    ...data.map(row =>
      headerKeys
        .map(key => {
          let cell = row[key] === null || row[key] === undefined ? '' : row[key];

          if (cell instanceof Date) {
            cell = format(cell, 'dd/MM/yyyy');
          }

          let cellString = String(cell);
          // Escape double quotes by doubling them
          cellString = cellString.replace(/"/g, '""');
          
          // If the cell contains a comma, a newline, or a double quote, wrap it in double quotes
          if (cellString.search(/("|,|\n)/g) >= 0) {
            cellString = `"${cellString}"`;
          }
          return cellString;
        })
        .join(separator)
    ),
  ];
  
  const csvContent = csvRows.join('\n');

  // Add BOM for Excel compatibility with UTF-8
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
