'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useStudio } from '@/context/StudioContext';
import { es } from 'date-fns/locale';
import { format, isWithinInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';

const formatTime = (time: string) => {
  if (!time || !time.includes(':')) return 'N/A';
  const [hour, minute] = time.split(':');
  const hourNum = parseInt(hour, 10);
  const ampm = hourNum >= 12 ? 'PM' : 'AM';
  const formattedHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
  return `${formattedHour}:${minute} ${ampm}`;
};

function PopularTimesChart() {
  const { yogaClasses } = useStudio();
  
  const chartData = useMemo(() => {
      const times = yogaClasses.reduce((acc, cls) => {
          const time = cls.time;
          const enrolled = cls.personIds.length;
          if (!acc[time]) {
              acc[time] = 0;
          }
          acc[time] += enrolled;
          return acc;
      }, {} as Record<string, number>);

      return Object.entries(times)
          .map(([time, students]) => ({
              time: time,
              displayTime: formatTime(time),
              Estudiantes: students
          }))
          .sort((a, b) => a.time.localeCompare(b.time));
  }, [yogaClasses]);

  const chartConfig = {
    Estudiantes: {
      label: 'Estudiantes',
      color: 'hsl(var(--chart-1))',
    },
  } satisfies ChartConfig;

  if (chartData.length === 0) {
      return <p className="text-muted-foreground p-6">No hay datos de clases para mostrar.</p>;
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="displayTime"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Legend />
        <Bar dataKey="Estudiantes" fill="var(--color-Estudiantes)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

function MonthlyActivityChart() {
  const { payments } = useStudio();

  const chartData = useMemo(() => {
    const now = new Date();
    const monthlyData: { name: string; Estudiantes: number }[] = [];
    
    for (let i = 11; i >= 0; i--) {
        const targetMonth = subMonths(now, i);
        const monthStart = startOfMonth(targetMonth);
        const monthEnd = endOfMonth(targetMonth);
        
        const uniqueStudents = new Set<string>();
        
        payments.forEach(payment => {
            if (isWithinInterval(payment.date, { start: monthStart, end: monthEnd })) {
                uniqueStudents.add(payment.personId);
            }
        });
        
        monthlyData.push({
            name: format(targetMonth, 'MMM yy', { locale: es }),
            Estudiantes: uniqueStudents.size
        });
    }
    return monthlyData;
  }, [payments]);

  const chartConfig = {
    Estudiantes: {
      label: 'Estudiantes Activos',
      color: 'hsl(var(--chart-2))',
    },
  } satisfies ChartConfig;
  
  if (chartData.every(d => d.Estudiantes === 0)) {
      return <p className="text-muted-foreground p-6">No hay suficientes datos de pagos para mostrar tendencias.</p>;
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <LineChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis allowDecimals={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Legend />
        <Line
          dataKey="Estudiantes"
          type="monotone"
          stroke="var(--color-Estudiantes)"
          strokeWidth={2}
          dot={true}
        />
      </LineChart>
    </ChartContainer>
  );
}

function PopularActivitiesChart() {
  const { yogaClasses, actividades } = useStudio();

  const chartData = useMemo(() => {
      const activityCounts = yogaClasses.reduce((acc, cls) => {
          const enrolled = cls.personIds.length;
          if (!acc[cls.actividadId]) {
              acc[cls.actividadId] = 0;
          }
          acc[cls.actividadId] += enrolled;
          return acc;
      }, {} as Record<string, number>);

      const sortedActivities = Object.entries(activityCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([id]) => id);

      return Object.entries(activityCounts).map(([actividadId, students]) => ({
          name: actividades.find(a => a.id === actividadId)?.name || 'Desconocido',
          value: students,
          fill: `hsl(var(--chart-${sortedActivities.indexOf(actividadId) + 1}))`
      }));
  }, [yogaClasses, actividades]);
  
  const chartConfig = chartData.reduce((acc, item) => {
    if (item.name) {
      acc[item.name] = { label: item.name, color: item.fill };
    }
    return acc;
  }, {} as ChartConfig);

  if (chartData.length === 0) {
      return <p className="text-muted-foreground p-6">No hay inscripciones a actividades para mostrar.</p>;
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <PieChart accessibilityLayer>
          <ChartTooltip content={<ChartTooltipContent nameKey="value" hideLabel />} />
          <Pie
              data={chartData}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              dataKey="value"
              nameKey="name"
          >
           {chartData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
            ))}
          </Pie>
      </PieChart>
    </ChartContainer>
  );
}


export default function StatisticsPage() {
  return (
    <div>
      <PageHeader
        title="Estadísticas del Estudio"
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Horarios Más Populares</CardTitle>
            <CardDescription>Total de estudiantes inscritos por hora de clase.</CardDescription>
          </CardHeader>
          <CardContent>
            <PopularTimesChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Actividad Mensual</CardTitle>
            <CardDescription>Estudiantes activos únicos por mes (basado en pagos).</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyActivityChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribución de Actividades</CardTitle>
            <CardDescription>Popularidad de cada tipo de actividad según el número de inscripciones.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <PopularActivitiesChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
