
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { useStudio } from '@/context/StudioContext';
import { format, subMonths, startOfMonth, endOfMonth, subDays, parse, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { getStudentPaymentStatus } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ClipboardCheck, Divide, ArrowLeft, UserPlus, UserX as UserXIcon, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Person } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { PinDialog } from '@/components/pin-dialog';


export default function StatisticsPageContent() {
  const { sessions, people, inactivePeople, actividades, loading: studioLoading, payments, tariffs, attendance } = useStudio();
  const { loading: authLoading, isPinVerified, setPinVerified } = useAuth();
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!authLoading && !isPinVerified) {
        setIsPinDialogOpen(true);
    }
  }, [isPinVerified, authLoading]);

  const chartData = useMemo(() => {
    if (!isMounted) return {
      monthlyNewMembers: [],
      monthlyDeactivations: [],
      monthlyRevenue: [],
      retentionData: { threeMonths: { rate: 0, total: 0, active: 0, label: '' }, sixMonths: { rate: 0, total: 0, active: 0, label: '' } },
      activityRevenue: [],
      attendanceMetrics: { totalAttendances: 0, totalClasses: 0, averageAttendance: '0.0' },
    };
    
    const now = new Date();
    const allPeople = [...people, ...inactivePeople];

    const monthLabels = Array.from({ length: 12 }).map((_, i) => format(startOfMonth(subMonths(now, i)), 'yyyy-MM')).reverse();
    
    const monthlyNewMembers = (() => {
      const memberCounts = allPeople.reduce<Record<string, number>>((acc, person) => {
        if (!person.joinDate || !(person.joinDate instanceof Date) || isNaN(person.joinDate.getTime())) return acc;
        const monthKey = format(person.joinDate, 'yyyy-MM');
        if (monthLabels.includes(monthKey)) acc[monthKey] = (acc[monthKey] || 0) + 1;
        return acc;
      }, {});
      return monthLabels.map(monthKey => ({
        month: format(new Date(`${monthKey}-02`), 'MMM yy', { locale: es }),
        nuevasPersonas: memberCounts[monthKey] || 0,
      }));
    })();
    
    const monthlyDeactivations = (() => {
      const deactivationCounts = inactivePeople.reduce<Record<string, number>>((acc, person) => {
        if (!person.inactiveDate || !(person.inactiveDate instanceof Date) || isNaN(person.inactiveDate.getTime())) return acc;
        const monthKey = format(person.inactiveDate, 'yyyy-MM');
        if (monthLabels.includes(monthKey)) acc[monthKey] = (acc[monthKey] || 0) + 1;
        return acc;
      }, {});
      return monthLabels.map(monthKey => ({
        month: format(new Date(`${monthKey}-02`), 'MMM yy', { locale: es }),
        bajas: deactivationCounts[monthKey] || 0,
      }));
    })();

    const monthlyRevenue = (() => {
        const revenueCounts = payments.reduce<Record<string, number>>((acc, payment) => {
            if (!payment.date || !(payment.date instanceof Date) || isNaN(payment.date.getTime())) return acc;
            const monthKey = format(payment.date, 'yyyy-MM');
            const tariff = tariffs.find(t => t.id === payment.tariffId);
            if (tariff && monthLabels.includes(monthKey)) {
                acc[monthKey] = (acc[monthKey] || 0) + tariff.price;
            }
            return acc;
        }, {});
         return monthLabels.map(monthKey => ({
            month: format(new Date(`${monthKey}-02`), 'MMM yy', { locale: es }),
            ingresos: revenueCounts[monthKey] || 0,
        }));
    })();

    const retentionData = (() => {
      const getCohort = (startDate: Date, endDate: Date) => allPeople.filter((p:Person) => p.joinDate && p.joinDate >= startDate && p.joinDate <= endDate);
      
      const threeMonthsAgo = subMonths(now, 3);
      const startOfThreeMonthCohort = startOfMonth(threeMonthsAgo);
      const threeMonthCohortPeople = getCohort(startOfThreeMonthCohort, endOfMonth(threeMonthsAgo));
      const activeInThreeMonthCohort = threeMonthCohortPeople.filter(p => getStudentPaymentStatus(p, now).status === 'Al día').length;
      
      const sixMonthsAgo = subMonths(now, 6);
      const startOfSixMonthCohort = startOfMonth(sixMonthsAgo);
      const sixMonthCohortPeople = getCohort(startOfSixMonthCohort, endOfMonth(sixMonthsAgo));
      const activeInSixMonthCohort = sixMonthCohortPeople.filter(p => getStudentPaymentStatus(p, now).status === 'Al día').length;
      
      return {
        threeMonths: {
          rate: threeMonthCohortPeople.length > 0 ? (activeInThreeMonthCohort / threeMonthCohortPeople.length) * 100 : 0,
          total: threeMonthCohortPeople.length,
          active: activeInThreeMonthCohort,
          label: format(startOfThreeMonthCohort, 'MMMM yyyy', { locale: es }),
        },
        sixMonths: {
          rate: sixMonthCohortPeople.length > 0 ? (activeInSixMonthCohort / sixMonthCohortPeople.length) * 100 : 0,
          total: sixMonthCohortPeople.length,
          active: activeInSixMonthCohort,
          label: format(startOfSixMonthCohort, 'MMMM yyyy', { locale: es }),
        },
      };
    })();
    
    const activityRevenue = (() => {
        const revenueByActivity: Record<string, number> = {};
        
        payments.forEach(payment => {
            const person = allPeople.find(p => p.id === payment.personId);
            if (!person) return;

            // Find all unique activities this person is enrolled in
            const personActivities = new Set<string>();
            sessions.forEach(session => {
                if (session.personIds.includes(person.id)) {
                    personActivities.add(session.actividadId);
                }
            });
            
            const tariff = tariffs.find(t => t.id === payment.tariffId);
            const paymentAmount = tariff?.price || 0;

            if (personActivities.size > 0) {
                const amountPerActivity = paymentAmount / personActivities.size;
                personActivities.forEach(actividadId => {
                    if (!revenueByActivity[actividadId]) revenueByActivity[actividadId] = 0;
                    revenueByActivity[actividadId] += amountPerActivity;
                });
            }
        });

        return Object.entries(revenueByActivity).map(([actividadId, total]) => ({
            actividad: actividades.find(a => a.id === actividadId)?.name || 'Desconocido',
            ingresos: total,
        })).sort((a, b) => b.ingresos - a.ingresos);
    })();
    
    const attendanceMetrics = (() => {
        const thirtyDaysAgo = subDays(now, 30);
        const recentAttendance = attendance.filter(a => {
            try {
                const recordDate = parse(a.date, 'yyyy-MM-dd', new Date());
                return isAfter(recordDate, thirtyDaysAgo);
            } catch {
                return false;
            }
        });

        const totalClasses = recentAttendance.length;
        const totalAttendances = recentAttendance.reduce((sum, record) => sum + (record.presentIds?.length || 0), 0);
        const averageAttendance = totalClasses > 0 ? (totalAttendances / totalClasses) : 0;
        
        return {
            totalAttendances,
            totalClasses,
            averageAttendance: averageAttendance.toFixed(1)
        }
    })();

    return {
      monthlyNewMembers,
      monthlyDeactivations,
      monthlyRevenue,
      retentionData,
      activityRevenue,
      attendanceMetrics,
    };
  }, [sessions, people, inactivePeople, actividades, isMounted, payments, tariffs, attendance]);
  
  const formatPrice = (price: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);

  const chartConfig = useMemo(() => {
    const config: any = {
      personas: { label: "Personas", color: "hsl(var(--chart-1))" },
      nuevasPersonas: { label: "Nuevas Personas", color: "hsl(var(--chart-2))" },
      bajas: { label: "Bajas", color: "hsl(var(--chart-5))" },
      ingresos: { label: "Ingresos", color: "hsl(var(--chart-3))" },
    };
    chartData.activityRevenue.forEach((activity, index) => {
      config[activity.actividad] = {
        label: activity.actividad,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    });
    return config;
  }, [chartData.activityRevenue]);
  
  if (!isMounted || studioLoading || authLoading) {
    return (
       <div className="space-y-8">
        <PageHeader title="Estadísticas del Estudio" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Skeleton className="h-[380px] w-full rounded-2xl" />
            <Skeleton className="h-[380px] w-full rounded-2xl" />
            <Skeleton className="lg:col-span-2 h-[280px] w-full rounded-2xl" />
            <Skeleton className="lg:col-span-2 h-[430px] w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!isPinVerified) {
    return (
        <>
            <PinDialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen} onPinVerified={() => setPinVerified(true)} />
            <div className="flex justify-start">
                <Button variant="outline" asChild>
                    <Link href="/?view=advanced">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Gestión Avanzada
                    </Link>
                </Button>
            </div>
            <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
                <CardHeader>
                    <CardTitle className="text-slate-800 dark:text-slate-100">Acceso Restringido</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                        Necesitas verificar tu PIN de propietario para gestionar esta sección.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => setIsPinDialogOpen(true)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Verificar PIN
                    </Button>
                </CardContent>
            </Card>
        </>
    );
}

  return (
    <div className="space-y-8">
      <div className="flex justify-start">
            <Button variant="outline" asChild>
                <Link href="/?view=advanced">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Gestión Avanzada
                </Link>
            </Button>
        </div>
      <PageHeader title="Estadísticas del Estudio" />
        <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
            <CardHeader>
                <CardTitle className="text-slate-800 dark:text-slate-100">Métricas de Asistencia</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">Datos de los últimos 30 días.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div>
                        <Users className="mx-auto h-8 w-8 text-primary mb-2"/>
                        <p className="text-2xl font-bold">{chartData.attendanceMetrics.totalAttendances}</p>
                        <p className="text-sm text-muted-foreground">Total de Asistencias</p>
                    </div>
                    <div>
                        <ClipboardCheck className="mx-auto h-8 w-8 text-primary mb-2"/>
                        <p className="text-2xl font-bold">{chartData.attendanceMetrics.totalClasses}</p>
                        <p className="text-sm text-muted-foreground">Clases Dictadas</p>
                    </div>
                    <div>
                        <Divide className="mx-auto h-8 w-8 text-primary mb-2"/>
                        <p className="text-2xl font-bold">{chartData.attendanceMetrics.averageAttendance}</p>
                        <p className="text-sm text-muted-foreground">Promedio por Clase</p>
                    </div>
                </div>
            </CardContent>
        </Card>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100"><UserPlus className="h-5 w-5"/>Nuevas Personas por Mes</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Total de alumnos que se unieron cada mes.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={chartData.monthlyNewMembers} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} /><YAxis />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Line type="monotone" dataKey="nuevasPersonas" stroke="var(--color-nuevasPersonas)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-nuevasPersonas)" }} activeDot={{ r: 6 }} name="Nuevas Personas" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100"><UserXIcon className="h-5 w-5"/>Bajas por Mes</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Total de alumnos desactivados cada mes.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData.monthlyDeactivations} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis allowDecimals={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="bajas" fill="var(--color-bajas)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
            <CardHeader>
                <CardTitle className="text-slate-800 dark:text-slate-100">Evolución de Ingresos Mensuales</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">Total de ingresos registrados por mes en los últimos 12 meses.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <LineChart data={chartData.monthlyRevenue} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                        <RechartsTooltip 
                            cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}
                            formatter={(value: number) => formatPrice(value)}
                        />
                        <Line type="monotone" dataKey="ingresos" stroke="var(--color-ingresos)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-ingresos)" }} activeDot={{ r: 6 }} name="Ingresos" />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
        
        <Card className="lg:col-span-2 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-slate-100">Rentabilidad por Actividad</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Distribución de ingresos totales por tipo de actividad.</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.activityRevenue.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={chartData.activityRevenue} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                    <CartesianGrid horizontal={false} />
                    <YAxis dataKey="actividad" type="category" tickLine={false} axisLine={false} tickMargin={8} width={80} />
                    <XAxis type="number" hide />
                     <RechartsTooltip 
                        cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}
                        formatter={(value: number) => formatPrice(value)}
                     />
                    <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
            ) : (
                 <div className="flex h-[300px] w-full items-center justify-center text-center text-slate-500 dark:text-slate-400">
                    <p>No hay suficientes datos de pagos para mostrar este gráfico.</p>
                </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-slate-100">Tasa de Retención de Clientes</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Porcentaje de personas que se inscriben en un mes y siguen activas después de un período.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {chartData.retentionData.threeMonths.total > 0 ? (
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-medium text-muted-foreground capitalize">Retención a 3 meses (Inscritos en {chartData.retentionData.threeMonths.label})</span>
                  <span className="text-lg font-bold text-primary">{chartData.retentionData.threeMonths.rate.toFixed(0)}%</span>
                </div>
                <Progress value={chartData.retentionData.threeMonths.rate} className="h-2" />
                <p className="text-xs text-right text-muted-foreground mt-1">{chartData.retentionData.threeMonths.active} de {chartData.retentionData.threeMonths.total} clientes continúan activos.</p>
              </div>
            ) : (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Retención a 3 meses</span>
                <p className="text-xs text-muted-foreground mt-1">No hay datos de inscripción de hace 3 meses para calcular la retención.</p>
              </div>
            )}
            {chartData.retentionData.sixMonths.total > 0 ? (
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-medium text-muted-foreground capitalize">Retención a 6 meses (Inscritos en {chartData.retentionData.sixMonths.label})</span>
                  <span className="text-lg font-bold text-primary">{chartData.retentionData.sixMonths.rate.toFixed(0)}%</span>
                </div>
                <Progress value={chartData.retentionData.sixMonths.rate} className="h-2" />
                <p className="text-xs text-right text-muted-foreground mt-1">{chartData.retentionData.sixMonths.active} de {chartData.retentionData.sixMonths.total} clientes continúan activos.</p>
              </div>
            ) : (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Retención a 6 meses</span>
                <p className="text-xs text-muted-foreground mt-1">No hay datos de inscripción de hace 6 meses para calcular la retención.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


    