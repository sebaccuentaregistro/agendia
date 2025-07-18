

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Pencil, Users, FileDown, Clock, User, MapPin, UserPlus, LayoutGrid, CalendarDays, ClipboardCheck, CalendarIcon, Send, Star, MoreHorizontal, UserX, Signal, DoorOpen, List, Plane, CalendarClock, ListPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionAlert, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import type { Person, Session, WaitlistEntry } from '@/types';
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScheduleCalendarView } from '@/components/schedule-calendar-view';
import { AttendanceSheet } from '@/components/attendance-sheet';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  instructorId: z.string().min(1, { message: 'Debes seleccionar un especialista.' }),
  actividadId: z.string().min(1, { message: 'Debes seleccionar una actividad.' }),
  spaceId: z.string().min(1, { message: 'Debes seleccionar un espacio.' }),
  dayOfWeek: z.enum(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']),
  time: z.string().min(1, { message: 'La hora es obligatoria.' }).regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:MM).' }),
  levelId: z.preprocess((val) => (val === 'none' || val === '' ? undefined : val), z.string().optional()),
});

const oneTimeAttendeeSchema = z.object({
    personId: z.string().min(1, { message: 'Debes seleccionar una persona.' }),
    date: z.date({ required_error: 'Debes seleccionar una fecha.' }),
});

function NotifyAttendeesDialog({ session, onClose }: { session: Session; onClose: () => void; }) {
  const { people, isPersonOnVacation, actividades, attendance } = useStudio();
  const [message, setMessage] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
      setIsMounted(true);
  }, []);

  const { todayStr, today, attendeesToNotify } = useMemo(() => {
    if (!isMounted) {
      return { todayStr: '', today: new Date(), attendeesToNotify: [] };
    }
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    // Regular attendees not on vacation today
    const regularAttendees = session.personIds
      .map(pid => people.find(p => p.id === pid))
      .filter((p): p is Person => !!p && !isPersonOnVacation(p, today));

    // One-time attendees for today
    const attendanceRecord = attendance.find(a => a.sessionId === session.id && a.date === todayStr);
    const oneTimeAttendeeIds = new Set(attendanceRecord?.oneTimeAttendees || []);
    const oneTimeAttendees = people.filter(p => oneTimeAttendeeIds.has(p.id));

    // Combine and remove duplicates
    const allAttendeesMap = new Map<string, Person>();
    regularAttendees.forEach(p => allAttendeesMap.set(p.id, p));
    oneTimeAttendees.forEach(p => allAttendeesMap.set(p.id, p));

    const attendees = Array.from(allAttendeesMap.values()).sort((a,b) => a.name.localeCompare(b.name));
    return { todayStr, today, attendeesToNotify: attendees };
  }, [isMounted, session, people, isPersonOnVacation, attendance]);

  const actividad = actividades.find(a => a.id === session.actividadId);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(message);
    // You might want to show a toast notification here
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Notificar Asistentes</DialogTitle>
          <DialogDescription>
            Clase: {actividad?.name} - {session.dayOfWeek} {session.time}.
            Se notificará a {attendeesToNotify.length} persona(s).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Escribe tu mensaje aquí... Ej: La clase de hoy se cancela."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <Button variant="outline" size="sm" onClick={handleCopyToClipboard} className="w-full">
            Copiar Mensaje al Portapapeles
          </Button>
          <ScrollArea className="h-48 rounded-md border p-2">
            <div className="space-y-2">
              {attendeesToNotify.map(person => (
                <div key={person.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                  <span>{person.name}</span>
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700">
                    <a
                      href={`https://wa.me/${person.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <WhatsAppIcon />
                    </a>
                  </Button>
                </div>
              ))}
              {attendeesToNotify.length === 0 && (
                <div className="text-center p-4 text-sm text-muted-foreground">No hay asistentes para notificar.</div>
              )}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const prospectSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().regex(/^\d+$/, { message: 'El teléfono solo debe contener números.' }).min(8, { message: 'El teléfono parece muy corto.' }),
});

function WaitlistDialog({ session, onClose }: { session: Session; onClose: () => void; }) {
  const { people, addToWaitlist } = useStudio();
  const [activeTab, setActiveTab] = useState('existing');
  const [selectedPersonId, setSelectedPersonId] = useState('');

  const prospectForm = useForm<z.infer<typeof prospectSchema>>({
    resolver: zodResolver(prospectSchema),
    defaultValues: { name: '', phone: '' },
  });

  const eligiblePeople = useMemo(() => {
    const enrolledIds = new Set(session.personIds);
    const waitlistPersonIds = new Set((session.waitlist || []).filter(e => typeof e === 'string'));
    return people.filter(p => !enrolledIds.has(p.id) && !waitlistPersonIds.has(p.id))
      .sort((a,b) => a.name.localeCompare(b.name));
  }, [people, session]);

  const handleExistingSubmit = () => {
    if (selectedPersonId) {
      addToWaitlist(session.id, selectedPersonId);
      onClose();
    }
  };

  const handleProspectSubmit = (values: z.infer<typeof prospectSchema>) => {
    const prospect: WaitlistEntry = { ...values, isProspect: true };
    addToWaitlist(session.id, prospect);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anotar en Lista de Espera</DialogTitle>
          <DialogDescription>
            Añade un alumno existente o un nuevo contacto a la lista de espera de esta clase.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Alumno Existente</TabsTrigger>
                <TabsTrigger value="prospect">Nuevo Contacto</TabsTrigger>
            </TabsList>
            <TabsContent value="existing" className="py-4">
                 <div className="space-y-4">
                    <Select onValueChange={setSelectedPersonId} value={selectedPersonId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona una persona..." />
                        </SelectTrigger>
                        <SelectContent>
                            <ScrollArea className="h-60">
                                {eligiblePeople.length > 0 ? (
                                    eligiblePeople.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">No hay personas elegibles.</div>
                                )}
                            </ScrollArea>
                        </SelectContent>
                    </Select>
                     <Button onClick={handleExistingSubmit} disabled={!selectedPersonId} className="w-full">Añadir Alumno a la Lista</Button>
                </div>
            </TabsContent>
            <TabsContent value="prospect" className="py-4">
                <Form {...prospectForm}>
                    <form onSubmit={prospectForm.handleSubmit(handleProspectSubmit)} className="space-y-4">
                         <FormField
                            control={prospectForm.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Contacto</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={prospectForm.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teléfono</FormLabel>
                                    <FormControl><Input type="tel" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full">Añadir Nuevo Contacto a la Lista</Button>
                    </form>
                </Form>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function OneTimeAttendeeDialog({ session, preselectedPersonId, onClose }: { session: Session; preselectedPersonId?: string | null; onClose: () => void }) {
  const { people, addOneTimeAttendee, actividades, attendance, spaces, isPersonOnVacation } = useStudio();
  const actividad = actividades.find(a => a.id === session.actividadId);
  const space = spaces.find(s => s.id === session.spaceId);
  const capacity = space?.capacity ?? 0;
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const form = useForm<z.infer<typeof oneTimeAttendeeSchema>>({
    resolver: zodResolver(oneTimeAttendeeSchema),
    defaultValues: {
        personId: preselectedPersonId || undefined,
    }
  });

  const selectedDate = form.watch('date');

  const dayMap: { [key in Session['dayOfWeek']]: number } = useMemo(() => ({
    'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6,
  }), []);

  const sessionDayNumber = dayMap[session.dayOfWeek];

  const { occupationMessage, isFull } = useMemo(() => {
    if (!selectedDate) return { occupationMessage: '', isFull: false };
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const attendanceRecord = attendance.find(a => a.sessionId === session.id && a.date === dateStr);
    const oneTimeIds = attendanceRecord?.oneTimeAttendees || [];
    const regularIdsOnVacation = session.personIds.filter(pid => {
        const person = people.find(p => p.id === pid);
        return person && isPersonOnVacation(person, selectedDate);
    }).length;

    const currentEnrollment = session.personIds.length - regularIdsOnVacation + oneTimeIds.length;
    
    return {
      occupationMessage: `Ocupación para el ${format(selectedDate, 'dd/MM/yy')}: ${currentEnrollment}/${capacity}`,
      isFull: currentEnrollment >= capacity,
    }
  }, [selectedDate, session, attendance, people, isPersonOnVacation, capacity]);

  const eligiblePeople = useMemo(() => {
    const balances: Record<string, number> = {};
    people.forEach(p => (balances[p.id] = 0));

    attendance.forEach(record => {
      record.justifiedAbsenceIds?.forEach(personId => {
        if (balances[personId] !== undefined) balances[personId]++;
      });
      record.oneTimeAttendees?.forEach(personId => {
        if (balances[personId] !== undefined) balances[personId]--;
      });
    });

    return people
      .filter(person => balances[person.id] > 0 || person.id === preselectedPersonId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [people, attendance, preselectedPersonId]);


  function onSubmit(values: z.infer<typeof oneTimeAttendeeSchema>) {
    addOneTimeAttendee(session.id, values.personId, values.date);
    onClose();
  }
  
  return (
    <Dialog open onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Añadir Asistente Puntual</DialogTitle>
                <DialogDescription>
                    Inscribe a una persona en la sesión de "{actividad?.name}" solo para una fecha específica.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                     <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Fecha de la clase</FormLabel>
                                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP", { locale: es })
                                                ) : (
                                                    <span>Selecciona una fecha</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={(date) => {
                                                field.onChange(date);
                                                setIsCalendarOpen(false);
                                            }}
                                            disabled={(date) => {
                                                const isPast = date < new Date(new Date().setDate(new Date().getDate() - 1));
                                                const isWrongDay = date.getDay() !== sessionDayNumber;
                                                return isPast || isWrongDay;
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                {occupationMessage && (
                                    <p className={cn("text-sm mt-1", isFull ? "text-destructive font-semibold" : "text-muted-foreground")}>
                                        {occupationMessage}
                                    </p>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="personId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Persona con recuperos pendientes</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDate || isFull || !!preselectedPersonId}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona una persona" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {eligiblePeople.length > 0 ? (
                                          eligiblePeople.map(person => (
                                            <SelectItem key={person.id} value={person.id}>
                                              {person.name}
                                            </SelectItem>
                                          ))
                                        ) : (
                                          <div className="p-4 text-center text-sm text-muted-foreground">No hay personas con recuperos pendientes.</div>
                                        )}
                                    </SelectContent>
                                </Select>
                                {!selectedDate && <p className="text-xs text-muted-foreground">Debes seleccionar una fecha para habilitar esta lista.</p>}
                                {isFull && <p className="text-xs text-destructive">La clase está llena para la fecha seleccionada.</p>}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={isFull || !form.formState.isValid}>Añadir Asistente</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}


function EnrollPeopleDialog({ session, onClose }: { session: Session; onClose: () => void; }) {
  const { people, spaces, enrollPeopleInClass, actividades } = useStudio();
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<{ personIds: string[] }>({
    defaultValues: { personIds: session.personIds || [] },
  });
  const watchedPersonIds = form.watch('personIds');

  const space = spaces.find(s => s.id === session.spaceId);
  const capacity = space?.capacity ?? 0;
  const actividad = actividades.find(a => a.id === session.actividadId);

  function onSubmit(data: { personIds: string[] }) {
    enrollPeopleInClass(session.id, data.personIds);
    onClose();
  }

  const sortedPeople = useMemo(() => [...people].sort((a, b) => a.name.localeCompare(b.name)), [people]);

  const filteredPeople = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    return sortedPeople.filter(person => {
      const isSelected = watchedPersonIds.includes(person.id);
      const nameMatches = person.name.toLowerCase().includes(lowercasedFilter);
      return isSelected || nameMatches;
    });
  }, [searchTerm, sortedPeople, watchedPersonIds]);

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
            <div className="my-2">
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <FormField
              control={form.control}
              name="personIds"
              render={() => (
                <FormItem>
                  <ScrollArea className="h-72 rounded-md border p-4">
                    {filteredPeople.length > 0 ? filteredPeople.map(person => (
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
                    )) : <p className="text-center text-sm text-muted-foreground">No se encontraron personas.</p>}
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
            {enrolledPeople.length} de {space?.capacity || 0} personas inscriptas.
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

function SchedulePageContent() {
  const { specialists, actividades, sessions, spaces, addSession, updateSession, deleteSession, levels, people, loading, isPersonOnVacation, attendance } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | undefined>(undefined);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [sessionToManage, setSessionToManage] = useState<Session | null>(null);
  const [sessionForRoster, setSessionForRoster] = useState<Session | null>(null);
  const [sessionForAttendance, setSessionForAttendance] = useState<Session | null>(null);
  const [sessionForPuntual, setSessionForPuntual] = useState<Session | null>(null);
  const [sessionToNotify, setSessionToNotify] = useState<Session | null>(null);
  const [sessionForWaitlist, setSessionForWaitlist] = useState<Session | null>(null);
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
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    return filteredSessions.map(session => {
        const attendanceRecord = attendance.find(a => a.sessionId === session.id && a.date === todayStr);
        const oneTimeAttendees = attendanceRecord?.oneTimeAttendees || [];
        
        const peopleOnVacationToday = session.personIds
            .map(pid => people.find(p => p.id === pid))
            .filter((p): p is Person => !!p && isPersonOnVacation(p, today));

        const activeRegulars = session.personIds.filter(pid => !peopleOnVacationToday.some(p => p.id === pid));
        const enrolledCount = activeRegulars.length + oneTimeAttendees.length;

        return {
            ...session,
            enrolledCount,
            peopleOnVacationToday,
        };
    });
  }, [filteredSessions, attendance, people, isPersonOnVacation, isMounted]);


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
              Estás buscando un lugar para que recupere una clase <strong>{personForRecovery.name}</strong>. Haz clic en "Recuperar Aquí" en la clase deseada.
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
                      const { enrolledCount, peopleOnVacationToday } = session;

                      const availableSpots = capacity - enrolledCount;
                      const sessionTitle = `${actividad?.name || 'Sesión'}`;
                      const isFull = availableSpots <= 0;
                      const waitlistCount = session.waitlist?.length || 0;
                      
                      const isAttendanceAllowed = isAttendanceAllowedForSession(session);
                      const tooltipMessage = isAttendanceAllowed ? "Pasar Lista" : "La asistencia se habilita 20 minutos antes o en días pasados.";

                      return (
                        <Card 
                          key={session.id} 
                          className={cn(
                            "flex flex-col bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border-2 border-slate-200/60 dark:border-zinc-700/60 overflow-hidden",
                            recoveryMode && !isFull && "border-primary/40 hover:border-primary"
                          )}
                        >
                          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                             <div className="flex flex-col gap-2">
                                <CardTitle className="text-lg font-bold text-primary">{sessionTitle}</CardTitle>
                                {level && (
                                    <Badge variant="outline" className="font-semibold w-fit flex items-center gap-1.5"><Signal className="h-3 w-3" />{level.name}</Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm", isFull ? 'bg-red-500': 'bg-green-500')}>
                                {isFull ? 'LLENO' : `${availableSpots} LUGARES`}
                              </div>
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
                                      <DropdownMenuItem onSelect={() => setSessionForPuntual(session)} disabled={isFull}>
                                        <CalendarDays className="mr-2 h-4 w-4" /> Inscripción de Recupero
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
                               <div className="flex items-center justify-between">
                                  <div
                                      className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:underline"
                                      onClick={() => setSessionForRoster(session)}
                                    >
                                    <Users className="h-4 w-4" />
                                    <span>
                                        {enrolledCount}/{capacity} inscriptos
                                    </span>
                                    {waitlistCount > 0 && (
                                        <Badge variant="outline" className="border-amber-500 text-amber-600 dark:border-amber-700 dark:text-amber-400 bg-amber-500/10 text-xs">
                                            {waitlistCount} en espera
                                        </Badge>
                                    )}
                                  </div>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center">
                                          {peopleOnVacationToday.length > 0 && (
                                            <span className="flex items-center gap-1 text-blue-500">
                                              <Plane className="h-4 w-4" />
                                            </span>
                                          )}
                                        </div>
                                      </TooltipTrigger>
                                      {peopleOnVacationToday.length > 0 && (
                                        <TooltipContent>
                                          <div className="text-sm">
                                            <p className="font-semibold mb-1">En vacaciones hoy:</p>
                                            <ul className="list-disc pl-4">
                                                {peopleOnVacationToday.map(p => <li key={p.id}>{p.name}</li>)}
                                            </ul>
                                          </div>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </TooltipProvider>
                               </div>
                              <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-zinc-700">
                                <div
                                  className={cn("h-2 rounded-full", isFull ? "bg-pink-500" : "bg-green-500")}
                                  style={{ width: `${capacity > 0 ? (enrolledCount / capacity) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="grid grid-cols-1 gap-4 p-4 mt-auto border-t border-slate-100 dark:border-zinc-700/80">
                            {recoveryMode ? (
                                <Button className="w-full font-bold" onClick={() => setSessionForPuntual(session)} disabled={isFull}>
                                    <CalendarClock className="mr-2 h-4 w-4" />
                                    Recuperar Aquí
                                </Button>
                            ) : (
                               <div className="grid grid-cols-3 gap-2">
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
                                  <Button className="w-full font-bold col-span-2" onClick={() => setSessionToManage(session)} disabled={isFull}>
                                    <Users className="mr-2 h-4 w-4" />
                                    Inscripción Fija
                                  </Button>
                                  <Button variant="secondary" className="w-full font-bold col-span-3" onClick={() => setSessionForWaitlist(session)} disabled={!isFull}>
                                    <ListPlus className="mr-2 h-4 w-4" />
                                    Anotar en Espera
                                  </Button>
                               </div>
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
                                    const { enrolledCount } = session;
                                    const isFull = enrolledCount >= capacity;
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
                                                <Badge variant={enrolledCount >= capacity ? 'destructive' : 'secondary'}>
                                                    {enrolledCount} / {capacity}
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
                                                        <DropdownMenuItem onSelect={() => setSessionToManage(session)} disabled={isFull}>
                                                          <Users className="mr-2 h-4 w-4" />Inscripción Fija
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => setSessionForPuntual(session)} disabled={isFull}>
                                                          <CalendarDays className="mr-2 h-4 w-4" />Inscripción Recupero
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onSelect={() => handleEdit(session)}>
                                                            <Pencil className="mr-2 h-4 w-4" />Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => setSessionToNotify(session)}>
                                                            <Send className="mr-2 h-4 w-4" />Notificar
                                                        </DropdownMenuItem>
                                                        {isFull && (
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
                onSessionClick={setSessionForRoster}
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

      {sessionToManage && <EnrollPeopleDialog session={sessionToManage} onClose={() => setSessionToManage(null)} />}
      {sessionForPuntual && <OneTimeAttendeeDialog session={sessionForPuntual} preselectedPersonId={personIdForRecovery} onClose={() => setSessionForPuntual(null)} />}
      {sessionForRoster && <EnrolledPeopleSheet session={sessionForRoster} onClose={() => setSessionForRoster(null)} />}
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
