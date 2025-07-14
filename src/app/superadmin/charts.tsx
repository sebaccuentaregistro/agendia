
'use client';

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';

interface MonthlyData {
  month: string;
  "Nuevos Alumnos": number;
}

interface AdminChartsProps {
  monthlyNewPeople: MonthlyData[];
}

export function AdminCharts({ monthlyNewPeople }: AdminChartsProps) {

  // Custom Tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col space-y-1">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Mes
              </span>
              <span className="font-bold text-muted-foreground">
                {label}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
               <span className="text-[0.70rem] uppercase text-muted-foreground">
                Nuevos Alumnos
              </span>
              <span className="font-bold">
                {payload[0].value}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
      <Card>
        <CardHeader>
          <CardTitle>Crecimiento de Nuevos Alumnos (Últimos 12 Meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={monthlyNewPeople}
              margin={{
                top: 5,
                right: 20,
                left: -10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="Nuevos Alumnos" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
