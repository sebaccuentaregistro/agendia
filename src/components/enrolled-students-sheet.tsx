

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
import { Plane } from 'lucide-react';

type EnrollmentStatus = 'Fijo' | 'Recupero' | 'Vacaciones';

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

  const { enrolledPeople, sessionDetails, title, description } = useMemo(() => {
    if (!isMounted || !session) {
      return { enrolledPeople: [], sessionDetails: {}, title: '', description: '' };
    }
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const specialist = specialists.find((i) => i.id === session.instructorId);
    const actividad = actividades.find((s) => s.id === session.actividadId);
    const space = spaces.find((s) => s.id === session.spaceId);

    let attendees: EnrolledPerson[] = [];
    let rosterTitle = '';
    let rosterDescription = '';

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
        const attendanceRecord = attendance.find(a => a.sessionId === session.id && a.date === todayStr);
        const oneTimeAttendeeIds = new Set(attendanceRecord?.oneTimeAttendees || []);
        
        const allAttendeesMap = new Map<string, EnrolledPerson>();
        
        // Add fixed people who are NOT on vacation
        session.personIds.forEach(pid => {
            const person = people.find(p => p.id === pid);
            if (person && !isPersonOnVacation(person, today)) {
                 allAttendeesMap.set(pid, {...person, enrollmentStatus: 'Fijo'});
            }
        });

        // Add one-time attendees for today
        oneTimeAttendeeIds.forEach(pid => {
            const person = people.find(p => p.id === pid);
            if (person) {
                // If they were already in as fixed, this will just overwrite with new status.
                // But since they can't be on vacation and also a one-time attendee, this is fine.
                allAttendeesMap.set(pid, {...person, enrollmentStatus: 'Recupero'});
            }
        });
        attendees = Array.from(allAttendeesMap.values());
    }

    return { 
        enrolledPeople: attendees.sort((a, b) => a.name.localeCompare(b.name)),
        sessionDetails: { specialist, actividad, space, count: attendees.length },
        title: rosterTitle,
        description: rosterDescription,
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
        <ScrollArea className="mt-4 space-y-4 h-[calc(100%-8rem)] pr-4">
          {enrolledPeople.length > 0 ? (
            enrolledPeople.map(person => (
              <Card key={person.id} className={cn(
                "p-3 bg-card/80 border",
                person.enrollmentStatus === 'Vacaciones' && "opacity-60 bg-muted/50"
              )}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                     <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{person.name}</p>
                        <Badge variant={person.enrollmentStatus === 'Fijo' ? 'default' : person.enrollmentStatus === 'Vacaciones' ? 'outline' : 'secondary'} className={cn(
                            "text-xs",
                            person.enrollmentStatus === 'Fijo' && "bg-primary/80",
                            person.enrollmentStatus === 'Recupero' && "bg-amber-500/80 text-white",
                            person.enrollmentStatus === 'Vacaciones' && "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/10"
                        )}>
                            {person.enrollmentStatus === 'Vacaciones' && <Plane className="h-3 w-3 mr-1" />}
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
      </SheetContent>
    </Sheet>
  )
}
