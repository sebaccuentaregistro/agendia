

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStudio } from '@/context/StudioContext';
import { cn } from '@/lib/utils';
import { MoreHorizontal, User, MapPin, Signal, Pencil, Trash2 } from 'lucide-react';
import type { Session } from '@/types';

interface ScheduleCardProps {
    session: Session;
}

const formatTime = (time: string) => {
    if (!time || !time.includes(':')) return 'N/A';
    return time;
};

export function ScheduleCard({ session }: ScheduleCardProps) {
    const { specialists, actividades, spaces, levels } = useStudio();
    
    const { specialist, actividad, space, level } = useMemo(() => {
        return {
            specialist: specialists.find((i) => i.id === session.instructorId),
            actividad: actividades.find((s) => s.id === session.actividadId),
            space: spaces.find((s) => s.id === session.spaceId),
            level: levels.find(l => l.id === session.levelId),
        };
    }, [session, specialists, actividades, spaces, levels]);

    const enrolledCount = session.personIds.length;
    const spaceCapacity = space?.capacity ?? 0;
    const utilization = spaceCapacity > 0 ? (enrolledCount / spaceCapacity) * 100 : 0;
    
    const progressColorClass = useMemo(() => {
        if (utilization >= 100) return "bg-red-600";
        if (utilization >= 80) return "bg-yellow-500";
        return "bg-green-600";
    }, [utilization]);
    
    const handleAction = (eventName: string, detail: any) => {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    };

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
                            <DropdownMenuItem onSelect={() => handleAction('edit-session', session)}><Pencil className="mr-2 h-4 w-4" />Editar Sesión</DropdownMenuItem>
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
                <div className="w-full px-2 pt-1 space-y-1">
                    <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-muted-foreground">Ocupación Fija</span>
                        <span className="text-foreground">{enrolledCount} / {spaceCapacity}</span>
                    </div>
                    <Progress value={utilization} indicatorClassName={progressColorClass} className="h-1.5" />
                </div>
            </CardFooter>
        </Card>
    );
}
