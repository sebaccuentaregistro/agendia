'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStudio } from '@/context/StudioContext';
import { getStudentPaymentStatus, cn } from '@/lib/utils';
import { Users, ClipboardList, Calendar, CreditCard, Star, Warehouse, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';

export default function Dashboard() {
  const { people, specialists, yogaClasses, actividades, spaces } = useStudio();
  const [todayDayName, setTodayDayName] = useState('');

  useEffect(() => {
    const dayOfWeekMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    setTodayDayName(dayOfWeekMap[new Date().getDay()]);
  }, []);

  const totalPeople = people.length;
  const totalSpecialists = specialists.length;
  const totalActividades = actividades.length;
  const totalSpaces = spaces.length;
  
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

  const navItems = [
    { href: "/students", label: "Personas", icon: Users, value: totalPeople },
    { href: "/instructors", label: "Especialistas", icon: ClipboardList, value: totalSpecialists },
    { href: "/schedule", label: "Próximas Clases", icon: Calendar, value: upcomingClassesCount },
    { href: "/students?filter=overdue", label: "Pagos Atrasados", icon: CreditCard, value: overduePayments, isDestructive: true },
    { href: "/specializations", label: "Actividades", icon: Star, value: totalActividades },
    { href: "/spaces", label: "Espacios", icon: Warehouse, value: totalSpaces },
    { href: "/payments", label: "Pagos", icon: CreditCard },
    { href: "/assistant", label: "Asistente IA", icon: Sparkles },
  ];


  return (
    <div className="space-y-8">
      <PageHeader title="Panel de control" description="¡Bienvenido de nuevo! Aquí tienes un resumen de tu estudio." />
      
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="block">
            <Card className={cn("transition-colors h-full flex flex-col justify-between p-4", 
              item.isDestructive ? "bg-destructive/5 hover:bg-destructive/10 border-destructive/20" : "hover:bg-muted/50"
            )}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{item.label}</h3>
                <item.icon className={cn("h-5 w-5 text-muted-foreground", item.isDestructive && "text-destructive")} />
              </div>
              <div className="mt-4">
                {item.value !== undefined ? (
                  <p className={cn("text-3xl font-bold", item.isDestructive && "text-destructive")}>{item.value}</p>
                ) : (
                  <p className="text-3xl font-bold">-</p>
                )}
              </div>
            </Card>
          </Link>
          ))}
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
