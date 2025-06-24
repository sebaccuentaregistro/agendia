'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStudio } from '@/context/StudioContext';
import { getStudentPaymentStatus, cn } from '@/lib/utils';
import { Users, ClipboardList, Calendar, CreditCard, Star, Warehouse, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { people, specialists, yogaClasses, actividades, spaces } = useStudio();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const todayDayName = useMemo(() => {
    if (!isMounted) return '';
    const dayOfWeekMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dayOfWeekMap[new Date().getDay()];
  }, [isMounted]);
  
  const navItems = useMemo(() => {
    if (!isMounted) {
      const skeletonItems = [
        { href: "/students", label: "Personas", icon: Users },
        { href: "/instructors", label: "Especialistas", icon: ClipboardList },
        { href: "/schedule", label: "Horarios", icon: Calendar },
        { href: "/students?filter=overdue", label: "Pagos Atrasados", icon: CreditCard },
        { href: "/specializations", label: "Actividades", icon: Star },
        { href: "/spaces", label: "Espacios", icon: Warehouse },
        { href: "/assistant", label: "Estadísticas", icon: BarChart3 },
      ];
      return skeletonItems.map(item => ({...item, value: undefined, isSuccess: false, isDestructive: false}));
    }

    const totalPeople = people.length;
    const totalSpecialists = specialists.length;
    const totalActividades = actividades.length;
    const totalSpaces = spaces.length;
    
    const upcomingClassesCount = (() => {
      const dayOfWeekMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const today = new Date();
      let count = 0;
      const currentTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
      for (let i = 0; i < 7; i++) {
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + i);
        const dayName = dayOfWeekMap[futureDate.getDay()];
        const classesForDay = yogaClasses.filter(c => c.dayOfWeek === dayName);
        if (i === 0) {
          count += classesForDay.filter(c => c.time > currentTime).length;
        } else {
          count += classesForDay.length;
        }
      }
      return count;
    })();

    const overduePayments = people.filter(s => getStudentPaymentStatus(s) === 'Atrasado').length;

    return [
      { href: "/students", label: "Personas", icon: Users, value: totalPeople },
      { href: "/instructors", label: "Especialistas", icon: ClipboardList, value: totalSpecialists },
      { href: "/schedule", label: "Horarios", icon: Calendar, value: upcomingClassesCount },
      { 
        href: "/students?filter=overdue", 
        label: "Pagos Atrasados", 
        icon: CreditCard, 
        value: overduePayments, 
        isDestructive: overduePayments > 0,
        isSuccess: overduePayments === 0
      },
      { href: "/specializations", label: "Actividades", icon: Star, value: totalActividades },
      { href: "/spaces", label: "Espacios", icon: Warehouse, value: totalSpaces },
      { href: "/assistant", label: "Estadísticas", icon: BarChart3 },
    ];

  }, [isMounted, people, specialists, yogaClasses, actividades, spaces]);

  const todaysClasses = useMemo(() => {
    if (!isMounted || !todayDayName) return [];
    return yogaClasses
      .filter(cls => cls.dayOfWeek === todayDayName)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [isMounted, todayDayName, yogaClasses]);

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
      <PageHeader title="Inicio" />
      
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {navItems.map((item, index) => (
            <Link key={index} href={item.href} className="block">
              <Card className={cn(
                "transition-colors h-full flex flex-col justify-between p-4 hover:bg-muted/50",
                {
                  "bg-destructive/5 hover:bg-destructive/10 border-destructive/20": item.isDestructive,
                  "bg-green-100/70 hover:bg-green-100 border-green-200": item.isSuccess,
                }
              )}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{item.label}</h3>
                  <item.icon className={cn("h-5 w-5 text-muted-foreground", {
                    "text-destructive": item.isDestructive,
                    "text-green-700": item.isSuccess,
                  })} />
                </div>
                <div className="mt-4">
                  {isMounted && item.value !== undefined ? (
                    <p className={cn("text-3xl font-bold", {
                      "text-destructive": item.isDestructive,
                      "text-green-700": item.isSuccess,
                    })}>{item.value}</p>
                  ) : item.value !== undefined ? (
                    <Skeleton className="h-8 w-1/2" />
                  ) : null }
                </div>
              </Card>
          </Link>
          ))}
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Horarios de Hoy {isMounted && todayDayName && `(${todayDayName})`}</CardTitle>
          </CardHeader>
          <CardContent>
            {isMounted ? (
              todaysClasses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Actividad</TableHead>
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
                  <p className="text-muted-foreground">No hay horarios programados para hoy.</p>
                </div>
              )
            ) : (
              <div className="p-6 pt-0">
                <Table>
                   <TableHeader>
                    <TableRow>
                      <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                      <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                      <TableHead className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableHead>
                      <TableHead className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
