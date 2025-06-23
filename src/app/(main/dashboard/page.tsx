'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStudio } from '@/context/StudioContext';
import { getStudentPaymentStatus } from '@/lib/utils';
import { Users, ClipboardList, Calendar, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function Dashboard() {
  const { people, specialists, yogaClasses } = useStudio();

  const totalPeople = people.length;
  const totalSpecialists = specialists.length;
  const upcomingClassesCount = yogaClasses.filter(c => new Date() < new Date(2024, 6, c.dayOfWeek === 'Lunes' ? 22 : 23)).length; // Mock logic
  const overduePayments = people.filter(s => getStudentPaymentStatus(s) === 'Atrasado').length;
  const recentPeople = people.sort((a, b) => b.joinDate.getTime() - a.joinDate.getTime()).slice(0, 5);

  return (
    <div>
      <PageHeader title="Panel de control" description="¡Bienvenido de nuevo! Aquí tienes un resumen de tu estudio." />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Personas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPeople}</div>
            <p className="text-xs text-muted-foreground">+2 desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Especialistas</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSpecialists}</div>
            <p className="text-xs text-muted-foreground">+1 nuevo especialista</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Clases</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingClassesCount}</div>
            <p className="text-xs text-muted-foreground">en los próximos 7 días</p>
          </CardContent>
        </Card>
        <Link href="/students?filter=overdue" className="block">
          <Card className="transition-colors hover:bg-muted/50 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Atrasados</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{overduePayments}</div>
              <p className="text-xs text-muted-foreground">Acción requerida</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Personas Recién Inscritas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-right">Fecha de Inscripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPeople.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell>{person.name}</TableCell>
                    <TableCell>{person.phone}</TableCell>
                    <TableCell className="text-right">{format(person.joinDate, 'dd/MM/yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
