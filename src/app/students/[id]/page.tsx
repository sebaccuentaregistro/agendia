

'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, MoreVertical, CalendarClock, Plane, Calendar as CalendarIcon, History, Undo2, Heart, FileText, ClipboardList, User, MapPin, Signal, DollarSign, ArrowLeft } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Person, Payment, Session, Actividad, Specialist, Space, RecoveryCredit, Level, Tariff } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getStudentPaymentStatus, calculateNextPaymentDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { PersonDialog } from '@/components/students/person-dialog';
import { PaymentReceiptDialog, type ReceiptInfo } from '@/components/payment-receipt-dialog';
import { EnrollmentsDialog } from '@/components/enrollments-dialog';
import { VacationDialog } from '../vacation-dialog';
import { PaymentHistoryDialog } from '../payment-history-dialog';
import { AttendanceHistoryDialog } from '../attendance-history-dialog';
import { JustifiedAbsenceDialog } from '../justified-absence-dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';

function StudentDetailContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { 
    people, sessions, actividades, specialists, spaces, levels, tariffs, attendance, payments, 
    deactivatePerson, revertLastPayment, recordPayment, loading 
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
  
  const { tariff, level, paymentStatusInfo, totalDebt, recoveryCredits, personSessions } = useMemo(() => {
    if (!person) return { recoveryCredits: [], personSessions: [] };

    const tariff = tariffs.find(t => t.id === person.tariffId);
    const level = levels.find(l => l.id === person.levelId);
    const paymentStatusInfo = getStudentPaymentStatus(person, new Date());
    const totalDebt = (tariff?.price || 0) * (person.outstandingPayments || 0);

    const credits: RecoveryCredit[] = [];
    let usedRecoveryCount = 0;
    
    attendance.forEach(record => {
      if (record.oneTimeAttendees?.includes(person.id)) usedRecoveryCount++;
      if (record.justifiedAbsenceIds?.includes(person.id)) {
        const session = sessions.find(s => s.id === record.sessionId);
        credits.push({
          className: session ? (actividades.find(a => a.id === session.actividadId)?.name || 'Clase') : 'Clase',
          date: format(parse(record.date, 'yyyy-MM-dd', new Date()), 'dd/MM/yy'),
        });
      }
    });

    const personSessions = sessions
      .filter(s => s.personIds.includes(person.id))
      .map(s => {
        const actividad = actividades.find(a => a.id === s.actividadId);
        const specialist = specialists.find(sp => sp.id === s.instructorId);
        const space = spaces.find(sp => sp.id === s.spaceId);
        return { ...s, actividadName: actividad?.name || 'Clase', specialistName: specialist?.name || 'N/A', spaceName: space?.name || 'N/A' };
      })
      .sort((a, b) => a.dayOfWeek.localeCompare(b.dayOfWeek) || a.time.localeCompare(b.time));

    return { 
      tariff, 
      level, 
      paymentStatusInfo, 
      totalDebt, 
      recoveryCredits: credits.slice(usedRecoveryCount),
      personSessions
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

  const formatWhatsAppLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

  if (loading || !person) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title={person.name}>
        <div className="flex items-center gap-2">
           <Button variant="outline" asChild>
                <Link href="/students">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Personas
                </Link>
            </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setIsPersonDialogOpen(true)}><Pencil className="mr-2 h-4 w-4" />Editar Persona</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsVacationDialogOpen(true)}><Plane className="mr-2 h-4 w-4" />Gestionar Vacaciones</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsRevertAlertOpen(true)} disabled={personPaymentCount === 0}><Undo2 className="mr-2 h-4 w-4" />Volver atrás último pago</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsDeactivateAlertOpen(true)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Desactivar Persona</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PageHeader>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
                {/* Payment Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Estado Financiero</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Content here */}
                    </CardContent>
                    <CardFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button onClick={handleRecordPaymentClick}><DollarSign className="mr-2 h-4 w-4"/>Registrar Pago</Button>
                        <Button variant="outline" onClick={() => setIsPaymentHistoryOpen(true)}><History className="mr-2 h-4 w-4"/>Ver Historial</Button>
                    </CardFooter>
                </Card>
                 {/* Enrollment Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Inscripciones</CardTitle>
                        <CardDescription>Clases a las que asiste de forma regular.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Content here */}
                    </CardContent>
                    <CardFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button variant="default" onClick={() => setIsEnrollmentDialogOpen(true)}><ClipboardList className="mr-2 h-4 w-4"/>Administrar Inscripciones</Button>
                        <Button variant="secondary" onClick={() => setIsJustifyAbsenceOpen(true)}><UserX className="mr-2 h-4 w-4"/>Notificar Ausencia</Button>
                    </CardFooter>
                </Card>
            </div>
            <div className="space-y-8">
                {/* Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Información Personal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                         <div className="flex items-center gap-2 text-sm">
                            <WhatsAppIcon className="h-5 w-5 text-green-600"/>
                            <a href={formatWhatsAppLink(person.phone)} target="_blank" rel="noopener noreferrer" className="hover:underline">{person.phone}</a>
                        </div>
                        {person.joinDate && <p className="text-sm flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-muted-foreground"/> Se unió el {format(person.joinDate, 'dd/MM/yyyy')}</p>}
                        {level && <p className="text-sm flex items-center gap-2"><Signal className="h-4 w-4 text-muted-foreground"/> Nivel: {level.name}</p>}
                        {person.healthInfo && <div className="text-sm"><p className="font-semibold flex items-center gap-2"><Heart className="h-4 w-4 text-muted-foreground"/>Info de Salud</p><p className="text-muted-foreground pl-6">{person.healthInfo}</p></div>}
                        {person.notes && <div className="text-sm"><p className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground"/>Notas</p><p className="text-muted-foreground pl-6">{person.notes}</p></div>}
                    </CardContent>
                    <CardFooter>
                         <Button variant="outline" className="w-full" onClick={() => setIsAttendanceHistoryOpen(true)}><History className="mr-2 h-4 w-4"/>Historial de Asistencia</Button>
                    </CardFooter>
                </Card>
            </div>
       </div>
       
       {/* Dialogs */}
       <PersonDialog person={person} onOpenChange={setIsPersonDialogOpen} open={isPersonDialogOpen} />
       <EnrollmentsDialog person={person} onClose={() => setIsEnrollmentDialogOpen(false)} />
       <JustifiedAbsenceDialog person={person} onClose={() => setIsJustifyAbsenceOpen(false)} />
       <VacationDialog person={person} onClose={() => setIsVacationDialogOpen(false)} />
       <PaymentHistoryDialog person={person} payments={payments} tariffs={tariffs} onClose={() => setIsPaymentHistoryOpen(false)} />
       <AttendanceHistoryDialog person={person} sessions={sessions} actividades={actividades} attendance={attendance} onClose={() => setIsAttendanceHistoryOpen(false)} />
       <PaymentReceiptDialog receiptInfo={receiptInfo} onOpenChange={() => setReceiptInfo(null)} />

        {/* Alerts */}
        <AlertDialog open={isPaymentAlertOpen} onOpenChange={setIsPaymentAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>¿Registrar Pago Adicional?</AlertDialogTitle><AlertDialogDescription>Este alumno ya tiene su cuota al día. Si continúas, se registrará un pago por adelantado y su próxima fecha de vencimiento se extenderá. ¿Estás seguro?</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel onClick={() => setIsPaymentAlertOpen(false)}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmRecordPayment}>Sí, registrar pago</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={isRevertAlertOpen} onOpenChange={setIsRevertAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>¿Revertir último pago?</AlertDialogTitle><AlertDialogDescription>Esta acción eliminará el pago más reciente del historial y sumará 1 al contador de pagos pendientes. No se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => {revertLastPayment(person.id); setIsRevertAlertOpen(false);}} className="bg-destructive hover:bg-destructive/90">Sí, revertir pago</AlertDialogAction></AlertDialogFooter>
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
