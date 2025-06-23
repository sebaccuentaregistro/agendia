'use client';

import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStudio } from '@/context/StudioContext';
import { Payment } from '@/types';
import { Badge } from '@/components/ui/badge';

export default function PaymentsPage() {
  const { payments, students } = useStudio();

  const getStudentName = (studentId: string): string => {
    return students.find(s => s.id === studentId)?.name || 'Estudiante Desconocido';
  };

  const getBadgeVariant = (status: Payment['status']) => {
    switch (status) {
      case 'Pagado':
        return 'default';
      case 'Pendiente':
        return 'secondary';
      case 'Atrasado':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div>
      <PageHeader title="Pagos" description="Realiza un seguimiento de los pagos de los estudiantes y gestiona los saldos pendientes." />
      
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estudiante</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{getStudentName(payment.studentId)}</TableCell>
                <TableCell>${payment.amount.toFixed(2)}</TableCell>
                <TableCell>{payment.date.toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(payment.status)}>{payment.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
