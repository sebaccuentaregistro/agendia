

'use client';

import React from 'react';
import type { Session, Specialist, Actividad, Space, Level } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Signal, MoreHorizontal, Pencil, XCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';

interface ScheduleCalendarViewProps {
  sessions: Session[];
  specialists: Specialist[];
  actividades: Actividad[];
  spaces: Space[];
  levels: Level[];
  onSessionClick: (session: Session, date: Date) => void;
  onCancelClick: (session: Session, date: Date) => void;
}

export function ScheduleCalendarView({ sessions, specialists, actividades, levels, onSessionClick, onCancelClick }: ScheduleCalendarViewProps) {
  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const timeSlots = Array.from({ length: 16 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`); // 7:00 to 22:00

  const scheduleGrid = sessions.reduce((acc, session) => {
    const key = `${session.dayOfWeek}-${session.time}`;
    acc[key] = session;
    return acc;
  }, {} as Record<string, Session>);
  
  const getNextDateForDay = (dayName: string): Date => {
      const dayMap: Record<string, number> = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0 };
      const targetDay = dayMap[dayName];
      const today = new Date();
      const currentDay = today.getDay();
      const distance = (targetDay - currentDay + 7) % 7;
      const nextDate = new Date(today.setDate(today.getDate() + distance));
      return nextDate;
  };


  const getSessionDetails = (session: Session) => {
    const specialist = specialists.find((i) => i.id === session.instructorId);
    const actividad = actividades.find((s) => s.id === session.actividadId);
    const level = levels.find(l => l.id === session.levelId);
    return { specialist, actividad, level };
  };

  return (
    <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-4">
      {/* Mobile View: Vertical list, hidden on md and up */}
      <div className="md:hidden space-y-6">
        {daysOfWeek.map(day => {
          const sessionsForDay = sessions
            .filter(s => s.dayOfWeek === day)
            .sort((a, b) => a.time.localeCompare(b.time));

          if (sessionsForDay.length === 0) return null;

          const dateForDay = getNextDateForDay(day);

          return (
            <div key={day}>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3 sticky top-0 bg-background/80 py-2">{day}</h3>
              <div className="space-y-3">
                {sessionsForDay.map(session => {
                  const { specialist, actividad, level } = getSessionDetails(session);
                  return (
                    <Card
                      key={session.id}
                      onClick={() => onSessionClick(session, dateForDay)}
                      className="p-3 cursor-pointer bg-white/50 dark:bg-white/10 hover:bg-white/70 dark:hover:bg-white/20 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-1">
                          <p className="font-bold text-primary">{actividad?.name || 'Sesión'}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{specialist?.name || 'N/A'}</p>
                           {level && <Badge variant="outline" className="text-[10px] px-1 py-0">{level.name}</Badge>}
                        </div>
                        <p className="font-semibold text-sm text-slate-700 dark:text-slate-300 flex-shrink-0">{session.time}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
        {sessions.length === 0 && (
             <div className="text-center text-slate-500 dark:text-slate-400 py-10">
                <p>No hay sesiones para mostrar con los filtros actuales.</p>
            </div>
        )}
      </div>

      {/* Desktop View: Grid, hidden on smaller screens */}
      <div className="hidden md:block overflow-x-auto">
        <div className="grid grid-cols-[auto_repeat(7,minmax(120px,1fr))] gap-1 min-w-[900px]">
            <div className="sticky left-0 bg-background/80 dark:bg-zinc-900/80 z-10 text-center font-bold text-slate-700 dark:text-slate-300 p-2"></div>
            {daysOfWeek.map(day => (
                <div key={day} className="text-center font-bold text-slate-700 dark:text-slate-300 p-2 text-sm md:text-base">
                    {day}
                </div>
            ))}

            {timeSlots.map(time => (
                <React.Fragment key={time}>
                    <div className="sticky left-0 bg-background/80 dark:bg-zinc-900/80 z-10 text-right font-semibold text-slate-500 dark:text-slate-400 p-2 text-xs pr-4 border-r border-slate-200 dark:border-slate-700">
                        {time}
                    </div>
                    {daysOfWeek.map(day => {
                        const session = scheduleGrid[`${day}-${time}`];
                        const dateForDay = getNextDateForDay(day);
                        return (
                            <div key={`${day}-${time}`} className="border-l border-b border-slate-200/50 dark:border-slate-700/50 min-h-[70px] p-1 relative group">
                                {session && (() => {
                                    const { specialist, actividad, level } = getSessionDetails(session);
                                    return (
                                        <Card 
                                            className={cn(
                                                "h-full w-full cursor-pointer transition-all hover:shadow-lg hover:border-primary/50",
                                                "bg-white/50 dark:bg-white/10"
                                            )}
                                        >
                                          <Popover>
                                            <PopoverTrigger asChild>
                                                <CardContent className="p-2 text-center flex flex-col justify-center items-center h-full">
                                                    <p className="font-bold text-xs leading-tight text-primary">{actividad?.name || 'Sesión'}</p>
                                                    <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">{specialist?.name || 'N/A'}</p>
                                                    {level && <Badge variant="outline" className="text-[9px] px-1 py-0 mt-1 flex items-center gap-1"><Signal className="h-2 w-2"/>{level.name}</Badge>}
                                                </CardContent>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-48 p-0">
                                               <div className="flex flex-col text-sm">
                                                  <Button variant="ghost" className="justify-start p-2" onClick={() => onSessionClick(session, dateForDay)}>
                                                      <Pencil className="mr-2 h-4 w-4" /> Editar Sesión
                                                  </Button>
                                                  <Button variant="ghost" className="justify-start p-2 text-destructive hover:text-destructive" onClick={() => onCancelClick(session, dateForDay)}>
                                                      <XCircle className="mr-2 h-4 w-4" /> Cancelar este día
                                                  </Button>
                                               </div>
                                            </PopoverContent>
                                          </Popover>
                                        </Card>
                                    );
                                })()}
                            </div>
                        );
                    })}
                </React.Fragment>
            ))}
        </div>
      </div>
    </Card>
  );
}
