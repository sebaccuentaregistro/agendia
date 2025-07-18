

'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Pencil, PlusCircle, Trash2, MoreVertical, Search, AlertTriangle, FileDown, UserX, CalendarClock, Plane, Calendar as CalendarIcon, X, History, Undo2, Heart, FileText, ClipboardList, User, MapPin, Check, Circle, HelpCircle, AlertCircle, LayoutGrid, List, ArrowLeft, Signal, Send, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionAlert, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle as AlertDialogTitleAlert } from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import type { Person, Payment, NewPersonData, Session, Actividad, Specialist, Space, SessionAttendance, PaymentStatusInfo, RecoveryCredit, Level, Tariff } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getStudentPaymentStatus, exportToCsv, calculateNextPaymentDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useRouter, useSearchParams } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isAfter, subMonths, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertTitle, AlertDescription as AlertDescriptionComponent } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { PersonDialog } from './person-dialog';
import { WelcomeDialog } from '@/components/welcome-dialog';
import { PaymentReceiptDialog, type ReceiptInfo } from '@/components/payment-receipt-dialog';

function AttendanceHistoryDialog({ person, sessions, actividades, attendance, onClose }: { person: Person | null; sessions: Session[]; actividades: Actividad[]; attendance: SessionAttendance[]; onClose: () => void; }) {
    if (!person) return null;

    const eventHistory = useMemo(() => {
        let history: { date: Date; type: string; description: string; }[] = [];

        // Process attendance records
        attendance.forEach(record => {
            const session = sessions.find(s => s.id === record.sessionId);
            const actividad = session ? actividades.find(a => a.id === session.actividadId) : null;
            const description = actividad ? actividad.name : 'Clase';
            const recordDate = parse(record.date, 'yyyy-MM-dd', new Date());

            if (record.presentIds?.includes(person.id)) {
                history.push({ date: recordDate, type: 'presente', description });
            }
            if (record.absentIds?.includes(person.id)) {
                history.push({ date: recordDate, type: 'ausente', description });
            }
            if (record.justifiedAbsenceIds?.includes(person.id)) {
                history.push({ date: recordDate, type: 'a recuperar', description });
            }
            if (record.oneTimeAttendees?.includes(person.id)) {
                history.push({ date: recordDate, type: 'recupero', description });
            }
        });

        // Process vacation periods
        person.vacationPeriods?.forEach(vac => {
            if (vac.startDate && vac.endDate) {
                 history.push({
                    date: vac.startDate,
                    type: 'vacaciones',
                    description: `Inicio de vacaciones hasta ${format(vac.endDate, 'dd/MM/yy')}`
                });
            }
        });

        // Sort all events by date, descending
        return history.sort((a, b) => b.date.getTime() - a.date.getTime());

    }, [person, attendance, sessions, actividades]);

    const getBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
        switch(type) {
            case 'presente': return 'secondary'; // Greenish in theme
            case 'recupero': return 'default'; // Primary color
            case 'a recuperar': return 'outline'; // Yellowish/Orange
            case 'ausente': return 'destructive';
            case 'vacaciones': return 'outline'; // Purplish
            default: return 'secondary';
        }
    };

    const getBadgeIcon = (type: string) => {
        switch(type) {
            case 'presente': return <Check className="h-3 w-3" />;
            case 'recupero': return <ClipboardList className="h-3 w-3" />;
            case 'a recuperar': return <CalendarClock className="h-3 w-3" />;
            case 'ausente': return <X className="h-3 w-3" />;
            case 'vacaciones': return <Plane className="h-3 w-3" />;
            default: return <Circle className="h-3 w-3" />;
        }
    };
    
    const getBadgeClass = (type: string) => {
        switch (type) {
            case 'presente': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
            case 'recupero': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700';
            case 'a recuperar': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700';
            case 'vacaciones': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700';
            default: return '';
        }
    };

    return (
        <Dialog open={!!person} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Historial de Asistencia: {person.name}</DialogTitle>
                    <DialogDescription>
                        Registro de todas las actividades, ausencias y recuperos.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-96 my-4">
                    {eventHistory.length > 0 ? (
                        <div className="space-y-4 pr-4">
                            {eventHistory.map((event, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    <div className="text-center w-16 flex-shrink-0">
                                        <p className="font-bold text-sm text-foreground">{format(event.date, 'dd MMM', { locale: es })}</p>
                                        <p className="text-xs text-muted-foreground">{format(event.date, 'yyyy')}</p>
                                    </div>
                                    <div className="flex-grow space-y-1">
                                       <Badge variant={getBadgeVariant(event.type)} className={cn("capitalize", getBadgeClass(event.type))}>
                                           {getBadgeIcon(event.type)}
                                           {event.type}
                                       </Badge>
                                       <p className="text-sm text-muted-foreground">{event.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground text-center">No hay historial de asistencia para esta persona.</p>
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


function JustifiedAbsenceDialog({ person, onClose }: { person: Person | null; onClose: () => void }) {
    if (!person) return null;
    
    const { sessions, addJustifiedAbsence, attendance } = useStudio();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const personSessions = useMemo(() => {
        return sessions.filter(s => s.personIds.includes(person?.id || ''));
    }, [sessions, person]);

    const dayMap: { [key in Session['dayOfWeek']]: number } = useMemo(() => ({
        'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6,
    }), []);
    
    const allowedDaysOfWeek = useMemo(() => {
        return Array.from(new Set(personSessions.map(s => dayMap[s.dayOfWeek])));
    }, [personSessions, dayMap]);

    const sessionOnSelectedDate = selectedDate ? personSessions.find(s => dayMap[s.dayOfWeek] === selectedDate.getDay()) : null;

    const isDateAlreadyJustified = useMemo(() => {
        if (!selectedDate || !sessionOnSelectedDate) return false;
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const attendanceRecord = attendance.find(a => a.sessionId === sessionOnSelectedDate.id && a.date === dateStr);
        return attendanceRecord?.justifiedAbsenceIds?.includes(person.id) || false;
    }, [selectedDate, sessionOnSelectedDate, attendance, person.id]);

    const handleDayClick = (day: Date, modifiers: any) => {
        if (modifiers.disabled) return;
        setSelectedDate(day);
    };
    
    const handleSubmit = async () => {
        if (!selectedDate || !sessionOnSelectedDate || isDateAlreadyJustified) return;
        setIsSubmitting(true);
        try {
            await addJustifiedAbsence(person.id, sessionOnSelectedDate.id, selectedDate);
            onClose();
        } catch (error) {
            console.error("Error justifying absence:", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Dialog open={!!person} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Notificar Ausencia: {person.name}</DialogTitle>
                    <DialogDescription>
                        Selecciona una fecha de clase para notificar una ausencia y generar un crédito de recupero. Solo se pueden seleccionar los días en los que la persona tiene clases asignadas.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4">
                     <Calendar
                        mode="single"
                        selected={selectedDate}
                        onDayClick={handleDayClick}
                        disabled={(date) => !allowedDaysOfWeek.includes(date.getDay())}
                        footer={selectedDate ? <p className="text-sm text-center pt-2">Fecha seleccionada: {format(selectedDate, "PPP", { locale: es })}.</p> : <p className="text-sm text-center pt-2">Por favor, selecciona una fecha.</p>}
                        className="rounded-md border"
                    />
                    {isDateAlreadyJustified && (
                        <p className="text-sm font-semibold text-destructive">Esta ausencia ya fue justificada previamente.</p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={!selectedDate || !sessionOnSelectedDate || isSubmitting || isDateAlreadyJustified}>Confirmar Ausencia</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function EnrollmentsDialog({ person, onClose }: { person: Person | null, onClose: () => void }) {
    const { sessions, specialists, actividades, enrollPersonInSessions, tariffs, spaces, levels, triggerWaitlistCheck } = useStudio();
    
    const [filters, setFilters] = useState({ day: 'all', actividadId: 'all', specialistId: 'all' });
    const [searchTerm, setSearchTerm] = useState('');
    
    const form = useForm<{ sessionIds: string[] }>();
    const watchedSessionIds = form.watch('sessionIds');

    const { enrolledSessionIds, filteredAndSortedSessions } = useMemo(() => {
        const enrolledIds = person ? sessions.filter(s => s.personIds.includes(person.id)).map(s => s.id) : [];
        const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

        const filtered = sessions.filter(session => {
            return (filters.day === 'all' || session.dayOfWeek === filters.day) &&
                   (filters.actividadId === 'all' || session.actividadId === filters.actividadId) &&
                   (filters.specialistId === 'all' || session.instructorId === filters.specialistId);
        });

        const sorted = [...filtered].sort((a, b) => {
            const dayComparison = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
            if (dayComparison !== 0) return dayComparison;
            return a.time.localeCompare(b.time);
        });

        return { enrolledSessionIds: enrolledIds, filteredAndSortedSessions: sorted };
    }, [sessions, person, filters]);
    
    const personTariff = useMemo(() => {
        return person ? tariffs.find(t => t.id === person.tariffId) : undefined;
    }, [tariffs, person]);

    const sessionsByDay = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        
        const sessionsMatchingSearch = searchTerm 
            ? filteredAndSortedSessions.filter(session => {
                const actividad = actividades.find(a => a.id === session.actividadId);
                const specialist = specialists.find(s => s.id === session.instructorId);
                return (
                    actividad?.name.toLowerCase().includes(lowercasedFilter) ||
                    specialist?.name.toLowerCase().includes(lowercasedFilter)
                );
            })
            : filteredAndSortedSessions;

        return sessionsMatchingSearch.reduce((acc, session) => {
            (acc[session.dayOfWeek] = acc[session.dayOfWeek] || []).push(session);
            return acc;
        }, {} as Record<string, Session[]>);

    }, [filteredAndSortedSessions, searchTerm, actividades, specialists]);
    
    useEffect(() => {
        form.reset({ sessionIds: enrolledSessionIds });
    }, [person, enrolledSessionIds, form]);
    
    if (!person) {
        return null;
    }

    const tariffFrequency = personTariff?.frequency;
    const isOverLimit = tariffFrequency !== undefined && watchedSessionIds.length > tariffFrequency;
    
    const onSubmit = async (data: { sessionIds: string[] }) => {
        if (!person) return;
        const removedFromSessionIds = await enrollPersonInSessions(person.id, data.sessionIds);

        // After enrollment, trigger waitlist check for sessions where a spot might have opened up.
        if (removedFromSessionIds && Array.isArray(removedFromSessionIds)) {
            removedFromSessionIds.forEach(sessionId => {
                triggerWaitlistCheck(sessionId);
            });
        }
        
        onClose();
    };

    const daysOfWeekWithSessions = Object.keys(sessionsByDay);

    return (
        <Dialog open={!!person} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Gestionar Horarios: {person.name}</DialogTitle>
                    <DialogDescription>
                        Selecciona las clases a las que asistirá {person.name} de forma regular.
                        {personTariff && (
                          <span className="block mt-1 font-medium">
                            Plan actual: {personTariff.name} ({tariffFrequency !== undefined ? `${watchedSessionIds.length}/${tariffFrequency}` : watchedSessionIds.length} clase(s) semanales)
                          </span>
                        )}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    <Input
                        placeholder="Buscar por actividad o especialista..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-4 border rounded-lg bg-muted/50">
                        <Select value={filters.day} onValueChange={(value) => setFilters(f => ({ ...f, day: value }))}>
                            <SelectTrigger><SelectValue placeholder="Día" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Día</SelectItem>
                                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filters.actividadId} onValueChange={(value) => setFilters(f => ({ ...f, actividadId: value }))}>
                            <SelectTrigger><SelectValue placeholder="Actividad" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Actividad</SelectItem>
                                {actividades.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filters.specialistId} onValueChange={(value) => setFilters(f => ({ ...f, specialistId: value }))}>
                            <SelectTrigger><SelectValue placeholder="Especialista" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Especialista</SelectItem>
                                {specialists.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {isOverLimit && (
                    <Alert variant="destructive" className="border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Atención</AlertTitle>
                        <AlertDescriptionComponent>
                            Con {watchedSessionIds.length} clases, {person.name} supera el límite de {tariffFrequency} de su plan. Puedes inscribirlo igualmente.
                        </AlertDescriptionComponent>
                    </Alert>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <ScrollArea className="h-[40vh] my-4">
                            <div className="space-y-6 pr-4">
                                {daysOfWeekWithSessions.length > 0 ? daysOfWeekWithSessions.map(day => (
                                    <div key={day}>
                                        <h3 className="font-semibold mb-2 sticky top-0 bg-background py-1">{day}</h3>
                                        <div className="space-y-2">
                                            {sessionsByDay[day].map(session => (
                                                <FormField
                                                    key={session.id}
                                                    control={form.control}
                                                    name="sessionIds"
                                                    render={({ field }) => {
                                                        const actividad = actividades.find(a => a.id === session.actividadId);
                                                        const specialist = specialists.find(s => s.id === session.instructorId);
                                                        const space = spaces.find(s => s.id === session.spaceId);
                                                        const level = levels.find(l => l.id === session.levelId);
                                                        const capacity = space?.capacity ?? 0;
                                                        const enrolledCount = session.personIds.length;
                                                        const isFull = enrolledCount >= capacity;
                                                        const isAlreadyEnrolled = field.value?.includes(session.id);

                                                        return (
                                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 hover:bg-accent/50 transition-colors data-[disabled]:opacity-50" data-disabled={isFull && !isAlreadyEnrolled}>
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={isAlreadyEnrolled}
                                                                        disabled={isFull && !isAlreadyEnrolled}
                                                                        onCheckedChange={(checked) => {
                                                                            return checked
                                                                                ? field.onChange([...(field.value || []), session.id])
                                                                                : field.onChange(field.value?.filter((value) => value !== session.id));
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal flex-grow cursor-pointer flex justify-between items-center">
                                                                    <div className="space-y-1">
                                                                        <p className="font-semibold">{actividad?.name || 'Clase'}</p>
                                                                        <div className="flex items-center gap-4 flex-wrap">
                                                                            <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><User className="h-3 w-3" /> {specialist?.name || 'N/A'}</span>
                                                                            <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {space?.name || 'N/A'}</span>
                                                                        </div>
                                                                        {level && <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium mt-1 flex items-center gap-1.5"><Signal className="h-3 w-3"/>{level.name}</Badge>}
                                                                    </div>
                                                                    <div className="text-right flex-shrink-0 ml-4">
                                                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{session.time}</p>
                                                                        <Badge variant={isFull ? 'destructive' : 'secondary'} className="text-xs">{enrolledCount}/{capacity}</Badge>
                                                                    </div>
                                                                </FormLabel>
                                                            </FormItem>
                                                        );
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="flex items-center justify-center h-full text-center">
                                        <p className="text-sm text-muted-foreground">No se encontraron clases con los filtros seleccionados.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
                            <Button type="submit">Guardar Horarios</Button>
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

function PersonCard({ person, sessions, actividades, specialists, spaces, levels, tariffs, recoveryCredits, onManageVacations, onEdit, onViewHistory, onViewAttendanceHistory, onManageEnrollments, onJustifyAbsence, onRecordPayment }: { person: Person, sessions: Session[], actividades: Actividad[], specialists: Specialist[], spaces: Space[], levels: Level[], tariffs: Tariff[], recoveryCredits: RecoveryCredit[], onManageVacations: (person: Person) => void, onEdit: (person: Person) => void, onViewHistory: (person: Person) => void, onViewAttendanceHistory: (person: Person) => void, onManageEnrollments: (person: Person) => void, onJustifyAbsence: (person: Person) => void, onRecordPayment: (person: Person) => void }) {
    const { deletePerson, revertLastPayment } = useStudio();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);
    
    const tariff = tariffs.find(t => t.id === person.tariffId);
    const paymentStatusInfo = getStudentPaymentStatus(person, new Date());
    const level = levels.find(l => l.id === person.levelId);
    
    const getStatusBadgeClass = () => {
        switch (paymentStatusInfo.status) {
            case 'Al día': return "bg-green-600 hover:bg-green-700 border-green-700 text-white";
            case 'Atrasado': return "bg-red-600 hover:bg-red-700 border-red-700 text-white";
            case 'Pendiente de Pago': return "bg-blue-600 hover:bg-blue-700 border-blue-700 text-white";
            default: return "bg-gray-500 hover:bg-gray-600 border-gray-600 text-white";
        }
    };
    
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
                const level = levels.find(l => l.id === s.levelId);
                return { 
                    ...s, 
                    actividadName: actividad?.name || 'Clase',
                    specialistName: specialist?.name || 'N/A',
                    spaceName: space?.name || 'N/A',
                    levelName: level?.name
                };
            })
            .sort((a, b) => {
                const dayComparison = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
                if (dayComparison !== 0) return dayComparison;
                return a.time.localeCompare(b.time);
            });
    }, [sessions, actividades, specialists, spaces, levels, person.id]);
    
    const renderPaymentStatus = (statusInfo: PaymentStatusInfo) => {
      let statusText = statusInfo.status === 'Pendiente de Pago' ? 'Pago Pendiente' : statusInfo.status;
      if (statusInfo.status === 'Atrasado' && statusInfo.daysOverdue !== undefined) {
        statusText += ` (hace ${statusInfo.daysOverdue} ${statusInfo.daysOverdue === 1 ? 'día' : 'días'})`;
      }
      return statusText;
    };

    const totalDebt = (tariff?.price || 0) * (person.outstandingPayments || 0);
    
    return (
        <>
            <Card className="flex flex-col rounded-2xl shadow-lg border-border/20 bg-card overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <CardHeader className="p-4 text-white bg-gradient-to-br from-primary to-fuchsia-600">
                    <div className="flex items-start justify-between">
                         <div className="flex-1">
                            <div className="flex items-center gap-1 flex-wrap">
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
                                {person.vacationPeriods && person.vacationPeriods.length > 0 && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20">
                                                <Plane className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80">
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="font-medium leading-none">Períodos de Vacaciones</h4>
                                                    <p className="text-sm text-muted-foreground">La persona no aparecerá en la asistencia durante estas fechas.</p>
                                                </div>
                                                <div className="space-y-2">
                                                    {person.vacationPeriods.map(vac => (
                                                        <div key={vac.id} className="text-sm">
                                                            <span className="font-semibold">{vac.startDate ? format(vac.startDate, 'dd/MM/yy') : 'N/A'}</span> al <span className="font-semibold">{vac.endDate ? format(vac.endDate, 'dd/MM/yy') : 'N/A'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <Button variant="outline" size="sm" className="w-full" onClick={() => onManageVacations(person)}>
                                                    Gestionar Vacaciones
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}
                                {recoveryCredits.length > 0 && (
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20">
                                                <CalendarClock className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80">
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">Recuperos Pendientes ({recoveryCredits.length})</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Clases con ausencia justificada para recuperar:
                                                </p>
                                                <ScrollArea className="h-40">
                                                    <ul className="space-y-2 pr-4">
                                                        {recoveryCredits.map((credit, index) => (
                                                          <li key={index} className="text-xs p-2 rounded-md bg-muted/50">
                                                            <p className="font-bold text-foreground">{credit.className}</p>
                                                            <p className="text-muted-foreground">{credit.date}</p>
                                                          </li>
                                                        ))}
                                                    </ul>
                                                </ScrollArea>
                                                {recoveryCredits.length > 0 && (
                                                    <Button asChild className="w-full">
                                                        <Link href={`/schedule?recoveryMode=true&personId=${person.id}`}>
                                                            <CalendarClock className="mr-2 h-4 w-4" />
                                                            Recuperar Sesión
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}
                                 {level && (
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20">
                                                <Signal className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto">
                                            <div className="space-y-2 text-center">
                                                <h4 className="font-medium leading-none">Nivel Asignado</h4>
                                                <Badge variant="outline">{level.name}</Badge>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                 )}
                            </div>
                            <Badge variant="secondary" className={cn("font-semibold mt-1.5 border-0 text-xs", getStatusBadgeClass())}>
                               {renderPaymentStatus(paymentStatusInfo)}
                            </Badge>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 -mr-2 flex-shrink-0"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => onEdit(person)}><Pencil className="mr-2 h-4 w-4" />Editar Persona</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onJustifyAbsence(person)}><UserX className="mr-2 h-4 w-4" />Notificar Ausencia</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onManageVacations(person)}><Plane className="mr-2 h-4 w-4" />Gestionar Vacaciones</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => onViewHistory(person)}><History className="mr-2 h-4 w-4" />Historial de Pagos</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onViewAttendanceHistory(person)}><CalendarIcon className="mr-2 h-4 w-4" />Historial de Asistencia</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setIsRevertDialogOpen(true)}><Undo2 className="mr-2 h-4 w-4" />Volver atrás último pago</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                     
                    <div className="mt-2">
                        <div className="flex justify-between items-baseline">
                            <p className="text-sm font-semibold opacity-90">{tariff?.name}</p>
                            {paymentStatusInfo.status === 'Atrasado' && totalDebt > 0 ? (
                                <div className="text-right">
                                    <p className="text-xs opacity-80">Deuda Total</p>
                                    <p className="text-lg font-bold">{formatPrice(totalDebt)}</p>
                                </div>
                            ) : (
                                tariff && <p className="text-lg font-bold">{formatPrice(tariff.price)}</p>
                            )}
                        </div>
                        {person.lastPaymentDate ? (
                            <p className="text-xs opacity-80 mt-1">Vence: {format(person.lastPaymentDate, 'dd/MM/yyyy')}</p>
                        ) : (
                            <p className="text-xs opacity-80 mt-1">Registra el primer pago para iniciar el ciclo.</p>
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
                        <h4 className="font-semibold text-sm text-foreground">Horarios</h4>
                        <ScrollArea className="h-28">
                           <div className="space-y-2 pr-4">
                            {personSessions.length > 0 ? (
                                personSessions.map(session => (
                                    <div key={session.id} className="text-xs p-2 rounded-md bg-muted/50">
                                        <div className="flex justify-between items-start">
                                          <p className="font-bold text-foreground">{session.actividadName}</p>
                                          {session.levelName && <Badge variant="outline" className="text-[9px] px-1 py-0">{session.levelName}</Badge>}
                                        </div>
                                        <p className="text-muted-foreground">{session.dayOfWeek}, {session.time}</p>
                                        <div className="flex items-center gap-4 mt-1 text-muted-foreground">
                                          <span className="flex items-center gap-1.5"><User className="h-3 w-3" />{session.specialistName}</span>
                                          <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{session.spaceName}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-4">Sin horarios fijos.</p>
                            )}
                            </div>
                        </ScrollArea>
                    </div>
                </CardContent>
                
                <CardFooter className="grid grid-cols-2 gap-2 p-2 border-t mt-auto">
                    <Button
                        onClick={() => onManageEnrollments(person)}
                        variant="outline"
                        className="w-full font-semibold"
                    >
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Horarios
                    </Button>
                    <Button onClick={() => onRecordPayment(person)} className="w-full font-bold">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Registrar Pago
                    </Button>
                </CardFooter>
            </Card>
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitleAlert>¿Estás seguro?</AlertDialogTitleAlert><AlertDialogDescriptionAlert>Esta acción no se puede deshacer. Se eliminará a la persona y todas sus inscripciones.</AlertDialogDescriptionAlert></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deletePerson(person.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

             <AlertDialog open={isRevertDialogOpen} onOpenChange={setIsRevertDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitleAlert>¿Revertir último pago?</AlertDialogTitleAlert><AlertDialogDescriptionAlert>Esta acción eliminará el pago más reciente del historial y sumará 1 al contador de pagos pendientes. Esta acción no se puede deshacer.</AlertDialogDescriptionAlert></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleRevertPayment} className="bg-destructive hover:bg-destructive/90">Sí, revertir pago</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function StudentsPageContent() {
  const { people, tariffs, isPersonOnVacation, attendance, payments, loading, sessions, actividades, specialists, spaces, recordPayment, levels, triggerWaitlistCheck, enrollPersonInSessions } = useStudio();
  const { institute } = useAuth();
  const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | undefined>(undefined);
  const [personForEnrollment, setPersonForEnrollment] = useState<Person | null>(null);
  const [personForAbsence, setPersonForAbsence] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const searchParams = useSearchParams();
  const statusFilterFromUrl = searchParams.get('filter') || 'all';

  const [actividadFilter, setActividadFilter] = useState('all');
  const [specialistFilter, setSpecialistFilter] = useState('all');
  const [spaceFilter, setSpaceFilter] = useState('all');

  const [personForVacation, setPersonForVacation] = useState<Person | null>(null);
  const [personForHistory, setPersonForHistory] = useState<Person | null>(null);
  const [personForAttendanceHistory, setPersonForAttendanceHistory] = useState<Person | null>(null);
  const [personForPayment, setPersonForPayment] = useState<Person | null>(null);
  const [personForWelcome, setPersonForWelcome] = useState<NewPersonData | null>(null);
  const [receiptInfo, setReceiptInfo] = useState<ReceiptInfo | null>(null);
  const [isPaymentAlertOpen, setIsPaymentAlertOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
        setSearchTerm(searchQuery);
    }
  }, [searchParams]);

  const { recoveryDetails, filteredPeople, isLimitReached } = useMemo(() => {
    if (!isMounted) return { recoveryDetails: {}, filteredPeople: [], isLimitReached: false };
    
    const limit = institute?.studentLimit;
    const isLimitReached = (limit !== null && limit !== undefined) ? people.length >= limit : false;

    const now = new Date();
    const term = searchTerm.toLowerCase();

    const allRecoveryCredits: Record<string, RecoveryCredit[]> = {};
    people.forEach(p => (allRecoveryCredits[p.id] = []));
    
    let usedRecoveryCounts: Record<string, number> = {};
    people.forEach(p => (usedRecoveryCounts[p.id] = 0));

    attendance.forEach(record => {
        record.oneTimeAttendees?.forEach(personId => {
            usedRecoveryCounts[personId] = (usedRecoveryCounts[personId] || 0) + 1;
        });
        
        record.justifiedAbsenceIds?.forEach(personId => {
            if (allRecoveryCredits[personId]) {
                const session = sessions.find(s => s.id === record.sessionId);
                const actividad = session ? actividades.find(a => a.id === session.actividadId) : null;
                allRecoveryCredits[personId].push({
                    className: actividad?.name || 'Clase',
                    date: format(parse(record.date, 'yyyy-MM-dd', new Date()), 'dd/MM/yy'),
                });
            }
        });
    });
    
    Object.keys(allRecoveryCredits).forEach(personId => {
        const usedCount = usedRecoveryCounts[personId] || 0;
        if (usedCount > 0) {
            allRecoveryCredits[personId] = allRecoveryCredits[personId].slice(usedCount);
        }
    });

    let peopleToFilter = [...people];

    if (statusFilterFromUrl !== 'all') {
        peopleToFilter = peopleToFilter.filter(p => {
            if (statusFilterFromUrl === 'overdue') return getStudentPaymentStatus(p, now).status === 'Atrasado';
            if (statusFilterFromUrl === 'on-vacation') return isPersonOnVacation(p, now);
            if (statusFilterFromUrl === 'pending-recovery') return (allRecoveryCredits[p.id]?.length || 0) > 0;
            return true;
        });
    }

    if (actividadFilter !== 'all' || specialistFilter !== 'all' || spaceFilter !== 'all') {
        const filteredSessions = sessions.filter(s => 
            (actividadFilter === 'all' || s.actividadId === actividadFilter) &&
            (specialistFilter === 'all' || s.instructorId === specialistFilter) &&
            (spaceFilter === 'all' || s.spaceId === spaceFilter)
        );
        const peopleIdsInFilteredSessions = new Set<string>();
        filteredSessions.forEach(s => {
            s.personIds.forEach(pid => peopleIdsInFilteredSessions.add(pid));
        });
        peopleToFilter = peopleToFilter.filter(p => peopleIdsInFilteredSessions.has(p.id));
    }
    
    const finalFilteredPeople = peopleToFilter
        .filter(person => person.name.toLowerCase().includes(term) || person.phone.includes(term))
        .sort((a,b) => a.name.localeCompare(b.name));
      
    return { recoveryDetails: allRecoveryCredits, filteredPeople: finalFilteredPeople, isLimitReached };
  }, [people, searchTerm, statusFilterFromUrl, actividadFilter, specialistFilter, spaceFilter, attendance, sessions, actividades, isMounted, isPersonOnVacation, institute]);

   const handleExport = () => {
    const dataToExport = filteredPeople.map(p => ({
        nombre: p.name,
        telefono: p.phone,
        arancel: tariffs.find(t => t.id === p.tariffId)?.name || 'N/A',
        estado_pago: getStudentPaymentStatus(p, new Date()).status,
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
  
  const handleJustifyAbsenceClick = (person: Person) => {
    setPersonForAbsence(person);
  };

  const handleSuccessfulPayment = (person: Person) => {
    const tariff = tariffs.find(t => t.id === person.tariffId);
    if (!tariff || !institute) return;

    // Calculate the new due date to show in the receipt
    const newDueDate = calculateNextPaymentDate(
      person.lastPaymentDate || new Date(), 
      person.joinDate,
      tariff
    );

    setReceiptInfo({
      personName: person.name,
      personPhone: person.phone,
      tariffName: tariff.name,
      tariffPrice: tariff.price,
      nextDueDate: newDueDate,
      instituteName: institute.name,
    });
  };

  const handleRecordPaymentClick = async (person: Person) => {
    const status = getStudentPaymentStatus(person, new Date()).status;
    if (status === 'Al día' && (person.outstandingPayments || 0) === 0) {
        setPersonForPayment(person);
        setIsPaymentAlertOpen(true);
    } else {
        await recordPayment(person.id);
        handleSuccessfulPayment(person);
    }
  };

  const confirmRecordPayment = async () => {
    if (personForPayment) {
        await recordPayment(personForPayment.id);
        handleSuccessfulPayment(personForPayment);
    }
    setIsPaymentAlertOpen(false);
    setPersonForPayment(null);
  };


  const formatPrice = (price: number) => {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
      }).format(price);
  };

  const getStatusBadgeClass = (status: string) => {
      switch (status) {
          case 'Al día': return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
          case 'Atrasado': return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
          case 'Pendiente de Pago': return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
          default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300";
      }
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
                    <div className="flex gap-2 flex-col sm:flex-row">
                      <Skeleton className="h-10 w-full sm:w-32 rounded-xl" />
                      <Skeleton className="h-10 w-full sm:w-32 rounded-xl" />
                      <Skeleton className="h-10 w-full sm:w-32 rounded-xl" />
                    </div>
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
      {statusFilterFromUrl === 'overdue' && (
        <div className="flex justify-start">
            <Button variant="outline" asChild>
                <Link href="/?view=advanced">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Gestión Avanzada
                </Link>
            </Button>
        </div>
      )}
      <PageHeader title="Personas">
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}><FileDown className="mr-2 h-4 w-4" />Exportar</Button>
            <Button onClick={handleAddClick} disabled={isLimitReached}>
                <PlusCircle className="mr-2 h-4 w-4" />Añadir Persona
            </Button>
        </div>
      </PageHeader>
      
      {isLimitReached && (
        <Alert variant="destructive" className="border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Límite de Alumnos Alcanzado</AlertTitle>
            <AlertDescriptionComponent>
                Has alcanzado el límite de {institute?.studentLimit} alumnos para tu plan actual. Para añadir más, por favor contacta a soporte para ampliar tu plan.
            </AlertDescriptionComponent>
        </Alert>
      )}

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
            <div className="flex gap-2 flex-col sm:flex-row">
                <Select value={actividadFilter} onValueChange={setActividadFilter}>
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
                 <Select value={specialistFilter} onValueChange={setSpecialistFilter}>
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
                 <Select value={spaceFilter} onValueChange={setSpaceFilter}>
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
        
        <Tabs defaultValue="cards" className="w-full">
            <TabsList className="mb-4">
                <TabsTrigger value="cards"><LayoutGrid className="mr-2 h-4 w-4"/>Tarjetas</TabsTrigger>
                <TabsTrigger value="table"><List className="mr-2 h-4 w-4"/>Tabla</TabsTrigger>
            </TabsList>

            <TabsContent value="cards">
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
                                levels={levels}
                                tariffs={tariffs}
                                recoveryCredits={recoveryDetails[person.id] || []}
                                onManageVacations={setPersonForVacation}
                                onEdit={handleEditClick}
                                onViewHistory={setPersonForHistory}
                                onViewAttendanceHistory={setPersonForAttendanceHistory}
                                onManageEnrollments={handleEnrollmentClick}
                                onJustifyAbsence={handleJustifyAbsenceClick}
                                onRecordPayment={handleRecordPaymentClick}
                            />
                        ))}
                    </div>
                    ) : (
                    <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
                        <CardHeader>
                        <CardTitle>{searchTerm || actividadFilter !== 'all' || statusFilterFromUrl !== 'all' || specialistFilter !== 'all' || spaceFilter !== 'all' ? "No se encontraron personas" : "No Hay Personas"}</CardTitle>
                        <CardDescription>
                            {searchTerm || actividadFilter !== 'all' || statusFilterFromUrl !== 'all' || specialistFilter !== 'all' || spaceFilter !== 'all' ? "Prueba con otros filtros o limpia la búsqueda." : "Empieza a construir tu comunidad añadiendo tu primera persona."}
                        </CardDescription>
                        </CardHeader>
                        <CardContent>
                        {!(searchTerm || actividadFilter !== 'all' || statusFilterFromUrl !== 'all' || specialistFilter !== 'all' || spaceFilter !== 'all') && (
                            <Button onClick={handleAddClick} disabled={isLimitReached}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Añadir Persona
                            </Button>
                        )}
                        </CardContent>
                    </Card>
                    )}
            </TabsContent>
            <TabsContent value="table">
                <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Contacto</TableHead>
                                <TableHead>Nivel</TableHead>
                                <TableHead>Arancel</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Vencimiento</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={7}><Skeleton className="h-8 w-full"/></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredPeople.length > 0 ? (
                                filteredPeople.map((person) => {
                                    const tariff = tariffs.find(t => t.id === person.tariffId);
                                    const level = levels.find(l => l.id === person.levelId);
                                    const paymentStatusInfo = getStudentPaymentStatus(person, new Date());
                                    const paymentStatusText = paymentStatusInfo.status === 'Atrasado'
                                        ? `${paymentStatusInfo.status} (${paymentStatusInfo.daysOverdue} d)`
                                        : paymentStatusInfo.status;

                                    return (
                                        <TableRow key={person.id}>
                                            <TableCell className="font-medium">{person.name}</TableCell>
                                            <TableCell>{person.phone}</TableCell>
                                            <TableCell>
                                                {level ? <Badge variant="outline">{level.name}</Badge> : <span className="text-muted-foreground">-</span>}
                                            </TableCell>
                                            <TableCell>{tariff?.name || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn('font-semibold', getStatusBadgeClass(paymentStatusInfo.status))}>
                                                    {paymentStatusText}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {person.lastPaymentDate ? format(person.lastPaymentDate, 'dd/MM/yyyy') : 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => handleRecordPaymentClick(person)}>Registrar Pago</DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => handleEnrollmentClick(person)}>Gestionar Horarios</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onSelect={() => handleEditClick(person)}>Editar Persona</DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => handleJustifyAbsenceClick(person)}>Notificar Ausencia</DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => setPersonForVacation(person)}>Gestionar Vacaciones</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onSelect={() => setPersonForHistory(person)}>Historial de Pagos</DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => setPersonForAttendanceHistory(person)}>Historial de Asistencia</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No se encontraron personas con los filtros seleccionados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </TabsContent>
        </Tabs>

      <PersonDialog 
        person={selectedPerson} 
        onOpenChange={setIsPersonDialogOpen} 
        open={isPersonDialogOpen}
        onPersonCreated={(person) => {
          if (person.tariffId) {
            setPersonForWelcome(person as NewPersonData);
          }
        }}
        isLimitReached={isLimitReached}
      />
      <WelcomeDialog person={personForWelcome} onOpenChange={() => setPersonForWelcome(null)} />
      <VacationDialog person={personForVacation} onClose={() => setPersonForVacation(null)} />
      <EnrollmentsDialog person={personForEnrollment} onClose={() => setPersonForEnrollment(null)} />
      <JustifiedAbsenceDialog person={personForAbsence} onClose={() => setPersonForAbsence(null)} />
      <PaymentHistoryDialog 
        person={personForHistory} 
        payments={payments}
        tariffs={tariffs}
        onClose={() => setPersonForHistory(null)}
      />
      <AttendanceHistoryDialog
        person={personForAttendanceHistory}
        sessions={sessions}
        actividades={actividades}
        attendance={attendance}
        onClose={() => setPersonForAttendanceHistory(null)}
      />
       <PaymentReceiptDialog
        receiptInfo={receiptInfo}
        onOpenChange={() => setReceiptInfo(null)}
      />

       <AlertDialog open={isPaymentAlertOpen} onOpenChange={setIsPaymentAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitleAlert>¿Registrar Pago Adicional?</AlertDialogTitleAlert>
                  <AlertDialogDescriptionAlert>
                      Este alumno ya tiene su cuota al día. Si continúas, se registrará un pago por adelantado y su próxima fecha de vencimiento se extenderá otro mes. ¿Estás seguro?
                  </AlertDialogDescriptionAlert>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setIsPaymentAlertOpen(false)}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmRecordPayment}>
                      Sí, registrar pago
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>


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
