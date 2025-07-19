

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
import { PersonCard } from './person-card';
import { EnrollmentsDialog } from './enrollment-dialog';
import { VacationDialog } from './vacation-dialog';
import { PaymentHistoryDialog } from './payment-history-dialog';

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
