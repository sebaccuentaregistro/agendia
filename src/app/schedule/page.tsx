
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Pencil, Users, FileDown, Clock, User, MapPin, UserPlus, LayoutGrid, CalendarDays, ClipboardCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionAlert, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useMemo, useEffect } from 'react';
import type { Session, Person } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, exportToCsv } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSearchParams } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PageHeader } from '@/components/page-header';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScheduleCalendarView } from '@/components/schedule-calendar-view';
import { AttendanceSheet } from '@/components/attendance-sheet';


const formSchema = z.object({
  instructorId: z.string().min(1, { message: 'Debes seleccionar un especialista.' }),
  actividadId: z.string().min(1, { message: 'Debes seleccionar una actividad.' }),
  spaceId: z.string().min(1, { message: 'Debes seleccionar un espacio.' }),
  dayOfWeek: z.enum(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']),
  time: z.string().min(1, { message: 'La hora es obligatoria.' }).regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:MM).' }),
  sessionType: z.enum(['Grupal', 'Individual']),
});

function EnrollPeopleDialog({ session, onClose }: { session: Session; onClose: () => void; }) {
  const { people, spaces, enrollPeopleInClass, actividades } = useStudio();
  
  const form = useForm<{ personIds: string[] }>({
    defaultValues: { personIds: session.personIds || [] },
  });
  const watchedPersonIds = form.watch('personIds');

  const space = spaces.find(s => s.id === session.spaceId);
  const capacity = session.sessionType === 'Individual' ? 1 : space?.capacity ?? 0;
  const actividad = actividades.find(a => a.id === session.actividadId);

  function onSubmit(data: { personIds: string[] }) {
    enrollPeopleInClass(session.id, data.personIds);
    onClose();
  }

  const sortedPeople = [...people].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inscribir: {actividad?.name}</DialogTitle>
          <DialogDescription>
            Selecciona las personas para la sesión. Ocupación: {watchedPersonIds.length}/{capacity}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="personIds"
              render={() => (
                <FormItem>
                  <ScrollArea className="h-72 rounded-md border p-4">
                    {sortedPeople.length > 0 ? sortedPeople.map(person => (
                      <FormField
                        key={person.id}
                        control={form.control}
                        name="personIds"
                        render={({ field }) => (
                          <FormItem key={person.id} className="flex flex-row items-center space-x-3 space-y-0 py-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(person.id)}
                                disabled={
                                  !field.value?.includes(person.id) &&
                                  watchedPersonIds.length >= capacity
                                }
                                onCheckedChange={checked => {
                                  const currentValues = field.value || [];
                                  return checked
                                    ? field.onChange([...currentValues, person.id])
                                    : field.onChange(
                                        currentValues.filter(value => value !== person.id)
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{person.name}</FormLabel>
                          </FormItem>
                        )}
                      />
                    )) : <p className="text-center text-sm text-muted-foreground">No hay personas para inscribir.</p>}
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const formatTime = (time: string) => {
    if (!time || !time.includes(':')) return 'N/A';
    return time;
};

// Helper component to show enrolled people, similar to the one in dashboard
function EnrolledPeopleSheet({ session, onClose }: { session: Session; onClose: () => void; }) {
  const { people, actividades, spaces } = useStudio();

  const enrolledPeople = useMemo(() => {
    return people.filter(p => session.personIds.includes(p.id));
  }, [people, session]);

  const actividad = useMemo(() => {
    return actividades.find((s) => s.id === session.actividadId);
  }, [session, actividades]);
  
  const space = useMemo(() => {
    return spaces.find((s) => s.id === session.spaceId);
  }, [session, spaces]);

  const formatWhatsAppLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

  return (
    <Sheet open={!!session} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Inscriptos en {actividad?.name || 'Sesión'}</SheetTitle>
          <SheetDescription>
            {session.dayOfWeek} a las {formatTime(session.time)} en {space?.name || 'N/A'}.
            <br/>
            {enrolledPeople.length} de {session.sessionType === 'Individual' ? 1 : space?.capacity || 0} personas inscriptas.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="mt-4 h-[calc(100%-8rem)] pr-4">
          {enrolledPeople.length > 0 ? (
            <div className="space-y-4">
              {enrolledPeople.map(person => (
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
              ))}
            </div>
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

export default function SchedulePage() {
  const { specialists, actividades, sessions, spaces, addSession, updateSession, deleteSession } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | undefined>(undefined);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [sessionToManage, setSessionToManage] = useState<Session | null>(null);
  const [sessionForRoster, setSessionForRoster] = useState<Session | null>(null);
  const [sessionForAttendance, setSessionForAttendance] = useState<Session | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [filters, setFilters] = useState({
    specialistId: 'all',
    actividadId: 'all',
    spaceId: 'all',
    dayOfWeek: 'all',
    timeOfDay: 'all',
  });
  const searchParams = useSearchParams();

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
      sessionType: 'Grupal',
    },
  });
  
  const watchedActividadId = form.watch('actividadId');
  const watchedInstructorId = form.watch('instructorId');

  const availableSpecialists = useMemo(() => {
    if (!watchedActividadId) return specialists;
    return specialists.filter(s => s.actividadIds.includes(watchedActividadId));
  }, [watchedActividadId, specialists]);

  const availableActividades = useMemo(() => {
    if (!watchedInstructorId) return actividades;
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
  }, [watchedActividadId, watchedInstructorId, availableSpecialists, form]);

  useEffect(() => {
    if (watchedInstructorId && watchedActividadId) {
      const isValid = availableActividades.some(a => a.id === watchedActividadId);
      if (!isValid) {
        form.setValue('actividadId', '', { shouldValidate: true });
      }
    }
  }, [watchedInstructorId, watchedActividadId, availableActividades, form]);

  const getSessionDetails = (session: Session) => {
    const specialist = specialists.find((i) => i.id === session.instructorId);
    const actividad = actividades.find((s) => s.id === session.actividadId);
    const space = spaces.find((s) => s.id === session.spaceId);
    return { specialist, actividad, space };
  };

  const handleAdd = () => {
    setSelectedSession(undefined);
    form.reset({ instructorId: '', actividadId: '', spaceId: '', dayOfWeek: 'Lunes', time: '09:00', sessionType: 'Grupal' });
    setIsDialogOpen(true);
  };

  const handleEdit = (session: Session) => {
    setSelectedSession(session);
    form.reset({ ...session });
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
      updateSession({ ...selectedSession, ...values });
    } else {
      addSession(values);
    }
    setIsDialogOpen(false);
    setSelectedSession(undefined);
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
            (filters.timeOfDay === 'all' || timeOfDay === filters.timeOfDay)
        );
    });
  }, [sortedSessions, filters]);


  const handleExportSchedule = () => {
    const headers = {
        actividad: 'Actividad',
        especialista: 'Especialista',
        espacio: 'Espacio',
        dia: 'Día',
        hora: 'Hora',
        tipo: 'Tipo',
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
            tipo: session.sessionType,
            inscriptos: session.personIds.length,
            capacidad: session.sessionType === 'Individual' ? 1 : (space?.capacity || 0)
        }
    });

    exportToCsv('horarios.csv', dataToExport, headers);
  };


  return (
    <div className="space-y-8">
      <PageHeader title="Horarios">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportSchedule} className="bg-white/80 dark:bg-zinc-800/80 border-slate-300/50 rounded-lg">
                <FileDown className="mr-2 h-4 w-4"/>
                Exportar
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                <Button onClick={handleAdd}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Sesión
                </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedSession ? 'Editar Sesión' : 'Programar Nueva Sesión'}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="sessionType" render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Tipo de Sesión</FormLabel>
                                <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="Grupal" /></FormControl>
                                    <FormLabel className="font-normal">Grupal</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="Individual" /></FormControl>
                                    <FormLabel className="font-normal">Individual</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}/>
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
                        <FormField control={form.control} name="instructorId" render={({ field }) => (
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
                            </Select><FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="spaceId" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Espacio</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un espacio" /></SelectTrigger></FormControl>
                                <SelectContent>{spaces.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name} ({s.capacity} pers.)</SelectItem>))}</SelectContent>
                            </Select><FormMessage />
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
                            <FormField control={form.control} name="time" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Hora</FormLabel>
                                <FormControl><Input type="time" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}/>
                        </div>
                        <DialogFooter><Button type="submit">Guardar Cambios</Button></DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
      </PageHeader>
      
      <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">Filtrar Horarios</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <Select value={filters.dayOfWeek} onValueChange={(value) => handleFilterChange('dayOfWeek', value)}>
              <SelectTrigger className="bg-white/80 dark:bg-zinc-800/80 border-slate-300/50 rounded-xl"><SelectValue placeholder="Día de la semana" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los días</SelectItem>
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.timeOfDay} onValueChange={(value) => handleFilterChange('timeOfDay', value)}>
              <SelectTrigger className="bg-white/80 dark:bg-zinc-800/80 border-slate-300/50 rounded-xl"><SelectValue placeholder="Momento del día" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el día</SelectItem>
                <SelectItem value="Mañana">Mañana</SelectItem>
                <SelectItem value="Tarde">Tarde</SelectItem>
                <SelectItem value="Noche">Noche</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.specialistId} onValueChange={(value) => handleFilterChange('specialistId', value)}>
              <SelectTrigger className="bg-white/80 dark:bg-zinc-800/80 border-slate-300/50 rounded-xl"><SelectValue placeholder="Especialista" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los especialistas</SelectItem>
                {specialists.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.actividadId} onValueChange={(value) => handleFilterChange('actividadId', value)}>
              <SelectTrigger className="bg-white/80 dark:bg-zinc-800/80 border-slate-300/50 rounded-xl"><SelectValue placeholder="Actividad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las actividades</SelectItem>
                {actividades.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.spaceId} onValueChange={(value) => handleFilterChange('spaceId', value)}>
              <SelectTrigger className="bg-white/80 dark:bg-zinc-800/80 border-slate-300/50 rounded-xl"><SelectValue placeholder="Espacio" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los espacios</SelectItem>
                {spaces.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 md:w-[300px]">
            <TabsTrigger value="cards"><LayoutGrid className="mr-2 h-4 w-4" />Tarjetas</TabsTrigger>
            <TabsTrigger value="calendar"><CalendarDays className="mr-2 h-4 w-4" />Calendario</TabsTrigger>
        </TabsList>
        <TabsContent value="cards">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {isMounted ? (
                sessions.length > 0 ? (
                  filteredSessions.length > 0 ? (
                      filteredSessions.map((session) => {
                      const { specialist, actividad, space } = getSessionDetails(session);
                      const isIndividual = session.sessionType === 'Individual';
                      const capacity = isIndividual ? 1 : space?.capacity || 0;
                      const enrolledCount = session.personIds?.length || 0;
                      const availableSpots = capacity - enrolledCount;
                      const sessionTitle = `${actividad?.name || 'Sesión'}`;
                      const isFull = availableSpots <= 0;

                      return (
                        <Card 
                          key={session.id} 
                          className={cn(
                            "flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 border-white/20 shadow-lg",
                            "bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl"
                          )}
                        >
                          <CardHeader className="flex flex-row items-start justify-between p-4">
                            <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">{sessionTitle}</CardTitle>
                            <div className={cn(
                                'text-xs font-bold px-3 py-1 rounded-full text-white', 
                                isFull 
                                  ? 'bg-gradient-to-r from-rose-500 to-pink-600' 
                                  : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                              )}>
                              {isIndividual ? 'Individual' : (isFull ? 'Llena' : `${availableSpots} Lugares`)}
                            </div>
                          </CardHeader>
                          <CardContent className="flex-grow p-4 pt-0 space-y-3 text-sm">
                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                              <Clock className="h-4 w-4 text-slate-500" />
                              <span>{session.dayOfWeek}, {formatTime(session.time)}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                              <User className="h-4 w-4 text-slate-500" />
                              <span>{specialist?.name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                              <MapPin className="h-4 w-4 text-slate-500" />
                              <span>{space?.name}</span>
                            </div>
                            <div 
                              onClick={() => setSessionForRoster(session)}
                              className="flex items-center gap-3 text-slate-600 dark:text-slate-300 cursor-pointer hover:text-primary transition-colors group"
                            >
                              {isIndividual ? <User className="h-4 w-4 text-slate-500 group-hover:text-primary transition-colors" /> : <Users className="h-4 w-4 text-slate-500 group-hover:text-primary transition-colors" />}
                              <span className="underline-offset-4 group-hover:underline">{enrolledCount}/{capacity} Inscriptos</span>
                            </div>
                          </CardContent>
                          <CardFooter className="p-3 flex items-center justify-between gap-2 border-t border-white/20">
                             <Button variant="outline" className="w-full flex-1" onClick={() => setSessionForAttendance(session)}>
                                <ClipboardCheck className="mr-2 h-4 w-4"/>
                                Pasar Lista
                             </Button>
                            <Button className="flex-1" onClick={() => setSessionToManage(session)}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Inscribir
                            </Button>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => handleEdit(session)}><Pencil className="h-4 w-4 text-slate-600" /><span className="sr-only">Editar</span></Button>
                              <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => openDeleteDialog(session)}><Trash2 className="h-4 w-4 text-rose-500" /><span className="sr-only">Eliminar</span></Button>
                            </div>
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
                )
              ) : (
                [...Array(6)].map((_, i) => <Skeleton key={i} className="h-[22rem] w-full bg-white/30 rounded-2xl" />)
              )}
            </div>
        </TabsContent>
        <TabsContent value="calendar">
          {isMounted ? (
            <ScheduleCalendarView 
                sessions={filteredSessions}
                specialists={specialists}
                actividades={actividades}
                spaces={spaces}
                onSessionClick={setSessionForRoster}
            />
          ) : (
              <Skeleton className="h-[500px] w-full bg-white/30 rounded-2xl" />
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

      {sessionToManage && <EnrollPeopleDialog session={sessionToManage} onClose={() => setSessionToManage(null)} />}
      {sessionForRoster && <EnrolledPeopleSheet session={sessionForRoster} onClose={() => setSessionForRoster(null)} />}
      {sessionForAttendance && <AttendanceSheet session={sessionForAttendance} onClose={() => setSessionForAttendance(null)} />}
    </div>
  );
}
