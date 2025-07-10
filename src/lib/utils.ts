
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Person } from "@/types";
import { set, isBefore, addMonths, isAfter, differenceInDays, addDays, format, getDate, getDaysInMonth } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates the next payment date based on a starting date and the original join date.
 * This ensures the billing day of the month remains consistent.
 * @param fromDate The date to calculate from (e.g., the current expiry date or today).
 * @param joinDate The original date the person joined, used to anchor the day of the month.
 * @param monthsToAdd The number of months to add (can be negative to go back).
 * @returns The new calculated payment date.
 */
export function calculateNextPaymentDate(fromDate: Date, joinDate: Date, monthsToAdd: number = 1): Date {
  const fromDateInFuture = addMonths(fromDate, monthsToAdd);
  let targetDay = getDate(joinDate);
  const daysInNewMonth = getDaysInMonth(fromDateInFuture);

  // If the join day is, e.g., the 31st, and the next month only has 30 days,
  // we should use the last day of that month.
  if (targetDay > daysInNewMonth) {
    targetDay = daysInNewMonth;
  }

  return set(fromDateInFuture, { date: targetDay });
}

// This function checks if a person's payment is up-to-date.
export function getStudentPaymentStatus(person: Person, referenceDate: Date): 'Al día' | 'Atrasado' {
  const nextDueDate = person.lastPaymentDate;
  
  if (!nextDueDate) {
    return 'Al día';
  }
  
  if (!(nextDueDate instanceof Date) || isNaN(nextDueDate.getTime())) {
    console.warn(`Invalid 'lastPaymentDate' for person ${person.id}:`, nextDueDate);
    return 'Atrasado';
  }
  
  const today = set(referenceDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
  const isOverdue = isAfter(today, nextDueDate);
  const hasDebt = (person.paymentBalance || 0) < 0;

  if (isOverdue && !hasDebt) {
    // Their date has passed, but they have no debt, so they are overdue by time.
    return 'Atrasado';
  }
  if (hasDebt) {
    // If they have a negative balance, they are always overdue.
    return 'Atrasado';
  }
  
  return 'Al día';
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
