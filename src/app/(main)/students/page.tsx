'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Student } from '@/types';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useStudio } from '@/context/StudioContext';
import { getStudentPaymentStatus } from '@/lib/utils';
import { format } from 'date-fns';

export default function StudentsPage() {
  const { students } = useStudio();

  const getPaymentStatusBadge = (student: Student) => {
    const status = getStudentPaymentStatus(student);
    if (status === 'Al día') {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Al día</Badge>;
    }
    return <Badge variant="destructive">Atrasado</Badge>;
  };

  return (
    <div>
      <PageHeader title="Asistentes" description="Gestiona los perfiles de los asistentes y el estado de los pagos." />
      
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Membresía</TableHead>
              <TableHead>Estado del Pago</TableHead>
              <TableHead>Inscrito Desde</TableHead>
              <TableHead><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={student.avatar} alt={student.name} data-ai-hint="person photo"/>
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                     <div className="flex flex-col">
                      <span>{student.name}</span>
                      <span className="text-xs text-muted-foreground">{student.phone}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{student.membershipType}</TableCell>
                <TableCell>{getPaymentStatusBadge(student)}</TableCell>
                <TableCell>{format(student.joinDate, 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Alternar menú</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
