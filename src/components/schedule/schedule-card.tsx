

'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { useStudio } from '@/context/StudioContext';
import { cn } from '@/lib/utils';
import { MoreHorizontal, User, MapPin, Signal, Pencil, Trash2, Users, ClipboardCheck, ListPlus, Bell, CalendarClock, UserPlus, XCircle, RefreshCw } from 'lucide-react';
import type { Session, Person, SessionAttendance } from '@/types';
import { format, isAfter, startOfDay, subMinutes, isToday } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface ScheduleCardProps {
    session: Session;
    view?: 'structural' | 'daily';
    isRecoveryMode?: boolean;
}

const formatTime = (time: string) => {
    if (!time || !time.includes(':')) return 'N/A';
    return time;
};

export function ScheduleCard({ session, view = 'structural', isRecoveryMode = false }: ScheduleCardProps) {
    const { specialists, actividades, spaces, attendance, isPersonOnVacation, people } = useStudio();
    
    const isDailyView = view === 'daily';
    const today = startOfDay(new Date());
    const dateStr = format(today, 'yyyy-MM-dd');

    const { specialist, actividad, space, dailyStats, structuralStats, isCancelledToday } = useMemo(() => {
        const structuralData = {
            specialist: specialists.find((i) => i.id === session.instructorId),
            actividad: actividades.find((s) => s.id === session.actividadId),
            space: spaces.find((s) => s.id === session.spaceId),
        };

        const enrolledCount = session.personIds.length;
        const spaceCapacity = structuralData.space?.capacity ?? 0;
        const structuralUtilization = spaceCapacity > 0 ? (enrolledCount / spaceCapacity) * 100 : 0;
        
        const attendanceRecord = attendance.find((a: SessionAttendance) => a.sessionId === session.id && a.date === dateStr);
        const oneTimeAttendeesCount = attendanceRecord?.oneTimeAttendees?.length || 0;
        
        const fixedEnrolledPeople = session.personIds.map(pid => people.find(p => p.id === pid)).filter((p): p is Person => !!p);
        const vacationingCount = fixedEnrolledPeople.filter(p => isPersonOnVacation(p, today)).length;
        
        const dailyOccupancy = (fixedEnrolledPeople.length - vacationingCount) + oneTimeAttendeesCount;
        const dailyUtilization = spaceCapacity > 0 ? (dailyOccupancy / spaceCapacity) * 100 : 0;
        
        const isCancelled = attendanceRecord?.status === 'cancelled';

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
            },
            isCancelledToday: isCancelled,
        };
    }, [session, specialists, actividades, spaces, attendance, people, isPersonOnVacation, dateStr, today]);

    const getProgressColorClass = (utilization: number) => {
        if (utilization >= 100) return "bg-red-600";
        if (utilization >= 80) return "bg-yellow-500";
        return "bg-green-600";
    };

    const handleAction = (action: string, detail: any) => {
        const event = new CustomEvent('schedule-card-action', { detail: { action, ...detail } });
        document.dispatchEvent(event);
    };
    
    const isFixedFull = structuralStats.enrolledCount >= structuralStats.capacity;
    const isDailyFull = dailyStats.enrolledCount >= dailyStats.capacity;
    
    const stats = isDailyView ? dailyStats : structuralStats;
    
    const progressColorClass = getProgressColorClass(dailyStats.utilization);
    
    return (
        <Card className={cn("flex flex-col bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1", isCancelledToday && "border-destructive/30")}>
            <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">{actividad?.name}</CardTitle>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-300 -mr-2 -mt-2"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleAction('add-to-waitlist', { session })} disabled={isFixedFull}>
                            <ListPlus className="mr-2 h-4 w-4" />Añadir a Lista de Espera
                        </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleAction('notify-attendees', { session })}>
                                <Bell className="mr-2 h-4 w-4" />Notificar Asistentes
                            </DropdownMenuItem>
                            {isCancelledToday ? (
                                <DropdownMenuItem onSelect={() => handleAction('reactivate-session', { session, date: new Date() })}>
                                    <RefreshCw className="mr-2 h-4 w-4 text-green-600" />
                                    <span className="text-green-600">Reactivar Clase de Hoy</span>
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onSelect={() => handleAction('cancel-session', { session, date: new Date() })}>
                                    <XCircle className="mr-2 h-4 w-4 text-destructive" />
                                    <span className="text-destructive">Cancelar solo por hoy</span>
                                </DropdownMenuItem>
                            )}
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
            <CardContent className="p-4 pt-2 flex-grow space-y-3">
                 {isCancelledToday && (
                    <div className="flex items-center justify-center gap-2 rounded-lg bg-destructive/10 p-2 text-center text-sm font-semibold text-destructive">
                        <XCircle className="h-4 w-4" />
                        <span>Cancelada Hoy</span>
                    </div>
                )}
                 <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-2"><User className="h-4 w-4 text-slate-500" /> {specialist?.name}</p>
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-500" /> {space?.name}</p>
                </div>
            </CardContent>
             <CardFooter className="flex flex-col gap-2 border-t border-white/20 p-2 mt-auto">
                <div 
                  className="w-full px-2 pt-1 space-y-1 cursor-pointer"
                  onClick={() => handleAction('view-students', { session })}
                  role="button"
                  aria-label="Ver asistentes de la sesión"
                  tabIndex={0}
                >
                    <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-muted-foreground">Ocupación de Hoy</span>
                        <span className="text-foreground">{`${dailyStats.enrolledCount} / ${dailyStats.capacity}`}</span>
                    </div>
                    <Progress value={dailyStats.utilization} indicatorClassName={progressColorClass} className="h-1.5" />
                </div>
                { (dailyStats.vacationingCount > 0 || dailyStats.oneTimeAttendeesCount > 0) &&
                    <div 
                      className="text-xs px-2 w-full cursor-pointer space-y-1"
                      onClick={() => handleAction('view-students', { session })}
                      role="button"
                    >
                        {dailyStats.oneTimeAttendeesCount > 0 && <p className="font-semibold text-green-600">+ {dailyStats.oneTimeAttendeesCount} recupero(s)</p>}
                        {dailyStats.vacationingCount > 0 && <p className="font-semibold text-amber-600">{dailyStats.vacationingCount} de vacaciones</p>}
                    </div>
                }
                {isDailyView || isRecoveryMode ? (
                    <div className="w-full grid grid-cols-2 gap-2 p-1">
                         <Button size="sm" variant="outline" className="text-xs" onClick={() => handleAction('take-attendance', { session })} disabled={isCancelledToday}>
                            <ClipboardCheck className="mr-1.5 h-4 w-4" /> Asistencia
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => handleAction('enroll-recovery', { session })} disabled={isDailyFull || isCancelledToday}>
                            <CalendarClock className="mr-1.5 h-4 w-4" /> Recupero
                        </Button>
                    </div>
                ) : (
                    <div className="w-full grid grid-cols-2 gap-2 p-1">
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => handleAction('enroll-fixed', { session })} disabled={isFixedFull}>
                            <UserPlus className="mr-1.5 h-4 w-4" /> Inscripción
                        </Button>
                         <Button size="sm" variant="outline" className="text-xs" onClick={() => handleAction('enroll-recovery', { session })} disabled={isDailyFull}>
                            <CalendarClock className="mr-1.5 h-4 w-4" /> Recupero
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}

