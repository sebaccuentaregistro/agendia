

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { useStudio } from '@/context/StudioContext';
import { cn } from '@/lib/utils';
import { MoreHorizontal, User, MapPin, Signal, Pencil, Trash2, Users, ClipboardCheck, ListPlus, Bell, CalendarClock, AlertTriangle } from 'lucide-react';
import type { Session, Person } from '@/types';
import { format, isBefore, isAfter, parse, startOfDay, addMinutes, subMinutes } from 'date-fns';

interface ScheduleCardProps {
    session: Session;
    view?: 'structural' | 'daily';
}

const formatTime = (time: string) => {
    if (!time || !time.includes(':')) return 'N/A';
    return time;
};

export function ScheduleCard({ session, view = 'structural' }: ScheduleCardProps) {
    const { specialists, actividades, spaces, levels, attendance, isPersonOnVacation, people } = useStudio();
    
    const { specialist, actividad, space, level, dailyStats, structuralStats } = useMemo(() => {
        const structuralData = {
            specialist: specialists.find((i) => i.id === session.instructorId),
            actividad: actividades.find((s) => s.id === session.actividadId),
            space: spaces.find((s) => s.id === session.spaceId),
            level: levels.find(l => l.id === session.levelId),
        };

        const enrolledCount = session.personIds.length;
        const spaceCapacity = structuralData.space?.capacity ?? 0;
        const structuralUtilization = spaceCapacity > 0 ? (enrolledCount / spaceCapacity) * 100 : 0;
        
        // Daily stats calculation
        const today = startOfDay(new Date());
        const dateStr = format(today, 'yyyy-MM-dd');
        const attendanceRecord = attendance.find(a => a.sessionId === session.id && a.date === dateStr);
        const oneTimeAttendeesCount = attendanceRecord?.oneTimeAttendees?.length || 0;
        
        const fixedEnrolledPeople = session.personIds.map(pid => people.find(p => p.id === pid)).filter((p): p is Person => !!p);
        const vacationingCount = fixedEnrolledPeople.filter(p => isPersonOnVacation(p, today)).length;
        
        const dailyOccupancy = (fixedEnrolledPeople.length - vacationingCount) + oneTimeAttendeesCount;
        const dailyUtilization = spaceCapacity > 0 ? (dailyOccupancy / spaceCapacity) * 100 : 0;
        
        return {
            ...structuralData,
            structuralStats: {
                enrolledCount,
                capacity: spaceCapacity,
                utilization: structuralUtilization,
            },
            dailyStats: {
                enrolledCount: dailyOccupancy,
                capacity: spaceCapacity,
                utilization: dailyUtilization,
                vacationingCount,
                oneTimeAttendeesCount
            }
        };
    }, [session, specialists, actividades, spaces, levels, attendance, people, isPersonOnVacation]);

    const getProgressColorClass = (utilization: number) => {
        if (utilization >= 100) return "bg-red-600";
        if (utilization >= 80) return "bg-yellow-500";
        return "bg-green-600";
    };

    const handleAction = (action: string, detail: any) => {
        const event = new CustomEvent('schedule-card-action', { detail: { action, ...detail } });
        document.dispatchEvent(event);
    };
    
    const isDailyView = view === 'daily';
    const stats = isDailyView ? dailyStats : structuralStats;
    const progressColorClass = getProgressColorClass(stats.utilization);
    const isFixedFull = structuralStats.enrolledCount >= structuralStats.capacity;
    
    const isAttendanceEnabled = useMemo(() => {
        if (!isDailyView) return false;
        const now = new Date();
        const [hour, minute] = session.time.split(':').map(Number);
        const sessionTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
        
        return isAfter(now, subMinutes(sessionTime, 20));
    }, [session.time, isDailyView]);
    
    return (
        <Card className="flex flex-col bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">{actividad?.name}</CardTitle>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-300 -mr-2 -mt-2"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onSelect={() => handleAction('enroll-fixed', { session })} disabled={isFixedFull}>
                             <Users className="mr-2 h-4 w-4" />Inscripción Fija
                           </DropdownMenuItem>
                           <DropdownMenuItem onSelect={() => handleAction('add-to-waitlist', { session })} disabled={!isFixedFull}>
                             <ListPlus className="mr-2 h-4 w-4" />Añadir a Lista de Espera
                           </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem onSelect={() => handleAction('notify-attendees', { session })}>
                                <Bell className="mr-2 h-4 w-4" />Notificar Asistentes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleAction('edit-session', { session })}>
                                <Pencil className="mr-2 h-4 w-4" />Editar Sesión
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleAction('delete-session', { session })} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />Eliminar Sesión
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    <p className="font-semibold">{session.dayOfWeek}, {formatTime(session.time)}</p>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 flex-grow space-y-4">
                <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-2"><User className="h-4 w-4 text-slate-500" /> {specialist?.name}</p>
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-500" /> {space?.name}</p>
                    {level && <p className="flex items-center gap-2 capitalize"><Signal className="h-4 w-4 text-slate-500" /> {level.name}</p>}
                </div>
                {isDailyView && (dailyStats.vacationingCount > 0 || dailyStats.oneTimeAttendeesCount > 0) && (
                     <div className="text-xs text-muted-foreground space-y-1">
                        {dailyStats.oneTimeAttendeesCount > 0 && <p>+ {dailyStats.oneTimeAttendeesCount} recupero(s)</p>}
                        {dailyStats.vacationingCount > 0 && <p>- {dailyStats.vacationingCount} de vacaciones</p>}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2 border-t border-white/20 p-2 mt-auto">
                <div className="w-full px-2 pt-1 space-y-1">
                    <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-muted-foreground">{isDailyView ? 'Ocupación de Hoy' : 'Ocupación Fija'}</span>
                        <span className="text-foreground">{stats.enrolledCount} / {stats.capacity}</span>
                    </div>
                    <Progress value={stats.utilization} indicatorClassName={progressColorClass} className="h-1.5" />
                </div>
                {isDailyView && (
                    <div className="w-full grid grid-cols-2 gap-2 p-1">
                        <Button size="sm" variant="outline" onClick={() => handleAction('enroll-recovery', { session })} disabled={dailyStats.enrolledCount >= dailyStats.capacity}>
                            <CalendarClock className="mr-2 h-4 w-4" /> Recupero
                        </Button>
                        <Button size="sm" onClick={() => handleAction('take-attendance', { session })} disabled={!isAttendanceEnabled}>
                            <ClipboardCheck className="mr-2 h-4 w-4" /> Asistencia
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
