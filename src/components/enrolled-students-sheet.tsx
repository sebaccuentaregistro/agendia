

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudio } from '@/context/StudioContext';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { Session, Person } from '@/types';
import { format, nextDay, Day, startOfDay, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Plane, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


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
  const { people, actividades, specialists, spaces, attendance, isPersonOnVacation, removeOneTimeAttendee, removePersonFromSession } = useStudio();
  const [isMounted, setIsMounted] = useState(false);
  const [personToRemove, setPersonToRemove] = useState<EnrolledPerson | null>(null);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { enrolledPeople, sessionDetails, title, description, debugInfo } = useMemo(() => {
    if (!isMounted || !session) {
      return { enrolledPeople: [], sessionDetails: {}, title: '', description: '', debugInfo: {} };
    }
    
    const dayMap: Record<Session['dayOfWeek'], Day> = { 'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6 };
    const today = startOfDay(new Date());
    const sessionDayIndex = dayMap[session.dayOfWeek];
    const sessionDate = today.getDay() === sessionDayIndex ? today : nextDay(today, sessionDayIndex);
    const sessionDateStr = format(sessionDate, 'yyyy-MM-dd');

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
        rosterTitle = `Asistentes del ${format(sessionDate, "eeee dd/MM", { locale: es })}`;
        rosterDescription = `Personas que se espera que asistan a ${actividad?.name || 'la sesión'} en esta fecha.`;
        
        const fixedEnrolledPeople = session.personIds
            .map(pid => people.find(p => p.id === pid))
            .filter((p): p is Person => !!p);

        const activeFixedPeople = fixedEnrolledPeople.filter(p => !isPersonOnVacation(p, sessionDate));

        const attendanceRecord = attendance.find(a => a.sessionId === session.id && a.date === sessionDateStr);
        const oneTimeAttendeeIds = new Set(attendanceRecord?.oneTimeAttendees || []);
        const oneTimeAttendees = people.filter(p => oneTimeAttendeeIds.has(p.id));

        const allAttendeesMap = new Map<string, EnrolledPerson>();
        
        activeFixedPeople.forEach(p => allAttendeesMap.set(p.id, {...p, enrollmentStatus: 'Fijo'}));
        
        oneTimeAttendees.forEach(p => allAttendeesMap.set(p.id, {
            ...p, 
            enrollmentStatus: 'Recupero',
            displayDate: format(parse(attendanceRecord!.date, 'yyyy-MM-dd', new Date()), 'dd/MM/yy')
        }));
        
        attendees = Array.from(allAttendeesMap.values());
        
        debugData = {
          usedDate: sessionDateStr,
          foundFixed: activeFixedPeople.length,
          foundOneTime: oneTimeAttendees.length,
          oneTimeNames: oneTimeAttendees.map(p => p.name),
          totalInList: attendees.length
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
  
  const handleRemoveClick = (person: EnrolledPerson) => {
    setPersonToRemove(person);
  };

  const handleConfirmRemove = () => {
    if (!personToRemove) return;
    
    if (personToRemove.enrollmentStatus === 'Recupero') {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      removeOneTimeAttendee(session.id, personToRemove.id, todayStr);
    } else {
      removePersonFromSession(session.id, personToRemove.id);
    }
    setPersonToRemove(null);
  };

  return (
    <>
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

        {/* --- DEBUG PANEL --- */}
        <Card className="mt-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500/50">
          <p className="text-xs font-bold text-yellow-700 dark:text-yellow-300">PANEL DE DEBUG (Temporal)</p>
          <pre className="text-[10px] text-yellow-800 dark:text-yellow-200 whitespace-pre-wrap break-all">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </Card>
        {/* --- END DEBUG PANEL --- */}

        <ScrollArea className="mt-4 space-y-4 h-[calc(100%-10rem)] pr-4">
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
                            {person.enrollmentStatus} {person.displayDate}
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
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveClick(person)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Eliminar asistente</span>
                  </Button>
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
    
    <AlertDialog open={!!personToRemove} onOpenChange={(open) => !open && setPersonToRemove(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                <AlertDialogDescription>
                    {personToRemove?.enrollmentStatus === 'Recupero' 
                        ? `Estás a punto de quitar a ${personToRemove.name} de la lista de recuperos de hoy. Esta acción no se puede deshacer.`
                        : `Estás a punto de desinscribir permanentemente a ${personToRemove?.name} de esta clase. ¿Estás seguro?`
                    }
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPersonToRemove(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmRemove}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
