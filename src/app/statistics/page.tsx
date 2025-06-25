'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { useStudio } from '@/context/StudioContext';
import { format, subMonths, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export default function StatisticsPage() {
  const { yogaClasses, people } = useStudio();

  const classPopularityByTime = useMemo(() => {
    const data = yogaClasses.reduce<Record<string, number>>((acc, cls) => {
      const time = cls.time;
      if (!acc[time]) {
        acc[time] = 0;
      }
      acc[time] += cls.personIds.length;
      return acc;
    }, {});

    return Object.entries(data)
      .map(([time, people]) => ({
        time,
        personas: people,
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [yogaClasses]);

  const monthlyNewMembers = useMemo(() => {
    const now = new Date();
    const monthLabels = Array.from({ length: 12 }).map((_, i) => {
      const date = subMonths(now, i);
      return format(startOfMonth(date), 'yyyy-MM');
    }).reverse();

    const memberCounts = people.reduce<Record<string, number>>((acc, person) => {
      const monthKey = format(person.joinDate, 'yyyy-MM');
      if (monthLabels.includes(monthKey)) {
        acc[monthKey] = (acc[monthKey] || 0) + 1;
      }
      return acc;
    }, {});

    return monthLabels.map(monthKey => ({
      month: format(new Date(`${monthKey}-02`), 'MMM yy', { locale: es }), // Using day 02 to avoid timezone issues
      'Nuevas Personas': memberCounts[monthKey] || 0,
    }));
  }, [people]);

  const chartConfig = {
    personas: {
      label: "Personas",
      color: "hsl(var(--chart-1))",
    },
    'Nuevas Personas': {
      label: "Nuevas Personas",
      color: "hsl(var(--chart-2))",
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Estadísticas del Estudio"
        description="Visualiza el rendimiento y las tendencias de tu centro."
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Popularidad por Horario</CardTitle>
            <CardDescription>
              Número total de personas inscritas por cada horario de clase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={classPopularityByTime} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
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

        <Card>
          <CardHeader>
            <CardTitle>Nuevas Personas por Mes</CardTitle>
            <CardDescription>
              Tendencia de nuevas inscripciones en los últimos 12 meses.
            </CardDescription>
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
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Nuevas Personas"
                  stroke="var(--color-Nuevas Personas)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "var(--color-Nuevas Personas)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
