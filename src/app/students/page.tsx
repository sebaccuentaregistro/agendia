
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import type { Person, Session } from '@/types';
import { MoreHorizontal, PlusCircle, Trash2, CreditCard, Undo2, History, CalendarPlus, FileDown, ClipboardCheck, CheckCircle2, XCircle, CalendarClock, Plane } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionAlert, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useStudio } from '@/context/StudioContext';
import * as Utils from '@/lib/utils';
import { format, addDays } from 'date-fns';
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

const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().regex(/^\d+$/, { message: 'El teléfono solo debe contener números (sin espacios ni guiones).' }).min(10, { message: 'El teléfono debe tener al menos 10 dígitos.' }),
  membershipType: z.enum(['Mensual', 'Diario'], { required_error: 'Debes seleccionar un tipo de membresía.' }),
});

function EnrollDialog({ person, onOpenChange }: { person: Person; onOpenChange: (open: boolean) => void }) {
  const { sessions, specialists, actividades, enrollPersonInSessions, spaces, isPersonOnVacation } = useStudio();
  const form = useForm<{ sessionIds: string[] }>({ defaultValues: { sessionIds: sessions.filter(session => session.personIds.includes(person.id)).map(session => session.id) } });
  const [actividadFilter, setActividadFilter] = useState('all');
  const [specialistFilter, setSpecialistFilter] = useState('all');

  const filteredSessions = sessions
      .filter(session => 
        (actividadFilter === 'all' || session.actividadId === actividadFilter) &&
        (specialistFilter === 'all' || session.instructorId === specialistFilter)
      )
      .map(session => {
        const space = spaces.find(s => s.id === session.spaceId);
        const capacity = session.sessionType === 'Individual' ? 1 : space?.capacity ?? 0;
        
        // Count people not on vacation
        const activeEnrolledCount = session.personIds.filter(pid => {
            const p = people.find(p => p.id === pid);
            return p && !isPersonOnVacation(p, new Date()); // simplified check for today
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
                      const isDisabled = isPermanentlyFull && !isEnrolledInForm;

                      return (
                        <FormField key={item.id} control={form.control} name="sessionIds" render={({ field }) => (
                          <FormItem className={Utils.cn("flex flex-row items-start space-x-3 space-y-0 rounded-md p-3 transition-colors", isDisabled ? "bg-muted/50 opacity-70" : "hover:bg-muted/50")}>
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                disabled={isDisabled}
                                onCheckedChange={(checked) => {
                                  const currentValues = field.value || [];
                                  return checked ? field.onChange([...currentValues, item.id]) : field.onChange(currentValues.filter((value) => value !== item.id));
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className={Utils.cn("font-normal", isDisabled && "cursor-not-allowed")}>{actividad.name}</FormLabel>
                              <div className="text-xs text-muted-foreground">
                                <p>{specialist?.name}</p>
                                <p>{item.dayOfWeek} {formatTime(item.time)}</p>
                                <p><span className="font-medium">Espacio:</span> {space?.name} ({activeEnrolledCount}/{capacity})</p>
                              </div>
                               {isDisabled && (
                                <p className="text-xs font-semibold text-amber-600 dark:text-amber-500">
                                  {item.sessionType === 'Individual' ? 'Sesión individual ocupada' : 'Plazas fijas completas.'}
                                </p>
                              )}
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


export default function StudentsPage() {
  const { people, addPerson, updatePerson, deletePerson, recordPayment, undoLastPayment, payments, sessions, specialists, actividades, spaces, removeVacationPeriod, isPersonOnVacation } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | undefined>(undefined);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [personToEnroll, setPersonToEnroll] = useState<Person | null>(null);
  const [personForHistory, setPersonForHistory] = useState<Person | null>(null);
  const [personForAttendance, setPersonForAttendance] = useState<Person | null>(null);
  const [personForVacation, setPersonForVacation] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => { setIsMounted(true); }, []);

  const processedPeople = useMemo(() => {
    if (!isMounted) return [];
    const filter = searchParams.get('filter');
    const now = new Date();
    
    let peopleList = people.map(p => ({ 
        ...p, 
        paymentStatus: Utils.getStudentPaymentStatus(p, now),
        nextPaymentDate: Utils.getNextPaymentDate(p)
    }));
    
    if (filter === 'overdue') {
      peopleList = peopleList.filter(p => p.paymentStatus === 'Atrasado');
    } else if (filter === 'on-vacation') {
      peopleList = peopleList.filter(p => isPersonOnVacation(p, now));
    }

    if (searchTerm.trim() !== '') {
      peopleList = peopleList.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    return peopleList.sort((a,b) => a.name.localeCompare(b.name));
  }, [people, searchParams, searchTerm, isMounted, isPersonOnVacation]);

  const emptyState = useMemo(() => {
    const filter = searchParams.get('filter');
    if (searchTerm) {
      return {
        title: "No se encontraron personas",
        description: "Intenta con otro nombre o limpia la búsqueda."
      }
    }
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
    return {
      title: "No Hay Personas",
      description: "Empieza añadiendo tu primera persona."
    }
  }, [searchTerm, searchParams]);

  const form = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema), defaultValues: { name: '', phone: '', membershipType: 'Mensual' }});

  const getPaymentStatusBadge = (status: 'Al día' | 'Atrasado') => {
    if (status === 'Al día') return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-700/50">Al día</Badge>;
    return <Badge variant="destructive">Atrasado</Badge>;
  };

  function handleEdit(person: Person) {
    setSelectedPerson(person);
    form.reset({ name: person.name, phone: person.phone, membershipType: person.membershipType });
    setIsDialogOpen(true);
  }

  function handleAdd() {
    setSelectedPerson(undefined);
    form.reset({ name: '', phone: '', membershipType: 'Mensual' });
    setIsDialogOpen(true);
  }

  function openDeleteDialog(person: Person) {
    setPersonToDelete(person);
    setIsDeleteDialogOpen(true);
  }

  function handleDelete() {
    if (personToDelete) {
      deletePerson(personToDelete.id);
      setIsDeleteDialogOpen(false);
      setPersonToDelete(null);
    }
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
          .map(p => ({ date: p.date }));

      if (personPayments.length === 0) return;

      const headers = {
          date: 'Fecha de Pago'
      };
      exportToCsv(`historial_pagos_${personForHistory.name.replace(/\s/g, '_')}.csv`, personPayments, headers);
  };

  return (
    <div>
      <PageHeader title="Personas">
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <Input placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-64 bg-white/80 dark:bg-zinc-800/80 border-slate-300/50 rounded-xl"/>
          <Button variant="outline" onClick={handleExportPeople}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setSelectedPerson(undefined); }}>
            <DialogTrigger asChild><Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Persona</Button></DialogTrigger>
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
                  <DialogFooter><Button type="submit">Guardar Cambios</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>
      
      {!isMounted ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-[32rem] w-full bg-white/30 rounded-2xl" />)}
        </div>
      ) : processedPeople.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {processedPeople.map((person) => {
                const hasPayments = payments.some(p => p.personId === person.id);
                const enrolledSessions = sessions.filter(session => session.personIds.includes(person.id)).sort((a,b) => a.dayOfWeek.localeCompare(b.dayOfWeek) || a.time.localeCompare(b.time));
                const sortedVacations = person.vacationPeriods?.sort((a,b) => a.startDate.getTime() - b.startDate.getTime()) || [];
                return (
                    <Card key={person.id} className="flex flex-col bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5">
                        <CardHeader className="flex flex-row items-start gap-4 p-4">
                            <div className="flex-grow">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{person.name}</h3>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                                    <span>{person.phone}</span>
                                    <a href={formatWhatsAppLink(person.phone)} target="_blank" rel="noopener noreferrer">
                                        <WhatsAppIcon className="text-green-600 hover:text-green-700 transition-colors" />
                                    </a>
                                </div>
                            </div>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0 text-slate-600 dark:text-slate-300 hover:bg-white/50">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Alternar menú</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(person)}>Editar Detalles</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setPersonForVacation(person)}><Plane className="mr-2 h-4 w-4" />Registrar Vacaciones</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setPersonForHistory(person)}><History className="mr-2 h-4 w-4" />Ver Historial de Pagos</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setPersonForAttendance(person)}><ClipboardCheck className="mr-2 h-4 w-4" />Ver Historial de Asistencia</DropdownMenuItem>
                                    {person.membershipType === 'Mensual' && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => recordPayment(person.id)}><CreditCard className="mr-2 h-4 w-4" />Registrar Pago</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => undoLastPayment(person.id)} disabled={!hasPayments}><Undo2 className="mr-2 h-4 w-4" />Deshacer Último Pago</DropdownMenuItem>
                                    </>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDeleteDialog(person)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent className="flex flex-col flex-grow space-y-4 p-4 pt-0">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div className="text-slate-700 dark:text-slate-200">
                                    <div>{getPaymentStatusBadge(person.paymentStatus)}</div>
                                </div>
                                <div className="text-slate-700 dark:text-slate-200">
                                    <div>{person.membershipType}</div>
                                </div>
                                <div className="text-slate-700 dark:text-slate-200">
                                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Inscripción</div>
                                    <div>{format(person.joinDate, 'dd/MM/yyyy')}</div>
                                </div>
                                {person.nextPaymentDate && (
                                  <div className="text-slate-700 dark:text-slate-200">
                                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Próximo Pago</div>
                                    <div>{format(person.nextPaymentDate, 'dd/MM/yyyy')}</div>
                                  </div>
                                )}
                            </div>
                            <div className="space-y-2 flex flex-col flex-grow">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Horarios inscriptos ({enrolledSessions.length})
                                </h4>
                                {enrolledSessions.length > 0 ? (
                                    <div className="flex-grow space-y-3 rounded-lg border border-white/20 p-2 bg-white/10 backdrop-blur-sm">
                                        {enrolledSessions.map(session => {
                                            const actividad = actividades.find(a => a.id === session.actividadId);
                                            const specialist = specialists.find(s => s.id === session.instructorId);
                                            const space = spaces.find(s => s.id === session.spaceId);
                                            return (
                                                <div key={session.id} className="text-sm">
                                                    <p className="font-semibold text-slate-700 dark:text-slate-200">{actividad?.name || 'N/A'}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{session.dayOfWeek}, {formatTime(session.time)} &bull; {specialist?.name || 'Sin especialista'} &bull; {space?.name || 'Sin espacio'}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-grow items-center justify-center rounded-lg border border-dashed border-white/30 h-10">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Sin horarios.</p>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Períodos de Vacaciones ({sortedVacations.length})
                                </h4>
                                {sortedVacations.length > 0 ? (
                                    <div className="space-y-2 rounded-lg border border-white/20 p-2 bg-white/10 backdrop-blur-sm">
                                        {sortedVacations.map(vac => (
                                            <div key={vac.id} className="flex items-center justify-between text-sm">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {format(vac.startDate, 'dd/MM/yy')} - {format(vac.endDate, 'dd/MM/yy')}
                                                </span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeVacationPeriod(person.id, vac.id)}>
                                                    <Trash2 className="h-3 w-3 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center rounded-lg border border-dashed border-white/30 h-10">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Sin vacaciones registradas.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="p-4 border-t border-white/20">
                            <Button className="w-full" variant="outline" onClick={() => setPersonToEnroll(person)}>
                                <CalendarPlus className="mr-2 h-4 w-4" />
                                Asignar Sesión
                            </Button>
                        </CardFooter>
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
               {(!searchTerm && !searchParams.get('filter')) && (
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

       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescriptionAlert>Esta acción no se puede deshacer. Esto eliminará permanentemente a la persona, sus datos de pago y la desinscribirá de todas las sesiones.</AlertDialogDescriptionAlert>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPersonToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sí, eliminar persona</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                        <div key={payment.id} className="text-sm p-3 rounded-md bg-muted/50">
                            <span>{format(payment.date, 'dd MMMM yyyy', { weekStartsOn: 1 })}</span>
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
