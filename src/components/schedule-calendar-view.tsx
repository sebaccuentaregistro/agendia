
'use client';

import React from 'react';
import type { Session, Specialist, Actividad, Space } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ScheduleCalendarViewProps {
  sessions: Session[];
  specialists: Specialist[];
  actividades: Actividad[];
  spaces: Space[];
  onSessionClick: (session: Session) => void;
}

export function ScheduleCalendarView({ sessions, specialists, actividades, onSessionClick }: ScheduleCalendarViewProps) {
  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const timeSlots = Array.from({ length: 16 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`); // 7:00 to 22:00

  const scheduleGrid = sessions.reduce((acc, session) => {
    const key = `${session.dayOfWeek}-${session.time}`;
    acc[key] = session;
    return acc;
  }, {} as Record<string, Session>);

  const getSessionDetails = (session: Session) => {
    const specialist = specialists.find((i) => i.id === session.instructorId);
    const actividad = actividades.find((s) => s.id === session.actividadId);
    return { specialist, actividad };
  };

  return (
    <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-4 overflow-x-auto">
        <div className="grid grid-cols-[auto_repeat(7,minmax(120px,1fr))] gap-1 min-w-[900px]">
            {/* Header Row */}
            <div className="sticky left-0 bg-background/80 dark:bg-zinc-900/80 z-10 text-center font-bold text-slate-700 dark:text-slate-300 p-2"></div>
            {daysOfWeek.map(day => (
                <div key={day} className="text-center font-bold text-slate-700 dark:text-slate-300 p-2 text-sm md:text-base">
                    {day}
                </div>
            ))}

            {/* Time Slots and Sessions */}
            {timeSlots.map(time => (
                <React.Fragment key={time}>
                    <div className="sticky left-0 bg-background/80 dark:bg-zinc-900/80 z-10 text-right font-semibold text-slate-500 dark:text-slate-400 p-2 text-xs pr-4 border-r border-slate-200 dark:border-slate-700">
                        {time}
                    </div>
                    {daysOfWeek.map(day => {
                        const session = scheduleGrid[`${day}-${time}`];
                        return (
                            <div key={`${day}-${time}`} className="border-l border-b border-slate-200/50 dark:border-slate-700/50 min-h-[70px] p-1 relative">
                                {session && (() => {
                                    const { specialist, actividad } = getSessionDetails(session);
                                    return (
                                        <Card 
                                            onClick={() => onSessionClick(session)}
                                            className={cn(
                                                "h-full w-full cursor-pointer transition-all hover:shadow-lg hover:border-primary/50",
                                                "bg-white/50 dark:bg-white/10"
                                            )}
                                        >
                                            <CardContent className="p-2 text-center flex flex-col justify-center h-full">
                                                <p className="font-bold text-xs leading-tight text-primary">{actividad?.name || 'Sesión'}</p>
                                                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">{specialist?.name || 'N/A'}</p>
                                            </CardContent>
                                        </Card>
                                    );
                                })()}
                            </div>
                        );
                    })}
                </React.Fragment>
            ))}
        </div>
    </Card>
  );
}
