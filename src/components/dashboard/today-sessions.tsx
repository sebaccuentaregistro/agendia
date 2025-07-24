

'use client';

import { useState, useMemo } from 'react';
import { Card, CardTitle, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Session, Specialist, Actividad, Space } from '@/types';
import { ScheduleCard } from '@/components/schedule/schedule-card';
import { useStudio } from '@/context/StudioContext';
import { cn } from '@/lib/utils';

interface TodaySessionsProps {
  sessions: Session[];
  todayName: string;
}

const getTimeOfDay = (time: string): 'Mañana' | 'Tarde' | 'Noche' => {
  if (!time) return 'Tarde';
  const hour = parseInt(time.split(':')[0], 10);
  if (hour < 12) return 'Mañana';
  if (hour < 18) return 'Tarde';
  return 'Noche';
};

export function TodaySessions({
  sessions,
  todayName
}: TodaySessionsProps) {
  const { specialists, actividades } = useStudio();
  const [filters, setFilters] = useState({
    actividadId: 'all',
    specialistId: 'all',
    timeOfDay: 'all',
  });

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
        const sessionTimeOfDay = getTimeOfDay(session.time);
        return (
            (filters.actividadId === 'all' || session.actividadId === filters.actividadId) &&
            (filters.specialistId === 'all' || session.instructorId === filters.specialistId) &&
            (filters.timeOfDay === 'all' || sessionTimeOfDay === filters.timeOfDay)
        );
    });
  }, [sessions, filters]);

  return (
    <Card className="flex flex-col bg-background/50 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-white/10">
        <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg text-foreground">Sesiones de Hoy - {todayName}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
                <Select value={filters.specialistId} onValueChange={(value) => handleFilterChange('specialistId', value)}>
                <SelectTrigger className={cn("w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-background/70 border-border/50 shadow-sm rounded-xl", { "border-primary/50 text-primary font-semibold": filters.specialistId !== 'all' })}>
                    <SelectValue placeholder="Especialista" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Especialista</SelectItem>
                    {specialists.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
                </Select>
                <Select value={filters.actividadId} onValueChange={(value) => handleFilterChange('actividadId', value)}>
                <SelectTrigger className={cn("w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-background/70 border-border/50 shadow-sm rounded-xl", { "border-primary/50 text-primary font-semibold": filters.actividadId !== 'all' })}>
                    <SelectValue placeholder="Actividad" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Actividades</SelectItem>
                    {actividades.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
                </Select>
                 <Select value={filters.timeOfDay} onValueChange={(value) => handleFilterChange('timeOfDay', value)}>
                <SelectTrigger className={cn("w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-background/70 border-border/50 shadow-sm rounded-xl", { "border-primary/50 text-primary font-semibold": filters.timeOfDay !== 'all' })}>
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
            {sessions.length > 0 ? (
            filteredSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSessions.map(session => (
                    <ScheduleCard 
                        key={session.id} 
                        session={session} 
                        view="daily"
                    />
                  ))}
                </div>
            ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 p-10 text-center bg-muted/40 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-foreground">No se encontraron sesiones</h3>
                <p className="text-sm text-muted-foreground">Prueba a cambiar o limpiar los filtros.</p>
                </div>
            )
            ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 p-10 text-center bg-muted/40 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-foreground">No hay sesiones hoy</h3>
                <p className="text-sm text-muted-foreground">¡Día libre! Disfruta del descanso.</p>
            </div>
            )}
        </CardContent>
    </Card>
  );
}
