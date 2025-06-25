
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { useStudio } from '@/context/StudioContext';
import { format, subMonths, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export default function StatisticsPage() {
  const { yogaClasses, people, actividades } = useStudio();

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

  const activityPopularity = useMemo(() => {
    const popularity: Record<string, number> = yogaClasses.reduce((acc, cls) => {
      acc[cls.actividadId] = (acc[cls.actividadId] || 0) + cls.personIds.length;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(popularity)
      .map(([actividadId, count]) => {
        const actividad = actividades.find(a => a.id === actividadId);
        return {
          name: actividad?.name || 'Desconocido',
          value: count,
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [yogaClasses, actividades]);

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
        className="text-[11px] font-semibold fill-primary-foreground"
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
        <Card>
          <CardHeader>
            <CardTitle>Popularidad por Horario</CardTitle>
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Popularidad de Actividades</CardTitle>
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
              <div className="flex h-[300px] w-full items-center justify-center text-center text-muted-foreground">
                <p>No hay datos de inscripciones para mostrar el gráfico.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
