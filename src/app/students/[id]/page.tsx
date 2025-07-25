

'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, MoreVertical, CalendarClock, Plane, Calendar as CalendarIcon, History, Undo2, Heart, FileText, ClipboardList, User, MapPin, Signal, DollarSign, ArrowLeft, UserX, PlusCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Person, Session, Actividad, Specialist, Space, RecoveryCredit, Level, Tariff, PaymentStatusInfo } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getStudentPaymentStatus, calculateNextPaymentDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { PersonDialog } from '@/components/students/person-dialog';
import { PaymentReceiptDialog, type ReceiptInfo } from '@/components/payment-receipt-dialog';
import { EnrollmentsDialog } from '@/components/enrollments-dialog';
import { VacationDialog } from '@/app/students/vacation-dialog';
import { PaymentHistoryDialog } from '@/app/students/payment-history-dialog';
import { AttendanceHistoryDialog } from '@/app/students/attendance-history-dialog';
import { JustifiedAbsenceDialog } from '@/app/students/justified-absence-dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parse, startOfDay, isBefore, isToday, compareDesc } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type SessionWithDetails = Session & {
    actividadName: string;
    specialistName: string;
    spaceName: string;
};

type UpcomingRecovery = {
    date: Date;
    className: string;
    time: string;
    sessionId: string;
    dateStr: string;
};

function StudentDetailContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { 
    people, sessions, actividades, specialists, spaces, levels, tariffs, attendance, payments, 
    deactivatePerson, revertLastPayment, recordPayment, loading, removePersonFromSession, removeOneTimeAttendee
  } = useStudio();
  
  const [person, setPerson] = useState<Person | null>(null);
  
  // Dialog states
  const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false);
  const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false);
  const [isJustifyAbsenceOpen, setIsJustifyAbsenceOpen] = useState(false);
  const [isVacationDialogOpen, setIsVacationDialogOpen] = useState(false);
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
  const [isAttendanceHistoryOpen, setIsAttendanceHistoryOpen] = useState(false);
  const [isPaymentAlertOpen, setIsPaymentAlertOpen] = useState(false);
  const [isDeactivateAlertOpen, setIsDeactivateAlertOpen] = useState(false);
  const [isRevertAlertOpen, setIsRevertAlertOpen] = useState(false);
  
  const [receiptInfo, setReceiptInfo] = useState<ReceiptInfo | null>(null);
  const { institute } = useAuth();
  const [sessionToUnenroll, setSessionToUnenroll] = useState<SessionWithDetails | null>(null);
  const [recoveryToCancel, setRecoveryToCancel] = useState<UpcomingRecovery | null>(null);


  useEffect(() => {
    if (!loading) {
      const foundPerson = people.find(p => p.id === params.id);
      if (foundPerson) {
        setPerson(foundPerson);
      } else {
        // Redirect if person not found
        router.push('/students');
      }
    }
  }, [params.id, people, loading, router]);
  
  const availableCredits = useMemo(() => {
    if (!person) return 0;
    
    const justifiedAbsencesCount = attendance.filter(record => 
        record.justifiedAbsenceIds?.includes(person.id)
    ).length;

    const usedRecoveriesCount = attendance.filter(record => 
        record.oneTimeAttendees?.includes(person.id)
    ).length;

    return Math.max(0, justifiedAbsencesCount - usedRecoveriesCount);
  }, [person, attendance]);


  const { tariff, level, paymentStatusInfo, totalDebt, personSessions, upcomingRecoveries } = useMemo(() => {
    if (!person) return { personSessions: [], upcomingRecoveries: [] };

    const tariff = tariffs.find(t => t.id === person.tariffId);
    const level = levels.find(l => l.id === person.levelId);
    const paymentStatusInfo = getStudentPaymentStatus(person, new Date());
    
    let debtMultiplier = person.outstandingPayments || 0;
     if (paymentStatusInfo.status === 'Atrasado' && debtMultiplier <= 0) {
        debtMultiplier = 1;
    }
    const totalDebt = (tariff?.price || 0) * debtMultiplier;

    const today = startOfDay(new Date());

    const upcomingRecs: UpcomingRecovery[] = [];
    const oneTimeAttendances = attendance.filter(record => record.oneTimeAttendees?.includes(person.id));

    for (const record of oneTimeAttendances) {
        const recordDate = parse(record.date, 'yyyy-MM-dd', new Date());
        if (!isBefore(recordDate, today)) {
             const session = sessions.find(s => s.id === record.sessionId);
             if (session) {
                 const actividad = actividades.find(a => a.id === session.actividadId);
                 upcomingRecs.push({
                      date: recordDate,
                      className: actividad?.name || 'Clase',
                      time: session.time,
                      sessionId: session.id,
                      dateStr: record.date
                 });
             }
        }
    }
    
    const personSessions = sessions
      .filter(s => s.personIds.includes(person.id))
      .map(s => {
        const actividad = actividades.find(a => a.id === s.actividadId);
        const specialist = specialists.find(sp => sp.id === s.instructorId);
        const space = spaces.find(sp => sp.id === s.spaceId);
        return { ...s, actividadName: actividad?.name || 'Clase', specialistName: specialist?.name || 'N/A', spaceName: space?.name || 'N/A' };
      })
      .sort((a, b) => {
         const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
         const dayComparison = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
         if (dayComparison !== 0) return dayComparison;
         return a.time.localeCompare(b.time);
      });

    return {
      tariff,
      level,
      paymentStatusInfo,
      totalDebt,
      personSessions,
      upcomingRecoveries: upcomingRecs.sort((a,b) => a.date.getTime() - b.date.getTime())
    };
}, [person, tariffs, levels, attendance, sessions, actividades, specialists, spaces]);
  
  const personPaymentCount = useMemo(() => {
      if (!person) return 0;
      return payments.filter(p => p.personId === person.id).length;
  }, [payments, person]);


  const handleRecordPaymentClick = async () => {
    if (!person) return;
    const status = getStudentPaymentStatus(person, new Date()).status;
    if (status === 'Al día' && (person.outstandingPayments || 0) === 0) {
        setIsPaymentAlertOpen(true);
    } else {
        await recordPayment(person.id);
        handleSuccessfulPayment();
    }
  };

  const confirmRecordPayment = async () => {
    if (person) {
        await recordPayment(person.id);
        handleSuccessfulPayment();
    }
    setIsPaymentAlertOpen(false);
  };

  const handleSuccessfulPayment = () => {
    if (!person || !tariff || !institute) return;
    const newDueDate = calculateNextPaymentDate(person.lastPaymentDate || new Date(), person.joinDate, tariff);
    setReceiptInfo({
      personName: person.name, personPhone: person.phone, tariffName: tariff.name,
      tariffPrice: tariff.price, nextDueDate: newDueDate, instituteName: institute.name,
    });
  };

  const handleDeactivate = async () => {
    if (!person) return;
    await deactivatePerson(person.id);
    setIsDeactivateAlertOpen(false);
    router.push('/students');
  };

  const handleUnenroll = () => {
    if (sessionToUnenroll && person) {
      removePersonFromSession(sessionToUnenroll.id, person.id);
    }
    setSessionToUnenroll(null);
  };
  
  const handleCancelRecovery = async () => {
    if (recoveryToCancel && person) {
      await removeOneTimeAttendee(recoveryToCancel.sessionId, person.id, recoveryToCancel.dateStr);
    }
    setRecoveryToCancel(null);
  };

  const getStatusBadgeClass = (status: PaymentStatusInfo['status']) => {
    switch (status) {
        case 'Al día': return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700";
        case 'Atrasado': return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700";
        case 'Próximo a Vencer': return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700";
        case 'Pendiente de Pago': return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700";
        default: return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
    }
  };

  const renderFinancialStatus = () => {
    if (!paymentStatusInfo) return null;
    
    const baseClass = "text-center p-3 rounded-lg";
    const statusClass = getStatusBadgeClass(paymentStatusInfo.status).replace('border-', 'bg-');
    
    switch (paymentStatusInfo.status) {
        case 'Atrasado':
            return (
                <div className={cn(baseClass, statusClass)}>
                    <span className="font-semibold">Debe: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(totalDebt)}</span>
                    <span className="block text-xs font-normal opacity-90">({paymentStatusInfo.daysOverdue} días de atraso)</span>
                </div>
            );
        case 'Próximo a Vencer':
             return (
                <div className={cn(baseClass, statusClass)}>
                   <span className="font-semibold">Vence {paymentStatusInfo.daysUntilDue === 0 ? 'hoy' : `en ${paymentStatusInfo.daysUntilDue} día(s)`}</span>
                   <span className="block text-xs font-normal opacity-90">({person.lastPaymentDate ? format(person.lastPaymentDate, 'dd/MM/yy') : 'N/A'})</span>
                </div>
            );
        case 'Al día':
            return (
                <div className={cn(baseClass, statusClass)}>
                    <span className="font-semibold">Al día</span>
                    <span className="block text-xs font-normal opacity-90">Próximo vencimiento: {person.lastPaymentDate ? format(person.lastPaymentDate, 'dd/MM/yyyy') : 'N/A'}</span>
                </div>
            );
        case 'Pendiente de Pago':
             return (
                <div className={cn(baseClass, statusClass)}>
                    <span className="font-semibold">Pendiente de Primer Pago</span>
                </div>
            );
        default: return null;
    }
};

  
  const formatWhatsAppLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

  if (loading || !person || !paymentStatusInfo) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  const sessionToUnenrollName = sessionToUnenroll ? actividades.find(a => a.id === sessionToUnenroll.actividadId)?.name : '';
  const isRecoverButtonDisabled = availableCredits <= 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1">
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{person.name}</h1>
                 <Badge variant="outline" className={cn("capitalize", getStatusBadgeClass(paymentStatusInfo.status))}>
                    {paymentStatusInfo.status}
                </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <WhatsAppIcon className="h-4 w-4 text-green-600"/>
              <a href={formatWhatsAppLink(person.phone)} target="_blank" rel="noopener noreferrer" className="hover:underline">{person.phone}</a>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
                <Link href="/students">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                </Link>
            </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setIsPersonDialogOpen(true)}><Pencil className="mr-2 h-4 w-4" />Editar Persona</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsRevertAlertOpen(true)} disabled={personPaymentCount === 0}><Undo2 className="mr-2 h-4 w-4" />Volver atrás último pago</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setIsDeactivateAlertOpen(true)} className="text-destructive focus:text-destructive"><UserX className="mr-2 h-4 w-4" />Desactivar Persona</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>


       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary"/>
                        Estado Financiero
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Arancel</p>
                            <p className="text-lg font-semibold">{tariff?.name}</p>
                        </div>
                        <p className="text-2xl font-bold">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(tariff?.price || 0)}</p>
                    </div>
                    {renderFinancialStatus()}
                </CardContent>
                <CardFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button onClick={handleRecordPaymentClick}><DollarSign className="mr-2 h-4 w-4"/>Registrar Pago</Button>
                    <Button variant="outline" onClick={() => setIsPaymentHistoryOpen(true)}><History className="mr-2 h-4 w-4"/>Ver Historial</Button>
                </CardFooter>
            </Card>
            <div className="space-y-8">
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                             <span className="flex items-center gap-2">
                                <ClipboardList className="h-5 w-5 text-primary"/>
                                Actividad y Horarios
                             </span>
                        </CardTitle>
                        {availableCredits > 0 && (
                             <CardDescription className="flex items-center gap-1.5 text-amber-600 font-semibold pt-2">
                                <CalendarClock className="h-4 w-4"/>
                                Tiene {availableCredits} clase(s) para recuperar.
                            </CardDescription>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {personSessions.length > 0 ? (
                            personSessions.map(session => (
                                <div key={session.id} className="text-sm p-3 rounded-md bg-muted/50">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-bold text-foreground">{session.actividadName}</p>
                                        <p className="font-semibold text-xs text-muted-foreground">{session.dayOfWeek}, {session.time}</p>
                                      </div>
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSessionToUnenroll(session)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1.5"><User className="h-3 w-3" />{session.specialistName}</span>
                                      <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{session.spaceName}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground text-sm py-8">
                                Sin horarios fijos asignados.
                            </div>
                        )}
                        {upcomingRecoveries.length > 0 && (
                            <>
                             <p className="font-bold text-xs uppercase text-muted-foreground pt-4">Recuperos Agendados</p>
                             {upcomingRecoveries.map((rec) => (
                                 <div key={`${rec.sessionId}-${rec.dateStr}`} className="text-sm p-3 rounded-md bg-blue-100/60 dark:bg-blue-900/40 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-blue-800 dark:text-blue-300">{rec.className}</p>
                                        <p className="font-semibold text-xs text-blue-700 dark:text-blue-400">{format(rec.date, "eeee, dd/MM 'a las' HH:mm", { locale: es })}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setRecoveryToCancel(rec)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                 </div>
                             ))}
                            </>
                        )}
                    </CardContent>
                     <CardFooter className="grid grid-cols-2 gap-2">
                        <Button variant="default" size="sm" onClick={() => setIsEnrollmentDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4"/>Inscribir a Clase
                        </Button>
                        {isRecoverButtonDisabled ? (
                            <Button variant="outline" size="sm" disabled>
                                <CalendarClock className="mr-2 h-4 w-4"/>Recuperar Clase
                            </Button>
                        ) : (
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/schedule?recoveryMode=true&personId=${person.id}`}>
                                    <CalendarClock className="mr-2 h-4 w-4"/>Recuperar Clase
                                </Link>
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setIsVacationDialogOpen(true)}><Plane className="mr-2 h-4 w-4" />Vacaciones</Button>
                        <Button variant="outline" size="sm" onClick={() => setIsJustifyAbsenceOpen(true)}><UserX className="mr-2 h-4 w-4" />Justificar Ausencia</Button>
                    </CardFooter>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                             <FileText className="h-5 w-5 text-primary"/>
                             Información Adicional
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {person.joinDate && <p className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-muted-foreground"/> Se unió el {format(person.joinDate, 'dd MMMM, yyyy', { locale: es })}</p>}
                        {level && <p className="flex items-center gap-2"><Signal className="h-4 w-4 text-muted-foreground"/> Nivel: {level.name}</p>}
                        {person.healthInfo && <div className="text-sm"><p className="font-semibold flex items-center gap-2"><Heart className="h-4 w-4 text-destructive"/>Info de Salud</p><p className="text-muted-foreground pl-6">{person.healthInfo}</p></div>}
                        {person.notes && <div className="text-sm"><p className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground"/>Notas</p><p className="text-muted-foreground pl-6">{person.notes}</p></div>}
                         {!person.joinDate && !level && !person.healthInfo && !person.notes && (
                            <p className="text-muted-foreground text-center py-4">No hay información adicional.</p>
                         )}
                    </CardContent>
                    <CardFooter>
                         <Button variant="outline" className="w-full" onClick={() => setIsAttendanceHistoryOpen(true)}><History className="mr-2 h-4 w-4"/>Historial de Asistencia</Button>
                    </CardFooter>
                </Card>
            </div>
       </div>
       
       {/* Dialogs */}
       <PersonDialog person={person} onOpenChange={setIsPersonDialogOpen} open={isPersonDialogOpen} />
       {isEnrollmentDialogOpen && <EnrollmentsDialog person={person} onClose={() => setIsEnrollmentDialogOpen(false)} />}
       {isJustifyAbsenceOpen && <JustifiedAbsenceDialog person={person} onClose={() => setIsJustifyAbsenceOpen(false)} />}
       {isVacationDialogOpen && <VacationDialog person={person} onClose={() => setIsVacationDialogOpen(false)} />}
       {isPaymentHistoryOpen && <PaymentHistoryDialog person={person} payments={payments} tariffs={tariffs} onClose={() => setIsPaymentHistoryOpen(false)} />}
       {isAttendanceHistoryOpen && <AttendanceHistoryDialog person={person} sessions={sessions} actividades={actividades} attendance={attendance} onClose={() => setIsAttendanceHistoryOpen(false)} />}
       <PaymentReceiptDialog receiptInfo={receiptInfo} onOpenChange={() => setReceiptInfo(null)} />

        {/* Alerts */}
        <AlertDialog open={isPaymentAlertOpen} onOpenChange={setIsPaymentAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>¿Registrar Pago Adicional?</AlertDialogTitle><AlertDialogDescription>Este alumno ya tiene su cuota al día. Si continúas, se registrará un pago por adelantado y su próxima fecha de vencimiento se extenderá. ¿Estás seguro?</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel onClick={() => setIsPaymentAlertOpen(false)}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmRecordPayment}>Sí, registrar pago</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={!!sessionToUnenroll} onOpenChange={() => setSessionToUnenroll(null)}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>¿Desinscribir de la clase?</AlertDialogTitle><AlertDialogDescription>Estás a punto de desinscribir a {person.name} de la clase de {sessionToUnenrollName}. ¿Estás seguro?</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleUnenroll}>Sí, desinscribir</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={!!recoveryToCancel} onOpenChange={() => setRecoveryToCancel(null)}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>¿Cancelar Recupero?</AlertDialogTitle><AlertDialogDescription>Estás a punto de cancelar el recupero de {person.name} para la clase de {recoveryToCancel?.className} del {recoveryToCancel && format(recoveryToCancel.date, 'dd/MM/yyyy')}. El crédito será devuelto a la persona.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleCancelRecovery}>Sí, cancelar recupero</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={isRevertAlertOpen} onOpenChange={setIsRevertAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>¿Revertir último pago?</AlertDialogTitle><AlertDialogDescription>Esta acción eliminará el pago más reciente del historial y sumará 1 al contador de pagos pendientes. No se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => {if(person) {revertLastPayment(person.id)}}} className="bg-destructive hover:bg-destructive/90">Sí, revertir pago</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={isDeactivateAlertOpen} onOpenChange={setIsDeactivateAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>¿Desactivar a {person.name}?</AlertDialogTitle><AlertDialogDescription>Esta acción marcará a la persona como inactiva y la desinscribirá de todas sus clases. No se borrará su historial.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeactivate} className="bg-destructive hover:bg-destructive/90">Desactivar</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<Skeleton className="h-screen w-full" />}>
      <StudentDetailContent params={params} />
    </Suspense>
  )
}
