

'use client';

import { useState, useMemo } from 'react';
import { Card, CardTitle, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ClipboardCheck, User as UserIcon, DoorOpen } from 'lucide-react';
import type { Session, Specialist, Actividad, Space } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { cn } from '@/lib/utils';

interface TodaySessionsProps {
  sessions: (Session & { 
    enrolledCount: number; 
    waitlistCount: number;
    debugInfo: {
        fixedCount: number;
        vacationCount: number;
        recoveryCount: number;
        fixedNames: string;
        vacationNames: string;
        recoveryNames: string;
    };
  })[];
  specialists: Specialist[];
  actividades: Actividad[];
  spaces: Space[];
  todayName: string;
  onSessionClick: (session: Session) => void;
  onAttendanceClick: (session: Session) => void;
}

const getTimeOfDay = (time: string): 'Mañana' | 'Tarde' | 'Noche' => {
  if (!time) return 'Tarde';
  const hour = parseInt(time.split(':')[0], 10);
  if (hour < 12) return 'Mañana';
  if (hour < 18) return 'Tarde';
  return 'Noche';
};

const formatTime = (time: string) => {
  if (!time || !time.includes(':')) return 'N/A';
  return time;
};

export function TodaySessions({
  sessions,
  specialists,
  actividades,
  spaces,
  todayName,
  onSessionClick,
  onAttendanceClick,
}: TodaySessionsProps) {
  const [filters, setFilters] = useState({
    actividadId: 'all',
    spaceId: 'all',
    specialistId: 'all',
    timeOfDay: 'all',
  });

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const getSessionDetails = (session: Session) => {
    const specialist = specialists.find((i) => i.id === session.instructorId);
    const actividad = actividades.find((s) => s.id === session.actividadId);
    const space = spaces.find((s) => s.id === session.spaceId);
    return { specialist, actividad, space };
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
        const sessionTimeOfDay = getTimeOfDay(session.time);
        return (
            (filters.actividadId === 'all' || session.actividadId === filters.actividadId) &&
            (filters.spaceId === 'all' || session.spaceId === filters.spaceId) &&
            (filters.specialistId === 'all' || session.instructorId === filters.specialistId) &&
            (filters.timeOfDay === 'all' || sessionTimeOfDay === filters.timeOfDay)
        );
    });
  }, [sessions, filters]);

  return (
    <Card className="flex flex-col bg-background/50 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-white/10 mt-8">
        <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg text-foreground">Sesiones de Hoy - {todayName}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
                <Select value={filters.specialistId} onValueChange={(value) => handleFilterChange('specialistId', value)}>
                <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-background/70 border-border/50 shadow-sm rounded-xl">
                    <SelectValue placeholder="Especialista" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Especialista</SelectItem>
                    {specialists.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
                </Select>
                <Select value={filters.actividadId} onValueChange={(value) => handleFilterChange('actividadId', value)}>
                <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-background/70 border-border/50 shadow-sm rounded-xl">
                    <SelectValue placeholder="Actividad" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Actividades</SelectItem>
                    {actividades.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
                </Select>
                <Select value={filters.spaceId} onValueChange={(value) => handleFilterChange('spaceId', value)}>
                <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-background/70 border-border/50 shadow-sm rounded-xl">
                    <SelectValue placeholder="Espacio" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Espacios</SelectItem>
                    {spaces.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
                </Select>
                <Select value={filters.timeOfDay} onValueChange={(value) => handleFilterChange('timeOfDay', value)}>
                <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-background/70 border-border/50 shadow-sm rounded-xl">
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
                <ul className="space-y-4">
                {filteredSessions.map(session => {
                    const { specialist, actividad, space } = getSessionDetails(session);
                    const { enrolledCount, debugInfo } = session;
                    const capacity = space?.capacity ?? 0;
                    const utilization = capacity > 0 ? enrolledCount / capacity : 0;
                    const isFull = utilization >= 1;
                    const isNearlyFull = utilization >= 0.8 && !isFull;

                    const now = new Date();
                    const [hour, minute] = session.time.split(':').map(Number);
                    const sessionStartTime = new Date();
                    sessionStartTime.setHours(hour, minute, 0, 0);
                    const attendanceWindowStart = new Date(sessionStartTime.getTime() - 20 * 60 * 1000);
                    const isAttendanceAllowed = now >= attendanceWindowStart;
                    const tooltipMessage = isAttendanceAllowed ? "Pasar Lista" : "La asistencia se habilita 20 minutos antes de la clase.";

                    return (
                    <li 
                        key={session.id}
                        className={cn(
                        "flex flex-col rounded-xl border p-3 transition-all duration-200 bg-background/60 shadow-md hover:shadow-lg hover:border-primary/30",
                        isFull && "bg-pink-500/10 border-pink-500/30",
                        isNearlyFull && "bg-amber-500/10 border-amber-500/20"
                        )}
                    >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex-1 space-y-1 cursor-pointer" onClick={() => onSessionClick(session)}>
                            <p className="font-semibold text-foreground">{actividad?.name || 'Sesión'}</p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5"><UserIcon className="h-4 w-4" />{specialist?.name || 'N/A'}</span>
                                <span className="flex items-center gap-1.5"><DoorOpen className="h-4 w-4" />{space?.name || 'N/A'}</span>
                            </div>
                            </div>
                            <div className="flex items-center gap-2 text-right self-end sm:self-center">
                                <div>
                                <p className="font-bold text-primary">{formatTime(session.time)}</p>
                                <p className={cn(
                                    "text-base font-semibold",
                                    isFull 
                                    ? "text-pink-600 dark:text-pink-400" 
                                    : isNearlyFull 
                                    ? "text-amber-600 dark:text-amber-500" 
                                    : "text-foreground"
                                )}>
                                    {enrolledCount}/{capacity} hoy
                                </p>
                                </div>
                                <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                    <span tabIndex={0}>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-accent" onClick={() => onAttendanceClick(session)} disabled={!isAttendanceAllowed}>
                                        <ClipboardCheck className="h-5 w-5" />
                                        <span className="sr-only">Pasar Lista</span>
                                        </Button>
                                    </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                    <p>{tooltipMessage}</p>
                                    </TooltipContent>
                                </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                        <div className="mt-2 text-xs p-2 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                            <p className="font-mono font-bold text-zinc-600 dark:text-zinc-300">DEBUG: {debugInfo.enrolledCount} = {debugInfo.fixedCount}(F) - {debugInfo.vacationCount}(V) + {debugInfo.recoveryCount}(R)</p>
                            <p className="font-mono text-zinc-500 dark:text-zinc-400">Fijos: {debugInfo.fixedNames}</p>
                            <p className="font-mono text-zinc-500 dark:text-zinc-400">Vacaciones: {debugInfo.vacationNames}</p>
                            <p className="font-mono text-zinc-500 dark:text-zinc-400">Recupero: {debugInfo.recoveryNames}</p>
                        </div>
                    </li>
                    );
                })}
                </ul>
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
