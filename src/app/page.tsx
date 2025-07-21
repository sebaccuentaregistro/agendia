

'use client';

import React, { useState, useEffect, useMemo, Suspense, useCallback } from 'react';

import { Card, CardTitle, CardContent, CardHeader, CardDescription as CardDescriptionComponent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Calendar, Users, ClipboardList, Star, Warehouse, AlertTriangle, User as UserIcon, DoorOpen, LineChart, CheckCircle2, ClipboardCheck, Plane, CalendarClock, Info, Settings, ArrowLeft, DollarSign, Signal, TrendingUp, Lock, ArrowRight, Banknote, Percent, Landmark, FileText, KeyRound, ListChecks, Bell, Send, RefreshCw, Loader2, UserX, ListPlus, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useStudio } from '@/context/StudioContext';
import type { Session, Institute, Person, PaymentReminderInfo, Tariff, NewPersonData, SessionAttendance, AppNotification, WaitlistEntry, WaitlistProspect } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStudentPaymentStatus, calculateNextPaymentDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { Button } from '@/components/ui/button';
import { AttendanceSheet } from '@/components/attendance-sheet';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format, startOfMonth, endOfMonth, isWithinInterval, differenceInDays, startOfDay, parse, isAfter, subDays, startOfWeek, endOfWeek, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter, useSearchParams } from 'next/navigation';
import { OnboardingTutorial } from '@/components/onboarding-tutorial';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PersonDialog } from '@/components/students/person-dialog';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { deleteEntity } from '@/lib/firestore-actions';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle as AlertTitleComponent } from '@/components/ui/alert';
import { WelcomeDialog } from '@/components/welcome-dialog';
import { WaitlistSheet } from '@/components/waitlist-sheet';
import { WaitlistOpportunities } from '@/components/waitlist-opportunities';
import { PinDialog } from '@/components/pin-dialog';
import { ChurnRiskAlerts } from '@/components/churn-risk-alerts';
import { PaymentReminders } from '@/components/payment-reminders';
import { EnrolledStudentsSheet } from '@/components/enrolled-students-sheet';
import { PaymentReminderDialog } from '@/components/payment-reminder-dialog';
import { MassReminderDialog } from '@/components/mass-reminder-dialog';




function DashboardPageContent() {
  const { 
    sessions, specialists, actividades, spaces, people, attendance, isPersonOnVacation, 
    isTutorialOpen, openTutorial, closeTutorial: handleCloseTutorial, levels, tariffs, payments, operators, notifications,
    updateOverdueStatuses, addPerson,
  } = useStudio();
  const { institute, isPinVerified, setPinVerified } = useAuth();
  const [filters, setFilters] = useState({
    actividadId: 'all',
    spaceId: 'all',
    specialistId: 'all',
    timeOfDay: 'all',
  });
  const [selectedSessionForStudents, setSelectedSessionForStudents] = useState<Session | null>(null);
  const [sessionForAttendance, setSessionForAttendance] = useState<Session | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [paymentReminderInfo, setPaymentReminderInfo] = useState<PaymentReminderInfo | null>(null);
  const [isMassReminderOpen, setIsMassReminderOpen] = useState(false);
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
  
  const getTimeOfDay = (time: string): 'Mañana' | 'Tarde' | 'Noche' => {
    if (!time) return 'Tarde';
    const hour = parseInt(time.split(':')[0], 10);
    if (hour < 12) return 'Mañana';
    if (hour < 18) return 'Tarde';
    return 'Noche';
  };

  const clientSideData = useMemo(() => {
    if (!isMounted) {
      return { overdueCount: 0, onVacationCount: 0, pendingRecoveryCount: 0, todaysSessions: [], todayName: '', hasOverdue: false, hasOnVacation: false, hasPendingRecovery: false, potentialIncome: 0, totalDebt: 0, collectionPercentage: 0, topDebtors: [], paymentReminders: [], totalWaitlistCount: 0, waitlistOpportunities: [], waitlistSummary: [], revenueToday: 0, revenueWeek: 0, revenueMonth: 0 };
    }
    const now = new Date();
    const today = startOfDay(now);
    const dayMap: { [key: number]: Session['dayOfWeek'] } = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
    const currentTodayName = dayMap[now.getDay()];
    const todayStr = format(now, 'yyyy-MM-dd');
    
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
    const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 });

    const getRevenueForPeriod = (start: Date, end: Date) => {
        return payments
            .filter(p => p.date && isWithinInterval(p.date, { start, end }))
            .reduce((acc, p) => acc + p.amount, 0);
    };

    const revenueMonth = getRevenueForPeriod(startOfCurrentMonth, endOfCurrentMonth);
    const revenueWeek = getRevenueForPeriod(startOfCurrentWeek, endOfCurrentWeek);
    const revenueToday = getRevenueForPeriod(today, endOfDay(today));


    const paymentReminders = people
      .map(person => {
          if (!person.lastPaymentDate) return null;
          const dueDate = person.lastPaymentDate;
          const daysUntilDue = differenceInDays(dueDate, today);
          if (daysUntilDue >= 0 && daysUntilDue <= 3) {
              return { person, dueDate, daysUntilDue };
          }
          return null;
      })
      .filter((p): p is PaymentReminderInfo => p !== null)
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);


    const overduePeople = people.filter(p => getStudentPaymentStatus(p, now).status === 'Atrasado');
    const overdueCount = overduePeople.length;
    
    const topDebtors = overduePeople.map(person => {
        const tariff = tariffs.find(t => t.id === person.tariffId);
        const statusInfo = getStudentPaymentStatus(person, now);
        return { ...person, debt: tariff?.price || 0, daysOverdue: statusInfo.daysOverdue || 0 };
    }).sort((a, b) => b.debt - a.debt).slice(0, 5);

    const totalDebt = overduePeople.reduce((acc, person) => {
        const tariff = tariffs.find(t => t.id === person.tariffId);
        const debtAmount = (tariff?.price || 0) * (person.outstandingPayments || 1);
        return acc + debtAmount;
    }, 0);

    const onVacationCount = people.filter(p => isPersonOnVacation(p, now)).length;

    const balances: Record<string, number> = {};
    people.forEach(p => (balances[p.id] = 0));
    attendance.forEach(record => {
      record.justifiedAbsenceIds?.forEach(personId => { if (balances[personId] !== undefined) balances[personId]++; });
      record.oneTimeAttendees?.forEach(personId => { if (balances[personId] !== undefined) balances[personId]--; });
    });
    const pendingRecoveryCount = Object.values(balances).filter(balance => balance > 0).length;
    
    const potentialIncome = people.reduce((acc, person) => {
        const tariff = tariffs.find(t => t.id === person.tariffId);
        return acc + (tariff?.price || 0);
    }, 0);
    
    const collectionPercentage = potentialIncome > 0 ? (revenueMonth / potentialIncome) * 100 : 0;

    const todaysSessions = sessions
      .filter(session => session.dayOfWeek === currentTodayName)
      .map(session => {
        const attendanceRecord = attendance.find(a => a.sessionId === session.id && a.date === todayStr);
        const oneTimeAttendees = attendanceRecord?.oneTimeAttendees || [];
        
        const activeRegulars = session.personIds.filter(pid => {
            const person = people.find(p => p.id === pid);
            return person && !isPersonOnVacation(person, now);
        });
        
        // ** CORRECT LOGIC **
        // Create a unique set of all people attending today
        const allAttendeesForToday = new Set([...activeRegulars, ...oneTimeAttendees]);
        const enrolledCount = allAttendeesForToday.size;

        return {
          ...session,
          enrolledCount: enrolledCount,
          waitlistCount: session.waitlist?.length || 0,
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));

    const totalWaitlistCount = sessions.reduce((acc, session) => {
        return acc + (session.waitlist?.length || 0);
    }, 0);
    
    const waitlistOpportunities = sessions
      .map(session => {
        const space = spaces.find(s => s.id === session.spaceId);
        const capacity = space?.capacity || 0;
        
        const attendanceRecord = attendance.find(a => a.sessionId === session.id && a.date === todayStr);
        const oneTimeAttendees = attendanceRecord?.oneTimeAttendees || [];
        const activeRegulars = session.personIds.filter(pid => {
            const person = people.find(p => p.id === pid);
            return person && !isPersonOnVacation(person, now);
        });
        const enrolledCount = new Set([...activeRegulars, ...oneTimeAttendees]).size;

        const hasSpot = enrolledCount < capacity;
        const hasWaitlist = session.waitlist && session.waitlist.length > 0;

        if (hasSpot && hasWaitlist) {
          const actividadName = actividades.find(a => a.id === session.actividadId)?.name || 'Clase';
          const waitlistDetails = session.waitlist.map(entry => {
            if (typeof entry === 'string') return people.find(p => p.id === entry);
            return entry;
          }).filter((p): p is Person | WaitlistProspect => !!p);
          
          const virtualNotification: AppNotification = {
            id: `virtual-${session.id}`,
            type: 'waitlist',
            sessionId: session.id,
            createdAt: now
          };

          return { notification: virtualNotification, session, actividadName, waitlist: waitlistDetails };
        }
        return null;
      }).filter((o): o is NonNullable<typeof o> => !!o);

    const waitlistSummary = sessions
        .filter(s => s.waitlist && s.waitlist.length > 0)
        .map(s => ({
            sessionId: s.id,
            className: actividades.find(a => a.id === s.actividadId)?.name || 'Clase',
            count: s.waitlist.length
        }));

    return {
      overdueCount,
      onVacationCount,
      pendingRecoveryCount,
      todaysSessions,
      todayName: currentTodayName,
      hasOverdue: overdueCount > 0,
      hasOnVacation: onVacationCount > 0,
      hasPendingRecovery: pendingRecoveryCount > 0,
      potentialIncome,
      totalDebt,
      collectionPercentage,
      topDebtors,
      paymentReminders,
      totalWaitlistCount,
      waitlistOpportunities,
      waitlistSummary,
      revenueToday,
      revenueWeek,
      revenueMonth,
    };
  }, [people, sessions, attendance, isPersonOnVacation, isMounted, tariffs, payments, actividades, spaces, notifications]);

  const {
    overdueCount,
    onVacationCount,
    pendingRecoveryCount,
    todaysSessions,
    todayName,
    potentialIncome,
    totalDebt,
    collectionPercentage,
    topDebtors,
    paymentReminders,
    totalWaitlistCount,
    waitlistOpportunities,
    waitlistSummary,
    revenueToday,
    revenueWeek,
    revenueMonth,
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

  const mainCards = [
    { href: "/schedule", label: "Horarios", icon: Calendar, count: sessions.length },
    { href: "/students", label: "Personas", icon: Users, count: people.length },
  ];
  
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
  ];
  
  const advancedCards = [
     { id: 'collectionPercentage', href: "/students?filter=overdue", label: "Cobranza", icon: Percent, value: `${collectionPercentage.toFixed(0)}%`, count: null, colorClass: "purple" },
     { id: 'totalDebt', href: "/students?filter=overdue", label: "Deuda Total", icon: Landmark, value: formatPrice(totalDebt), count: null, colorClass: totalDebt > 0 ? "red" : "purple" },
     { id: 'operators', href: "/operators", label: "Operadores", icon: KeyRound, count: operators.length, colorClass: "purple" },
     { id: 'payments', href: "/payments", label: "Pagos", icon: Banknote, count: payments.length, colorClass: "purple" },
     { id: 'statistics', href: "/statistics", label: "Estadísticas", icon: LineChart, count: null, colorClass: "purple" },
     { id: 'activity-log', href: "/activity-log", label: "Registro Actividad", icon: ListChecks, count: null, colorClass: "purple" },
  ];

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const filteredSessions = useMemo(() => {
    return todaysSessions.filter(session => {
        const sessionTimeOfDay = getTimeOfDay(session.time);
        return (
            (filters.actividadId === 'all' || session.actividadId === filters.actividadId) &&
            (filters.spaceId === 'all' || session.spaceId === filters.spaceId) &&
            (filters.specialistId === 'all' || session.instructorId === filters.specialistId) &&
            (filters.timeOfDay === 'all' || sessionTimeOfDay === filters.timeOfDay)
        );
    });
  }, [todaysSessions, filters]);

  const getSessionDetails = (session: Session) => {
    const specialist = specialists.find((i) => i.id === session.instructorId);
    const actividad = actividades.find((s) => s.id === session.actividadId);
    const space = spaces.find((s) => s.id === session.spaceId);
    return { specialist, actividad, space };
  };

  const formatTime = (time: string) => {
    if (!time || !time.includes(':')) return 'N/A';
    return time;
  };

  
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
          onClick={() => {
            if (dashboardView === 'advanced') {
              router.push('/?view=management');
            } else {
              router.push('/');
            }
          }} 
          className="mb-4"
        >
            <ArrowLeft className="mr-2 h-4 w-4" /> 
            {dashboardView === 'advanced' ? 'Volver a Gestión' : 'Volver al Inicio'}
        </Button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {dashboardView === 'main' && (
            <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    <Link href="/students?filter=overdue" className="transition-transform hover:-translate-y-1">
                        <Card className={cn(
                            "group relative flex flex-col items-center justify-center p-2 text-center bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 aspect-square overflow-hidden border-2 border-transparent",
                            overdueCount > 0 ? "hover:border-red-500/50" : "hover:border-green-500/50"
                        )}>
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-br to-transparent",
                            overdueCount > 0 ? "from-red-500/10" : "from-green-500/10"
                        )}></div>
                        <div className={cn(
                            "absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent",
                            overdueCount > 0 ? "from-red-500/20" : "from-green-500/20"
                        )}></div>
                        <div className={cn(
                            "flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full",
                            overdueCount > 0 ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                        )}>
                            {overdueCount > 0 ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </div>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Atrasados
                        </CardTitle>
                        <p className="text-2xl font-bold text-foreground">{overdueCount}</p>
                        </Card>
                    </Link>
                    <Link href="/students?filter=pending-recovery" className="transition-transform hover:-translate-y-1">
                        <Card className={cn(
                            "group relative flex flex-col items-center justify-center p-2 text-center bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 aspect-square overflow-hidden border-2 border-transparent",
                            pendingRecoveryCount > 0 ? "hover:border-yellow-500/50" : "hover:border-primary/50"
                        )}>
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-br to-transparent",
                            pendingRecoveryCount > 0 ? "from-yellow-500/10" : "from-primary/10"
                        )}></div>
                        <div className={cn(
                            "absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent",
                            pendingRecoveryCount > 0 ? "from-yellow-500/20" : "from-primary/20"
                        )}></div>
                        <div className={cn(
                            "flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full",
                            pendingRecoveryCount > 0 ? "bg-yellow-500/10 text-yellow-500" : "bg-primary/10 text-primary"
                        )}>
                            <CalendarClock className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Recuperos
                        </CardTitle>
                        <p className="text-2xl font-bold text-foreground">{pendingRecoveryCount}</p>
                        </Card>
                    </Link>
                    <Link href="/students?filter=on-vacation" className="transition-transform hover:-translate-y-1">
                        <Card className={cn(
                            "group relative flex flex-col items-center justify-center p-2 text-center bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 aspect-square overflow-hidden border-2 border-transparent",
                            onVacationCount > 0 ? "hover:border-cyan-500/50" : "hover:border-primary/50"
                        )}>
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-br to-transparent",
                            onVacationCount > 0 ? "from-cyan-500/10" : "from-primary/10"
                        )}></div>
                        <div className={cn(
                            "absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent",
                            onVacationCount > 0 ? "from-cyan-500/20" : "from-primary/20"
                        )}></div>
                        <div className={cn(
                            "flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full",
                            onVacationCount > 0 ? "bg-cyan-500/10 text-cyan-500" : "bg-primary/10 text-primary"
                        )}>
                            <Plane className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Vacaciones
                        </CardTitle>
                        <p className="text-2xl font-bold text-foreground">{onVacationCount}</p>
                        </Card>
                    </Link>
                    {mainCards.map((item) => (
                    <Link key={item.href} href={item.href} className="transition-transform hover:-translate-y-1">
                        <Card className="group relative flex flex-col items-center justify-center p-2 text-center bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 aspect-square overflow-hidden border-2 border-transparent hover:border-primary/50">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/20 to-transparent"></div>
                        <div className="flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <item.icon className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-foreground">{item.label}</CardTitle>
                        {item.count !== null && (
                        <p className="text-2xl font-bold text-foreground">{item.count}</p>
                        )}
                        </Card>
                    </Link>
                    ))}
                    <Link href="/?view=management" className="transition-transform hover:-translate-y-1">
                    <Card className="group relative flex flex-col items-center justify-center p-2 text-center bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 aspect-square overflow-hidden border-2 border-transparent hover:border-primary/50">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/20 to-transparent"></div>
                        <div className="flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Settings className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-foreground">Gestión</CardTitle>
                        <p className="text-2xl font-bold text-transparent select-none" aria-hidden="true">&nbsp;</p>
                    </Card>
                    </Link>
                </div>
                
                <Card className="flex flex-col bg-background/50 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-white/10 mt-8">
                    <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-lg text-foreground">Sesiones de Hoy - {todayName}</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={filters.specialistId} onValueChange={(value) => handleFilterChange('specialistId', value)}>
                            <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-background/70 border-border/50 shadow-sm rounded-xl">
                                <SelectValue placeholder="Especialista" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Especialista</SelectItem>
                                {specialists.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                            </Select>
                            <Select value={filters.actividadId} onValueChange={(value) => handleFilterChange('actividadId', value)}>
                            <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-background/70 border-border/50 shadow-sm rounded-xl">
                                <SelectValue placeholder="Actividad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Actividades</SelectItem>
                                {actividades.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                            </SelectContent>
                            </Select>
                            <Select value={filters.spaceId} onValueChange={(value) => handleFilterChange('spaceId', value)}>
                            <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-background/70 border-border/50 shadow-sm rounded-xl">
                                <SelectValue placeholder="Espacio" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Espacios</SelectItem>
                                {spaces.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                            </Select>
                            <Select value={filters.timeOfDay} onValueChange={(value) => handleFilterChange('timeOfDay', value)}>
                            <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-background/70 border-border/50 shadow-sm rounded-xl">
                                <SelectValue placeholder="Horario" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todo el Día</SelectItem>
                                <SelectItem value="Mañana">Mañana</SelectItem>
                                <SelectItem value="Tarde">Tarde</SelectItem>
                                <SelectItem value="Noche">Noche</SelectItem>
                            </SelectContent>
                            </Select>
                        </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        {todaysSessions.length > 0 ? (
                        filteredSessions.length > 0 ? (
                            <ul className="space-y-4">
                            {filteredSessions.map(session => {
                                const { specialist, actividad, space } = getSessionDetails(session);
                                const { enrolledCount } = session as any;
                                const capacity = space?.capacity ?? 0;
                                const utilization = capacity > 0 ? enrolledCount / capacity : 0;
                                const isFull = utilization >= 1;
                                const isNearlyFull = utilization >= 0.8 && !isFull;

                                const now = new Date();
                                const [hour, minute] = session.time.split(':').map(Number);
                                const sessionStartTime = new Date();
                                sessionStartTime.setHours(hour, minute, 0, 0);
                                const attendanceWindowStart = new Date(sessionStartTime.getTime() - 20 * 60 * 1000);
                                const isAttendanceAllowed = now >= attendanceWindowStart;
                                const tooltipMessage = isAttendanceAllowed ? "Pasar Lista" : "La asistencia se habilita 20 minutos antes de la clase.";

                                return (
                                <li 
                                    key={session.id}
                                    className={cn(
                                    "flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border p-3 transition-all duration-200 bg-background/60 shadow-md hover:shadow-lg hover:border-primary/30",
                                    isFull && "bg-pink-500/10 border-pink-500/30",
                                    isNearlyFull && "bg-amber-500/10 border-amber-500/20"
                                    )}
                                >
                                    <div className="flex-1 space-y-1 cursor-pointer" onClick={() => setSelectedSessionForStudents(session)}>
                                    <p className="font-semibold text-foreground">{actividad?.name || 'Sesión'}</p>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1.5"><UserIcon className="h-4 w-4" />{specialist?.name || 'N/A'}</span>
                                        <span className="flex items-center gap-1.5"><DoorOpen className="h-4 w-4" />{space?.name || 'N/A'}</span>
                                    </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-right self-end sm:self-center">
                                        <div>
                                        <p className="font-bold text-primary">{formatTime(session.time)}</p>
                                        <p className={cn(
                                            "text-base font-semibold",
                                            isFull 
                                            ? "text-pink-600 dark:text-pink-400" 
                                            : isNearlyFull 
                                            ? "text-amber-600 dark:text-amber-500" 
                                            : "text-foreground"
                                        )}>
                                            {enrolledCount}/{capacity} anotados
                                        </p>
                                        </div>
                                        <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                            <span tabIndex={0}>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-accent" onClick={() => setSessionForAttendance(session)} disabled={!isAttendanceAllowed}>
                                                <ClipboardCheck className="h-5 w-5" />
                                                <span className="sr-only">Pasar Lista</span>
                                                </Button>
                                            </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                            <p>{tooltipMessage}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </li>
                                );
                            })}
                            </ul>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 p-10 text-center bg-muted/40 backdrop-blur-sm">
                            <h3 className="text-lg font-semibold text-foreground">No se encontraron sesiones</h3>
                            <p className="text-sm text-muted-foreground">Prueba a cambiar o limpiar los filtros.</p>
                            </div>
                        )
                        ) : (
                        <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 p-10 text-center bg-muted/40 backdrop-blur-sm">
                            <h3 className="text-lg font-semibold text-foreground">No hay sesiones hoy</h3>
                            <p className="text-sm text-muted-foreground">¡Día libre! Disfruta del descanso.</p>
                        </div>
                        )}
                    </CardContent>
                </Card>
            </>
          )}

          {dashboardView === 'management' && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {managementCards.map((item) => (
                  <Link key={item.id} href={item.href || '#'} className="transition-transform hover:-translate-y-1">
                    <Card className="group relative flex flex-col items-center justify-center p-2 text-center bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 aspect-square overflow-hidden border-2 border-transparent hover:border-primary/50 h-full">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/20 to-transparent"></div>
                      <div className="flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <item.icon className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-lg font-semibold text-foreground">{item.label}</CardTitle>
                      <p className="text-2xl font-bold text-foreground">{item.count}</p>
                    </Card>
                  </Link>
                ))}
                <div onClick={() => isPinVerified ? router.push('/?view=advanced') : setIsPinDialogOpen(true)} className="transition-transform hover:-translate-y-1 cursor-pointer">
                    <Card id="advanced-management-card" className="group relative flex flex-col items-center justify-center p-2 text-center bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 aspect-square overflow-hidden border-2 hover:border-primary/50 border-transparent h-full">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent"></div>
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-purple-500/20 to-transparent"></div>
                      <div className="flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
                          <Lock className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-lg font-semibold text-foreground">Gestión Avanzada</CardTitle>
                        <div className="text-sm text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
                        Acceder <ArrowRight className="h-3 w-3" />
                        </div>
                    </Card>
                </div>
            </div>
          )}

          {dashboardView === 'advanced' && isPinVerified && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                <Card className="col-span-2 sm:col-span-3 md:col-span-2 bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-purple-500/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-semibold text-foreground">Ingresos del Período</CardTitle>
                        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                             <Button size="sm" variant={revenuePeriod === 'today' ? 'secondary' : 'ghost'} className="h-7 px-2" onClick={() => setRevenuePeriod('today')}>Hoy</Button>
                             <Button size="sm" variant={revenuePeriod === 'week' ? 'secondary' : 'ghost'} className="h-7 px-2" onClick={() => setRevenuePeriod('week')}>Semana</Button>
                             <Button size="sm" variant={revenuePeriod === 'month' ? 'secondary' : 'ghost'} className="h-7 px-2" onClick={() => setRevenuePeriod('month')}>Mes</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-foreground">
                            {revenuePeriod === 'today' && formatPrice(revenueToday)}
                            {revenuePeriod === 'week' && formatPrice(revenueWeek)}
                            {revenuePeriod === 'month' && formatPrice(revenueMonth)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {revenuePeriod === 'today' && `Ingresos registrados hoy, ${format(new Date(), 'dd MMMM', {locale: es})}.`}
                            {revenuePeriod === 'week' && `Ingresos registrados en la semana actual.`}
                            {revenuePeriod === 'month' && `Ingresos acumulados en ${format(new Date(), 'MMMM', {locale: es})}.`}
                        </p>
                    </CardContent>
                </Card>
                {advancedCards.map((item) => {
                  const colorClass = item.colorClass || 'purple';
                  return (
                    <Link key={item.id} href={item.href || '#'} className="transition-transform hover:-translate-y-1">
                        <Card className={cn(
                            "group relative flex flex-col items-center justify-center p-4 text-center bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 aspect-square overflow-hidden border-2 border-transparent h-full",
                            colorClass === 'purple' && "hover:border-purple-500/50",
                            colorClass === 'red' && "hover:border-red-500/50"
                        )}>
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-br to-transparent",
                                colorClass === 'purple' && "from-purple-500/10",
                                colorClass === 'red' && "from-red-500/10"
                            )}></div>
                            <div className={cn(
                                "absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent",
                                colorClass === 'purple' && "from-purple-500/20",
                                colorClass === 'red' && "from-red-500/20"
                            )}></div>
                            <div className={cn(
                                "flex h-10 w-10 mb-2 flex-shrink-0 items-center justify-center rounded-full",
                                colorClass === 'purple' && "bg-purple-500/10 text-purple-500",
                                colorClass === 'red' && "bg-red-500/10 text-red-500"
                            )}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-semibold text-foreground">{item.label}</CardTitle>
                            <p className="text-2xl font-bold text-foreground">{item.value ?? item.count}</p>
                        </Card>
                    </Link>
                  );
                })}
                <div
                  onClick={!isUpdatingDebts ? handleUpdateDebts : undefined}
                  className={cn(
                    "transition-transform hover:-translate-y-1",
                    isUpdatingDebts ? 'cursor-not-allowed' : 'cursor-pointer'
                  )}
                >
                  <Card className="group relative flex flex-col items-center justify-center p-4 text-center bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 aspect-square overflow-hidden border-2 border-transparent hover:border-purple-500/50 h-full">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent"></div>
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-purple-500/20 to-transparent"></div>
                      <div className="flex h-10 w-10 mb-2 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
                          <RefreshCw className={cn("h-5 w-5", isUpdatingDebts && "animate-spin")} />
                      </div>
                      <CardTitle className="text-lg font-semibold text-foreground">Actualizar Deudas</CardTitle>
                      <Button asChild size="sm" className="mt-2" variant={isUpdatingDebts ? "ghost" : "default"}>
                        <div>
                          {isUpdatingDebts ? 'Actualizando...' : 'Ejecutar'}
                        </div>
                      </Button>
                  </Card>
                </div>
            </div>
          )}
        </div>
        <div className="space-y-8">
            
            <Card className="bg-card/80 backdrop-blur-lg rounded-2xl shadow-lg border-yellow-500/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                        <DollarSign className="h-5 w-5 text-yellow-500" />
                        Top Deudores
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {topDebtors.length > 0 ? (
                        <ul className="space-y-3">
                            {topDebtors.map(person => {
                                const tariff = tariffs.find(t => t.id === person.tariffId);
                                const totalDebtForPerson = (tariff?.price || 0) * (person.outstandingPayments || 1);
                                return (
                                <li key={person.id} className="flex items-center justify-between text-sm">
                                    <Link href={`/students?search=${encodeURIComponent(person.name)}`} className="group">
                                        <div className="font-medium text-foreground group-hover:text-primary group-hover:underline">{person.name}</div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{person.phone}</span>
                                            <a href={`https://wa.me/${person.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                <WhatsAppIcon className="text-green-600 hover:text-green-700 transition-colors" />
                                                <span className="sr-only">Enviar WhatsApp a {person.name}</span>
                                            </a>
                                        </div>
                                    </Link>
                                    <div className="text-right">
                                        <span className="font-semibold text-red-600 dark:text-red-400">{formatPrice(totalDebtForPerson)}</span>
                                        <p className="text-xs text-muted-foreground">hace {person.daysOverdue} {person.daysOverdue === 1 ? 'día' : 'días'}</p>
                                    </div>
                                </li>
                            )})}
                        </ul>
                    ) : (
                        <p className="text-sm text-center text-muted-foreground py-4">¡Excelente! No hay deudores por el momento.</p>
                    )}
                </CardContent>
            </Card>

            <ChurnRiskAlerts people={people} attendance={attendance} sessions={sessions} />

            <WaitlistOpportunities
              opportunities={waitlistOpportunities}
              summary={waitlistSummary}
              totalCount={totalWaitlistCount}
              onHeaderClick={() => setIsWaitlistSheetOpen(true)}
            />

            <PaymentReminders 
                reminders={paymentReminders} 
                onSendReminder={setPaymentReminderInfo}
                onSendAll={() => setIsMassReminderOpen(true)}
            />
            
        </div>
      </div>
    
      <PinDialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen} onPinVerified={() => { setPinVerified(true); router.push('/?view=advanced'); }} />
      <PaymentReminderDialog reminderInfo={paymentReminderInfo} onOpenChange={() => setPaymentReminderInfo(null)} />
      {isMassReminderOpen && <MassReminderDialog reminders={paymentReminders} onOpenChange={setIsMassReminderOpen} />}


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

    

    

