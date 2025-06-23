'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStudio } from '@/context/StudioContext';
import { format } from 'date-fns';

export default function PaymentsPage() {
  const { payments, people } = useStudio();
  const [searchTerm, setSearchTerm] = useState('');

  const getPersonName = (personId: string): string => {
    return people.find(p => p.id === personId)?.name || 'Persona Desconocida';
  };

  const sortedPayments = [...payments].sort((a, b) => b.date.getTime() - a.date.getTime());

  const filteredPayments = searchTerm
    ? sortedPayments.filter(payment => {
        const personName = getPersonName(payment.studentId).toLowerCase();
        return personName.includes(searchTerm.toLowerCase());
      })
    : sortedPayments;

  return (
    <div>
      <PageHeader title="Historial de Pagos" description="Un registro de todas las transacciones de pago de las personas.">
        <div className="w-full max-w-sm">
          <Input 
            placeholder="Buscar por nombre de persona..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </PageHeader>
      
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Persona</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Fecha de Pago</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length > 0 ? (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{getPersonName(payment.studentId)}</TableCell>
                  <TableCell>${payment.amount.toFixed(2)}</TableCell>
                  <TableCell>{format(payment.date, 'dd/MM/yyyy')}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No se encontraron pagos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
