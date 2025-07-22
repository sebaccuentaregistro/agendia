
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudio } from '@/context/StudioContext';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { Session, Person } from '@/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type EnrolledPerson = Person & {
    enrollmentStatus: 'Fijo' | 'Recupero';
};

export function EnrolledStudentsSheet({ session, onClose }: { session: Session; onClose: () => void }) {
  const { people, actividades, specialists, spaces, attendance, isPersonOnVacation } = useStudio();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { enrolledPeople, sessionDetails } = useMemo(() => {
    if (!isMounted) {
      return { enrolledPeople: [], sessionDetails: {} };
    }
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    const attendanceRecord = attendance.find(a => a.sessionId === session.id && a.date === todayStr);
    const oneTimeAttendeeIds = new Set(attendanceRecord?.oneTimeAttendees || []);
    
    // Filter out people on vacation from their regular spot
    const regularIds = new Set(session.personIds.filter(pid => {
        const person = people.find(p => p.id === pid);
        return person && !isPersonOnVacation(person, today);
    }));

    const allAttendees: EnrolledPerson[] = [];

    people.forEach(person => {
        const isRegular = regularIds.has(person.id);
        const isOneTime = oneTimeAttendeeIds.has(person.id);

        if(isRegular) {
            allAttendees.push({ ...person, enrollmentStatus: 'Fijo' });
        } else if (isOneTime) {
            allAttendees.push({ ...person, enrollmentStatus: 'Recupero' });
        }
    });
    
    const specialist = specialists.find((i) => i.id === session.instructorId);
    const actividad = actividades.find((s) => s.id === session.actividadId);
    const space = spaces.find((s) => s.id === session.spaceId);
    
    return { 
        enrolledPeople: allAttendees.sort((a, b) => a.name.localeCompare(b.name)),
        sessionDetails: { specialist, actividad, space } 
    };
  }, [isMounted, people, session, attendance, isPersonOnVacation, specialists, actividades, spaces]);

  const formatWhatsAppLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

  return (
    <Sheet open={!!session} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Inscriptos en {(sessionDetails as any).actividad?.name || 'Sesión'}</SheetTitle>
          <SheetDescription>
            {session.dayOfWeek} a las {session.time} en {(sessionDetails as any).space?.name || 'N/A'}.
            <br/>
            {enrolledPeople.length} de {(sessionDetails as any).space?.capacity || 0} personas inscriptas.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="mt-4 space-y-4 h-[calc(100%-8rem)] pr-4">
          {enrolledPeople.length > 0 ? (
            enrolledPeople.map(person => (
              <Card key={person.id} className="p-3 bg-card/80 border">
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
                <p className="text-sm text-muted-foreground">No hay personas inscriptas.</p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
