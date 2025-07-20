
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { useStudio } from '@/context/StudioContext';
import { Person, Session } from '@/types';
import { format } from 'date-fns';

interface NotifyAttendeesDialogProps {
  session: Session;
  onClose: () => void;
}

export function NotifyAttendeesDialog({ session, onClose }: NotifyAttendeesDialogProps) {
  const { people, isPersonOnVacation, actividades, attendance } = useStudio();
  const [message, setMessage] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { attendeesToNotify } = useMemo(() => {
    if (!isMounted) {
      return { attendeesToNotify: [] };
    }
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    // Regular attendees not on vacation today
    const regularAttendees = session.personIds
      .map(pid => people.find(p => p.id === pid))
      .filter((p): p is Person => !!p && !isPersonOnVacation(p, today));

    // One-time attendees for today
    const attendanceRecord = attendance.find(a => a.sessionId === session.id && a.date === todayStr);
    const oneTimeAttendeeIds = new Set(attendanceRecord?.oneTimeAttendees || []);
    const oneTimeAttendees = people.filter(p => oneTimeAttendeeIds.has(p.id));

    // Combine and remove duplicates
    const allAttendeesMap = new Map<string, Person>();
    regularAttendees.forEach(p => allAttendeesMap.set(p.id, p));
    oneTimeAttendees.forEach(p => allAttendeesMap.set(p.id, p));

    const attendees = Array.from(allAttendeesMap.values()).sort((a,b) => a.name.localeCompare(b.name));
    return { attendeesToNotify: attendees };
  }, [isMounted, session, people, isPersonOnVacation, attendance]);

  const actividad = actividades.find(a => a.id === session.actividadId);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(message);
    // You might want to show a toast notification here
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Notificar Asistentes</DialogTitle>
          <DialogDescription>
            Clase: {actividad?.name} - {session.dayOfWeek} {session.time}.
            Se notificará a {attendeesToNotify.length} persona(s).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Escribe tu mensaje aquí... Ej: La clase de hoy se cancela."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <Button variant="outline" size="sm" onClick={handleCopyToClipboard} className="w-full">
            Copiar Mensaje al Portapapeles
          </Button>
          <ScrollArea className="h-48 rounded-md border p-2">
            <div className="space-y-2">
              {attendeesToNotify.map(person => (
                <div key={person.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                  <span>{person.name}</span>
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700">
                    <a
                      href={`https://wa.me/${person.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <WhatsAppIcon />
                    </a>
                  </Button>
                </div>
              ))}
              {attendeesToNotify.length === 0 && (
                <div className="text-center p-4 text-sm text-muted-foreground">No hay asistentes para notificar.</div>
              )}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
