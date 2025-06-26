
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardTitle, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Calendar, Users, ClipboardList, Star, Warehouse, AlertTriangle, User as UserIcon, DoorOpen, LineChart, CheckCircle2, ClipboardCheck, Plane } from 'lucide-react';
import Link from 'next/link';
import { useStudio } from '@/context/StudioContext';
import { useMemo, useState } from 'react';
import type { Session, Person } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStudentPaymentStatus } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { Button } from '@/components/ui/button';
import { AttendanceSheet } from '@/components/attendance-sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

// Helper function to render student cards inside the sheet
function EnrolledStudentsSheet({ session, onClose }: { session: Session; onClose: () => void }) {
  const { people, actividades, specialists, spaces, attendance, isPersonOnVacation } = useStudio();
  
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const today = useMemo(() => new Date(), []);

  const enrolledPeople = useMemo(() => {
    const attendanceRecord = attendance.find(a => a.sessionId === session.id && a.date === todayStr);
    const oneTimeIds = attendanceRecord?.oneTimeAttendees || [];
    
    const regularIds = session.personIds.filter(pid => {
        const person = people.find(p => p.id === pid);
        return person && !isPersonOnVacation(person, today);
    });
    
    const allEnrolledIds = [...new Set([...regularIds, ...oneTimeIds])];
    
    return people
      .filter(p => allEnrolledIds.includes(p.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [people, session, attendance, todayStr, isPersonOnVacation, today]);

  const sessionDetails = useMemo(() => {
    const specialist = specialists.find((i) => i.id === session.instructorId);
    const actividad = actividades.find((s) => s.id === session.actividadId);
    const space = spaces.find((s) => s.id === session.spaceId);
    return { specialist, actividad, space };
  }, [session, specialists, actividades, spaces]);

  const formatWhatsAppLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

  return (
    <Sheet open={!!session} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Inscriptos en {sessionDetails.actividad?.name || 'Sesión'}</SheetTitle>
          <SheetDescription>
            {session.dayOfWeek} a las {session.time} en {sessionDetails.space?.name || 'N/A'}.
            <br/>
            {enrolledPeople.length} de {sessionDetails.space?.capacity || 0} personas inscriptas.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="mt-4 space-y-4 h-[calc(100%-8rem)] pr-4">
          {enrolledPeople.length > 0 ? (
            enrolledPeople.map(person => (
              <Card key={person.id} className="p-3 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border-white/20">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{person.name}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
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
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-white/30">
                <p className="text-sm text-slate-500 dark:text-slate-400">No hay personas inscriptas.</p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}


export default function Dashboard() {
  const { sessions, specialists, actividades, spaces, people, attendance, isPersonOnVacation } = useStudio();
  const [filters, setFilters] = useState({
    actividadId: 'all',
    spaceId: 'all',
    specialistId: 'all',
    timeOfDay: 'all', // Mañana, Tarde, Noche
  });
  const [selectedSessionForStudents, setSelectedSessionForStudents] = useState<Session | null>(null);
  const [sessionForAttendance, setSessionForAttendance] = useState<Session | null>(null);

  const overdueCount = useMemo(() => {
    const now = new Date();
    return people.filter(p => getStudentPaymentStatus(p, now) === 'Atrasado').length;
  }, [people]);

  const onVacationCount = useMemo(() => {
    const now = new Date();
    return people.filter(p => isPersonOnVacation(p, now)).length;
  }, [people, isPersonOnVacation]);

  const hasOverdue = overdueCount > 0;
  const hasOnVacation = onVacationCount > 0;

  const navItems = [
    { href: "/schedule", label: "Horarios", icon: Calendar, count: sessions.length },
    { href: "/students", label: "Personas", icon: Users, count: people.length },
    { href: "/instructors", label: "Especialistas", icon: ClipboardList, count: specialists.length },
    { href: "/specializations", label: "Actividades", icon: Star, count: actividades.length },
    { href: "/spaces", label: "Espacios", icon: Warehouse, count: spaces.length },
    { href: "/statistics", label: "Estadísticas", icon: LineChart, count: null },
  ];

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const { todaysSessions, filteredSessions, todayName } = useMemo(() => {
    const dayMap: { [key: number]: Session['dayOfWeek'] } = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
    const today = new Date();
    const todayName = dayMap[today.getDay()];
    const todayStr = format(today, 'yyyy-MM-dd');

    const getTimeOfDay = (time: string): 'Mañana' | 'Tarde' | 'Noche' => {
        if (!time) return 'Tarde';
        const hour = parseInt(time.split(':')[0], 10);
        if (hour < 12) return 'Mañana';
        if (hour < 18) return 'Tarde';
        return 'Noche';
    };

    const todaysSessions = sessions
      .filter(session => session.dayOfWeek === todayName)
      .map(session => {
        const attendanceRecord = attendance.find(a => a.sessionId === session.id && a.date === todayStr);
        const oneTimeAttendees = attendanceRecord?.oneTimeAttendees || [];
        const activeRegulars = session.personIds.filter(pid => {
            const person = people.find(p => p.id === pid);
            return person && !isPersonOnVacation(person, today);
        });
        return {
          ...session,
          enrolledCount: activeRegulars.length + oneTimeAttendees.length,
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));

    const filtered = todaysSessions.filter(session => {
        const timeOfDay = getTimeOfDay(session.time);
        return (
            (filters.actividadId === 'all' || session.actividadId === filters.actividadId) &&
            (filters.spaceId === 'all' || session.spaceId === filters.spaceId) &&
            (filters.specialistId === 'all' || session.instructorId === filters.specialistId) &&
            (filters.timeOfDay === 'all' || timeOfDay === filters.timeOfDay)
        );
    });

    return { todaysSessions, filteredSessions: filtered, todayName };
  }, [sessions, filters, attendance, people, isPersonOnVacation]);

  const getSessionDetails = (session: Session) => {
    const specialist = specialists.find((i) => i.id === session.instructorId);
    const actividad = actividades.find((s) => s.id === session.actividadId);
    const space = spaces.find((s) => s.id === session.spaceId);
    return { specialist, actividad, space };
  };

  const formatTime = (time: string) => {
    if (!time || !time.includes(':')) return 'N/A';
    return time;
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Inicio" />
      
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          <Link href="/students?filter=overdue" className="transition-transform hover:-translate-y-1">
            <Card className={cn(
                "group flex flex-col items-center justify-center p-2 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 aspect-square",
                hasOverdue ? "hover:!border-destructive" : "hover:!border-green-500"
            )}>
                <div className={cn(
                    "flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full",
                    hasOverdue ? "bg-destructive/10 text-destructive" : "bg-green-100 text-green-600"
                )}>
                    {hasOverdue ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                </div>
                <CardTitle className={cn(
                    "text-sm font-semibold",
                    hasOverdue ? "text-destructive" : "text-green-600"
                )}>
                    Atrasados
                </CardTitle>
                <p className="text-xl font-bold text-slate-600 dark:text-slate-300">{overdueCount}</p>
            </Card>
          </Link>
          <Link href="/students?filter=on-vacation" className="transition-transform hover:-translate-y-1">
            <Card className={cn(
                "group flex flex-col items-center justify-center p-2 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 aspect-square",
                hasOnVacation ? "hover:!border-blue-500" : "hover:!border-green-500"
            )}>
                <div className={cn(
                    "flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full",
                    hasOnVacation ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                )}>
                    <Plane className="h-5 w-5" />
                </div>
                <CardTitle className={cn(
                    "text-sm font-semibold",
                    hasOnVacation ? "text-blue-600" : "text-green-600"
                )}>
                    En Vacaciones
                </CardTitle>
                <p className="text-xl font-bold text-slate-600 dark:text-slate-300">{onVacationCount}</p>
            </Card>
          </Link>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition-transform hover:-translate-y-1">
              <Card className="group flex flex-col items-center justify-center p-2 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:!border-primary aspect-square">
                  <div className="flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.label}</CardTitle>
                  {item.count !== null && (
                    <p className="text-xl font-bold text-slate-600 dark:text-slate-400">{item.count}</p>
                  )}
              </Card>
          </Link>
          ))}
      </div>

      <Card className="flex flex-col bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg text-slate-800 dark:text-slate-100">Sesiones de Hoy - {todayName}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filters.specialistId} onValueChange={(value) => handleFilterChange('specialistId', value)}>
                <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-white/80 dark:bg-zinc-800/80 border-slate-300/50 rounded-xl">
                  <SelectValue placeholder="Especialista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Especialista</SelectItem>
                  {specialists.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.actividadId} onValueChange={(value) => handleFilterChange('actividadId', value)}>
                <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-white/80 dark:bg-zinc-800/80 border-slate-300/50 rounded-xl">
                  <SelectValue placeholder="Actividad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Actividades</SelectItem>
                  {actividades.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.spaceId} onValueChange={(value) => handleFilterChange('spaceId', value)}>
                <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-white/80 dark:bg-zinc-800/80 border-slate-300/50 rounded-xl">
                  <SelectValue placeholder="Espacio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Espacios</SelectItem>
                  {spaces.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.timeOfDay} onValueChange={(value) => handleFilterChange('timeOfDay', value)}>
                <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-white/80 dark:bg-zinc-800/80 border-slate-300/50 rounded-xl">
                  <SelectValue placeholder="Horario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo el Día</SelectItem>
                  <SelectItem value="Mañana">Mañana</SelectItem>
                  <SelectItem value="Tarde">Tarde</SelectItem>
                  <SelectItem value="Noche">Noche</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          {todaysSessions.length > 0 ? (
            filteredSessions.length > 0 ? (
              <ul className="space-y-4">
                {filteredSessions.map(session => {
                  const { specialist, actividad, space } = getSessionDetails(session);
                  const enrolledCount = (session as any).enrolledCount;
                  const capacity = session.sessionType === 'Individual' ? 1 : space?.capacity ?? 0;
                  const isFull = capacity > 0 && enrolledCount >= capacity;

                  const now = new Date();
                  const [hour, minute] = session.time.split(':').map(Number);
                  const sessionStartTime = new Date();
                  sessionStartTime.setHours(hour, minute, 0, 0);
                  const attendanceWindowStart = new Date(sessionStartTime.getTime() - 20 * 60 * 1000);
                  const isAttendanceAllowed = now >= attendanceWindowStart;
                  const tooltipMessage = isAttendanceAllowed ? "Pasar Lista" : "La asistencia se habilita 20 minutos antes de la clase.";

                  return (
                    <li 
                      key={session.id}
                      className={cn(
                        "flex items-center gap-4 rounded-xl border p-3 transition-all duration-200 bg-white/30 dark:bg-white/10 border-white/20 hover:bg-white/50 dark:hover:bg-white/20 hover:shadow-md",
                        isFull && "bg-pink-500/20 border-pink-500/30"
                      )}
                    >
                      <div className="flex-1 space-y-1 cursor-pointer" onClick={() => setSelectedSessionForStudents(session)}>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{actividad?.name || 'Sesión'}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1.5"><UserIcon className="h-3 w-3" />{specialist?.name || 'N/A'}</span>
                          <span className="flex items-center gap-1.5"><DoorOpen className="h-3 w-3" />{space?.name || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                          <div>
                            <p className="font-bold text-primary">{formatTime(session.time)}</p>
                            <p className={cn(
                                "text-sm", 
                                isFull ? "font-semibold text-pink-600 dark:text-pink-400" : "text-slate-600 dark:text-slate-400"
                              )}>
                              {enrolledCount}/{capacity} inscriptos
                            </p>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span tabIndex={0}>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-slate-600 dark:text-slate-300 hover:bg-white/50" onClick={() => setSessionForAttendance(session)} disabled={!isAttendanceAllowed}>
                                    <ClipboardCheck className="h-5 w-5" />
                                    <span className="sr-only">Pasar Lista</span>
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{tooltipMessage}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/30 p-10 text-center bg-white/20 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No se encontraron sesiones</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Prueba a cambiar o limpiar los filtros.</p>
              </div>
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/30 p-10 text-center bg-white/20 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No hay sesiones hoy</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">¡Día libre! Disfruta del descanso.</p>
            </div>
          )}
        </CardContent>
      </Card>
      {selectedSessionForStudents && (
         <EnrolledStudentsSheet 
            session={selectedSessionForStudents}
            onClose={() => setSelectedSessionForStudents(null)}
          />
      )}
      {sessionForAttendance && (
        <AttendanceSheet
          session={sessionForAttendance}
          onClose={() => setSessionForAttendance(null)}
        />
      )}
    </div>
  );
}
