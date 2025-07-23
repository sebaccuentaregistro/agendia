

'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ArrowLeft, RefreshCw, Loader2, ListPlus, Star, ClipboardList, Warehouse, Signal, DollarSign, Percent, Landmark, KeyRound, Banknote, LineChart, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { useStudio } from '@/context/StudioContext';
import type { Session, Person, PaymentReminderInfo, WaitlistEntry } from '@/types';
import { getStudentPaymentStatus } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AttendanceSheet } from '@/components/attendance-sheet';
import { format, startOfMonth, endOfMonth, isWithinInterval, differenceInDays, startOfDay, startOfWeek, endOfWeek, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter, useSearchParams } from 'next/navigation';
import { OnboardingTutorial } from '@/components/onboarding-tutorial';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PersonDialog } from '@/components/students/person-dialog';
import { WelcomeDialog } from '@/components/welcome-dialog';
import { MainCards } from '@/components/dashboard/main-cards';
import { TodaySessions } from '@/components/dashboard/today-sessions';
import { EnrolledStudentsSheet } from '@/components/enrolled-students-sheet';
import { WaitlistSheet } from '@/components/waitlist-sheet';
import { PinDialog } from '@/components/pin-dialog';




function DashboardPageContent() {
  const { 
    sessions, specialists, actividades, spaces, people, attendance, isPersonOnVacation, 
    isTutorialOpen, openTutorial, closeTutorial: handleCloseTutorial, levels, tariffs, payments, operators,
    updateOverdueStatuses,
  } = useStudio();
  const { institute, isPinVerified, setPinVerified } = useAuth();
  
  const [selectedSessionForStudents, setSelectedSessionForStudents] = useState<Session | null>(null);
  const [sessionForAttendance, setSessionForAttendance] = useState<Session | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [isUpdatingDebts, setIsUpdatingDebts] = useState(false);
  const [isWaitlistSheetOpen, setIsWaitlistSheetOpen] = useState(false);
  const { toast } = useToast();
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const dashboardView = searchParams.get('view') || 'main';

  const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false);
  const [personForWelcome, setPersonForWelcome] = useState<Person | null>(null);
  const [revenuePeriod, setRevenuePeriod] = useState<'today' | 'week' | 'month'>('month');
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleUpdateDebts = async () => {
    setIsUpdatingDebts(true);
    const count = await updateOverdueStatuses();
    toast({
      title: "Actualización de Deudas Completa",
      description: count > 0 ? `Se actualizaron los estados de ${count} persona(s).` : "No se encontraron nuevas deudas para actualizar."
    });
    setIsUpdatingDebts(false);
  };
  
  const clientSideData = useMemo(() => {
    if (!isMounted) {
      return { todaysSessions: [], todayName: '', totalDebt: 0, collectionPercentage: 0 };
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

    return {
      todaysSessions, todayName: currentTodayName,
      totalDebt, collectionPercentage,
    };
  }, [people, sessions, attendance, isPersonOnVacation, isMounted, tariffs, payments]);

  const {
    todaysSessions,
    todayName,
    totalDebt,
    collectionPercentage,
  } = clientSideData;
  
  const isLimitReached = useMemo(() => {
    if (!institute) return false;
    const limit = institute?.studentLimit;
    return (limit !== null && limit !== undefined) ? people.length >= limit : false;
  }, [people.length, institute]);


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
    { id: 'instructors', href: "/instructors", label: "Especialistas", icon: ClipboardList, count: specialists.length },
    { id: 'specializations', href: "/specializations", label: "Actividades", icon: Star, count: actividades.length },
    { id: 'spaces', href: "/spaces", label: "Espacios", icon: Warehouse, count: spaces.length },
    { id: 'levels', href: "/levels", label: "Niveles", icon: Signal, count: levels.length },
    { id: 'tariffs', href: "/tariffs", label: "Aranceles", icon: DollarSign, count: tariffs.length },
    { id: 'advanced', href: "/?view=advanced", label: "Gestión Avanzada", icon: KeyRound, count: null },
  ];
  
  const advancedCards = [
     { id: 'collectionPercentage', href: "/students?filter=overdue", label: "Cobranza", icon: Percent, value: `${collectionPercentage.toFixed(0)}%`, count: null, colorClass: "purple" },
     { id: 'totalDebt', href: "/students?filter=overdue", label: "Deuda Total", icon: Landmark, value: formatPrice(totalDebt), count: null, colorClass: totalDebt > 0 ? "red" : "purple" },
     { id: 'operators', href: "/operators", label: "Operadores", icon: KeyRound, count: operators.length, colorClass: "purple" },
     { id: 'payments', href: "/payments", label: "Pagos", icon: Banknote, count: payments.length, colorClass: "purple" },
     { id: 'statistics', href: "/statistics", label: "Estadísticas", icon: LineChart, count: null, colorClass: "purple" },
     { id: 'activity-log', href: "/activitylog", label: "Registro Actividad", icon: ListChecks, count: null, colorClass: "purple" },
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
          onClick={() => router.push(dashboardView === 'advanced' ? '/?view=management' : '/')} 
          className="mb-4"
        >
            <ArrowLeft className="mr-2 h-4 w-4" /> 
            {dashboardView === 'advanced' ? 'Volver a Gestión' : 'Volver al Inicio'}
        </Button>
      )}

      
      {dashboardView === 'main' && (
        <>
            <MainCards />
            <TodaySessions
                sessions={todaysSessions}
                todayName={todayName}
                onSessionClick={setSelectedSessionForStudents}
                onAttendanceClick={setSessionForAttendance}
            />
        </>
      )}

      {dashboardView === 'management' && (
         <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {managementCards.map((card) => (
                <Link key={card.id} href={card.href}>
                    <Card className="group relative flex flex-col items-center justify-center p-2 text-center bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 aspect-square overflow-hidden border-2 border-transparent hover:border-primary/50">
                        <div className="flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <card.icon className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-foreground">{card.label}</CardTitle>
                        {card.count !== null && <p className="text-2xl font-bold text-foreground">{card.count}</p>}
                    </Card>
                </Link>
            ))}
        </div>
      )}

      {dashboardView === 'advanced' && isPinVerified && (
        <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {advancedCards.map((card) => (
                    <Link key={card.id} href={card.href}>
                        <Card className="group relative flex flex-col items-center justify-center p-2 text-center bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 aspect-square overflow-hidden border-2 border-transparent hover:border-primary/50">
                            <div className="flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <card.icon className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-lg font-semibold text-foreground">{card.label}</CardTitle>
                             {card.value ? 
                                <p className="text-2xl font-bold text-foreground">{card.value}</p> :
                                card.count !== null && <p className="text-2xl font-bold text-foreground">{card.count}</p>
                             }
                        </Card>
                    </Link>
                ))}
            </div>
            <div className="flex justify-end">
                <Button onClick={handleUpdateDebts} disabled={isUpdatingDebts}>
                    {isUpdatingDebts && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Actualizar Deudas
                </Button>
            </div>
        </div>
      )}

       {dashboardView === 'advanced' && !isPinVerified && (
           <Card className="flex flex-col items-center justify-center p-12 text-center">
                <CardHeader>
                    <CardTitle>Acceso Restringido</CardTitle>
                    <CardContent>
                        <p className="mb-4">Necesitas tu PIN de propietario para acceder a esta sección.</p>
                        <Button onClick={() => setIsPinDialogOpen(true)}>
                            Verificar PIN
                        </Button>
                    </CardContent>
                </CardHeader>
           </Card>
        )}
    
      <PinDialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen} onPinVerified={() => { setPinVerified(true); router.push('/?view=advanced'); }} />

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
      <PersonDialog
        open={isPersonDialogOpen}
        onOpenChange={setIsPersonDialogOpen}
        onPersonCreated={(person) => {
          if (person.tariffId) {
            setPersonForWelcome(person);
          }
        }}
        isLimitReached={isLimitReached}
      />
      <WelcomeDialog person={personForWelcome} onOpenChange={() => setPersonForWelcome(null)} />
      <WaitlistSheet isOpen={isWaitlistSheetOpen} onOpenChange={setIsWaitlistSheetOpen} />
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
