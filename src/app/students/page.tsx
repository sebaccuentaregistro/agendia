'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Pencil, PlusCircle, Trash2, MoreVertical, Search, AlertTriangle, FileDown, UserX, CalendarClock, Plane, Calendar as CalendarIcon, X, History, Undo2, Heart, FileText, ClipboardList, User, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Person, Payment, NewPersonData, Session, Actividad, Specialist, Space } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getStudentPaymentStatus, exportToCsv, calculateNextPaymentDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isAfter, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const personFormSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().min(7, { message: 'Por favor, introduce un número de teléfono válido.' }),
  levelId: z.preprocess((val) => (val === 'none' || val === '' ? undefined : val), z.string().optional()),
  tariffId: z.string().min(1, { message: 'Debes seleccionar un arancel.' }),
  healthInfo: z.string().optional(),
  notes: z.string().optional(),
});

type PersonFormData = z.infer<typeof personFormSchema>;

const vacationFormSchema = z.object({
    startDate: z.date({ required_error: 'La fecha de inicio es obligatoria.' }),
    endDate: z.date({ required_error: 'La fecha de fin es obligatoria.' }),
}).refine(data => {
    if (!data.startDate || !data.endDate) return true;
    return isAfter(data.endDate, data.startDate) || data.endDate.toDateString() === data.startDate.toDateString();
}, {
    message: "La fecha de fin debe ser igual o posterior a la de inicio.",
    path: ['endDate'],
});

function EnrollmentsDialog({ person, onClose }: { person: Person | null, onClose: () => void }) {
    const { sessions, specialists, actividades, enrollPersonInSessions } = useStudio();

    const { enrolledSessionIds, sortedSessions } = useMemo(() => {
        const enrolledSessionIds = sessions.filter(s => s.personIds.includes(person?.id || '')).map(s => s.id);
        const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const sortedSessions = [...sessions].sort((a, b) => {
            const dayComparison = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
            if (dayComparison !== 0) return dayComparison;
            return a.time.localeCompare(b.time);
        });
        return { enrolledSessionIds, sortedSessions };
    }, [sessions, person]);
    
    const form = useForm<{ sessionIds: string[] }>({
        defaultValues: { sessionIds: enrolledSessionIds },
    });

    useEffect(() => {
        form.reset({ sessionIds: enrolledSessionIds });
    }, [person, enrolledSessionIds, form]);

    if (!person) return null;

    const onSubmit = (data: { sessionIds: string[] }) => {
        enrollPersonInSessions(person.id, data.sessionIds);
        onClose();
    };

    const sessionsByDay = sortedSessions.reduce((acc, session) => {
        (acc[session.dayOfWeek] = acc[session.dayOfWeek] || []).push(session);
        return acc;
    }, {} as Record<string, Session[]>);

    return (
        <Dialog open={!!person} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Gestionar Inscripciones: {person.name}</DialogTitle>
                    <DialogDescription>Selecciona las clases a las que asistirá {person.name} de forma regular.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <ScrollArea className="h-[60vh] my-4">
                            <div className="space-y-6 pr-4">
                                {Object.entries(sessionsByDay).map(([day, daySessions]) => (
                                    <div key={day}>
                                        <h3 className="font-semibold mb-2 sticky top-0 bg-background py-1">{day}</h3>
                                        <div className="space-y-2">
                                            {daySessions.map(session => {
                                                const actividad = actividades.find(a => a.id === session.actividadId);
                                                const specialist = specialists.find(s => s.id === session.instructorId);
                                                return (
                                                    <FormField
                                                        key={session.id}
                                                        control={form.control}
                                                        name="sessionIds"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 hover:bg-accent/50 transition-colors">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(session.id)}
                                                                        onCheckedChange={(checked) => {
                                                                            return checked
                                                                                ? field.onChange([...(field.value || []), session.id])
                                                                                : field.onChange(field.value?.filter((value) => value !== session.id));
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal flex-grow cursor-pointer">
                                                                    <div className="flex justify-between items-center">
                                                                        <div>
                                                                            <p className="font-semibold">{actividad?.name || 'Clase'}</p>
                                                                            <p className="text-xs text-muted-foreground">{specialist?.name || 'N/A'}</p>
                                                                        </div>
                                                                        <p className="text-sm font-mono">{session.time}</p>
                                                                    </div>
                                                                </FormLabel>
                                                            </FormItem>
                                                        )}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
                            <Button type="submit">Guardar Inscripciones</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


function PaymentHistoryDialog({ person, payments, tariffs, onClose }: { person: Person | null; payments: Payment[]; tariffs: any[]; onClose: () => void; }) {
    if (!person) return null;

    const personPayments = payments
        .filter(p => p.personId === person.id)
        .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
      }).format(price);
    };

    return (
        <Dialog open={!!person} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Historial de Pagos: {person.name}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-72 my-4">
                    {personPayments.length > 0 ? (
                        <div className="space-y-3 pr-4">
                            {personPayments.map(payment => {
                                const tariff = tariffs.find(t => t.id === payment.tariffId);
                                return (
                                    <div key={payment.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                                        <div>
                                            <p className="font-semibold">{tariff ? tariff.name : 'Pago registrado'}</p>
                                            <p className="text-sm text-muted-foreground">{payment.date ? format(payment.date, 'dd MMMM, yyyy', { locale: es }) : 'Fecha no disponible'}</p>
                                        </div>
                                        <p className="font-bold text-lg">{tariff ? formatPrice(tariff.price) : ''}</p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">No hay pagos registrados para esta persona.</p>
                        </div>
                    )}
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function VacationDialog({ person, onClose }: { person: Person | null; onClose: () => void; }) {
    const { addVacationPeriod, removeVacationPeriod } = useStudio();
    
    const form = useForm<z.infer<typeof vacationFormSchema>>({
        resolver: zodResolver(vacationFormSchema),
    });

    const onSubmit = (values: z.infer<typeof vacationFormSchema>) => {
        if (person) {
            addVacationPeriod(person.id, values.startDate, values.endDate);
            form.reset();
        }
    }
    
    if (!person) return null;

    return (
        <Dialog open={!!person} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Vacaciones de {person.name}</DialogTitle>
                    <DialogDescription>Gestiona los períodos de ausencia. Durante estos días, la persona no aparecerá en las listas de asistencia.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <h4 className="font-semibold text-sm">Períodos Cargados</h4>
                    <ScrollArea className="h-32 rounded-md border">
                        <div className="p-2 space-y-2">
                        {person.vacationPeriods && person.vacationPeriods.length > 0 ? (
                            person.vacationPeriods.map(vac => (
                                <div key={vac.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                                    <span>{vac.startDate ? format(vac.startDate, 'dd/MM/yy') : 'N/A'} - {vac.endDate ? format(vac.endDate, 'dd/MM/yy') : 'N/A'}</span>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeVacationPeriod(person.id, vac.id)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="p-4 text-center text-muted-foreground text-sm">No hay vacaciones programadas.</p>
                        )}
                        </div>
                    </ScrollArea>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border-t pt-4">
                             <h4 className="font-semibold text-sm">Añadir Nuevo Período</h4>
                            <div className="flex items-start gap-4">
                                <FormField control={form.control} name="startDate" render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Inicio</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, 'PPP', { locale: es }) : <span>Elegir fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                 <FormField control={form.control} name="endDate" render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Fin</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, 'PPP', { locale: es }) : <span>Elegir fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                            <Button type="submit" className="w-full">Añadir Vacaciones</Button>
                        </form>
                    </Form>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function PersonDialog({ person, onOpenChange, open, setActiveFilter, setSearchTerm }: { person?: Person; onOpenChange: (open: boolean) => void; open: boolean, setActiveFilter: (filter: string) => void; setSearchTerm: (term: string) => void; }) {
  const { addPerson, updatePerson, levels, tariffs } = useStudio();
  const form = useForm<PersonFormData>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
        name: '',
        phone: '',
        levelId: 'none',
        tariffId: '',
        healthInfo: '',
        notes: '',
    }
  });
  
  useEffect(() => {
    if (open) {
        if (person) {
          form.reset({
            name: person.name,
            phone: person.phone,
            levelId: person.levelId || 'none',
            tariffId: person.tariffId,
            healthInfo: person.healthInfo,
            notes: person.notes,
          });
        } else {
          form.reset({
            name: '',
            phone: '',
            levelId: 'none',
            tariffId: '',
            healthInfo: '',
            notes: '',
          });
        }
    }
  }, [person, open, form]);

  const onSubmit = (values: PersonFormData) => {
    const finalValues: NewPersonData = {
        name: values.name,
        phone: values.phone,
        tariffId: values.tariffId,
        levelId: values.levelId === 'none' ? undefined : values.levelId,
        healthInfo: values.healthInfo,
        notes: values.notes,
    };
    
    if (person) {
      updatePerson({ ...person, ...finalValues });
    } else {
      addPerson(finalValues);
      setActiveFilter('all');
      setSearchTerm('');
    }
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{person ? 'Editar Persona' : 'Añadir Nueva Persona'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nombre completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={form.control} name="tariffId" render={({ field }) => (
                <FormItem><FormLabel>Arancel</FormLabel><Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                    <SelectContent>{tariffs.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
              )}/>
            </div>
             <FormField control={form.control} name="levelId" render={({ field }) => (
                <FormItem><FormLabel>Nivel (Opcional)</FormLabel><Select onValueChange={field.onChange} value={field.value || 'none'}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin nivel</SelectItem>
                      {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                </Select><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="healthInfo" render={({ field }) => (
              <FormItem><FormLabel>Información de Salud (Opcional)</FormLabel><FormControl><Textarea placeholder="Alergias, lesiones, etc." {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notas Adicionales (Opcional)</FormLabel><FormControl><Textarea placeholder="Preferencias, objetivos, etc." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
            )}/>
            <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function PersonCard({ person, sessions, actividades, specialists, spaces, onManageVacations, onEdit, onViewHistory, onManageEnrollments }: { person: Person, sessions: Session[], actividades: Actividad[], specialists: Specialist[], spaces: Space[], onManageVacations: (person: Person) => void, onEdit: (person: Person) => void, onViewHistory: (person: Person) => void, onManageEnrollments: (person: Person) => void }) {
    const { tariffs, deletePerson, recordPayment, revertLastPayment } = useStudio();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);
    
    const tariff = tariffs.find(t => t.id === person.tariffId);
    const paymentStatus = getStudentPaymentStatus(person, new Date());
    
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
      }).format(price);
    };

    const handleRevertPayment = () => {
        revertLastPayment(person.id);
        setIsRevertDialogOpen(false);
    }

    const formatWhatsAppLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

    const personSessions = useMemo(() => {
        const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        return sessions
            .filter(s => s.personIds.includes(person.id))
            .map(s => {
                const actividad = actividades.find(a => a.id === s.actividadId);
                const specialist = specialists.find(sp => sp.id === s.instructorId);
                const space = spaces.find(sp => sp.id === s.spaceId);
                return { 
                    ...s, 
                    actividadName: actividad?.name || 'Clase',
                    specialistName: specialist?.name || 'N/A',
                    spaceName: space?.name || 'N/A'
                };
            })
            .sort((a, b) => {
                const dayComparison = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
                if (dayComparison !== 0) return dayComparison;
                return a.time.localeCompare(b.time);
            });
    }, [sessions, actividades, specialists, spaces, person.id]);
    
    return (
        <>
            <Card className="flex flex-col rounded-2xl shadow-lg border-border/20 bg-card overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <CardHeader className={cn(
                    "p-4 text-white",
                    paymentStatus === 'Al día' ? "bg-gradient-to-br from-primary to-fuchsia-600" : "bg-gradient-to-br from-red-500 to-orange-600"
                )}>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-xl font-bold">{person.name}</CardTitle>
                                {person.healthInfo && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20">
                                                <Heart className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-60">
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">Info de Salud</h4>
                                                <p className="text-sm text-muted-foreground">{person.healthInfo}</p>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}
                                {person.notes && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                             <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20">
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-60">
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">Notas</h4>
                                                <p className="text-sm text-muted-foreground">{person.notes}</p>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                            <Badge variant="secondary" className={cn(
                                "font-semibold mt-1.5 border-0", 
                                paymentStatus === 'Al día' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            )}>
                                {paymentStatus}
                            </Badge>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 -mr-2 flex-shrink-0"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => onEdit(person)}><Pencil className="mr-2 h-4 w-4" />Editar Persona</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onManageEnrollments(person)}><ClipboardList className="mr-2 h-4 w-4" />Gestionar Inscripciones</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onManageVacations(person)}><Plane className="mr-2 h-4 w-4" />Gestionar Vacaciones</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onViewHistory(person)}><History className="mr-2 h-4 w-4" />Ver Historial de Pagos</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => setIsRevertDialogOpen(true)}><Undo2 className="mr-2 h-4 w-4" />Volver atrás último pago</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                     
                    <div className="mt-2">
                        <div className="flex justify-between items-baseline">
                            <p className="text-sm font-semibold opacity-90">{tariff?.name}</p>
                            {tariff && <p className="text-lg font-bold">{formatPrice(tariff.price)}</p>}
                        </div>
                        {person.lastPaymentDate && (
                            <p className="text-xs opacity-80 mt-1">Vence: {format(person.lastPaymentDate, 'dd/MM/yyyy')}</p>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-4 flex-grow space-y-4">
                     <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{person.phone}</span>
                            <a href={formatWhatsAppLink(person.phone)} target="_blank" rel="noopener noreferrer">
                                <WhatsAppIcon className="text-green-600 hover:text-green-700 transition-colors" />
                                <span className="sr-only">Enviar WhatsApp a {person.name}</span>
                            </a>
                        </div>
                     </div>
                     <div className="space-y-3 pt-4 border-t border-border/50">
                        <h4 className="font-semibold text-sm text-foreground">Inscripciones</h4>
                        <ScrollArea className="h-28">
                           <div className="space-y-2 pr-4">
                            {personSessions.length > 0 ? (
                                personSessions.map(session => (
                                    <div key={session.id} className="text-xs p-2 rounded-md bg-muted/50">
                                        <p className="font-bold text-foreground">{session.actividadName}</p>
                                        <p className="text-muted-foreground">{session.dayOfWeek}, {session.time}</p>
                                        <div className="flex items-center gap-4 mt-1 text-muted-foreground">
                                          <span className="flex items-center gap-1.5"><User className="h-3 w-3" />{session.specialistName}</span>
                                          <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{session.spaceName}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-4">Sin inscripciones.</p>
                            )}
                            </div>
                        </ScrollArea>
                    </div>
                     <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                        {typeof person.paymentBalance === 'number' && person.paymentBalance < 0 && (
                             <Badge variant="destructive">Debe: {Math.abs(person.paymentBalance)} cuota(s)</Badge>
                        )}
                        {typeof person.paymentBalance === 'number' && person.paymentBalance > 0 && (
                             <Badge className="bg-blue-600">Crédito: {person.paymentBalance} cuota(s)</Badge>
                        )}
                     </div>
                </CardContent>
                
                <CardFooter className="p-2 border-t mt-auto">
                    <Button onClick={() => recordPayment(person.id)} className="w-full font-bold">
                        Registrar Pago
                    </Button>
                </CardFooter>
            </Card>
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará a la persona y todas sus inscripciones.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deletePerson(person.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

             <AlertDialog open={isRevertDialogOpen} onOpenChange={setIsRevertDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>¿Revertir último pago?</AlertDialogTitle><AlertDialogDescription>Esta acción eliminará el pago más reciente del historial, ajustará el saldo y la fecha de vencimiento de la persona. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleRevertPayment} className="bg-destructive hover:bg-destructive/90">Sí, revertir pago</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function StudentsPageContent() {
  const { people, tariffs, isPersonOnVacation, attendance, payments, loading, sessions, actividades, specialists, spaces } = useStudio();
  const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | undefined>(undefined);
  const [personForEnrollment, setPersonForEnrollment] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [personForVacation, setPersonForVacation] = useState<Person | null>(null);
  const [personForHistory, setPersonForHistory] = useState<Person | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { recoveryBalances, filteredPeople } = useMemo(() => {
    if (!isMounted) return { recoveryBalances: {}, filteredPeople: [] };
    
    const now = new Date();
    const term = searchTerm.toLowerCase();

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

    const finalFilteredPeople = people
      .filter(person => person.name.toLowerCase().includes(term) || person.phone.includes(term))
      .filter(person => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'overdue') return getStudentPaymentStatus(person, now) === 'Atrasado';
        if (activeFilter === 'on-vacation') return isPersonOnVacation(person, now);
        if (activeFilter === 'pending-recovery') return balances[person.id] > 0;
        return true;
      })
      .sort((a,b) => a.name.localeCompare(b.name));
      
    return { recoveryBalances: balances, filteredPeople: finalFilteredPeople };
  }, [people, searchTerm, activeFilter, isPersonOnVacation, attendance, isMounted]);

   const handleExport = () => {
    const dataToExport = filteredPeople.map(p => ({
        nombre: p.name,
        telefono: p.phone,
        arancel: tariffs.find(t => t.id === p.tariffId)?.name || 'N/A',
        estado_pago: getStudentPaymentStatus(p, new Date()),
        fecha_ingreso: p.joinDate ? format(p.joinDate, 'dd/MM/yyyy') : 'N/A',
        vencimiento_pago: p.lastPaymentDate ? format(p.lastPaymentDate, 'dd/MM/yyyy') : 'N/A',
    }));
    const headers = {
        nombre: "Nombre",
        telefono: "Teléfono",
        arancel: "Arancel",
        estado_pago: "Estado de Pago",
        fecha_ingreso: "Fecha de Ingreso",
        vencimiento_pago: "Vencimiento",
    }
    exportToCsv('personas.csv', dataToExport, headers);
  }

  const handleAddClick = () => {
    setSelectedPerson(undefined);
    setIsPersonDialogOpen(true);
  }

  const handleEditClick = (person: Person) => {
    setSelectedPerson(person);
    setIsPersonDialogOpen(true);
  }
  
  const handleEnrollmentClick = (person: Person) => {
    setPersonForEnrollment(person);
  };


  if (!isMounted) {
    return (
        <div className="space-y-8">
            <PageHeader title="Personas">
                <div className="flex items-center gap-2">
                    <Button variant="outline" disabled><FileDown className="mr-2 h-4 w-4" />Exportar</Button>
                    <Button disabled><PlusCircle className="mr-2 h-4 w-4" />Añadir Persona</Button>
                </div>
            </PageHeader>
            <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <Skeleton className="h-10 flex-grow rounded-xl" />
                    <Skeleton className="h-10 w-full sm:w-auto sm:min-w-[380px] rounded-lg" />
                </div>
            </Card>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[218px] w-full rounded-2xl" />)}
            </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Personas">
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}><FileDown className="mr-2 h-4 w-4" />Exportar</Button>
            <Button onClick={handleAddClick}><PlusCircle className="mr-2 h-4 w-4" />Añadir Persona</Button>
        </div>
      </PageHeader>
      
      <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
           <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Buscar por nombre o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl"
                />
            </div>
            <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full sm:w-auto">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="overdue"><AlertTriangle className="mr-1.5 h-3.5 w-3.5" />Atrasados</TabsTrigger>
                    <TabsTrigger value="pending-recovery"><CalendarClock className="mr-1.5 h-3.5 w-3.5" />Recuperos</TabsTrigger>
                    <TabsTrigger value="on-vacation"><Plane className="mr-1.5 h-3.5 w-3.5" />Vacaciones</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[350px] w-full rounded-2xl" />)}
        </div>
      ) : filteredPeople.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
            {filteredPeople.map((person) => (
                <PersonCard 
                    key={person.id} 
                    person={person}
                    sessions={sessions}
                    actividades={actividades}
                    specialists={specialists}
                    spaces={spaces}
                    onManageVacations={setPersonForVacation}
                    onEdit={handleEditClick}
                    onViewHistory={setPersonForHistory}
                    onManageEnrollments={handleEnrollmentClick}
                />
            ))}
          </div>
        ) : (
          <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-slate-100">{searchTerm || activeFilter !== 'all' ? "No se encontraron personas" : "No Hay Personas"}</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {searchTerm || activeFilter !== 'all' ? "Prueba con otros filtros o limpia la búsqueda." : "Empieza a construir tu comunidad añadiendo tu primera persona."}
              </CardDescription>
            </CardHeader>
            <CardContent>
               {!(searchTerm || activeFilter !== 'all') && (
                 <Button onClick={handleAddClick}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Persona
                  </Button>
               )}
            </CardContent>
          </Card>
        )}

      <PersonDialog 
        person={selectedPerson} 
        onOpenChange={setIsPersonDialogOpen} 
        open={isPersonDialogOpen}
        setActiveFilter={setActiveFilter}
        setSearchTerm={setSearchTerm}
      />
      <VacationDialog person={personForVacation} onClose={() => setPersonForVacation(null)} />
      <EnrollmentsDialog person={personForEnrollment} onClose={() => setPersonForEnrollment(null)} />
      <PaymentHistoryDialog 
        person={personForHistory} 
        payments={payments}
        tariffs={tariffs}
        onClose={() => setPersonForHistory(null)}
      />

    </div>
  );
}


export default function StudentsPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <StudentsPageContent />
    </Suspense>
  );
}
