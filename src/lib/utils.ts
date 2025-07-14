import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Person } from "@/types";
import { set, isBefore, addMonths, isAfter, differenceInDays, addDays, format, getDate, getDaysInMonth } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates the next payment date based on a starting date.
 * If the original join date is provided, it tries to maintain the same day of the month.
 * @param fromDate The date to calculate from (e.g., the current expiry date or today).
 * @param joinDate The original date the person joined, used to anchor the day of the month. (Optional)
 * @param monthsToAdd The number of months to add (can be negative to go back).
 * @returns The new calculated payment date.
 */
export function calculateNextPaymentDate(fromDate: Date, joinDate?: Date | null, monthsToAdd: number = 1): Date {
  const fromDateInFuture = addMonths(fromDate, monthsToAdd);
  
  if (joinDate) {
    let targetDay = getDate(joinDate);
    const daysInNewMonth = getDaysInMonth(fromDateInFuture);

    if (targetDay > daysInNewMonth) {
      targetDay = daysInNewMonth;
    }
    return set(fromDateInFuture, { date: targetDay });
  }

  // If no join date, just add the months
  return fromDateInFuture;
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
  
  const today = set(referenceDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });

  const isOverdue = isAfter(today, nextDueDate) && (person.paymentBalance ?? 0) <= 0;
  
  if (isOverdue) {
    const daysOverdue = differenceInDays(today, nextDueDate);
    return { status: 'Atrasado', daysOverdue };
  }
  
  if ((person.paymentBalance ?? 0) < 0) {
    return { status: 'Atrasado', daysOverdue: 0 };
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
