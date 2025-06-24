'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStudio } from '@/context/StudioContext';
import { getStudentPaymentStatus } from '@/lib/utils';
import { Users, ClipboardList, Calendar, CreditCard, Star, Warehouse, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';

const navItems = [
  { href: "/schedule", label: "Horario", description: "Gestionar clases", icon: Calendar },
  { href: "/students", label: "Personas", description: "Gestionar perfiles", icon: Users },
  { href: "/instructors", label: "Especialistas", description: "Gestionar instructores", icon: ClipboardList },
  { href: "/payments", label: "Pagos", description: "Ver historial", icon: CreditCard },
  { href: "/specializations", label: "Actividades", description: "Definir clases", icon: Star },
  { href: "/spaces", label: "Espacios", description: "Definir salas", icon: Warehouse },
  { href: "/assistant", label: "Asistente IA", description: "Optimizar horario", icon: Sparkles },
];


export default function Dashboard() {
  const { people, specialists, yogaClasses, actividades } = useStudio();
  const [todayDayName, setTodayDayName] = useState('');

  useEffect(() => {
    const dayOfWeekMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    setTodayDayName(dayOfWeekMap[new Date().getDay()]);
  }, []);

  const totalPeople = people.length;
  const totalSpecialists = specialists.length;
  
  const upcomingClassesCount = useMemo(() => {
    const dayOfWeekMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const today = new Date();
    let count = 0;

    const currentTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

    for (let i = 0; i < 7; i++) {
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + i);
      const dayName = dayOfWeekMap[futureDate.getDay()];
      
      const classesForDay = yogaClasses.filter(c => c.dayOfWeek === dayName);
      
      if (i === 0) { // It's today, only count future classes
        count += classesForDay.filter(c => c.time > currentTime).length;
      } else { // It's a future day, count all classes
        count += classesForDay.length;
      }
    }
    return count;
  }, [yogaClasses]);

  const overduePayments = people.filter(s => getStudentPaymentStatus(s) === 'Atrasado').length;
  
  const todaysClasses = todayDayName 
    ? yogaClasses
        .filter(cls => cls.dayOfWeek === todayDayName)
        .sort((a, b) => a.time.localeCompare(b.time))
    : [];

  const formatTime = (time: string) => {
    if (!time || !time.includes(':')) return 'N/A';
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const formattedHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
    return `${formattedHour}:${minute} ${ampm}`;
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Panel de control" description="¡Bienvenido de nuevo! Aquí tienes un resumen de tu estudio." />
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div>
        <h2 className="mb-4 text-xl font-bold tracking-tight">Navegación Rápida</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
           {navItems.map((item) => (
             <Link key={item.href} href={item.href} className="block">
              <Card className="flex flex-col items-center justify-center p-6 text-center transition-colors hover:bg-primary/10 h-full">
                <item.icon className="h-8 w-8 mb-3 text-primary" />
                <h3 className="text-base font-semibold">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </Card>
            </Link>
           ))}
        </div>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Clases de Hoy {todayDayName && `(${todayDayName})`}</CardTitle>
          </CardHeader>
          <CardContent>
            {todaysClasses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Clase</TableHead>
                    <TableHead className="hidden sm:table-cell">Especialista</TableHead>
                    <TableHead className="text-right">Inscritos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaysClasses.map((cls) => {
                    const specialist = specialists.find(i => i.id === cls.instructorId);
                    const actividad = actividades.find(s => s.id === cls.actividadId);
                    return (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{formatTime(cls.time)}</TableCell>
                        <TableCell>{actividad?.name || 'N/A'}</TableCell>
                        <TableCell className="hidden sm:table-cell">{specialist?.name || 'N/A'}</TableCell>
                        <TableCell className="text-right">{`${cls.personIds.length} / ${cls.capacity}`}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No hay clases programadas para hoy.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
