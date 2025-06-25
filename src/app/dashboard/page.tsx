
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardTitle, CardContent, CardHeader } from '@/components/ui/card';
import { Calendar, Users, ClipboardList, Star, Warehouse, AlertTriangle, User as UserIcon, DoorOpen, LineChart, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useStudio } from '@/context/StudioContext';
import { useMemo, useState } from 'react';
import type { YogaClass } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStudentPaymentStatus } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { yogaClasses, specialists, actividades, spaces, people } = useStudio();
  const [filters, setFilters] = useState({
    actividadId: 'all',
    spaceId: 'all',
    specialistId: 'all',
    timeOfDay: 'all', // Mañana, Tarde, Noche
  });

  const overdueCount = useMemo(() => {
    const now = new Date();
    return people.filter(p => getStudentPaymentStatus(p, now) === 'Atrasado').length;
  }, [people]);

  const hasOverdue = overdueCount > 0;

  const navItems = [
    { href: "/schedule", label: "Horarios", icon: Calendar, count: yogaClasses.length },
    { href: "/students", label: "Personas", icon: Users, count: people.length },
    { href: "/instructors", label: "Especialistas", icon: ClipboardList, count: specialists.length },
    { href: "/specializations", label: "Actividades", icon: Star, count: actividades.length },
    { href: "/spaces", label: "Espacios", icon: Warehouse, count: spaces.length },
    { href: "/statistics", label: "Estadísticas", icon: LineChart, count: null },
  ];

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const { todaysClasses, filteredClasses, todayName } = useMemo(() => {
    const dayMap: { [key: number]: YogaClass['dayOfWeek'] } = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
    const today = new Date();
    const todayName = dayMap[today.getDay()];

    const getTimeOfDay = (time: string): 'Mañana' | 'Tarde' | 'Noche' => {
        if (!time) return 'Tarde';
        const hour = parseInt(time.split(':')[0], 10);
        if (hour < 12) return 'Mañana';
        if (hour < 18) return 'Tarde';
        return 'Noche';
    };

    const todaysClasses = yogaClasses
      .filter(cls => cls.dayOfWeek === todayName)
      .sort((a, b) => a.time.localeCompare(b.time));

    const filtered = todaysClasses.filter(cls => {
        const timeOfDay = getTimeOfDay(cls.time);
        return (
            (filters.actividadId === 'all' || cls.actividadId === filters.actividadId) &&
            (filters.spaceId === 'all' || cls.spaceId === filters.spaceId) &&
            (filters.specialistId === 'all' || cls.instructorId === filters.specialistId) &&
            (filters.timeOfDay === 'all' || timeOfDay === filters.timeOfDay)
        );
    });

    return { todaysClasses, filteredClasses: filtered, todayName };
  }, [yogaClasses, filters]);

  const getClassDetails = (cls: YogaClass) => {
    const specialist = specialists.find((i) => i.id === cls.instructorId);
    const actividad = actividades.find((s) => s.id === cls.actividadId);
    const space = spaces.find((s) => s.id === cls.spaceId);
    return { specialist, actividad, space };
  };

  const formatTime = (time: string) => {
    if (!time || !time.includes(':')) return 'N/A';
    return time;
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Inicio" />
      
      <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-7">
          <Link href="/students?filter=overdue" className="transition-transform hover:-translate-y-1">
            <Card className={cn(
                "group flex flex-col items-center justify-center p-2 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 aspect-square",
                hasOverdue ? "hover:!border-destructive" : "hover:!border-green-500"
            )}>
                <div className={cn(
                    "flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full",
                    hasOverdue ? "bg-destructive/10 text-destructive" : "bg-green-100 text-green-600"
                )}>
                    {hasOverdue ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                </div>
                <CardTitle className={cn(
                    "text-xs font-semibold",
                    hasOverdue ? "text-destructive" : "text-green-600"
                )}>
                    Atrasados
                </CardTitle>
                <p className="text-lg font-bold text-slate-600 dark:text-slate-300">{overdueCount}</p>
            </Card>
          </Link>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition-transform hover:-translate-y-1">
              <Card className="group flex flex-col items-center justify-center p-2 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:!border-primary aspect-square">
                  <div className="flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.label}</CardTitle>
                  {item.count !== null && (
                    <p className="text-lg font-bold text-slate-600 dark:text-slate-400">{item.count}</p>
                  )}
              </Card>
          </Link>
          ))}
      </div>

      <Card className="flex flex-col bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg text-slate-800 dark:text-slate-100">Clases de Hoy - {todayName}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filters.specialistId} onValueChange={(value) => handleFilterChange('specialistId', value)}>
                <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-white/80 dark:bg-zinc-800/80 border-slate-300/50 rounded-xl">
                  <SelectValue placeholder="Especialista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Especialista</SelectItem>
                  {specialists.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.actividadId} onValueChange={(value) => handleFilterChange('actividadId', value)}>
                <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-white/80 dark:bg-zinc-800/80 border-slate-300/50 rounded-xl">
                  <SelectValue placeholder="Actividad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Actividades</SelectItem>
                  {actividades.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.spaceId} onValueChange={(value) => handleFilterChange('spaceId', value)}>
                <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-white/80 dark:bg-zinc-800/80 border-slate-300/50 rounded-xl">
                  <SelectValue placeholder="Espacio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Espacios</SelectItem>
                  {spaces.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.timeOfDay} onValueChange={(value) => handleFilterChange('timeOfDay', value)}>
                <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-white/80 dark:bg-zinc-800/80 border-slate-300/50 rounded-xl">
                  <SelectValue placeholder="Horario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo el Día</SelectItem>
                  <SelectItem value="Mañana">Mañana</SelectItem>
                  <SelectItem value="Tarde">Tarde</SelectItem>
                  <SelectItem value="Noche">Noche</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          {todaysClasses.length > 0 ? (
            filteredClasses.length > 0 ? (
              <ul className="space-y-4">
                {filteredClasses.map(cls => {
                  const { specialist, actividad, space } = getClassDetails(cls);
                  const enrolledCount = cls.personIds.length;
                  const capacity = space?.capacity ?? 0;
                  const isFull = capacity > 0 && enrolledCount >= capacity;
                  return (
                    <li 
                      key={cls.id}
                      className={cn(
                        "flex items-center gap-4 rounded-xl border p-3 transition-colors bg-white/30 dark:bg-white/10 border-white/20",
                        isFull && "bg-pink-500/20 border-pink-500/30"
                      )}
                    >
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{actividad?.name || 'Clase'}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1.5"><UserIcon className="h-3 w-3" />{specialist?.name || 'N/A'}</span>
                          <span className="flex items-center gap-1.5"><DoorOpen className="h-3 w-3" />{space?.name || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{formatTime(cls.time)}</p>
                        <p className={cn(
                            "text-sm", 
                            isFull ? "font-semibold text-pink-600 dark:text-pink-400" : "text-slate-600 dark:text-slate-400"
                          )}>
                          {enrolledCount}/{capacity} inscritos
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/30 p-10 text-center bg-white/20 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No se encontraron clases</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Prueba a cambiar o limpiar los filtros.</p>
              </div>
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/30 p-10 text-center bg-white/20 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No hay clases hoy</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">¡Día libre! Disfruta del descanso.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
