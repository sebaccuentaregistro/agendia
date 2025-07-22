
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Pencil, Users, FileDown, Clock, User, MapPin, UserPlus, LayoutGrid, CalendarDays, ClipboardCheck, CalendarIcon, Send, Star, MoreHorizontal, UserX, Signal, DoorOpen, List, Plane, CalendarClock, ListPlus, ChevronDown, Pointer } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionAlert, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import type { Person, Session, WaitlistEntry, WaitlistProspect } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from '@/components/ui/select';
import { cn, exportToCsv } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScheduleCalendarView } from '@/components/schedule-calendar-view';
import { AttendanceSheet } from '@/components/attendance-sheet';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle, AlertCircle } from '@/components/ui/alert';
import { NotifyAttendeesDialog } from '@/components/notify-attendees-dialog';
import { WaitlistDialog } from '@/components/waitlist-dialog';
import { OneTimeAttendeeDialog } from '@/components/one-time-attendee-dialog';
import { EnrollPeopleDialog } from '@/components/enroll-people-dialog';
import { EnrolledStudentsSheet } from '@/components/enrolled-students-sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';


const formSchema = z.object({
  instructorId: z.string().min(1, { message: 'Debes seleccionar un especialista.' }),
  actividadId: z.string().min(1, { message: 'Debes seleccionar una actividad.' }),
  spaceId: z.string().min(1, { message: 'Debes seleccionar un espacio.' }),
  dayOfWeek: z.enum(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']),
  time: z.string().min(1, { message: 'La hora es obligatoria.' }).regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:MM).' }),
  levelId: z.preprocess((val) => (val === 'none' || val === '' ? undefined : val), z.string().optional()),
});

const formatTime = (time: string) => {
    if (!time || !time.includes(':')) return 'N/A';
    return time;
};

type UnifiedWaitlistItem =
  | (Person & { isProspect: false; entry: string })
  | (WaitlistProspect & { isProspect: true; entry: WaitlistProspect });


function SchedulePageContent() {
  const { specialists, actividades, sessions, spaces, addSession, updateSession, deleteSession, levels, people, loading, isPersonOnVacation, attendance, removeFromWaitlist } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | undefined>(undefined);
  const [sessionForDelete, setSessionForDelete] = useState<Session | null>(null);
  const [sessionForEnrollment, setSessionForEnrollment] = useState<Session | null>(null);
  const [sessionForAttendance, setSessionForAttendance] = useState<Session | null>(null);
  const [sessionForOneTime, setSessionForOneTime] = useState<Session | null>(null);
  const [personForOneTime, setPersonForOneTime] = useState<string | null>(null);
  const [sessionForWaitlist, setSessionForWaitlist] = useState<Session | null>(null);
  const [sessionForNotification, setSessionForNotification] = useState<Session | null>(null);
  const [sessionForStudentsSheet, setSessionForStudentsSheet] = useState<Session | null>(null);
  const [rosterTypeForSheet, setRosterTypeForSheet] = useState<'fixed' | 'daily'>('daily');
  
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'cards');
  const [filters, setFilters] = useState({
    day: searchParams.get('day') || 'all',
    actividadId: searchParams.get('actividadId') || 'all',
    specialistId: searchParams.get('specialistId') || 'all',
    spaceId: searchParams.get('spaceId') || 'all',
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { dayOfWeek: 'Lunes', time: '', levelId: 'none' },
  });
  
  const filteredAndSortedSessions = useMemo(() => {
    const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    const recoveryMode = searchParams.get('recoveryMode') === 'true';
    const personId = searchParams.get('personId');

    return sessions
        .filter(session => {
            if (recoveryMode && personId) {
                 if (session.personIds.includes(personId)) return false; // Hide classes the person is already in
            }
            return (
                (filters.day === 'all' || session.dayOfWeek === filters.day) &&
                (filters.actividadId === 'all' || session.actividadId === filters.actividadId) &&
                (filters.specialistId === 'all' || session.instructorId === filters.specialistId) &&
                (filters.spaceId === 'all' || session.spaceId === filters.spaceId)
            );
        })
        .sort((a, b) => {
            const dayComparison = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
            if (dayComparison !== 0) return dayComparison;
            return a.time.localeCompare(b.time);
        });
  }, [sessions, filters, searchParams]);
  

  const getSessionDetails = (session: Session) => {
    const specialist = specialists.find((i) => i.id === session.instructorId);
    const actividad = actividades.find((s) => s.id === session.actividadId);
    const space = spaces.find((s) => s.id === session.spaceId);
    const level = levels.find(l => l.id === session.levelId);
    return { specialist, actividad, space, level };
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const sessionData = {
        ...values,
        levelId: values.levelId === 'none' ? undefined : values.levelId,
    };
    if (selectedSession) {
      updateSession({ ...selectedSession, ...sessionData });
    } else {
      addSession(sessionData);
    }
    setIsDialogOpen(false);
  };

  const handleEdit = (session: Session) => {
    setSelectedSession(session);
    form.reset({
      instructorId: session.instructorId,
      actividadId: session.actividadId,
      spaceId: session.spaceId,
      dayOfWeek: session.dayOfWeek,
      time: session.time,
      levelId: session.levelId || 'none',
    });
    setIsDialogOpen(true);
  };
  
  const handleAdd = () => {
    setSelectedSession(undefined);
    form.reset({
        instructorId: '',
        actividadId: '',
        spaceId: '',
        dayOfWeek: 'Lunes',
        time: '',
        levelId: 'none'
    });
    setIsDialogOpen(true);
  };
  
  const handleDelete = () => {
    if (sessionForDelete) {
      deleteSession(sessionForDelete.id);
      setSessionForDelete(null);
    }
  };
  
  const handleOpenOneTime = (session: Session) => {
    const personId = searchParams.get('personId');
    setPersonForOneTime(personId);
    setSessionForOneTime(session);
  };

  const availableSpecialists = useMemo(() => {
    const actividadId = form.watch('actividadId');
    if (!actividadId) return specialists;
    return specialists.filter(s => s.actividadIds.includes(actividadId));
  }, [specialists, form.watch('actividadId')]);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete(filterName);
    } else {
      newParams.set(filterName, value);
    }
    router.push(`?${newParams.toString()}`);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', value);
    router.push(`?${newParams.toString()}`);
  };

  const handleExport = () => {
    const dataToExport = filteredAndSortedSessions.map(session => {
        const { specialist, actividad, space, level } = getSessionDetails(session);
        const enrolledCount = session.personIds.length;
        const spaceCapacity = space?.capacity ?? 0;
        return {
            dia: session.dayOfWeek,
            hora: session.time,
            actividad: actividad?.name || 'N/A',
            especialista: specialist?.name || 'N/A',
            espacio: space?.name || 'N/A',
            nivel: level?.name || 'N/A',
            inscriptos: enrolledCount,
            capacidad: spaceCapacity,
        };
    });
    const headers = {
        dia: "Día",
        hora: "Hora",
        actividad: "Actividad",
        especialista: "Especialista",
        espacio: "Espacio",
        nivel: "Nivel",
        inscriptos: "Inscriptos",
        capacidad: "Capacidad",
    };
    exportToCsv('horarios.csv', dataToExport, headers);
  }

  const SessionCard = ({ session }: { session: Session }) => {
    const { specialist, actividad, space, level } = getSessionDetails(session);
    const enrolledCount = session.personIds.length;
    const spaceCapacity = space?.capacity ?? 0;

    const today = startOfDay(new Date());
    const dayMap: { [key: number]: Session['dayOfWeek'] } = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
    const isToday = session.dayOfWeek === dayMap[today.getDay()];
    
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const sessionStartTime = useMemo(() => {
        if (!isToday) return null;
        const [hour, minute] = session.time.split(':').map(Number);
        const startTime = new Date(today);
        startTime.setHours(hour, minute, 0, 0);
        return startTime;
    }, [isToday, session.time, today]);

    const attendanceWindowStart = useMemo(() => {
        return sessionStartTime ? new Date(sessionStartTime.getTime() - 20 * 60 * 1000) : null;
    }, [sessionStartTime]);

    const isAttendanceAllowed = attendanceWindowStart ? now >= attendanceWindowStart : false;
    const tooltipMessage = isAttendanceAllowed ? "Pasar Lista" : "La asistencia se habilita 20 minutos antes.";

    const recoveryMode = searchParams.get('recoveryMode') === 'true';

    const { dailyOccupancy, recoveryNames, onVacationNames } = useMemo(() => {
      const todayStr = format(today, 'yyyy-MM-dd');

      const fixedEnrolledPeople = session.personIds
          .map(pid => people.find(p => p.id === pid))
          .filter((p): p is Person => !!p);

      const activeFixedPeople = fixedEnrolledPeople.filter(p => !isPersonOnVacation(p, today));
      
      const attendanceRecord = attendance.find(a => a.sessionId === session.id && a.date === todayStr);

      // Validate one-time attendees to prevent counting "ghosts"
      const validOneTimeAttendees = (attendanceRecord?.oneTimeAttendees || [])
        .map(id => people.find(p => p.id === id))
        .filter((p): p is Person => !!p);
        
      const recoveryCount = validOneTimeAttendees.length;
      const oneTimeNames = validOneTimeAttendees.map(p => p.name);

      const dailyOccupancy = activeFixedPeople.length + recoveryCount;
      
      const onVacationNames = fixedEnrolledPeople
        .filter(p => isPersonOnVacation(p, today))
        .map(p => p.name);
        
      return { dailyOccupancy, recoveryNames: oneTimeNames, onVacationNames };
  }, [session, people, isPersonOnVacation, attendance, today]);
    
     const waitlistDetails = useMemo(() => {
        if (!session.waitlist) return [];
        return (session.waitlist || [])
            .map(entry => {
                if (typeof entry === 'string') {
                    const person = people.find(p => p.id === entry);
                    if (!person) return null;
                    return { ...person, isProspect: false as const, entry: entry as string };
                }
                return { ...entry, isProspect: true as const, entry: entry as WaitlistProspect };
            })
            .filter((p): p is UnifiedWaitlistItem => !!p);
     }, [session.waitlist, people]);

    const waitlistCount = waitlistDetails?.length || 0;
    
    const occupancyToday = isToday ? dailyOccupancy : enrolledCount;
    const canRecover = occupancyToday < spaceCapacity;

    if (recoveryMode && !canRecover) {
        return null;
    }

    const utilization = spaceCapacity > 0 ? (occupancyToday / spaceCapacity) * 100 : 0;
    const isFull = utilization >= 100;
    const isNearlyFull = utilization >= 80 && !isFull;
    
    const handleOccupancyClick = () => {
        setRosterTypeForSheet(isToday ? 'daily' : 'fixed');
        setSessionForStudentsSheet(session);
    };

    return (
        <Card className="flex flex-col bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5">
            <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">{actividad?.name}</CardTitle>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-300 -mr-2 -mt-2"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleEdit(session)}><Pencil className="mr-2 h-4 w-4" />Editar Sesión</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setSessionForNotification(session)}><Send className="mr-2 h-4 w-4" />Notificar Asistentes</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setSessionForDelete(session)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Eliminar Sesión</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    <p className="font-semibold">{session.dayOfWeek}, {formatTime(session.time)}</p>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 flex-grow space-y-4">
                <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-2"><User className="h-4 w-4 text-slate-500" /> {specialist?.name}</p>
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-500" /> {space?.name}</p>
                    {level && <p className="flex items-center gap-2 capitalize"><Signal className="h-4 w-4 text-slate-500" /> {level.name}</p>}
                </div>
                
                 <Collapsible className="space-y-2">
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted">
                        <span>Asistentes del Día</span>
                        <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 pt-2 text-xs">
                        <div className="rounded-md border p-2">
                            <h4 className="font-semibold mb-1 flex items-center gap-1.5"><Users className="h-3 w-3"/>Fijos ({session.personIds.length})</h4>
                            {session.personIds.map(id => people.find(p=>p.id===id)?.name).join(', ') || <span className="text-muted-foreground">Ninguno</span>}
                        </div>
                        <div className="rounded-md border p-2">
                            <h4 className="font-semibold mb-1 flex items-center gap-1.5"><CalendarClock className="h-3 w-3"/>Recuperos Hoy ({recoveryNames.length})</h4>
                            {recoveryNames.length > 0 ? recoveryNames.join(', ') : <span className="text-muted-foreground">Ninguno</span>}
                        </div>
                        <div className="rounded-md border p-2">
                            <h4 className="font-semibold mb-1 flex items-center gap-1.5"><Plane className="h-3 w-3"/>De Vacaciones Hoy ({onVacationNames.length})</h4>
                            {onVacationNames.length > 0 ? onVacationNames.join(', ') : <span className="text-muted-foreground">Ninguno</span>}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 border-t border-white/20 p-2 mt-auto">
                 <div className="w-full px-2 pt-1 space-y-1 cursor-pointer" onClick={handleOccupancyClick}>
                    <div className="flex justify-between items-center text-xs font-semibold">
                         <span className="text-muted-foreground">{isToday ? "Ocupación Hoy" : "Ocupación Fija"}</span>
                         <span className="text-foreground">
                             {occupancyToday} / {spaceCapacity}
                         </span>
                    </div>
                    <Progress
                        value={utilization}
                        className={cn(
                            "h-1.5",
                            !isFull && !isNearlyFull && "[&>div]:bg-green-500",
                            isNearlyFull && "[&>div]:bg-yellow-500",
                            isFull && "[&>div]:bg-red-500"
                        )}
                    />
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                    {isToday ? (
                        <>
                            <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="w-full col-span-2" tabIndex={0}>
                                            <Button variant="secondary" size="sm" onClick={() => setSessionForAttendance(session)} disabled={!isAttendanceAllowed} className="w-full">
                                                <ClipboardCheck className="mr-2 h-4 w-4" /> Asistencia
                                            </Button>
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{tooltipMessage}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            {!isFull && (
                                <>
                                    <Button variant="secondary" size="sm" onClick={() => setSessionForEnrollment(session)}>Inscripción Fija</Button>
                                    <Button variant="outline" size="sm" onClick={() => handleOpenOneTime(session)}>Inscripción Recupero</Button>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                           <Button variant="secondary" size="sm" onClick={() => setSessionForEnrollment(session)}>Inscripción Fija</Button>
                           <Button variant="outline" size="sm" onClick={() => handleOpenOneTime(session)}>Inscripción Recupero</Button>
                        </>
                    )}
                </div>
                 <Button variant={waitlistCount > 0 ? "destructive" : "link"} size="sm" className="w-full" onClick={() => setSessionForWaitlist(session)}>
                    <ListPlus className="mr-2 h-4 w-4" />
                    {waitlistCount > 0 ? `Lista de Espera (${waitlistCount})` : "Anotar en Espera"}
                </Button>
            </CardFooter>
        </Card>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Horarios de Clases">
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={handleExport}><FileDown className="mr-2 h-4 w-4" />Exportar</Button>
           <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Agregar Horario</Button>
        </div>
      </PageHeader>

        <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex gap-2 flex-col sm:flex-row flex-wrap flex-grow">
                    <Select value={filters.day} onValueChange={(value) => handleFilterChange('day', value)}>
                        <SelectTrigger className="w-full sm:w-[160px] bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl">
                            <SelectValue placeholder="Día" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Día</SelectItem>
                            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filters.actividadId} onValueChange={(value) => handleFilterChange('actividadId', value)}>
                        <SelectTrigger className="w-full sm:w-[160px] bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl">
                            <SelectValue placeholder="Actividad" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Actividad</SelectItem>
                            {actividades.map(a => (
                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.specialistId} onValueChange={(value) => handleFilterChange('specialistId', value)}>
                        <SelectTrigger className="w-full sm:w-[160px] bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl">
                            <SelectValue placeholder="Especialista" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Especialista</SelectItem>
                            {specialists.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.spaceId} onValueChange={(value) => handleFilterChange('spaceId', value)}>
                        <SelectTrigger className="w-full sm:w-[160px] bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl">
                            <SelectValue placeholder="Espacio" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Espacio</SelectItem>
                            {spaces.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </Card>
        
      {searchParams.get('recoveryMode') === 'true' && (
            <Alert className="border-primary/50 text-primary">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Modo Recupero Activado</AlertTitle>
                <AlertDescription>
                    Estás viendo los horarios disponibles para recuperar una clase. Solo se muestran las sesiones con cupos libres. Haz clic en "Añadir Recupero" en la clase que desees.
                </AlertDescription>
            </Alert>
        )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList className="grid grid-cols-3 w-auto">
                  <TabsTrigger value="cards"><LayoutGrid className="h-4 w-4 mr-2"/>Tarjetas</TabsTrigger>
                  <TabsTrigger value="list"><List className="h-4 w-4 mr-2"/>Lista</TabsTrigger>
                  <TabsTrigger value="calendar"><CalendarDays className="h-4 w-4 mr-2"/>Calendario</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="cards">
              {loading ? (
                 <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
                 </div>
              ) : filteredAndSortedSessions.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredAndSortedSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              ) : (
                <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
                    <CardHeader>
                    <CardTitle>No se encontraron sesiones</CardTitle>
                    <CardDescription>
                        Prueba con otros filtros o añade una nueva sesión a tu horario.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Horario</Button>
                    </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="list">
                 <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Día y Hora</TableHead>
                                <TableHead>Actividad</TableHead>
                                <TableHead>Especialista</TableHead>
                                <TableHead>Espacio</TableHead>
                                <TableHead className="text-right">Inscripción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {filteredAndSortedSessions.length > 0 ? (
                           filteredAndSortedSessions.map(session => {
                                const { specialist, actividad, space } = getSessionDetails(session);
                                const enrolledCount = session.personIds.length;
                                const spaceCapacity = space?.capacity ?? 0;
                                return (
                                    <TableRow key={session.id} className="cursor-pointer" onClick={() => handleEdit(session)}>
                                        <TableCell className="font-medium">{session.dayOfWeek}, {session.time}</TableCell>
                                        <TableCell>{actividad?.name}</TableCell>
                                        <TableCell>{specialist?.name}</TableCell>
                                        <TableCell>{space?.name}</TableCell>
                                        <TableCell className="text-right">{`${enrolledCount} / ${spaceCapacity}`}</TableCell>
                                    </TableRow>
                                )
                           })
                        ) : (
                           <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">No se encontraron sesiones.</TableCell>
                           </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </Card>
            </TabsContent>
            <TabsContent value="calendar">
                <ScheduleCalendarView 
                    sessions={filteredAndSortedSessions} 
                    specialists={specialists} 
                    actividades={actividades}
                    spaces={spaces}
                    levels={levels}
                    onSessionClick={handleEdit}
                />
            </TabsContent>
        </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <DialogHeader><DialogTitle>{selectedSession ? 'Editar Sesión' : 'Nueva Sesión'}</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="actividadId" render={({ field }) => (
                      <FormItem><FormLabel>Actividad</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                            <SelectContent>{actividades.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="instructorId" render={({ field }) => (
                      <FormItem><FormLabel>Especialista</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                            <SelectContent>{availableSpecialists.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )}/>
                  </div>
                  <FormField control={form.control} name="spaceId" render={({ field }) => (
                      <FormItem><FormLabel>Espacio</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                            <SelectContent>{spaces.map(s => <SelectItem key={s.id} value={s.id}>{s.name} (Cap: {s.capacity})</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )}/>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="dayOfWeek" render={({ field }) => (
                      <FormItem><FormLabel>Día de la semana</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                            <SelectContent>{['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="time" render={({ field }) => (
                        <FormItem><FormLabel>Hora</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                  </div>
                   <FormField control={form.control} name="levelId" render={({ field }) => (
                      <FormItem><FormLabel>Nivel (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Sin nivel" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="none">Sin nivel</SelectItem>
                                {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                            </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )}/>
                  <DialogFooter>
                      <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                      <Button type="submit">Guardar Cambios</Button>
                  </DialogFooter>
                </form>
              </Form>
          </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!sessionForDelete} onOpenChange={() => setSessionForDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescriptionAlert>Esta acción no se puede deshacer. Esto eliminará permanentemente la sesión. Si hay personas inscriptas, no podrás eliminarla.</AlertDialogDescriptionAlert>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sí, eliminar sesión</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {sessionForEnrollment && (
        <EnrollPeopleDialog
          session={sessionForEnrollment}
          onClose={() => setSessionForEnrollment(null)}
        />
      )}
      
      {sessionForStudentsSheet && (
         <EnrolledStudentsSheet 
            session={sessionForStudentsSheet}
            onClose={() => setSessionForStudentsSheet(null)}
            rosterType={rosterTypeForSheet}
          />
      )}

      {sessionForAttendance && (
        <AttendanceSheet session={sessionForAttendance} onClose={() => setSessionForAttendance(null)} />
      )}
      
      {sessionForOneTime && (
        <OneTimeAttendeeDialog 
            session={sessionForOneTime}
            preselectedPersonId={personForOneTime}
            onClose={() => {
                setSessionForOneTime(null);
                setPersonForOneTime(null);
                 // If in recovery mode, redirect back to students page
                if (searchParams.get('recoveryMode') === 'true') {
                    router.push('/students');
                }
            }}
        />
      )}
      
      {sessionForWaitlist && (
        <WaitlistDialog session={sessionForWaitlist} onClose={() => setSessionForWaitlist(null)} />
      )}
      
      {sessionForNotification && (
        <NotifyAttendeesDialog session={sessionForNotification} onClose={() => setSessionForNotification(null)} />
      )}

    </div>
  );
}


export default function SchedulePage() {
    return (
        <Suspense fallback={<div>Cargando horarios...</div>}>
            <SchedulePageContent />
        </Suspense>
    )
}


    