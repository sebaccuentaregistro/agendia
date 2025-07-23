

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useStudio } from '@/context/StudioContext';
import { cn } from '@/lib/utils';
import { format, startOfDay, nextDay, Day } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import { MoreHorizontal, User, MapPin, Signal, ClipboardCheck, ListPlus, Pencil, Send, Trash2 } from 'lucide-react';
import type { Session, Person } from '@/types';

interface ScheduleCardProps {
    session: Session;
    onSessionClick: (session: Session) => void;
    onAttendanceClick: (session: Session) => void;
}

const formatTime = (time: string) => {
    if (!time || !time.includes(':')) return 'N/A';
    return time;
};

export function ScheduleCard({ session, onSessionClick, onAttendanceClick }: ScheduleCardProps) {
    const { specialists, actividades, spaces, levels, people, isPersonOnVacation, attendance } = useStudio();
    
    const searchParams = useSearchParams();

    const { specialist, actividad, space, level } = useMemo(() => {
        const specialist = specialists.find((i) => i.id === session.instructorId);
        const actividad = actividades.find((s) => s.id === session.actividadId);
        const space = spaces.find((s) => s.id === session.spaceId);
        const level = levels.find(l => l.id === session.levelId);
        return { specialist, actividad, space, level };
    }, [session, specialists, actividades, spaces, levels]);

    const { dailyOccupancy, recoveryCount, onVacationCount } = useMemo(() => {
        const today = startOfDay(new Date());
        const dayIndexMap: Record<Session['dayOfWeek'], Day> = { 'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6 };
        const sessionDayIndex = dayIndexMap[session.dayOfWeek];

        let checkDate = nextDay(today, sessionDayIndex);
        if (today.getDay() === sessionDayIndex && format(today, 'HH:mm') < session.time) {
            checkDate = today;
        } else if (today.getDay() === sessionDayIndex) {
            checkDate = nextDay(today, sessionDayIndex);
        }

        const dateStrToUse = format(checkDate, 'yyyy-MM-dd');

        const fixedEnrolledPeople = session.personIds
            .map(pid => people.find(p => p.id === pid))
            .filter((p): p is Person => !!p);

        const vacationing = fixedEnrolledPeople.filter(p => isPersonOnVacation(p, checkDate));
        const activeFixedPeople = fixedEnrolledPeople.filter(p => !isPersonOnVacation(p, checkDate));
        
        const attendanceRecord = attendance.find(a => a.sessionId === session.id && a.date === dateStrToUse);
        const validOneTimeAttendees = (attendanceRecord?.oneTimeAttendees || [])
            .map(id => people.find(p => p.id === id))
            .filter((p): p is Person => !!p);

        return {
            dailyOccupancy: activeFixedPeople.length + validOneTimeAttendees.length,
            recoveryCount: validOneTimeAttendees.length,
            onVacationCount: vacationing.length,
        };
    }, [session, people, isPersonOnVacation, attendance]);
    
    const waitlistCount = session.waitlist?.length || 0;
    const enrolledCount = session.personIds.length;
    const spaceCapacity = space?.capacity ?? 0;
    
    const utilization = spaceCapacity > 0 ? (dailyOccupancy / spaceCapacity) * 100 : 0;
    const isFull = dailyOccupancy >= spaceCapacity;
    const isNearlyFull = utilization >= 80 && !isFull;
    
    const canRecover = dailyOccupancy < spaceCapacity;
    const recoveryMode = searchParams.get('recoveryMode') === 'true';
    if (recoveryMode && !canRecover) return null;

    const dayMap: { [key: number]: Session['dayOfWeek'] } = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
    const today = startOfDay(new Date());
    const isToday = session.dayOfWeek === dayMap[today.getDay()];

    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const sessionStartTime = useMemo(() => {
        if (!isToday) return null;
        const [hour, minute] = session.time.split(':').map(Number);
        const startTime = new Date(today);
        startTime.setHours(hour, minute, 0, 0);
        return startTime;
    }, [isToday, session.time, today]);

    const attendanceWindowStart = useMemo(() => {
        return sessionStartTime ? new Date(sessionStartTime.getTime() - 20 * 60 * 1000) : null;
    }, [sessionStartTime]);

    const isAttendanceAllowed = attendanceWindowStart ? now >= attendanceWindowStart : false;
    const tooltipMessage = isAttendanceAllowed ? "Pasar Lista" : "La asistencia se habilita 20 minutos antes.";
    
    const progressColorClass = useMemo(() => {
        if (utilization >= 100) return "bg-red-500";
        if (utilization >= 80) return "bg-yellow-500";
        return "bg-green-500";
    }, [utilization]);
    
    const handleAction = (eventName: string, detail: any) => {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    };

    return (
        <Card className="flex flex-col bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5">
            <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">{actividad?.name}</CardTitle>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-300"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleAction('edit-session', session)}><Pencil className="mr-2 h-4 w-4" />Editar Sesión</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleAction('notify-session', session)}><Send className="mr-2 h-4 w-4" />Notificar Asistentes</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleAction('delete-session', session)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Eliminar Sesión</DropdownMenuItem>
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
            </CardContent>
            <CardFooter className="flex flex-col gap-2 border-t border-white/20 p-2 mt-auto">
                <div className="w-full px-2 pt-1 space-y-1 cursor-pointer" onClick={() => onSessionClick(session)}>
                    <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-muted-foreground">Ocupación Fija</span>
                        <span className="text-foreground">{enrolledCount} / {spaceCapacity}</span>
                    </div>
                    <Progress value={utilization} indicatorClassName={progressColorClass} className="h-1.5" />
                    <p className="text-[11px] text-muted-foreground text-center">
                        Ocupación Hoy: {dailyOccupancy} (Rec: {recoveryCount} | Vac: {onVacationCount})
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 w-full">
                    {isToday ? (
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="w-full col-span-2" tabIndex={0}>
                                        <Button variant="secondary" size="sm" onClick={() => onAttendanceClick(session)} disabled={!isAttendanceAllowed} className="w-full">
                                            <ClipboardCheck className="mr-2 h-4 w-4" /> Asistencia
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent><p>{tooltipMessage}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : null}

                    {enrolledCount < spaceCapacity ? (
                        <>
                            <Button variant="secondary" size="sm" onClick={() => handleAction('enroll-people', session)}>Inscripción Fija</Button>
                            <Button variant="outline" size="sm" onClick={() => handleAction('one-time-attendee', session)}>Inscripción Recupero</Button>
                        </>
                    ) : (
                       <Button variant={waitlistCount > 0 ? "destructive" : "link"} size="sm" className="w-full col-span-2" onClick={() => handleAction('manage-waitlist', session)}>
                            <ListPlus className="mr-2 h-4 w-4" />
                            {waitlistCount > 0 ? `Lista de Espera (${waitlistCount})` : "Anotar en Espera"}
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}
