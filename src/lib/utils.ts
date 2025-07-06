
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Person } from "@/types";
import { set, isBefore, addMonths, isAfter, differenceInDays, addDays } from "date-fns";

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
  let dueDate = set(lastPayment, {
    date: joinDay,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });

  // If payment was made on or after the due day, the next payment is one month after.
  // If payment was made before the due day, the due date is in the same month.
  if (lastPayment.getDate() >= joinDay) {
    dueDate = addMonths(dueDate, 1);
  }

  // Adjust for vacations that overlap with the calculated due date
  const vacations = person.vacationPeriods?.sort((a,b) => a.startDate.getTime() - b.startDate.getTime()) || [];
  for (const vacation of vacations) {
    const vacationStart = set(vacation.startDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
    const vacationEnd = set(vacation.endDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });

    // Check if the due date falls within this vacation period.
    // The range is inclusive: [vacationStart, vacationEnd]
    if (dueDate >= vacationStart && dueDate <= vacationEnd) {
      const vacationDuration = differenceInDays(vacationEnd, vacationStart) + 1;
      dueDate = addDays(dueDate, vacationDuration);
    }
  }

  return dueDate;
}

// This function checks if a person's payment is up-to-date.
export function getStudentPaymentStatus(person: Person, referenceDate: Date): 'Al día' | 'Atrasado' {
  if (person.membershipType === 'Diario') {
    return 'Al día';
  }

  const nextDueDate = getNextPaymentDate(person);
  if (!nextDueDate) {
    return 'Al día';
  }
  
  const today = set(referenceDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
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
            // Consistently format dates, e.g., "15/07/2024, 10:00:00"
            cell = cell.toLocaleString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            });
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
