'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudio } from '@/context/StudioContext';
import type { Session } from '@/types';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, CalendarClock, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type AttendanceStatus = 'present' | 'absent' | 'justified';

export function AttendanceSheet({ session, onClose }: { session: Session; onClose: () => void }) {
  const { people, actividades, saveAttendance, attendance, isPersonOnVacation } = useStudio();
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const today = useMemo(() => new Date(), []);
  
  const allPersonIdsForToday = useMemo(() => {
    const attendanceRecord = attendance.find(a => a.sessionId === session.id && a.date === todayStr);
    const oneTimeIds = attendanceRecord?.oneTimeAttendees || [];
    
    // Filter out people on vacation from their regular spot
    const regularIds = session.personIds.filter(pid => {
        const person = people.find(p => p.id === pid);
        return person && !isPersonOnVacation(person, today);
    });

    const allEnrolledIds = [...new Set([...regularIds, ...oneTimeIds])];
    return allEnrolledIds;
  }, [session, attendance, todayStr, people, isPersonOnVacation, today]);

  const enrolledPeople = useMemo(() => {
    return people
      .filter(p => allPersonIdsForToday.includes(p.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [people, allPersonIdsForToday]);
  
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(() => {
    const initialStatuses: Record<string, AttendanceStatus> = {};
    const record = attendance.find(a => a.sessionId === session.id && a.date === todayStr);
    
    allPersonIdsForToday.forEach(personId => {
        if(record?.absentIds.includes(personId)) {
            initialStatuses[personId] = 'absent';
        } else if (record?.justifiedAbsenceIds?.includes(personId)) {
            initialStatuses[personId] = 'justified';
        } else if (record?.presentIds.includes(personId)) {
            initialStatuses[personId] = 'present';
        } else {
            // Default to present if no record exists for them yet
            initialStatuses[personId] = 'present';
        }
    });
    return initialStatuses;
  });

  function onSubmit() {
    const presentIds = Object.keys(statuses).filter(id => statuses[id] === 'present');
    const absentIds = Object.keys(statuses).filter(id => statuses[id] === 'absent');
    const justifiedAbsenceIds = Object.keys(statuses).filter(id => statuses[id] === 'justified');
    saveAttendance(session.id, presentIds, absentIds, justifiedAbsenceIds);
    onClose();
  }
  
  const handleStatusChange = (personId: string, status: AttendanceStatus) => {
    setStatuses(prev => ({ ...prev, [personId]: status }));
  };
  
  const attendanceCounts = useMemo(() => {
    return Object.values(statuses).reduce((acc, status) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<AttendanceStatus, number>);
  }, [statuses]);

  const actividad = actividades.find(a => a.id === session.actividadId);

  return (
    <Sheet open onOpenChange={open => !open && onClose()}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Pasar Lista: {actividad?.name}</SheetTitle>
          <SheetDescription>
            Selecciona el estado de cada persona. Por defecto, todas están presentes.
          </SheetDescription>
           <div className="hidden sm:flex items-center justify-around text-sm pt-2 text-muted-foreground flex-wrap gap-x-4 gap-y-2">
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Total: {allPersonIdsForToday.length}</span>
                <span className="flex items-center gap-1.5 text-green-600"><CheckCircle2 className="h-4 w-4" /> Presentes: {attendanceCounts.present || 0}</span>
                <span className="flex items-center gap-1.5 text-destructive"><XCircle className="h-4 w-4" /> Ausentes: {attendanceCounts.absent || 0}</span>
                <span className="flex items-center gap-1.5 text-yellow-600"><CalendarClock className="h-4 w-4" /> Justif.: {attendanceCounts.justified || 0}</span>
            </div>
        </SheetHeader>
        
        <ScrollArea className="flex-grow my-4">
          <div className="space-y-2 pr-4">
            {enrolledPeople.length > 0 ? (
              enrolledPeople.map(person => (
                <div key={person.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <p className="font-medium">{person.name}</p>
                  <div className="flex items-center gap-1">
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className={cn("h-8 w-8", statuses[person.id] === 'present' && "bg-green-100 text-green-700 hover:bg-green-200")} onClick={() => handleStatusChange(person.id, 'present')}>
                                    <CheckCircle2 className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Presente</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className={cn("h-8 w-8", statuses[person.id] === 'absent' && "bg-red-100 text-red-700 hover:bg-red-200")} onClick={() => handleStatusChange(person.id, 'absent')}>
                                    <XCircle className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Ausente</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className={cn("h-8 w-8", statuses[person.id] === 'justified' && "bg-yellow-100 text-yellow-700 hover:bg-yellow-200")} onClick={() => handleStatusChange(person.id, 'justified')}>
                                    <CalendarClock className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Ausencia Justificada</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-10">
                No hay personas inscriptas en esta sesión para hoy.
              </p>
            )}
          </div>
        </ScrollArea>
        <SheetFooter>
            <SheetClose asChild>
                <Button type="button" variant="outline">
                    Cancelar
                </Button>
            </SheetClose>
            <Button onClick={onSubmit}>Guardar Asistencia</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
