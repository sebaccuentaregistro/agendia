
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import type { Person, Session } from '@/types';
import { MoreHorizontal, PlusCircle, CreditCard, Undo2, History, CalendarPlus, FileDown, ClipboardCheck, CheckCircle2, XCircle, CalendarClock, Plane, Users, MapPin, Calendar as CalendarIcon, Clock, HeartPulse, UserPlus, UserX, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useStudio } from '@/context/StudioContext';
import * as Utils from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSearchParams } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { exportToCsv } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().regex(/^\d+$/, { message: 'El teléfono solo debe contener números (sin espacios ni guiones).' }).min(10, { message: 'El teléfono debe tener al menos 10 dígitos.' }),
  membershipType: z.enum(['Mensual', 'Diario'], { required_error: 'Debes seleccionar un tipo de membresía.' }),
  healthInfo: z.string().optional(),
});

function EnrollDialog({ person, onOpenChange }: { person: Person; onOpenChange: (open: boolean) => void }) {
  const { people, sessions, specialists, actividades, enrollPersonInSessions, spaces, isPersonOnVacation, addToWaitlist } = useStudio();
  const form = useForm<{ sessionIds: string[] }>({ defaultValues: { sessionIds: sessions.filter(session => session.personIds.includes(person.id)).map(session => session.id) } });
  const [actividadFilter, setActividadFilter] = useState('all');
  const [specialistFilter, setSpecialistFilter] = useState('all');

  const filteredSessions = sessions
      .filter(session => 
        (actividadFilter === 'all' || session.actividadId ===ividadFilter) &&
        (specialistFilter === 'all' || session.instructorId === specialistFilter)
      )
      .map(session => {
        const space = spaces.find(s => s.id === session.spaceId);
        const capacity = session.sessionType === 'Individual' ? 1 : space?.capacity ?? 0;
        
        // Count active people not on vacation
        const activeEnrolledCount = session.personIds.filter(pid => {
            const p = people.find(p => p.id === pid);
            return p && p.status === 'active' && !isPersonOnVacation(p, new Date());
        }).length;
        
        return {
            ...session,
            specialist: specialists.find(i => i.id === session.instructorId),
            actividad: actividades.find(a => a.id === session.actividadId),
            space,
            isPermanentlyFull: activeEnrolledCount >= capacity,
            activeEnrolledCount,
            capacity,
        };
    })
      .sort((a, b) => {
        const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const dayComparison = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
        if (dayComparison !== 0) return dayComparison;
        return a.time.localeCompare(b.time);
      });


  function onSubmit(data: { sessionIds: string[] }) {
    enrollPersonInSessions(person.id, data.sessionIds);
    onOpenChange(false);
  }

  const formatTime = (time: string) => {
    if (!time || !time.includes(':')) return 'N/A';
    return time;
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Asignar Sesiones a {person.name}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Filtrar por Actividad</Label>
                <Select onValueChange={setActividadFilter} value={actividadFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {actividades.slice().sort((a, b) => a.name.localeCompare(b.name)).map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Filtrar por Especialista</Label>
                <Select onValueChange={setSpecialistFilter} value={specialistFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {specialists.slice().sort((a, b) => a.name.localeCompare(b.name)).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <FormField control={form.control} name="sessionIds" render={() => (
              <FormItem>
                <FormLabel>Sesiones Disponibles</FormLabel>
                <ScrollArea className="h-72 rounded-md border p-4">
                  <div className="space-y-4">
                    {filteredSessions.map((item) => {
                      const { specialist, actividad, space, isPermanentlyFull, activeEnrolledCount, capacity } = item;
                      if (!actividad || !specialist || !space) return null;
                      
                      const isEnrolledInForm = form.watch('sessionIds').includes(item.id);
                      const isOnWaitlist = item.waitlistPersonIds?.includes(person.id);

                      if (isPermanentlyFull && !isEnrolledInForm) {
                        return (
                          <div key={item.id} className={Utils.cn("flex flex-row items-center space-x-3 space-y-0 rounded-md p-3 transition-colors bg-muted/50 opacity-80")}>
                            <div className="flex-grow space-y-1 leading-none">
                              <span className="font-normal text-muted-foreground">{actividad.name}</span>
                              <div className="text-xs text-muted-foreground">
                                <p>{specialist?.name}</p>
                                <p>{item.dayOfWeek} {formatTime(item.time)}</p>
                                <p><span className="font-medium">Espacio:</span> {space?.name} ({activeEnrolledCount}/{capacity})</p>
                              </div>
                              <p className="text-xs font-semibold text-amber-600 dark:text-amber-500">
                                {item.sessionType === 'Individual' ? 'Sesión individual ocupada' : 'Plazas fijas completas.'}
                              </p>
                            </div>
                            {isOnWaitlist ? (
                                <Badge variant="secondary">En espera</Badge>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addToWaitlist(item.id, person.id)}
                                >
                                    Anotar en espera
                                </Button>
                            )}
                          </div>
                        )
                      }
                      
                      return (
                        <FormField key={item.id} control={form.control} name="sessionIds" render={({ field }) => (
                          <FormItem className={Utils.cn("flex flex-row items-start space-x-3 space-y-0 rounded-md p-3 transition-colors hover:bg-muted/50")}>
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  const currentValues = field.value || [];
                                  return checked ? field.onChange([...currentValues, item.id]) : field.onChange(currentValues.filter((value) => value !== item.id));
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-normal">{actividad.name}</FormLabel>
                              <div className="text-xs text-muted-foreground">
                                <p>{specialist?.name}</p>
                                <p>{item.dayOfWeek} {formatTime(item.time)}</p>
                                <p><span className="font-medium">Espacio:</span> {space?.name} ({activeEnrolledCount}/{capacity})</p>
                              </div>
                            </div>
                          </FormItem>
                        )}/>
                      );
                    })}
                  </div>
                </ScrollArea><FormMessage />
              </FormItem>
            )}/>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AttendanceHistorySheet({ person, onClose }: { person: Person; onClose: () => void }) {
  const { attendance, sessions, actividades } = useStudio();

  const history = useMemo(() => {
    if (!person) return [];
    
    type HistoryEntry = { date: string, sessionId: string, status: 'present' | 'absent' | 'justified' };
    const personHistory: HistoryEntry[] = [];
    
    attendance.forEach(record => {
      if (record.presentIds.includes(person.id)) {
        personHistory.push({ date: record.date, sessionId: record.sessionId, status: 'present' });
      } else if (record.absentIds.includes(person.id)) {
        personHistory.push({ date: record.date, sessionId: record.sessionId, status: 'absent' });
      } else if (record.justifiedAbsenceIds?.includes(person.id)) {
        personHistory.push({ date: record.date, sessionId: record.sessionId, status: 'justified' });
      }
    });

    return personHistory
      .map(entry => {
        const session = sessions.find(s => s.id === entry.sessionId);
        const actividad = session ? actividades.find(a => a.id === session.actividadId) : null;
        const dateObj = new Date(`${entry.date}T12:00:00Z`); // Avoid timezone issues
        return {
          ...entry,
          dateObj,
          actividadName: actividad?.name || 'Clase eliminada',
        };
      })
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [person, attendance, sessions, actividades]);
  
  const handleExportAttendance = () => {
    if (!person) return;
      const dataToExport = history.map(h => ({
          date: h.date,
          activity: h.actividadName,
          status: h.status === 'present' ? 'Presente' : (h.status === 'absent' ? 'Ausente' : 'Justificada')
      }));

      if (dataToExport.length === 0) return;

      const headers = {
          date: 'Fecha',
          activity: 'Actividad',
          status: 'Estado'
      };
      exportToCsv(`historial_asistencia_${person.name.replace(/\s/g, '_')}.csv`, dataToExport, headers);
  }

  const getStatusBadge = (status: 'present' | 'absent' | 'justified') => {
    switch(status) {
      case 'present':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Presente</span>
          </div>
        );
      case 'absent':
        return (
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-4 w-4" />
            <span>Ausente</span>
          </div>
        );
      case 'justified':
        return (
           <div className="flex items-center gap-2 text-yellow-600">
            <CalendarClock className="h-4 w-4" />
            <span>Justificada</span>
          </div>
        )
      default:
        return null;
    }
  }


  return (
    <Sheet open={!!person} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Historial de Asistencia: {person?.name}</SheetTitle>
          <div className="flex items-center justify-between pt-2">
            <SheetDescription>Registro de todas las asistencias.</SheetDescription>
            <Button
                variant="outline"
                size="sm"
                onClick={handleExportAttendance}
                disabled={history.length === 0}
            >
                <FileDown className="mr-2 h-4 w-4" />
                Exportar
            </Button>
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100%-8rem)] pr-4 mt-4">
          <div className="space-y-2">
            {history.length > 0 ? (
              history.map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-3 rounded-md bg-muted/50">
                  <div>
                    <p className="font-semibold">{entry.actividadName}</p>
                    <p className="text-xs text-muted-foreground">{format(entry.dateObj, 'dd MMMM yyyy')}</p>
                  </div>
                  {getStatusBadge(entry.status)}
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground pt-16">
                <p>No hay registros de asistencia.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function VacationDialog({ person, onClose }: { person: Person; onClose: () => void; }) {
  const { addVacationPeriod } = useStudio();
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  const handleSubmit = () => {
    if (person && date?.from && date?.to) {
      addVacationPeriod(person.id, date.from, date.to);
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Vacaciones para {person.name}</DialogTitle>
          <DialogDescription>
            Selecciona el período. Durante este tiempo, los pagos se pausarán y no aparecerá en las listas de asistencia.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4 justify-center">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={new Date()}
            selected={date}
            onSelect={setDate}
            numberOfMonths={1}
            locale={es}
            disabled={{ before: new Date() }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!date?.from || !date?.to}>Guardar Período</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const justifyAbsenceSchema = z.object({
  sessionId: z.string().min(1, { message: 'Debes seleccionar una sesión.' }),
  date: z.date({ required_error: 'Debes seleccionar una fecha.' }),
});

function JustifyAbsenceDialog({ person, onClose }: { person: Person; onClose: () => void; }) {
  const { sessions, specialists, actividades, addJustifiedAbsence } = useStudio();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const form = useForm<z.infer<typeof justifyAbsenceSchema>>({
    resolver: zodResolver(justifyAbsenceSchema),
  });

  const watchedSessionId = form.watch('sessionId');

  const enrolledSessions = useMemo(() => {
    return sessions
      .filter(session => session.personIds.includes(person.id))
      .map(session => ({
        ...session,
        actividad: actividades.find(a => a.id === session.actividadId)?.name || 'N/A',
        specialist: specialists.find(s => s.id === session.instructorId)?.name || 'N/A',
      }))
      .sort((a,b) => a.dayOfWeek.localeCompare(b.dayOfWeek) || a.time.localeCompare(b.time));
  }, [sessions, person.id, actividades, specialists]);

  const selectedSession = useMemo(() => {
    return enrolledSessions.find(s => s.id === watchedSessionId);
  }, [watchedSessionId, enrolledSessions]);
  
  const dayMap: { [key in Session['dayOfWeek']]: number } = useMemo(() => ({
    'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6,
  }), []);

  const sessionDayNumber = selectedSession ? dayMap[selectedSession.dayOfWeek] : -1;

  function onSubmit(values: z.infer<typeof justifyAbsenceSchema>) {
    addJustifiedAbsence(person.id, values.sessionId, values.date);
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notificar Ausencia Futura</DialogTitle>
          <DialogDescription>
            Registra una ausencia justificada para {person.name}. Esto le otorgará una clase para recuperar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="sessionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sesión</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la sesión a la que faltará" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {enrolledSessions.map(session => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.actividad} ({session.dayOfWeek} {session.time})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de la Ausencia</FormLabel>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          disabled={!watchedSessionId}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>{watchedSessionId ? 'Selecciona una fecha' : 'Primero elige una sesión'}</span>
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
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            const isPastOrToday = date < today;
                            const isWrongDay = date.getDay() !== sessionDayNumber;
                            return isPastOrToday || isWrongDay;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">Guardar Justificación</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const paymentMonthsSchema = z.object({
  months: z.coerce.number().int().min(1, "Debe ser al menos 1 mes.").max(12, "No se pueden registrar más de 12 meses."),
});

function RecordPaymentDialog({ person, onClose }: { person: Person; onClose: () => void; }) {
  const { recordPayment } = useStudio();

  const form = useForm<z.infer<typeof paymentMonthsSchema>>({
    resolver: zodResolver(paymentMonthsSchema),
    defaultValues: { months: 1 },
  });

  function onSubmit(values: z.infer<typeof paymentMonthsSchema>) {
    recordPayment(person.id, values.months);
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            Selecciona cuántos meses de membresía quieres registrar para {person.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad de Meses</FormLabel>
                  <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <SelectItem key={month} value={String(month)}>
                          {month} {month === 1 ? 'mes' : 'meses'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">Registrar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const deactivationReasons = [
  "Costo",
  "Se mudó",
  "Problemas de horario",
  "No está conforme con las clases",
  "Motivos personales",
];

const deactivationSchema = z.object({
  reason: z.string().min(1, { message: "Debes seleccionar un motivo." }),
  otherReason: z.string().optional(),
}).refine(data => {
  if (data.reason === 'Otro' && (!data.otherReason || data.otherReason.trim().length < 5)) {
    return false;
  }
  return true;
}, {
  message: "Por favor, especifica el otro motivo (mínimo 5 caracteres).",
  path: ["otherReason"],
});


function DeactivationDialog({ person, onClose }: { person: Person; onClose: () => void; }) {
  const { deactivatePerson } = useStudio();
  const form = useForm<z.infer<typeof deactivationSchema>>({
    resolver: zodResolver(deactivationSchema),
    defaultValues: { reason: "", otherReason: "" },
  });
  const watchedReason = form.watch("reason");

  function onSubmit(values: z.infer<typeof deactivationSchema>) {
    const finalReason = values.reason === 'Otro' ? values.otherReason! : values.reason;
    deactivatePerson(person.id, finalReason);
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dar de baja a {person.name}</DialogTitle>
          <DialogDescription>
            Esto marcará a la persona como inactiva y la desinscribirá de todas sus clases. Sus datos históricos se conservarán.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo de la baja</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un motivo..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      {deactivationReasons.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      <SelectItem value="Otro">Otro...</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {watchedReason === 'Otro' && (
              <FormField
                control={form.control}
                name="otherReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Por favor, especifica el motivo</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" variant="destructive">Confirmar Baja</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export default function StudentsPage() {
  const { people, addPerson, updatePerson, deactivatePerson, reactivatePerson, recordPayment, undoLastPayment, payments, sessions, specialists, actividades, spaces, removeVacationPeriod, isPersonOnVacation, attendance } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | undefined>(undefined);
  const [personToDeactivate, setPersonToDeactivate] = useState<Person | null>(null);
  const [personToEnroll, setPersonToEnroll] = useState<Person | null>(null);
  const [personForHistory, setPersonForHistory] = useState<Person | null>(null);
  const [personForAttendance, setPersonForAttendance] = useState<Person | null>(null);
  const [personForVacation, setPersonForVacation] = useState<Person | null>(null);
  const [personForJustification, setPersonForJustification] = useState<Person | null>(null);
  const [personToRecordPayment, setPersonToRecordPayment] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [isMounted, setIsMounted] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => { setIsMounted(true); }, []);

  const processedPeople = useMemo(() => {
    if (!isMounted) return [];
    
    const now = new Date();
    const recoveryBalances: Record<string, number> = {};
    people.forEach(p => (recoveryBalances[p.id] = 0));
    attendance.forEach(record => {
      record.justifiedAbsenceIds?.forEach(personId => {
        if (recoveryBalances[personId] !== undefined) recoveryBalances[personId]++;
      });
      record.oneTimeAttendees?.forEach(personId => {
        if (recoveryBalances[personId] !== undefined) recoveryBalances[personId]--;
      });
    });
    
    let peopleList = people.map(p => ({ 
        ...p, 
        paymentStatus: Utils.getStudentPaymentStatus(p, now),
        nextPaymentDate: Utils.getNextPaymentDate(p),
        recoveryBalance: recoveryBalances[p.id] > 0 ? recoveryBalances[p.id] : 0,
    }));
    
    // Primary filter: active/inactive status
    peopleList = peopleList.filter(p => p.status === statusFilter);

    // Secondary filter from query params (only applies to active people)
    if (statusFilter === 'active') {
      const filter = searchParams.get('filter');
      if (filter === 'overdue') {
        peopleList = peopleList.filter(p => p.paymentStatus === 'Atrasado');
      } else if (filter === 'on-vacation') {
        peopleList = peopleList.filter(p => isPersonOnVacation(p, now));
      } else if (filter === 'pending-recovery') {
        peopleList = peopleList.filter(p => p.recoveryBalance > 0);
      }
    }

    if (searchTerm.trim() !== '') {
      peopleList = peopleList.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    return peopleList.sort((a,b) => a.name.localeCompare(b.name));
  }, [people, searchParams, searchTerm, isMounted, isPersonOnVacation, attendance, statusFilter]);

  const emptyState = useMemo(() => {
    if (searchTerm) {
      return {
        title: `No se encontraron personas ${statusFilter === 'active' ? 'activas' : 'inactivas'}`,
        description: "Intenta con otro nombre o limpia la búsqueda."
      }
    }
    if (statusFilter === 'inactive') {
        return {
            title: "No hay personas inactivas",
            description: "Aquí se mostrarán las personas que se den de baja."
        }
    }
    const filter = searchParams.get('filter');
    if (filter === 'overdue') {
      return {
        title: "Nadie tiene pagos atrasados",
        description: "¡Excelente! Todas las personas están al día con sus pagos."
      }
    }
    if (filter === 'on-vacation') {
      return {
        title: "Nadie está de vacaciones",
        description: "Actualmente no hay personas registradas en período de vacaciones."
      }
    }
    if (filter === 'pending-recovery') {
        return {
            title: "Nadie tiene recuperos pendientes",
            description: "¡Todo en orden! No hay clases para recuperar."
        }
    }
    return {
      title: "No Hay Personas",
      description: "Empieza añadiendo tu primera persona."
    }
  }, [searchTerm, searchParams, statusFilter]);

  const form = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema), defaultValues: { name: '', phone: '', membershipType: 'Mensual', healthInfo: '' }});

  const getPaymentStatusBadge = (status: 'Al día' | 'Atrasado') => {
    if (status === 'Al día') return <Badge className="bg-white/90 text-green-700 hover:bg-white/90 font-bold border-green-200"><CheckCircle2 className="h-4 w-4 mr-1.5" />Al día</Badge>;
    return <Badge variant="destructive" className="font-bold border-destructive/50"><XCircle className="h-4 w-4 mr-1.5" />Atrasado</Badge>;
  };

  function handleEdit(person: Person) {
    setSelectedPerson(person);
    form.reset({ name: person.name, phone: person.phone, membershipType: person.membershipType, healthInfo: person.healthInfo || '' });
    setIsDialogOpen(true);
  }

  function handleAdd() {
    setSelectedPerson(undefined);
    form.reset({ name: '', phone: '', membershipType: 'Mensual', healthInfo: '' });
    setIsDialogOpen(true);
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (selectedPerson) {
      updatePerson({ ...selectedPerson, ...values });
    } else {
      addPerson(values);
    }
    setIsDialogOpen(false);
    setSelectedPerson(undefined);
  }
  
  const formatWhatsAppLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

  const formatTime = (time: string) => {
    if (!time || !time.includes(':')) return 'N/A';
    return time;
  };

  const handleExportPeople = () => {
    const headers = {
        name: 'Nombre',
        phone: 'Teléfono',
        membershipType: 'Membresía',
        paymentStatus: 'Estado de Pago',
        joinDate: 'Fecha de Inscripción',
        nextPaymentDate: 'Próximo Pago'
    };
    const dataToExport = processedPeople.map(p => ({
        ...p,
        nextPaymentDate: p.nextPaymentDate || ''
    }));
    exportToCsv('personas.csv', dataToExport, headers);
  };
  
  const handleExportHistory = () => {
      if (!personForHistory) return;
      const personPayments = payments
          .filter(p => p.personId === personForHistory.id)
          .sort((a,b) => b.date.getTime() - a.date.getTime())
          .map(p => ({ date: p.date, months: p.months || 1 }));

      if (personPayments.length === 0) return;

      const headers = {
          date: 'Fecha de Pago',
          months: 'Meses Pagados'
      };
      exportToCsv(`historial_pagos_${personForHistory.name.replace(/\s/g, '_')}.csv`, personPayments, headers);
  };

  return (
    <div>
      <PageHeader title="Personas">
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={handleExportPeople}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setSelectedPerson(undefined); }}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd} size="icon">
                <UserPlus className="h-5 w-5" />
                <span className="sr-only">Añadir Persona</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader><DialogTitle>{selectedPerson ? 'Editar Persona' : 'Añadir Nueva Persona'}</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="membershipType" render={({ field }) => (
                    <FormItem><FormLabel>Membresía</FormLabel><FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Mensual" /></FormControl><FormLabel className="font-normal">Mensual</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Diario" /></FormControl><FormLabel className="font-normal">Diario</FormLabel></FormItem>
                      </RadioGroup>
                    </FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="healthInfo" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Consideraciones de Salud (Opcional)</FormLabel>
                          <FormControl>
                              <Textarea placeholder="Ej: Lesión de rodilla, embarazo, hipertensión..." {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                  )}/>
                  <DialogFooter><Button type="submit">Guardar Cambios</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>
      
      <div className="flex flex-col sm:flex-row gap-4 -mt-6 mb-8">
        <Input 
          placeholder="Buscar por nombre..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full max-w-sm bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl"
        />
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
                <TabsTrigger value="active">Activos</TabsTrigger>
                <TabsTrigger value="inactive">Inactivos</TabsTrigger>
            </TabsList>
        </Tabs>
      </div>

      {!isMounted ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-[32rem] w-full bg-white/30 rounded-2xl" />)}
        </div>
      ) : processedPeople.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {processedPeople.map((person) => {
                const hasPayments = payments.some(p => p.personId === person.id);
                const enrolledSessions = sessions.filter(session => session.personIds.includes(person.id)).sort((a,b) => a.dayOfWeek.localeCompare(b.dayOfWeek) || a.time.localeCompare(b.time));
                const sortedVacations = person.vacationPeriods?.sort((a,b) => a.startDate.getTime() - b.startDate.getTime()) || [];
                const personRecoveryClasses = attendance
                  .filter(record => record.justifiedAbsenceIds?.includes(person.id))
                  .map(record => {
                      const session = sessions.find(s => s.id === record.sessionId);
                      constividad = session ? actividades.find(a => a.id === session.actividadId) : null;
                      return {
                          date: record.date,
                          actividadName: actividad?.name || 'Clase eliminada'
                      };
                  })
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                return (
                    <Card key={person.id} className={cn("flex flex-col rounded-2xl shadow-lg overflow-hidden border border-slate-200/60 dark:border-zinc-700/60 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-card", person.status === 'inactive' && 'bg-slate-50 dark:bg-zinc-900/50 opacity-70')}>
                        <div className="p-4 bg-gradient-to-br from-primary to-fuchsia-600 text-primary-foreground">
                            <div className="flex flex-row items-start justify-between">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-lg font-bold text-white">{person.name}</h3>
                                        {(person as any).recoveryBalance > 0 && person.status === 'active' && (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <button className="flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-900 shadow-sm cursor-pointer hover:bg-amber-500 transition-colors">
                                                        <CalendarClock className="h-3.5 w-3.5" />
                                                        <span>{(person as any).recoveryBalance}</span>
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80">
                                                    <div className="grid gap-4">
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium leading-none">Clases para Recuperar</h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                Tiene {(person as any).recoveryBalance} clase(s) pendiente(s) de recuperar.
                                                            </p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <h5 className="text-xs font-semibold uppercase text-muted-foreground">Créditos de Ausencias Justificadas</h5>
                                                            <ScrollArea className="h-32">
                                                                <div className="space-y-2 pr-2">
                                                                    {personRecoveryClasses.length > 0 ? personRecoveryClasses.map((rec, index) => (
                                                                        <div key={index} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                                                                            <div>
                                                                                <p className="font-medium text-foreground">{rec.actividadName}</p>
                                                                                <p className="text-xs text-muted-foreground">{format(new Date(rec.date + 'T12:00:00'), 'dd MMMM yyyy', { locale: es })}</p>
                                                                            </div>
                                                                        </div>
                                                                    )) : (
                                                                        <p className="text-xs text-muted-foreground">No hay ausencias justificadas registradas.</p>
                                                                    )}
                                                                </div>
                                                            </ScrollArea>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                        {person.healthInfo && (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-full">
                                                        <HeartPulse className="h-5 w-5" />
                                                        <span className="sr-only">Ver consideraciones de salud</span>
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80">
                                                    <div className="grid gap-4">
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium leading-none">Consideraciones de Salud</h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                {person.healthInfo}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                        {sortedVacations.length > 0 && person.status === 'active' && (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-full">
                                                        <Plane className="h-5 w-5" />
                                                        <span className="sr-only">Ver períodos de vacaciones</span>
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80">
                                                    <div className="grid gap-4">
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium leading-none">Períodos de Vacaciones</h4>
                                                            <div className="space-y-2 mt-2">
                                                                {sortedVacations.map(vac => (
                                                                    <div key={vac.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200">
                                                                        <span className="font-medium">
                                                                            {format(vac.startDate, 'dd/MM/yy')} - {format(vac.endDate, 'dd/MM/yy')}
                                                                        </span>
                                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeVacationPeriod(person.id, vac.id)}>
                                                                            <UserX className="h-3 w-3 text-destructive" />
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-white/80 text-sm">
                                        <span>{person.phone}</span>
                                        <a href={formatWhatsAppLink(person.phone)} target="_blank" rel="noopener noreferrer">
                                            <WhatsAppIcon className="text-white hover:text-white/80 transition-colors" />
                                        </a>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0 text-white hover:bg-black/20">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Alternar menú</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(person)}>Editar Detalles</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setPersonForHistory(person)}><History className="mr-2 h-4 w-4" />Ver Historial de Pagos</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setPersonForAttendance(person)}><ClipboardCheck className="mr-2 h-4 w-4" />Ver Historial de Asistencia</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {person.status === 'active' ? (
                                            <>
                                                <DropdownMenuItem onClick={() => setPersonForJustification(person)}><CalendarClock className="mr-2 h-4 w-4" />Notificar Ausencia</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setPersonForVacation(person)}><Plane className="mr-2 h-4 w-4" />Registrar Vacaciones</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => undoLastPayment(person.id)} disabled={!hasPayments}>
                                                  <Undo2 className="mr-2 h-4 w-4" />Deshacer Último Pago
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setPersonToDeactivate(person)}><UserX className="mr-2 h-4 w-4" />Dar de baja</DropdownMenuItem>
                                            </>
                                        ) : (
                                            <DropdownMenuItem onClick={() => reactivatePerson(person.id)}><UserCheck className="mr-2 h-4 w-4" />Reactivar Persona</DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            {person.status === 'active' ? (
                                <div className="mt-4">
                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                        {getPaymentStatusBadge((person as any).paymentStatus)}
                                        {person.membershipType !== 'Diario' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-auto px-2 py-1 text-xs bg-white/20 text-white hover:bg-white/30 border-white/30"
                                                onClick={() => setPersonToRecordPayment(person)}
                                            >
                                                <CreditCard className="mr-1.5 h-3 w-3" />
                                                Registrar Pago
                                            </Button>
                                        )}
                                    </div>
                                    <h4 className="text-2xl font-bold">{person.membershipType}</h4>
                                    <div className="flex justify-between mt-2 text-xs opacity-80 uppercase font-semibold">
                                        <div>
                                            <p>Inscripción</p>
                                            <p>{format(person.joinDate, 'dd/MM/yyyy')}</p>
                                        </div>
                                        {(person as any).nextPaymentDate && (
                                        <div className="text-right">
                                            <p>Próximo Pago</p>
                                            <p>{format((person as any).nextPaymentDate, 'dd/MM/yyyy')}</p>
                                        </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 text-sm">
                                    <p className="font-bold">INACTIVO</p>
                                    {person.cancellationDate && <p className="text-xs opacity-80">Dado de baja el {format(person.cancellationDate, 'dd/MM/yyyy')}</p>}
                                    {person.cancellationReason && <p className="text-xs opacity-80 mt-1">Motivo: {person.cancellationReason}</p>}
                                </div>
                            )}
                        </div>
                        <CardContent className="flex flex-col flex-grow space-y-4 p-4">
                            <div className="space-y-2 flex flex-col flex-grow">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-sm font-semibold text-foreground">
                                      Horarios inscriptos
                                  </h4>
                                  <Badge variant="secondary" className="rounded-full bg-primary/20 text-primary font-bold">{enrolledSessions.length}</Badge>
                                </div>
                                {enrolledSessions.length > 0 ? (
                                    <div className="flex-grow space-y-3">
                                        {enrolledSessions.map(session => {
                                            const actividad = actividades.find(a => a.id === session.actividadId);
                                            const specialist = specialists.find(s => s.id === session.instructorId);
                                            const space = spaces.find(s => s.id === session.spaceId);
                                            return (
                                                <div key={session.id} className="text-sm p-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-background/50">
                                                    <p className="font-bold text-primary">{actividad?.name || 'N/A'}</p>
                                                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-3 w-3"/>
                                                            <span>{session.dayOfWeek}, {formatTime(session.time)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                           <Users className="h-3 w-3"/>
                                                           <span>{specialist?.name || 'Sin especialista'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-3 w-3"/>
                                                            <span>{space?.name || 'Sin espacio'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-grow items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-zinc-700 h-24">
                                        <div className="text-center text-muted-foreground">
                                          <CalendarIcon className="mx-auto h-8 w-8 opacity-50"/>
                                          <p className="text-sm mt-1">{person.status === 'active' ? 'Sin horarios inscriptos.' : 'Sin horarios.'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        {person.status === 'active' && (
                            <CardFooter className="p-4 border-t border-slate-100 dark:border-zinc-700/80 mt-auto">
                                <Button className="w-full bg-gradient-to-r from-violet-500 to-primary text-white shadow-md hover:opacity-95 font-bold" onClick={() => setPersonToEnroll(person)}>
                                    <CalendarPlus className="mr-2 h-4 w-4" />
                                    Asignar Sesión
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                )
            })}
        </div>
      ) : (
          <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-slate-100">{emptyState.title}</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {emptyState.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
               {(!searchTerm && !searchParams.get('filter') && statusFilter === 'active') && (
                 <Button onClick={handleAdd}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Persona
                  </Button>
               )}
            </CardContent>
          </Card>
      )}
      
      {personToEnroll && (<EnrollDialog person={personToEnroll} onOpenChange={(open) => !open && setPersonToEnroll(null)}/>)}
      {personForVacation && <VacationDialog person={personForVacation} onClose={() => setPersonForVacation(null)} />}
      {personForJustification && <JustifyAbsenceDialog person={personForJustification} onClose={() => setPersonForJustification(null)} />}
      {personToRecordPayment && <RecordPaymentDialog person={personToRecordPayment} onClose={() => setPersonToRecordPayment(null)} />}
      {personToDeactivate && <DeactivationDialog person={personToDeactivate} onClose={() => setPersonToDeactivate(null)} />}


      <Sheet open={!!personForHistory} onOpenChange={(open) => !open && setPersonForHistory(null)}>
        <SheetContent>
            <SheetHeader>
                <SheetTitle>Historial de Pagos: {personForHistory?.name}</SheetTitle>
                <div className="flex items-center justify-between pt-2">
                  <SheetDescription>
                    Registro de todas las fechas de pago.
                  </SheetDescription>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportHistory}
                    disabled={!personForHistory || payments.filter(p => p.personId === personForHistory.id).length === 0}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </div>
            </SheetHeader>
            <ScrollArea className="h-[calc(100%-6rem)] pr-4 mt-4">
              <div className="space-y-2">
                {personForHistory && payments.filter(p => p.personId === personForHistory.id).length > 0 ? (
                    payments
                    .filter(p => p.personId === personForHistory.id)
                    .sort((a,b) => b.date.getTime() - a.date.getTime())
                    .map(payment => (
                        <div key={payment.id} className="flex items-center justify-between text-sm p-3 rounded-md bg-muted/50">
                            <span>{format(payment.date, 'dd MMMM yyyy', { locale: es })}</span>
                            {payment.months > 1 && <span className="text-xs text-muted-foreground">({payment.months} meses)</span>}
                        </div>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground pt-16">
                        <p>No hay pagos registrados.</p>
                    </div>
                )}
              </div>
            </ScrollArea>
        </SheetContent>
      </Sheet>

      {personForAttendance && (<AttendanceHistorySheet person={personForAttendance} onClose={() => setPersonForAttendance(null)}/>)}
    </div>
  );
}
