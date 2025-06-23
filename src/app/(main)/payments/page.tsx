'use client';

import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStudio } from '@/context/StudioContext';
import { format } from 'date-fns';

export default function PaymentsPage() {
  const { payments, students } = useStudio();

  const getStudentName = (studentId: string): string => {
    return students.find(s => s.id === studentId)?.name || 'Asistente Desconocido';
  };

  return (
    <div>
      <PageHeader title="Historial de Pagos" description="Un registro de todas las transacciones de pago de los asistentes." />
      
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asistente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Fecha de Pago</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{getStudentName(payment.studentId)}</TableCell>
                <TableCell>${payment.amount.toFixed(2)}</TableCell>
                <TableCell>{format(payment.date, 'dd/MM/yyyy')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
