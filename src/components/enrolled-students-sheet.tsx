

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudio } from '@/context/StudioContext';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { Session, Person } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Plane, AlertTriangle } from 'lucide-react';

type EnrollmentStatus = 'Fijo' | 'Recupero';

type EnrolledPerson = Person & {
    enrollmentStatus: EnrollmentStatus;
    displayDate?: string;
};

interface EnrolledStudentsSheetProps {
    session: Session;
    rosterType: 'fixed' | 'daily';
    onClose: () => void;
}

export function EnrolledStudentsSheet({ session, rosterType, onClose }: EnrolledStudentsSheetProps) {
  const { people, actividades, specialists, spaces, attendance, isPersonOnVacation } = useStudio();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { enrolledPeople, sessionDetails, title, description, debugInfo } = useMemo(() => {
    if (!isMounted || !session) {
      return { enrolledPeople: [], sessionDetails: {}, title: '', description: '', debugInfo: null };
    }
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const specialist = specialists.find((i) => i.id === session.instructorId);
    const actividad = actividades.find((s) => s.id === session.actividadId);
    const space = spaces.find((s) => s.id === session.spaceId);

    let attendees: EnrolledPerson[] = [];
    let rosterTitle = '';
    let rosterDescription = '';
    let debugData: any = {};

    if (rosterType === 'fixed') {
        rosterTitle = 'Inscriptos Fijos';
        rosterDescription = `Lista de todas las personas con un cupo permanente en ${actividad?.name || 'la sesión'}.`;
        attendees = session.personIds
            .map(pid => people.find(p => p.id === pid))
            .filter((p): p is Person => !!p)
            .map(p => ({...p, enrollmentStatus: 'Fijo'}));

    } else { // rosterType === 'daily'
        rosterTitle = 'Asistentes de Hoy';
        rosterDescription = `Personas que se espera que asistan hoy a ${actividad?.name || 'la sesión'}.`;
        
        const fixedEnrolledPeople = session.personIds
            .map(pid => people.find(p => p.id === pid))
            .filter((p): p is Person => !!p);

        const vacationingPeople = fixedEnrolledPeople.filter(p => isPersonOnVacation(p, today));
        const activeFixedPeople = fixedEnrolledPeople.filter(p => !isPersonOnVacation(p, today));

        const attendanceRecord = attendance.find(a => a.sessionId === session.id && a.date === todayStr);
        const oneTimeAttendeeIds = new Set(attendanceRecord?.oneTimeAttendees || []);
        const oneTimeAttendees = people.filter(p => oneTimeAttendeeIds.has(p.id));

        const allAttendeesMap = new Map<string, EnrolledPerson>();
        activeFixedPeople.forEach(p => allAttendeesMap.set(p.id, {...p, enrollmentStatus: 'Fijo'}));
        oneTimeAttendees.forEach(p => allAttendeesMap.set(p.id, {...p, enrollmentStatus: 'Recupero'}));
        
        attendees = Array.from(allAttendeesMap.values());
        
        debugData = {
          fixed: fixedEnrolledPeople.map(p => p.name),
          vacation: vacationingPeople.map(p => p.name),
          oneTime: oneTimeAttendees.map(p => p.name),
          finalCount: fixedEnrolledPeople.length - vacationingPeople.length + oneTimeAttendees.length
        };
    }

    return { 
        enrolledPeople: attendees.sort((a, b) => a.name.localeCompare(b.name)),
        sessionDetails: { specialist, actividad, space, count: attendees.length },
        title: rosterTitle,
        description: rosterDescription,
        debugInfo: debugData
    };
  }, [isMounted, session, rosterType, people, attendance, isPersonOnVacation, specialists, actividades, spaces]);

  const formatWhatsAppLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

  const { specialist, actividad, space, count } = sessionDetails as any;

  return (
    <Sheet open={!!session} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {description}
            <br />
            Total: {count || 0} persona(s).
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="mt-4 space-y-4 h-[calc(100%-14rem)] pr-4">
          {enrolledPeople.length > 0 ? (
            enrolledPeople.map(person => (
              <Card key={person.id} className={cn(
                "p-3 bg-card/80 border"
              )}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                     <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{person.name}</p>
                        <Badge variant={person.enrollmentStatus === 'Fijo' ? 'default' : 'secondary'} className={cn(
                            "text-xs",
                            person.enrollmentStatus === 'Fijo' && "bg-primary/80",
                            person.enrollmentStatus === 'Recupero' && "bg-amber-500/80 text-white"
                        )}>
                            {person.enrollmentStatus}
                        </Badge>
                     </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{person.phone}</span>
                       <a href={formatWhatsAppLink(person.phone)} target="_blank" rel="noopener noreferrer">
                          <WhatsAppIcon className="text-green-600 hover:text-green-700 transition-colors" />
                          <span className="sr-only">Enviar WhatsApp a {person.name}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/30">
                <p className="text-sm text-muted-foreground">No hay personas en esta lista.</p>
            </div>
          )}
        </ScrollArea>
        {rosterType === 'daily' && debugInfo && (
            <div className="mt-4 p-3 border-2 border-dashed border-destructive/50 rounded-lg text-xs">
                <h4 className="font-bold text-destructive flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4"/>Desglose del Cálculo</h4>
                <p><strong>+ Inscriptos Fijos ({debugInfo.fixed.length}):</strong> {debugInfo.fixed.join(', ') || 'Ninguno'}</p>
                <p><strong>- De Vacaciones ({debugInfo.vacation.length}):</strong> {debugInfo.vacation.join(', ') || 'Ninguno'}</p>
                <p><strong>+ Recuperos Hoy ({debugInfo.oneTime.length}):</strong> {debugInfo.oneTime.join(', ') || 'Ninguno'}</p>
                <p className="font-bold mt-1 pt-1 border-t"><strong>= Total Ocupación Hoy: {debugInfo.finalCount}</strong></p>
            </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
