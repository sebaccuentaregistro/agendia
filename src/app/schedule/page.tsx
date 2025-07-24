

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, FileDown, LayoutGrid, List, CalendarDays, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionAlert, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import React, { useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import type { Session } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, exportToCsv } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScheduleCalendarView } from '@/components/schedule-calendar-view';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScheduleCard } from '@/components/schedule/schedule-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle } from 'lucide-react';
import { EnrollPeopleDialog } from '@/components/enroll-people-dialog';
import { WaitlistDialog } from '@/components/waitlist-dialog';
import { OneTimeAttendeeDialog } from '@/components/one-time-attendee-dialog';


const formSchema = z.object({
  instructorId: z.string().min(1, { message: 'Debes seleccionar un especialista.' }),
  actividadId: z.string().min(1, { message: 'Debes seleccionar una actividad.' }),
  spaceId: z.string().min(1, { message: 'Debes seleccionar un espacio.' }),
  dayOfWeek: z.enum(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']),
  time: z.string().min(1, { message: 'La hora es obligatoria.' }).regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:MM).' }),
  levelId: z.preprocess((val) => (val === 'none' || val === '' ? undefined : val), z.string().optional()),
});


function SchedulePageContent() {
  const { specialists, actividades, sessions, spaces, addSession, updateSession, deleteSession, levels, loading } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | undefined>(undefined);
  const [sessionForDelete, setSessionForDelete] = useState<Session | null>(null);
  const [sessionForEnrollment, setSessionForEnrollment] = useState<Session | null>(null);
  const [sessionForWaitlist, setSessionForWaitlist] = useState<Session | null>(null);
  const [sessionForRecovery, setSessionForRecovery] = useState<Session | null>(null);
  
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

  useEffect(() => {
    const handleAction = (e: Event) => {
        const { action, session } = (e as CustomEvent).detail;
        switch (action) {
            case 'edit-session':
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
                break;
            case 'delete-session':
                setSessionForDelete(session);
                break;
            case 'enroll-fixed':
                setSessionForEnrollment(session);
                break;
            case 'enroll-recovery':
                setSessionForRecovery(session);
                break;
            case 'add-to-waitlist':
                setSessionForWaitlist(session);
                break;
        }
    };
    document.addEventListener('schedule-card-action', handleAction);
    return () => {
        document.removeEventListener('schedule-card-action', handleAction);
    };

  }, [form]);
  
  const filteredAndSortedSessions = useMemo(() => {
    const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    return sessions
        .filter(session => {
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
  }, [sessions, filters]);
  

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
                 <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-2xl" />)}
                 </div>
              ) : filteredAndSortedSessions.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredAndSortedSessions.map((session) => (
                    <ScheduleCard 
                        key={session.id} 
                        session={session}
                        view="structural"
                    />
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
                                    <TableRow key={session.id} onClick={() => setIsDialogOpen(true)}>
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
                    onSessionClick={(session) => {
                        setSelectedSession(session);
                        setIsDialogOpen(true);
                    }}
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
       {sessionForRecovery && (
        <OneTimeAttendeeDialog 
            session={sessionForRecovery}
            onClose={() => setSessionForRecovery(null)}
        />
      )}
      {sessionForWaitlist && (
        <WaitlistDialog 
          session={sessionForWaitlist}
          onClose={() => setSessionForWaitlist(null)}
        />
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
