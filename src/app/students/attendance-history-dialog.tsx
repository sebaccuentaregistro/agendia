
'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { Person, Session, SessionAttendance, Actividad } from '@/types';
import { format, parse, compareDesc } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Check, X, CalendarClock } from 'lucide-react';

interface AttendanceHistoryDialogProps {
  person: Person | null;
  sessions: Session[];
  actividades: Actividad[];
  attendance: SessionAttendance[];
  onClose: () => void;
}

type FormattedAttendanceRecord = {
    date: Date;
    status: 'presente' | 'ausente' | 'justificada';
    className: string;
};

export function AttendanceHistoryDialog({ person, sessions, actividades, attendance, onClose }: AttendanceHistoryDialogProps) {
    const personAttendance = useMemo(() => {
        if (!person) return [];

        const personSessionIds = new Set(sessions.filter(s => s.personIds.includes(person.id)).map(s => s.id));
        const history: FormattedAttendanceRecord[] = [];

        attendance.forEach(record => {
            if (!personSessionIds.has(record.sessionId)) return;

            const date = parse(record.date, 'yyyy-MM-dd', new Date());
            const session = sessions.find(s => s.id === record.sessionId);
            const actividad = actividades.find(a => a.id === session?.actividadId);
            const className = actividad?.name || 'Clase';
            
            if (record.presentIds?.includes(person.id)) {
                history.push({ date, status: 'presente', className });
            } else if (record.absentIds?.includes(person.id)) {
                history.push({ date, status: 'ausente', className });
            } else if (record.justifiedAbsenceIds?.includes(person.id)) {
                history.push({ date, status: 'justificada', className });
            }
        });

        // Add one-time attendances as present
        attendance.forEach(record => {
            if (record.oneTimeAttendees?.includes(person.id)) {
                const date = parse(record.date, 'yyyy-MM-dd', new Date());
                const session = sessions.find(s => s.id === record.sessionId);
                const actividad = actividades.find(a => a.id === session?.actividadId);
                const className = `${actividad?.name || 'Clase'} (Recupero)`;
                history.push({ date, status: 'presente', className });
            }
        });


        return history.sort((a, b) => compareDesc(a.date, b.date));
    }, [person, attendance, sessions, actividades]);

    if (!person) return null;
    
    const getStatusInfo = (status: FormattedAttendanceRecord['status']) => {
        switch(status) {
            case 'presente': return { icon: Check, text: 'Presente', className: 'text-green-600 bg-green-100 border-green-200' };
            case 'ausente': return { icon: X, text: 'Ausente', className: 'text-red-600 bg-red-100 border-red-200' };
            case 'justificada': return { icon: CalendarClock, text: 'Justificada', className: 'text-yellow-600 bg-yellow-100 border-yellow-200' };
        }
    };

    return (
        <Dialog open={!!person} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Historial de Asistencia: {person.name}</DialogTitle>
                    <DialogDescription>
                        Registro de todas las asistencias de esta persona.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-72 my-4">
                    <div className="space-y-3 pr-4">
                        {personAttendance.length > 0 ? (
                            personAttendance.map((record, index) => {
                                const statusInfo = getStatusInfo(record.status);
                                return (
                                    <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-background border">
                                        <div>
                                            <p className="font-semibold">{record.className}</p>
                                            <p className="text-sm text-muted-foreground">{format(record.date, 'eeee, dd MMMM yyyy', { locale: es })}</p>
                                        </div>
                                        <Badge variant="outline" className={cn("capitalize gap-1.5", statusInfo.className)}>
                                            <statusInfo.icon className="h-3 w-3" />
                                            {statusInfo.text}
                                        </Badge>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex items-center justify-center h-full text-center">
                                <p className="text-sm text-muted-foreground">No hay asistencias registradas para esta persona.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
