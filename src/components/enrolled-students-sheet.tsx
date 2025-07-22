
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
import { Plane } from 'lucide-react';

type EnrollmentStatus = 'Fijo' | 'Recupero' | 'Vacaciones';

type EnrolledPerson = Person & {
    enrollmentStatus: EnrollmentStatus;
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
    
    const allAttendees: EnrolledPerson[] = [];
    const processedIds = new Set<string>();

    // First, process all fixed members of the session
    session.personIds.forEach(personId => {
        const person = people.find(p => p.id === personId);
        if (person) {
            const onVacation = isPersonOnVacation(person, today);
            allAttendees.push({
                ...person,
                enrollmentStatus: onVacation ? 'Vacaciones' : 'Fijo'
            });
            processedIds.add(personId);
        }
    });

    // Then, add any one-time attendees who aren't already in the list
    oneTimeAttendeeIds.forEach(personId => {
        if (!processedIds.has(personId)) {
            const person = people.find(p => p.id === personId);
            if (person) {
                allAttendees.push({ ...person, enrollmentStatus: 'Recupero' });
            }
        }
    });
    
    const specialist = specialists.find((i) => i.id === session.instructorId);
    const actividad = actividades.find((s) => s.id === session.actividadId);
    const space = spaces.find((s) => s.id === session.spaceId);
    
    // The total count for display should be the active people for today
    const dailyEnrolledCount = allAttendees.filter(p => p.enrollmentStatus !== 'Vacaciones').length;

    return { 
        enrolledPeople: allAttendees.sort((a, b) => a.name.localeCompare(b.name)),
        sessionDetails: { specialist, actividad, space, dailyEnrolledCount } 
    };
  }, [isMounted, people, session, attendance, isPersonOnVacation, specialists, actividades, spaces]);

  const formatWhatsAppLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

  const { specialist, actividad, space, dailyEnrolledCount } = sessionDetails as any;

  return (
    <Sheet open={!!session} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Inscriptos en {actividad?.name || 'Sesión'}</SheetTitle>
          <SheetDescription>
            {session.dayOfWeek} a las {session.time} en {space?.name || 'N/A'}.
            <br/>
            {dailyEnrolledCount || 0} de {space?.capacity || 0} personas asisten hoy.
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
                <p className="text-sm text-muted-foreground">No hay personas inscriptas.</p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
