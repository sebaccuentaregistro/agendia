
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Person } from "@/types";
import { set, isBefore, addMonths, isAfter, differenceInDays, addDays, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// This function determines the next billing date based on the last payment.
export function getNextPaymentDate(person: Person): Date | null {
  // The 'lastPaymentDate' field now stores the date the membership is valid until.
  // This date is effectively the next payment date.
  return person.lastPaymentDate;
}

// This function checks if a person's payment is up-to-date.
export function getStudentPaymentStatus(person: Person, referenceDate: Date): 'Al día' | 'Atrasado' {
  const nextDueDate = getNextPaymentDate(person);
  
  // A person needs a due date to have a status. If not, they are up to date by default.
  if (!nextDueDate) {
    return 'Al día';
  }
  
  // Defensive check for invalid date formats that might have slipped through
  if (!(nextDueDate instanceof Date) || isNaN(nextDueDate.getTime())) {
    console.warn(`Invalid 'lastPaymentDate' for person ${person.id}:`, nextDueDate);
    return 'Atrasado'; // Default to overdue if date is invalid to be safe
  }
  
  const today = set(referenceDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
  // We consider the payment overdue if today is strictly after the due date.
  return isAfter(today, nextDueDate) ? 'Atrasado' : 'Al día';
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
