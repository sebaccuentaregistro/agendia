
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Pencil, Users, FileDown, Clock, User, MapPin, UserPlus, LayoutGrid, CalendarDays, ClipboardCheck, CalendarIcon, Send, Star, MoreHorizontal, UserX, Signal, DoorOpen, List, Plane, CalendarClock, ListPlus } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { NotifyAttendeesDialog } from '@/components/notify-attendees-dialog';
import { WaitlistDialog } from '@/components/waitlist-dialog';
import { OneTimeAttendeeDialog } from '@/components/one-time-attendee-dialog';
import { EnrollPeopleDialog } from '@/components/enroll-people-dialog';
import { EnrolledStudentsSheet } from '@/components/enrolled-students-sheet';

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | undefined>(undefined);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [sessionToManage, setSessionToManage] = useState<Session | null>(null);
  const [sessionForRoster, setSessionForRoster] = useState<{session: Session, rosterType: 'fixed' | 'daily'} | null>(null);
  const [sessionForAttendance, setSessionForAttendance] = useState<Session | null>(null);
  const [sessionForPuntual, setSessionForPuntual] = useState<Session | null>(null);
  const [sessionToNotify, setSessionToNotify] = useState<Session | null>(null);
  const [sessionForWaitlist, setSessionForWaitlist] = useState<Session | null>(null);
  const [entryToRemoveFromWaitlist, setEntryToRemoveFromWaitlist] = useState<{session: Session, entry: WaitlistEntry, name: string} | null>(null);
  const [filters, setFilters] = useState({
    specialistId: 'all',
    actividadId: 'all',
    spaceId: 'all',
    dayOfWeek: 'all',
    timeOfDay: 'all',
    levelId: 'all',
  });
  const searchParams = useSearchParams();
  const [conflictInfo, setConflictInfo] = useState<{ specialist: string | null; space: string | null, operatingHours: string | null }>({ specialist: null, space: null, operatingHours: null });
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Recovery Mode
  const recoveryMode = searchParams.get('recoveryMode') === 'true';
  const personIdForRecovery = searchParams.get('personId');
  const personForRecovery = useMemo(() => people.find(p => p.id === personIdForRecovery), [people, personIdForRecovery]);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  useEffect(() => { setIsMounted(true); }, []);
  
  useEffect(() => {
    if (!isMounted) return;
    const spaceIdFromQuery = searchParams.get('spaceId');
    if (spaceIdFromQuery && spaces.some(s => s.id === spaceIdFromQuery)) {
      handleFilterChange('spaceId', spaceIdFromQuery);
    }
  }, [searchParams, isMounted, spaces]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      instructorId: '',
      actividadId: '',
      spaceId: '',
      dayOfWeek: 'Lunes',
      time: '09:00',
      levelId: '',
    },
  });
  
  const watchedActividadId = form.watch('actividadId');
  const watchedInstructorId = form.watch('instructorId');
  const watchedDay = form.watch('dayOfWeek');
  const watchedTime = form.watch('time');
  const watchedSpaceId = form.watch('spaceId');

  useEffect(() => {
    if (!isDialogOpen) return;

    let specialistMsg: string | null = null;
    let spaceMsg: string | null = null;
    let operatingHoursMsg: string | null = null;
    
    if (watchedDay && watchedTime && watchedInstructorId && watchedSpaceId) {
      const specialistConflictSession = sessions.find(s =>
        s.id !== (selectedSession?.id || '') &&
        s.instructorId === watchedInstructorId &&
        s.dayOfWeek === watchedDay &&
        s.time === watchedTime
      );

      if (specialistConflictSession) {
        const specialist = specialists.find(sp => sp.id === watchedInstructorId);
        specialistMsg = `${specialist?.name || 'Este especialista'} ya tiene otra clase este día a las ${watchedTime}.`;
      }

      const spaceConflictSession = sessions.find(s =>
        s.id !== (selectedSession?.id || '') &&
        s.spaceId === watchedSpaceId &&
        s.dayOfWeek === watchedDay &&
        s.time === watchedTime
      );

      if (spaceConflictSession) {
        const space = spaces.find(sp => sp.id === watchedSpaceId);
        spaceMsg = `${space?.name || 'Este espacio'} ya está en uso este día a las ${watchedTime}.`;
      }
      
      const space = spaces.find(s => s.id === watchedSpaceId);
      if (space && space.operatingHoursStart && space.operatingHoursEnd) {
          if (watchedTime < space.operatingHoursStart || watchedTime >= space.operatingHoursEnd) {
              operatingHoursMsg = `Fuera del horario del espacio (${space.operatingHoursStart} - ${space.operatingHoursEnd}).`;
          }
      }
    }
    
    setConflictInfo({ specialist: specialistMsg, space: spaceMsg, operatingHours: operatingHoursMsg });
  }, [watchedDay, watchedTime, watchedInstructorId, watchedSpaceId, sessions, specialists, spaces, selectedSession, isDialogOpen]);

  const availableSpecialists = useMemo(() => {
    if (!watchedActividadId) return specialists;
    return specialists.filter(s => s.actividadIds.includes(watchedActividadId));
  }, [watchedActividadId, specialists]);

  const availableActividades = useMemo(() => {
    if (!watchedInstructorId) return [];
    const specialist = specialists.find(s => s.id === watchedInstructorId);
    if (!specialist) return [];
    const specialistActividadIds = new Set(specialist.actividadIds);
    return actividades.filter(a => specialistActividadIds.has(a.id));
  }, [watchedInstructorId, specialists, actividades]);

  useEffect(() => {
    if (watchedActividadId && watchedInstructorId) {
      const isValid = availableSpecialists.some(s => s.id === watchedInstructorId);
      if (!isValid) {
        form.setValue('instructorId', '', { shouldValidate: true });
      }
    }
  }, [watchedActividadId, availableSpecialists, form]);

  useEffect(() => {
    if (watchedInstructorId && watchedActividadId) {
      const isValid = availableActividades.some(a => a.id === watchedActividadId);
      if (!isValid) {
        form.setValue('actividadId', '', { shouldValidate: true });
      }
    }
  }, [watchedInstructorId, availableActividades, form]);

  const getSessionDetails = (session: Session) => {
    const specialist = specialists.find((i) => i.id === session.instructorId);
    const actividad = actividades.find((s) => s.id === session.actividadId);
    const space = spaces.find((s) => s.id === session.spaceId);
    const level = levels.find((l) => l.id === session.levelId);
    return { specialist, actividad, space, level };
  };

  const handleAdd = () => {
    setSelectedSession(undefined);
    form.reset({ instructorId: '', actividadId: '', spaceId: '', dayOfWeek: 'Lunes', time: '09:00', levelId: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (session: Session) => {
    setSelectedSession(session);
    form.reset({ ...session, levelId: session.levelId || '' });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (session: Session) => {
    setSessionToDelete(session);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (sessionToDelete) {
      deleteSession(sessionToDelete.id);
      setIsDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (selectedSession) {
      updateSession({ ...selectedSession, ...values, waitlist: selectedSession.waitlist || [] });
    } else {
      addSession(values);
    }
    setIsDialogOpen(false);
    setSelectedSession(undefined);
    if (recoveryMode) {
        router.replace('/schedule', { scroll: false });
    }
  }
  
  const getTimeOfDay = (time: string): 'Mañana' | 'Tarde' | 'Noche' => {
    if (!time) return 'Tarde';
    const hour = parseInt(time.split(':')[0], 10);
    if (hour < 12) return 'Mañana';
    if (hour < 18) return 'Tarde';
    return 'Noche';
  };

  const sortedSessions = useMemo(() => {
    const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return [...sessions].sort((a, b) => {
        const dayComparison = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
        if (dayComparison !== 0) return dayComparison;
        return a.time.localeCompare(b.time);
    });
  }, [sessions]);
  
  const filteredSessions = useMemo(() => {
    return sortedSessions.filter(session => {
        const timeOfDay = getTimeOfDay(session.time);
        return (
            (filters.actividadId === 'all' || session.actividadId === filters.actividadId) &&
            (filters.spaceId === 'all' || session.spaceId === filters.spaceId) &&
            (filters.specialistId === 'all' || session.instructorId === filters.specialistId) &&
            (filters.dayOfWeek === 'all' || session.dayOfWeek === filters.dayOfWeek) &&
            (filters.timeOfDay === 'all' || timeOfDay === filters.timeOfDay) &&
            (filters.levelId === 'all' || session.levelId === filters.levelId)
        );
    });
  }, [sortedSessions, filters]);

  const sessionsWithDetails = useMemo(() => {
    if (!isMounted) return [];
    
    const today = startOfDay(new Date());
    const todayStr = format(today, 'yyyy-MM-dd');

    return filteredSessions.map(session => {
        const space = spaces.find(s => s.id === session.spaceId);
        const capacity = space?.capacity || 0;
        
        const attendanceRecordForToday = attendance.find(a => a.sessionId === session.id && a.date === todayStr);
        const oneTimeAttendeesCount = attendanceRecordForToday?.oneTimeAttendees?.length || 0;
        
        const fixedEnrolledPeople = session.personIds.map(pid => people.find(p => p.id === pid)).filter(p => p);
        const fixedEnrolledCount = fixedEnrolledPeople.length;

        const vacationCount = fixedEnrolledPeople.filter(p => p && isPersonOnVacation(p, today)).length;
        
        const dailyEnrolledCount = (fixedEnrolledCount - vacationCount) + oneTimeAttendeesCount;
        
        const waitlistDetails: UnifiedWaitlistItem[] = (session.waitlist || [])
            .map(entry => {
                if (typeof entry === 'string') {
                    const person = people.find(p => p.id === entry);
                    return person ? { ...person, isProspect: false as const, entry: entry as string } : null;
                }
                return { ...entry, isProspect: true as const, entry: entry as WaitlistProspect };
            })
            .filter((p): p is UnifiedWaitlistItem => !!p);

        const waitlistCount = waitlistDetails.length;
        
        const fixedSpotsAvailable = Math.max(0, capacity - fixedEnrolledCount);
        
        return {
            ...session,
            dailyEnrolledCount,
            fixedEnrolledCount,
            waitlistCount,
            waitlistDetails,
            vacationCount,
            availableSpots: {
                fixed: fixedSpotsAvailable,
                temporary: vacationCount,
            }
        };
    });
  }, [filteredSessions, people, isPersonOnVacation, attendance, spaces, isMounted]);


  const handleExportSchedule = () => {
    const headers = {
        actividad: 'Actividad',
        especialista: 'Especialista',
        espacio: 'Espacio',
        dia: 'Día',
        hora: 'Hora',
        inscriptos: 'Inscriptos',
        capacidad: 'Capacidad'
    };
    const dataToExport = filteredSessions.map(session => {
        const { specialist, actividad, space } = getSessionDetails(session);
        return {
            actividad: actividad?.name || 'N/A',
            especialista: specialist?.name || 'N/A',
            espacio: space?.name || 'N/A',
            dia: session.dayOfWeek,
            hora: session.time,
            inscriptos: session.personIds.length,
            capacidad: space?.capacity || 0
        }
    });

    exportToCsv('horarios.csv', dataToExport, headers);
  };
  
  const clientTimeData = useMemo(() => {
    if (!isMounted) return { now: null, todayName: '', todayIndex: -1, appDayOrder: [] as Session['dayOfWeek'][] };
    
    const now = new Date();
    const dayMap: { [key: number]: Session['dayOfWeek'] } = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
    const appDayOrder: Session['dayOfWeek'][] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const todayName = dayMap[now.getDay()];
    const todayIndex = appDayOrder.indexOf(todayName);
    
    return { now, todayName, todayIndex, appDayOrder };
  }, [isMounted]);

    const isAttendanceAllowedForSession = (session: Session) => {
        if (!isMounted) return false;
        const { now, todayName, todayIndex, appDayOrder } = clientTimeData;
        const sessionIndex = appDayOrder.indexOf(session.dayOfWeek);
        const isFutureDay = todayIndex !== -1 && sessionIndex > todayIndex;
        const isToday = todayIndex !== -1 && sessionIndex === todayIndex;
        if (isFutureDay) return false;

        if (isToday && now) {
            const [hour, minute] = session.time.split(':').map(Number);
            const sessionStartTime = new Date(now);
            sessionStartTime.setHours(hour, minute, 0, 0);
            const attendanceWindowStart = new Date(sessionStartTime.getTime() - 20 * 60 * 1000);
            if (now < attendanceWindowStart) {
                return false;
            }
        }
        return true;
    };


  if (!isMounted) {
    return (
      <div className="space-y-8">
        <PageHeader title="Horarios">
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled><FileDown className="mr-2 h-4 w-4"/>Exportar</Button>
            <Button disabled><PlusCircle className="mr-2 h-4 w-4" />Agregar Horario</Button>
          </div>
        </PageHeader>
        <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
          <Skeleton className="h-8 w-1/4 mb-4" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </Card>
        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 md:w-[450px]">
            <TabsTrigger value="cards"><LayoutGrid className="mr-2 h-4 w-4" />Tarjetas</TabsTrigger>
            <TabsTrigger value="calendar"><CalendarDays className="mr-2 h-4 w-4" />Calendario</TabsTrigger>
            <TabsTrigger value="list"><List className="mr-2 h-4 w-4" />Lista</TabsTrigger>
          </TabsList>
          <TabsContent value="cards">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[22rem] w-full bg-white/30 rounded-2xl" />)}
            </div>
          </TabsContent>
          <TabsContent value="calendar">
            <Skeleton className="h-[500px] w-full bg-white/30 rounded-2xl" />
          </TabsContent>
           <TabsContent value="list">
            <Skeleton className="h-[500px] w-full bg-white/30 rounded-2xl" />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Horarios">
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportSchedule}>
                <FileDown className="mr-2 h-4 w-4"/>
                Exportar
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                <Button onClick={handleAdd}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Horario
                </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedSession ? 'Editar Sesión' : 'Programar Nueva Sesión'}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="actividadId" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Actividad</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una actividad" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {availableActividades.length > 0 ? (
                                        availableActividades.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))
                                    ) : (
                                        <SelectItem value="no-options" disabled>No hay actividades para este especialista</SelectItem>
                                    )}
                                </SelectContent>
                            </Select><FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="instructorId" render={({ field, fieldState }) => (
                            <FormItem>
                                <FormLabel>Especialista</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un especialista" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {availableSpecialists.length > 0 ? (
                                            availableSpecialists.map((i) => (<SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>))
                                        ) : (
                                            <SelectItem value="no-options" disabled>No hay especialistas para esta actividad</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                {conflictInfo.specialist && !fieldState.error && (
                                  <p className="text-sm text-destructive">{conflictInfo.specialist}</p>
                                )}
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="spaceId" render={({ field, fieldState }) => (
                            <FormItem>
                                <FormLabel>Espacio</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un espacio" /></SelectTrigger></FormControl>
                                    <SelectContent>{spaces.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name} ({s.capacity} pers.)</SelectItem>))}</SelectContent>
                                </Select>
                                <FormMessage />
                                {conflictInfo.space && !fieldState.error && (
                                  <p className="text-sm text-destructive">{conflictInfo.space}</p>
                                )}
                            </FormItem>
                        )}/>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="dayOfWeek" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Día</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>{['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (<SelectItem key={day} value={day}>{day}</SelectItem>))}</SelectContent>
                                </Select><FormMessage />
                            </FormItem>
                            )}/>
                            <FormField control={form.control} name="time" render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel>Hora</FormLabel>
                                    <FormControl><Input type="time" {...field} /></FormControl>
                                    <FormMessage />
                                    {conflictInfo.operatingHours && !fieldState.error && (
                                      <p className="text-sm text-destructive">{conflictInfo.operatingHours}</p>
                                    )}
                                </FormItem>
                            )}/>
                        </div>
                        <FormField control={form.control} name="levelId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nivel (Opcional)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar nivel" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="none">Sin Nivel</SelectItem>
                                    {levels.map(level => (
                                    <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>
                                    ))}
                                </SelectContent>
                                </Select><FormMessage />
                            </FormItem>
                        )}/>
                        <DialogFooter>
                            <Button type="submit" disabled={!!conflictInfo.specialist || !!conflictInfo.space || !!conflictInfo.operatingHours}>
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
      </PageHeader>
       
      {recoveryMode && personForRecovery && (
        <Alert className="mb-4 border-primary/50 text-primary bg-primary/5">
            <CalendarClock className="h-4 w-4 !text-primary" />
            <AlertTitle>Modo Recuperación</AlertTitle>
            <AlertDescription>
              Estás buscando un lugar para que recupere una clase <strong>{personForRecovery.name}</strong>. Haz clic en "Inscripción Recupero" en la clase deseada.
            </AlertDescription>
        </Alert>
      )}

      <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">Filtrar Horarios</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
            <Select value={filters.dayOfWeek} onValueChange={(value) => handleFilterChange('dayOfWeek', value)}>
              <SelectTrigger className="bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl"><SelectValue placeholder="Día de la semana" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los días</SelectItem>
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.timeOfDay} onValueChange={(value) => handleFilterChange('timeOfDay', value)}>
              <SelectTrigger className="bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl"><SelectValue placeholder="Momento del día" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el día</SelectItem>
                <SelectItem value="Mañana">Mañana</SelectItem>
                <SelectItem value="Tarde">Tarde</SelectItem>
                <SelectItem value="Noche">Noche</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.specialistId} onValueChange={(value) => handleFilterChange('specialistId', value)}>
              <SelectTrigger className="bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl"><SelectValue placeholder="Especialista" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los especialistas</SelectItem>
                {specialists.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.actividadId} onValueChange={(value) => handleFilterChange('actividadId', value)}>
              <SelectTrigger className="bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl"><SelectValue placeholder="Actividad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las actividades</SelectItem>
                {actividades.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.spaceId} onValueChange={(value) => handleFilterChange('spaceId', value)}>
              <SelectTrigger className="bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl"><SelectValue placeholder="Espacio" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los espacios</SelectItem>
                {spaces.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.levelId} onValueChange={(value) => handleFilterChange('levelId', value)}>
                <SelectTrigger className="bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl"><SelectValue placeholder="Nivel" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos los niveles</SelectItem>
                    {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 md:w-[450px]">
            <TabsTrigger value="cards"><LayoutGrid className="mr-2 h-4 w-4" />Tarjetas</TabsTrigger>
            <TabsTrigger value="list"><List className="mr-2 h-4 w-4" />Lista</TabsTrigger>
            <TabsTrigger value="calendar"><CalendarDays className="mr-2 h-4 w-4" />Calendario</TabsTrigger>
        </TabsList>
        <TabsContent value="cards">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {loading ? (
                [...Array(6)].map((_, i) => <Skeleton key={i} className="h-[22rem] w-full bg-white/30 rounded-2xl" />)
              ) : sessions.length > 0 ? (
                  sessionsWithDetails.length > 0 ? (
                      sessionsWithDetails.map((session) => {
                      const { specialist, actividad, space, level } = getSessionDetails(session);
                      const capacity = space?.capacity || 0;
                      const { dailyEnrolledCount, vacationCount, waitlistDetails, availableSpots, fixedEnrolledCount } = session;
                      const isFixedFull = fixedEnrolledCount >= capacity;
                      
                      const isAttendanceAllowed = isAttendanceAllowedForSession(session);
                      const tooltipMessage = isAttendanceAllowed ? "Pasar Lista" : "La asistencia se habilita 20 minutos antes o en días pasados.";

                      return (
                        <Card 
                          key={session.id} 
                          className={cn(
                            "flex flex-col bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border-2 border-slate-200/60 dark:border-zinc-700/60 overflow-hidden",
                            isFixedFull && "border-pink-500/30",
                            recoveryMode && availableSpots.temporary > 0 && "border-primary/40 hover:border-primary"
                          )}
                        >
                          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                             <div className="flex flex-col gap-2">
                                <CardTitle className="text-lg font-bold text-primary">{actividad?.name || 'Sesión'}</CardTitle>
                                {level && (
                                    <Badge variant="outline" className="font-semibold w-fit flex items-center gap-1.5"><Signal className="h-3 w-3" />{level.name}</Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                               {vacationCount > 0 && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <div className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-bold text-white shadow-sm bg-blue-500">
                                            <Plane className="h-3 w-3" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{vacationCount} persona(s) de vacaciones hoy.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                               )}
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -mr-2 text-slate-600 dark:text-slate-300">
                                          <MoreHorizontal className="h-5 w-5" />
                                          <span className="sr-only">Más opciones</span>
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                      <DropdownMenuItem onSelect={() => handleEdit(session)}>
                                          <Pencil className="mr-2 h-4 w-4" />
                                          Editar Sesión
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onSelect={() => setSessionToNotify(session)}>
                                          <Send className="mr-2 h-4 w-4" />
                                          Notificar Asistentes
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onSelect={() => openDeleteDialog(session)} className="text-destructive focus:text-destructive">
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Eliminar Sesión
                                      </DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>
                          <CardContent className="flex-grow p-4 pt-2 space-y-4">
                            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                              <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-slate-500" />
                                <span>{session.dayOfWeek}, {formatTime(session.time)}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <User className="h-4 w-4 text-slate-500" />
                                <span>{specialist?.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-slate-500" />
                                <span>{space?.name}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                                    <span
                                      className="font-semibold text-foreground cursor-pointer hover:underline"
                                      onClick={() => setSessionForRoster({ session, rosterType: 'fixed' })}
                                    >
                                      Inscriptos Fijos: {fixedEnrolledCount}/{capacity}
                                    </span>
                                    <span
                                      className="font-semibold text-foreground cursor-pointer hover:underline"
                                      onClick={() => setSessionForRoster({ session, rosterType: 'daily' })}
                                    >
                                      Ocupación Hoy: {dailyEnrolledCount}/{capacity}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-zinc-700">
                                    <div
                                    className={cn("h-2 rounded-full", dailyEnrolledCount >= capacity ? "bg-pink-500" : "bg-green-500")}
                                    style={{ width: `${capacity > 0 ? (dailyEnrolledCount / capacity) * 100 : 0}%` }}
                                    />
                                </div>
                               {waitlistDetails.length > 0 && (
                                <div className="pt-2 text-xs text-muted-foreground">
                                    <span className="font-semibold">En espera: </span>
                                     <div className="space-y-1 mt-1">
                                        {waitlistDetails.map((p, index) => (
                                            <div key={index} className="flex items-center justify-between gap-2">
                                                <span>{p.name}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => setEntryToRemoveFromWaitlist({session, entry: p.entry, name: p.name})}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                               )}
                            </div>
                          </CardContent>
                          <CardFooter className="flex flex-col gap-2 p-3 mt-auto border-t border-slate-100 dark:border-zinc-700/80">
                                <TooltipProvider>
                                    <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span tabIndex={0} className="w-full">
                                        <Button variant="outline" className="w-full font-semibold border-slate-300 dark:border-zinc-600" onClick={() => setSessionForAttendance(session)} disabled={!isAttendanceAllowed}>
                                            <ClipboardCheck className="mr-2 h-4 w-4"/>
                                            Asistencia
                                        </Button>
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{tooltipMessage}</p>
                                    </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                 <div className="grid grid-cols-2 gap-2 w-full">
                                    <Button className="w-full font-bold" onClick={() => setSessionToManage(session)} disabled={isFixedFull}>
                                        Fija ({availableSpots.fixed})
                                    </Button>
                                    <Button variant="secondary" className="w-full font-bold" onClick={() => setSessionForPuntual(session)} disabled={availableSpots.temporary <= 0}>
                                        Recupero ({availableSpots.temporary})
                                    </Button>
                                </div>
                                {isFixedFull && (
                                     <Button variant="outline" className="w-full" onClick={() => setSessionForWaitlist(session)}>
                                        <ListPlus className="mr-2 h-4 w-4" />
                                        Anotar en Espera
                                    </Button>
                                )}
                          </CardFooter>
                        </Card>
                      );
                    })
                  ) : (
                      <div className="col-span-1 md:col-span-2 xl:col-span-3">
                          <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 backdrop-blur-lg rounded-2xl border-white/20">
                          <CardHeader>
                              <CardTitle className="text-slate-700 dark:text-slate-200">No se encontraron sesiones</CardTitle>
                              <CardDescription className="text-slate-500 dark:text-slate-400">Prueba a cambiar o limpiar los filtros.</CardDescription>
                          </CardHeader>
                          </Card>
                    </div>
                  )
                ) : (
                  <div className="col-span-1 md:col-span-2 xl:col-span-3">
                     <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 backdrop-blur-lg rounded-2xl border-white/20">
                        <CardHeader>
                          <CardTitle className="text-slate-700 dark:text-slate-200">No Hay Sesiones Programadas</CardTitle>
                          <CardDescription className="text-slate-500 dark:text-slate-400">Empieza a organizar tu estudio añadiendo tu primera sesión.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button onClick={handleAdd} className="bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg hover:from-violet-600 hover:to-purple-700 transition-all">
                              <PlusCircle className="mr-2 h-4 w-4" />Añadir Sesión
                          </Button>
                        </CardContent>
                      </Card>
                  </div>
                )}
            </div>
        </TabsContent>
        <TabsContent value="list">
             <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Actividad</TableHead>
                            <TableHead>Día y Hora</TableHead>
                            <TableHead>Especialista</TableHead>
                            <TableHead>Espacio</TableHead>
                            <TableHead>Ocupación</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6}><Skeleton className="h-8 w-full"/></TableCell>
                                    </TableRow>
                                ))
                            ) : sessionsWithDetails.length > 0 ? (
                                sessionsWithDetails.map(session => {
                                    const { specialist, actividad, space, level } = getSessionDetails(session);
                                    const capacity = space?.capacity || 0;
                                    const { dailyEnrolledCount } = session;
                                    const isFullForFixed = session.fixedEnrolledCount >= capacity;
                                    const isAttendanceAllowed = isAttendanceAllowedForSession(session);

                                    return (
                                        <TableRow key={session.id}>
                                            <TableCell>
                                                <div className="font-medium text-foreground">{actividad?.name || 'N/A'}</div>
                                                {level && <div className="text-xs text-muted-foreground">{level.name}</div>}
                                            </TableCell>
                                            <TableCell>
                                                <div>{session.dayOfWeek}</div>
                                                <div className="text-muted-foreground">{formatTime(session.time)}</div>
                                            </TableCell>
                                            <TableCell>{specialist?.name || 'N/A'}</TableCell>
                                            <TableCell>{space?.name || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Badge variant={dailyEnrolledCount >= capacity ? 'destructive' : 'secondary'}>
                                                    {dailyEnrolledCount} / {capacity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => setSessionForAttendance(session)} disabled={!isAttendanceAllowed}>
                                                          <ClipboardCheck className="mr-2 h-4 w-4" />Asistencia
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => setSessionToManage(session)} disabled={isFullForFixed}>
                                                          <Users className="mr-2 h-4 w-4" />Inscripción Fija
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => setSessionForPuntual(session)} disabled={session.availableSpots.temporary <= 0}>
                                                          <CalendarDays className="mr-2 h-4 w-4" />Inscripción Recupero
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onSelect={() => handleEdit(session)}>
                                                            <Pencil className="mr-2 h-4 w-4" />Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => setSessionToNotify(session)}>
                                                            <Send className="mr-2 h-4 w-4" />Notificar
                                                        </DropdownMenuItem>
                                                        {isFullForFixed && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onSelect={() => setSessionForWaitlist(session)}>
                                                                    <ListPlus className="mr-2 h-4 w-4" /> Anotar en Espera
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onSelect={() => openDeleteDialog(session)} className="text-destructive focus:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No se encontraron sesiones con los filtros seleccionados.
                                    </TableCell>
                                </TableRow>
                            )}
                    </TableBody>
                 </Table>
             </Card>
        </TabsContent>
        <TabsContent value="calendar">
          {loading ? (
              <Skeleton className="h-[500px] w-full bg-white/30 rounded-2xl" />
          ) : (
            <ScheduleCalendarView 
                sessions={filteredSessions}
                specialists={specialists}
                actividades={actividades}
                spaces={spaces}
                levels={levels}
                onSessionClick={(session) => setSessionForRoster({session, rosterType: 'daily'})}
            />
          )}
        </TabsContent>
      </Tabs>


      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescriptionAlert>Esta acción no se puede deshacer. Esto eliminará permanentemente la sesión. Si hay personas inscriptas, la eliminación será bloqueada para proteger tus datos.</AlertDialogDescriptionAlert>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSessionToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sí, eliminar sesión</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={!!entryToRemoveFromWaitlist} onOpenChange={(open) => !open && setEntryToRemoveFromWaitlist(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
                <AlertDialogDescriptionAlert>
                    ¿Estás seguro de que quieres quitar a <span className="font-bold">{entryToRemoveFromWaitlist?.name}</span> de la lista de espera?
                </AlertDialogDescriptionAlert>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>No, cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                    if (entryToRemoveFromWaitlist) {
                        removeFromWaitlist(entryToRemoveFromWaitlist.session.id, entryToRemoveFromWaitlist.entry);
                        setEntryToRemoveFromWaitlist(null);
                    }
                }} className="bg-destructive hover:bg-destructive/90">
                    Sí, quitar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {sessionToManage && <EnrollPeopleDialog session={sessionToManage} onClose={() => setSessionToManage(null)} />}
      {sessionForPuntual && <OneTimeAttendeeDialog session={sessionForPuntual} preselectedPersonId={personIdForRecovery} onClose={() => setSessionForPuntual(null)} />}
      {sessionForRoster && <EnrolledStudentsSheet session={sessionForRoster.session} rosterType={sessionForRoster.rosterType} onClose={() => setSessionForRoster(null)} />}
      {sessionForAttendance && <AttendanceSheet session={sessionForAttendance} onClose={() => setSessionForAttendance(null)} />}
      {sessionToNotify && <NotifyAttendeesDialog session={sessionToNotify} onClose={() => setSessionToNotify(null)} />}
      {sessionForWaitlist && <WaitlistDialog session={sessionForWaitlist} onClose={() => setSessionForWaitlist(null)} />}
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SchedulePageContent />
    </Suspense>
  );
}

    