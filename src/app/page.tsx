

'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, RefreshCw, Loader2, ListPlus, Star, ClipboardList, Warehouse, Signal, DollarSign, Percent, Landmark, KeyRound, Banknote, LineChart, ListChecks, ArrowRight, Bell, Trash2, UserPlus, Settings } from 'lucide-react';
import Link from 'next/link';
import { useStudio } from '@/context/StudioContext';
import type { Session, Person, PaymentReminderInfo, WaitlistEntry, WaitlistProspect, RecoveryCredit } from '@/types';
import { getStudentPaymentStatus } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AttendanceSheet } from '@/components/attendance-sheet';
import { format, startOfMonth, endOfMonth, isWithinInterval, differenceInDays, startOfDay, startOfWeek, endOfWeek, endOfDay, nextDay, Day, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter, useSearchParams } from 'next/navigation';
import { OnboardingTutorial } from '@/components/onboarding-tutorial';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { TodaySessions } from '@/components/dashboard/today-sessions';
import { EnrolledStudentsSheet } from '@/components/enrolled-students-sheet';
import { WaitlistSheet } from '@/components/waitlist-sheet';
import { WaitlistOpportunities, type Opportunity } from '@/components/waitlist-opportunities';
import { ChurnRiskAlerts } from '@/components/churn-risk-alerts';
import { PinDialog } from '@/components/pin-dialog';
import { PaymentRemindersSheet } from '@/components/students/payment-reminders-sheet';
import { EnrollPeopleDialog } from '@/components/enroll-people-dialog';
import { OneTimeAttendeeDialog } from '@/components/one-time-attendee-dialog';
import { NotifyAttendeesDialog } from '@/components/notify-attendees-dialog';
import { WaitlistDialog } from '@/components/waitlist-dialog';
import { CancelSessionDialog } from '@/components/cancel-session-dialog';
import { Badge } from '@/components/ui/badge';
import { MainCards } from '@/components/dashboard/main-cards';
import { useShell } from '@/context/ShellContext';
import { cn } from '@/lib/utils';


function DashboardPageContent() {
  const { 
    sessions, specialists, actividades, spaces, people, attendance, isPersonOnVacation, 
    isTutorialOpen, openTutorial, closeTutorial: handleCloseTutorial, tariffs, payments, operators,
    updateOverdueStatuses, deleteSession, reactivateCancelledSession
  } = useStudio();
  const { isPinVerified, setPinVerified } = useAuth();
  const { openSessionDialog } = useShell();
  
  const [selectedSessionForStudents, setSelectedSessionForStudents] = useState<Session | null>(null);
  const [sessionForAttendance, setSessionForAttendance] = useState<Session | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isUpdatingDebts, setIsUpdatingDebts] = useState(false);
  const [isWaitlistSheetOpen, setIsWaitlistSheetOpen] = useState(false);
  const [isRemindersSheetOpen, setIsRemindersSheetOpen] = useState(false);
  const [remindersInitialFocus, setRemindersInitialFocus] = useState<'overdue' | 'upcoming' | null>(null);
  const { toast } = useToast();
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const dashboardView = searchParams.get('view') || 'main';
  
  // States for dialogs triggered from ScheduleCard
  const [sessionForEnrollment, setSessionForEnrollment] = useState<Session | null>(null);
  const [sessionForOneTime, setSessionForOneTime] = useState<Session | null>(null);
  const [sessionForNotification, setSessionForNotification] = useState<Session | null>(null);
  const [sessionForWaitlist, setSessionForWaitlist] = useState<Session | null>(null);
  const [sessionForCancellation, setSessionForCancellation] = useState<{ session: Session, date: Date } | null>(null);
  const [sessionForDelete, setSessionForDelete] = useState<Session | null>(null);
  const [sessionForReactivation, setSessionForReactivation] = useState<{ session: Session, date: Date } | null>(null);
  
  useEffect(() => {
    setIsMounted(true);
    
    const handleAction = (e: Event) => {
        const { action, session, date } = (e as CustomEvent).detail;
        switch (action) {
            case 'view-students':
                setSelectedSessionForStudents(session);
                break;
            case 'take-attendance':
                setSessionForAttendance(session);
                break;
            case 'enroll-fixed':
                setSessionForEnrollment(session);
                break;
            case 'enroll-recovery':
                setSessionForOneTime(session);
                break;
            case 'notify-attendees':
                setSessionForNotification(session);
                break;
            case 'add-to-waitlist':
                setSessionForWaitlist(session);
                break;
            case 'cancel-session':
                setSessionForCancellation({ session, date });
                break;
            case 'reactivate-session':
                setSessionForReactivation({ session, date });
                break;
            case 'edit-session':
                openSessionDialog(session);
                break;
            case 'delete-session':
                setSessionForDelete(session);
                break;
        }
    };
    document.addEventListener('schedule-card-action', handleAction);
    return () => {
        document.removeEventListener('schedule-card-action', handleAction);
    };

  }, [openSessionDialog]);


  const handleUpdateDebts = async () => {
    setIsUpdatingDebts(true);
    const count = await updateOverdueStatuses();
    toast({
      title: "Actualización de Deudas Completa",
      description: count > 0 ? `Se actualizaron los estados de ${count} persona(s).` : "No se encontraron nuevas deudas para actualizar."
    });
    setIsUpdatingDebts(false);
  };

  const handleDeleteSession = () => {
    if (sessionForDelete) {
      deleteSession(sessionForDelete.id);
      setSessionForDelete(null);
    }
  };
  
  const handleReactivateSession = async () => {
    if (sessionForReactivation) {
        await reactivateCancelledSession(sessionForReactivation.session.id, sessionForReactivation.date);
        setSessionForReactivation(null);
    }
  };

  const clientSideData = useMemo(() => {
    if (!isMounted) {
      return { todaysSessions: [], todayName: '', totalDebt: 0, collectionPercentage: 0, waitlistOpportunities: [], waitlistSummary: [], totalWaitlistCount: 0, churnRiskPeople: [], overdueCount: 0, upcomingCount: 0, recoveryCount: 0 };
    }
    const now = new Date();
    const today = startOfDay(now);
    const dayMap: { [key: number]: Session['dayOfWeek'] } = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
    const currentTodayName = dayMap[now.getDay()];
    
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    const revenueMonth = payments
            .filter(p => p.date && isWithinInterval(p.date, { start: startOfCurrentMonth, end: endOfCurrentMonth }))
            .reduce((acc, p) => acc + p.amount, 0);
    
    const todaysSessions = sessions
      .filter(session => session.dayOfWeek === currentTodayName)
      .sort((a, b) => a.time.localeCompare(b.time));
    
    let overdueCount = 0;
    let upcomingCount = 0;
    let recoveryPeopleCount = 0;

    for (const p of people) {
      const status = getStudentPaymentStatus(p, now).status;
      if (status === 'Atrasado') {
        overdueCount++;
      } else if (status === 'Próximo a Vencer') {
        upcomingCount++;
      }
      if ((p.recoveryCredits?.filter(c => c.status === 'available').length || 0) > 0) {
        recoveryPeopleCount++;
      }
    }


    const overduePeople = people.filter(p => getStudentPaymentStatus(p, now).status === 'Atrasado');
    const potentialIncome = people.reduce((acc, person) => {
        const tariff = tariffs.find(t => t.id === person.tariffId);
        return acc + (tariff?.price || 0);
    }, 0);

    const totalDebt = overduePeople.reduce((acc, person) => {
        const tariff = tariffs.find(t => t.id === person.tariffId);
        const debtAmount = (tariff?.price || 0) * (person.outstandingPayments || 1);
        return acc + debtAmount;
    }, 0);
    
    const collectionPercentage = potentialIncome > 0 ? (revenueMonth / potentialIncome) * 100 : 0;
    
    // Waitlist Opportunities Logic
    const waitlistOpportunities: Opportunity[] = [];
    
    sessions.forEach(session => {
        if (!session.waitlist || session.waitlist.length === 0) return;
        
        const space = spaces.find(s => s.id === session.spaceId);
        if (!space) return;

        const fixedEnrolledPeople = session.personIds.map(pid => people.find(p => p.id === pid)).filter((p): p is Person => !!p);
        const fixedAvailable = space.capacity - fixedEnrolledPeople.length;
        
        // Only show as an opportunity if there's a permanent spot available
        if (fixedAvailable > 0) {
            const vacationingCount = fixedEnrolledPeople.filter(p => isPersonOnVacation(p, today)).length;
            const temporaryAvailable = vacationingCount;

            const waitlistItems = session.waitlist.map(entry => {
                if (typeof entry === 'string') {
                    const person = people.find(p => p.id === entry);
                    return person ? { ...person, isProspect: false } : null;
                }
                return { ...entry, isProspect: true };
            }).filter(item => item !== null) as Opportunity['waitlist'];

            if (waitlistItems.length > 0) {
                waitlistOpportunities.push({
                    session,
                    actividadName: actividades.find(a => a.id === session.actividadId)?.name || 'Clase',
                    waitlist: waitlistItems,
                    availableSlots: {
                        fixed: fixedAvailable,
                        temporary: temporaryAvailable,
                        total: fixedAvailable + temporaryAvailable,
                    }
                });
            }
        }
    });
    
    const waitlistSummary = sessions.reduce<{sessionId: string, className: string, count: number}[]>((acc, session) => {
        if(session.waitlist && session.waitlist.length > 0) {
            acc.push({
                sessionId: session.id,
                className: actividades.find(a => a.id === session.actividadId)?.name || 'Clase',
                count: session.waitlist.length
            });
        }
        return acc;
    }, []);

    const totalWaitlistCount = waitlistSummary.reduce((sum, item) => sum + item.count, 0);

    const churnRiskPeople: Person[] = [];
    for (const person of people) {
      const personSessionIds = new Set(sessions.filter(s => s.personIds.includes(person.id)).map(s => s.id));
      if (personSessionIds.size === 0) continue;

      const relevantAttendance = attendance
        .filter(a => personSessionIds.has(a.sessionId))
        .sort((a, b) => b.date.localeCompare(a.date));

      let consecutiveAbsences = 0;
      for (let i = 0; i < Math.min(relevantAttendance.length, 5); i++) {
        const record = relevantAttendance[i];
        if (record.absentIds?.includes(person.id)) {
          consecutiveAbsences++;
        } else if (record.presentIds?.includes(person.id) || record.justifiedAbsenceIds?.includes(person.id)) {
          break;
        }
      }
      if (consecutiveAbsences >= 3) {
        churnRiskPeople.push(person);
      }
    }


    return {
      todaysSessions, todayName: currentTodayName,
      totalDebt, collectionPercentage,
      waitlistOpportunities, waitlistSummary, totalWaitlistCount,
      churnRiskPeople,
      overdueCount, upcomingCount,
      recoveryCount: recoveryPeopleCount,
    };
  }, [people, sessions, attendance, isPersonOnVacation, isMounted, tariffs, payments, spaces, actividades]);

  const {
    todaysSessions,
    todayName,
    totalDebt,
    collectionPercentage,
    waitlistOpportunities,
    waitlistSummary,
    totalWaitlistCount,
    churnRiskPeople,
    overdueCount,
    upcomingCount,
    recoveryCount,
  } = clientSideData;
  

  useEffect(() => {
    if (!isMounted) return;
    try {
      const tutorialCompleted = localStorage.getItem('agendia-tutorial-completed');
      if (!tutorialCompleted) {
        openTutorial();
      }
    } catch (e) {
      console.warn("Could not access localStorage. Tutorial will not be shown automatically.");
    }
  }, [openTutorial, isMounted]);

  const formatPrice = (price: number) => {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
      }).format(price);
  };
  
  const managementCards = [
    { id: 'instructors', href: "/instructors", label: "Especialistas", icon: ClipboardList, description: "Gestiona instructores y sus actividades." },
    { id: 'specializations', href: "/specializations", label: "Actividades", icon: Star, description: "Define los tipos de clases que ofreces." },
    { id: 'spaces', href: "/spaces", label: "Espacios", icon: Warehouse, description: "Administra las salas y sus capacidades." },
    { id: 'tariffs', href: "/tariffs", label: "Aranceles", icon: DollarSign, description: "Configura tus planes de precios." },
    { id: 'payments', href: "/payments", label: "Pagos", icon: Banknote, description: "Analiza y gestiona los ingresos.", requiresPin: true },
    { id: 'statistics', href: "/statistics", label: "Estadísticas", icon: LineChart, description: "Métricas clave de tu negocio.", requiresPin: true },
    { id: 'operators', href: "/operators", label: "Operadores", icon: KeyRound, description: "Gestiona el acceso de tu equipo.", requiresPin: true },
    { id: 'activity-log', href: "/activitylog", label: "Registro Actividad", icon: ListChecks, description: "Audita acciones importantes.", requiresPin: true },
  ];


  if (!isMounted) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-auto w-full rounded-xl aspect-square" />)}
        </div>
        <Card className="flex flex-col bg-card/80 backdrop-blur-lg rounded-2xl shadow-lg border border-primary/10">
          <CardHeader>
            <Skeleton className="h-8 w-1/3 rounded-lg" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <OnboardingTutorial isOpen={isTutorialOpen} onClose={handleCloseTutorial} />
      
      {dashboardView !== 'main' && (
        <Button 
          variant="outline" 
          onClick={() => router.push('/')} 
          className="mb-4"
        >
            <ArrowLeft className="mr-2 h-4 w-4" /> 
            Volver al Inicio
        </Button>
      )}

      
      {dashboardView === 'main' && (
        <>
            <MainCards 
              activePeopleCount={people.length}
              overdueCount={overdueCount}
              recoveryCount={recoveryCount}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div className="md:col-span-2">
                <TodaySessions
                    sessions={todaysSessions}
                    todayName={todayName}
                />
              </div>
              <div className="space-y-8">
                {churnRiskPeople.length > 0 && (
                  <ChurnRiskAlerts
                      people={churnRiskPeople}
                  />
                )}
                <Card className="bg-card/80 backdrop-blur-lg rounded-2xl shadow-lg border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Bell className="h-5 w-5 text-blue-500" />
                      Recordatorios de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setRemindersInitialFocus('upcoming');
                          setIsRemindersSheetOpen(true);
                        }}
                      >
                        Próximos Vencimientos
                        {upcomingCount > 0 && <Badge variant="secondary" className="ml-2 bg-yellow-400/80 text-yellow-900 hover:bg-yellow-400">{upcomingCount}</Badge>}
                      </Button>
                  </CardContent>
                </Card>
                {totalWaitlistCount > 0 && (
                  <WaitlistOpportunities 
                    opportunities={waitlistOpportunities} 
                    summary={waitlistSummary} 
                    totalCount={totalWaitlistCount}
                    onHeaderClick={() => setIsWaitlistSheetOpen(true)}
                  />
                )}
              </div>
            </div>
        </>
      )}

      {dashboardView === 'management' && (
         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {managementCards.map((card) => (
                <Link key={card.id} href={card.href} className="group">
                    <Card className="relative flex flex-col p-4 bg-card rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary/50 h-full">
                         {card.requiresPin && (
                            <KeyRound className="absolute top-2 right-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                         )}
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <card.icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-base font-semibold text-foreground">{card.label}</CardTitle>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex-grow">{card.description}</p>
                    </Card>
                </Link>
            ))}
            <Card className="relative flex flex-col p-4 bg-card rounded-2xl shadow-lg border-2 border-dashed h-full items-center justify-center hover:border-primary transition-colors">
                <Button variant="ghost" onClick={handleUpdateDebts} disabled={isUpdatingDebts}>
                     {isUpdatingDebts && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Actualizar Deudas
                </Button>
            </Card>
        </div>
      )}
    
      {selectedSessionForStudents && (
         <EnrolledStudentsSheet 
            session={selectedSessionForStudents}
            onClose={() => setSelectedSessionForStudents(null)}
          />
      )}
      {sessionForAttendance && (
        <AttendanceSheet
          session={sessionForAttendance}
          onClose={() => setSessionForAttendance(null)}
        />
      )}
      {sessionForEnrollment && (
        <EnrollPeopleDialog 
            session={sessionForEnrollment}
            onClose={() => setSessionForEnrollment(null)}
        />
      )}
      {sessionForOneTime && (
        <OneTimeAttendeeDialog 
            session={sessionForOneTime}
            onClose={() => setSessionForOneTime(null)}
        />
      )}
       {sessionForNotification && (
        <NotifyAttendeesDialog 
            session={sessionForNotification}
            onClose={() => setSessionForNotification(null)}
        />
      )}
      {sessionForWaitlist && (
        <WaitlistDialog 
            session={sessionForWaitlist}
            onClose={() => setSessionForWaitlist(null)}
        />
      )}
       {sessionForCancellation && (
        <CancelSessionDialog
            session={sessionForCancellation.session}
            date={sessionForCancellation.date}
            onClose={() => setSessionForCancellation(null)}
        />
      )}
       <AlertDialog open={!!sessionForDelete} onOpenChange={() => setSessionForDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la sesión. Si hay personas inscriptas, no podrás eliminarla.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive hover:bg-destructive/90">Sí, eliminar sesión</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        <AlertDialog open={!!sessionForReactivation} onOpenChange={() => setSessionForReactivation(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Reactivar la clase?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Estás a punto de reactivar la clase de {sessionForReactivation ? actividades.find(a => a.id === sessionForReactivation.session.actividadId)?.name : ''} para hoy.
                        Los créditos de recupero otorgados por la cancelación (que no hayan sido usados) serán eliminados. ¿Deseas continuar?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>No, mantener cancelada</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReactivateSession}>Sí, reactivar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      <WaitlistSheet isOpen={isWaitlistSheetOpen} onOpenChange={setIsWaitlistSheetOpen} />
      <PaymentRemindersSheet 
        isOpen={isRemindersSheetOpen} 
        onOpenChange={setIsRemindersSheetOpen} 
        initialFocus={remindersInitialFocus}
      />
    </div>
  );
}


export default function RootPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <DashboardPageContent />
    </Suspense>
  );
}
