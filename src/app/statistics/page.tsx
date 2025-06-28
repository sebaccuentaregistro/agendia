
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { useStudio } from '@/context/StudioContext';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { getStudentPaymentStatus } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export default function StatisticsPage() {
  const { sessions, people, actividades } = useStudio();

  const sessionPopularityByTime = useMemo(() => {
    const data = sessions.reduce<Record<string, number>>((acc, session) => {
      const time = session.time;
      if (!acc[time]) {
        acc[time] = 0;
      }
      acc[time] += session.personIds.length;
      return acc;
    }, {});

    return Object.entries(data)
      .map(([time, people]) => ({
        time,
        personas: people,
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [sessions]);

  const monthlyNewMembers = useMemo(() => {
    const now = new Date();
    const monthLabels = Array.from({ length: 12 }).map((_, i) => {
      const date = subMonths(now, i);
      return format(startOfMonth(date), 'yyyy-MM');
    }).reverse();

    const memberCounts = people.reduce<Record<string, number>>((acc, person) => {
      if (!(person.joinDate instanceof Date) || isNaN(person.joinDate.getTime())) {
        return acc; 
      }
      const monthKey = format(person.joinDate, 'yyyy-MM');
      if (monthLabels.includes(monthKey)) {
        acc[monthKey] = (acc[monthKey] || 0) + 1;
      }
      return acc;
    }, {});

    return monthLabels.map(monthKey => ({
      month: format(new Date(`${monthKey}-02`), 'MMM yy', { locale: es }),
      nuevasPersonas: memberCounts[monthKey] || 0,
    }));
  }, [people]);
  
  const retentionData = useMemo(() => {
    const now = new Date();
    
    // 3-Month Cohort
    const threeMonthsAgo = subMonths(now, 3);
    const startOfThreeMonthCohort = startOfMonth(threeMonthsAgo);
    const endOfThreeMonthCohort = endOfMonth(threeMonthsAgo);
    const threeMonthCohortPeople = people.filter(p => p.joinDate >= startOfThreeMonthCohort && p.joinDate <= endOfThreeMonthCohort);
    const activeInThreeMonthCohort = threeMonthCohortPeople.filter(p => getStudentPaymentStatus(p, now) === 'Al día').length;
    const retentionRate3Months = threeMonthCohortPeople.length > 0 ? (activeInThreeMonthCohort / threeMonthCohortPeople.length) * 100 : 0;

    // 6-Month Cohort
    const sixMonthsAgo = subMonths(now, 6);
    const startOfSixMonthCohort = startOfMonth(sixMonthsAgo);
    const endOfSixMonthCohort = endOfMonth(sixMonthsAgo);
    const sixMonthCohortPeople = people.filter(p => p.joinDate >= startOfSixMonthCohort && p.joinDate <= endOfSixMonthCohort);
    const activeInSixMonthCohort = sixMonthCohortPeople.filter(p => getStudentPaymentStatus(p, now) === 'Al día').length;
    const retentionRate6Months = sixMonthCohortPeople.length > 0 ? (activeInSixMonthCohort / sixMonthCohortPeople.length) * 100 : 0;

    return {
      threeMonths: {
        rate: retentionRate3Months,
        total: threeMonthCohortPeople.length,
        active: activeInThreeMonthCohort,
        label: format(startOfThreeMonthCohort, 'MMMM yyyy', { locale: es }),
      },
      sixMonths: {
        rate: retentionRate6Months,
        total: sixMonthCohortPeople.length,
        active: activeInSixMonthCohort,
        label: format(startOfSixMonthCohort, 'MMMM yyyy', { locale: es }),
      },
    };
}, [people]);

  const activityPopularity = useMemo(() => {
    const popularity: Record<string, number> = sessions.reduce((acc, session) => {
      acc[session.actividadId] = (acc[session.actividadId] || 0) + session.personIds.length;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(popularity)
      .map(([actividadId, count]) => {
        const actividad = actividades.find(a => a.id ===ividadId);
        return {
          name: actividad?.name || 'Desconocido',
          value: count,
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [sessions, actividades]);

  const chartConfig = useMemo(() => {
    const config: any = {
      personas: { label: "Personas", color: "hsl(var(--chart-1))" },
      nuevasPersonas: { label: "Nuevas Personas", color: "hsl(var(--chart-2))" },
    };
    activityPopularity.forEach((activity, index) => {
      config[activity.name] = {
        label: activity.name,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    });
    return config;
  }, [activityPopularity]);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        className="text-[11px] font-semibold fill-background"
        textAnchor="middle"
        dominantBaseline="central"
      >
        <tspan x={x} dy="-0.5em">{name}</tspan>
        <tspan x={x} dy="1.2em">{`(${(percent * 100).toFixed(0)}%)`}</tspan>
      </text>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Estadísticas del Estudio"
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-slate-100">Popularidad por Horario</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={sessionPopularityByTime} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="personas" fill="var(--color-personas)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-slate-100">Nuevas Personas por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={monthlyNewMembers} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Line
                  type="monotone"
                  dataKey="nuevasPersonas"
                  stroke="var(--color-nuevasPersonas)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "var(--color-nuevasPersonas)" }}
                  activeDot={{ r: 6 }}
                  name="Nuevas Personas"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-slate-100">Tasa de Retención de Clientes</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Porcentaje de personas que se inscriben en un mes y siguen activas después de un período.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {retentionData.threeMonths.total > 0 ? (
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-medium text-muted-foreground capitalize">Retención a 3 meses (Inscritos en {retentionData.threeMonths.label})</span>
                  <span className="text-lg font-bold text-primary">{retentionData.threeMonths.rate.toFixed(0)}%</span>
                </div>
                <Progress value={retentionData.threeMonths.rate} className="h-2" />
                <p className="text-xs text-right text-muted-foreground mt-1">
                  {retentionData.threeMonths.active} de {retentionData.threeMonths.total} clientes continúan activos.
                </p>
              </div>
            ) : (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Retención a 3 meses</span>
                <p className="text-xs text-muted-foreground mt-1">No hay datos de inscripción de hace 3 meses para calcular la retención.</p>
              </div>
            )}
            {retentionData.sixMonths.total > 0 ? (
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-medium text-muted-foreground capitalize">Retención a 6 meses (Inscritos en {retentionData.sixMonths.label})</span>
                  <span className="text-lg font-bold text-primary">{retentionData.sixMonths.rate.toFixed(0)}%</span>
                </div>
                <Progress value={retentionData.sixMonths.rate} className="h-2" />
                <p className="text-xs text-right text-muted-foreground mt-1">
                  {retentionData.sixMonths.active} de {retentionData.sixMonths.total} clientes continúan activos.
                </p>
              </div>
            ) : (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Retención a 6 meses</span>
                <p className="text-xs text-muted-foreground mt-1">No hay datos de inscripción de hace 6 meses para calcular la retención.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-slate-100">Popularidad de Actividades</CardTitle>
          </CardHeader>
          <CardContent>
            {activityPopularity.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={activityPopularity}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    labelLine={false}
                    label={renderCustomizedLabel}
                    stroke="hsl(var(--border))"
                    strokeWidth={2}
                  >
                    {activityPopularity.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={chartConfig[entry.name]?.color || '#ccc'} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[300px] w-full items-center justify-center text-center text-slate-500 dark:text-slate-400">
                <p>No hay datos de inscripciones para mostrar el gráfico.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
