
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Landmark, Users, Calendar, Star } from 'lucide-react';
import type { Institute } from '@/types';
import { getAllInstitutes, getMonthlyNewPeopleCount } from '@/lib/superadmin-actions';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AdminCharts } from './charts';

interface InstituteWithCount extends Institute {
    peopleCount?: number;
    sessionsCount?: number;
    actividadesCount?: number;
    lastActivity?: Date | null;
}

interface MonthlyData {
  month: string;
  "Nuevos Alumnos": number;
}


export default function SuperAdminPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [institutes, setInstitutes] = useState<InstituteWithCount[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [monthlyNewPeople, setMonthlyNewPeople] = useState<MonthlyData[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (userProfile?.isSuperAdmin !== true) {
        router.push('/');
        return;
      }
      
      const fetchAllData = async () => {
        setPageLoading(true);
        const [instituteList, monthlyData] = await Promise.all([
            getAllInstitutes(),
            getMonthlyNewPeopleCount()
        ]);
        
        setInstitutes(instituteList);
        setMonthlyNewPeople(monthlyData);
        setPageLoading(false);
      };

      if (userProfile?.isSuperAdmin) {
        fetchAllData();
      }
    }
  }, [userProfile, authLoading, router]);

  const sortedInstitutes = useMemo(() => {
      return [...institutes].sort((a, b) => (b.peopleCount ?? 0) - (a.peopleCount ?? 0));
  }, [institutes]);
  
  const globalMetrics = useMemo(() => {
    return {
      totalInstitutes: sortedInstitutes.length,
      totalPeople: sortedInstitutes.reduce((sum, i) => sum + (i.peopleCount ?? 0), 0),
      totalSessions: sortedInstitutes.reduce((sum, i) => sum + (i.sessionsCount ?? 0), 0),
      totalActividades: sortedInstitutes.reduce((sum, i) => sum + (i.actividadesCount ?? 0), 0),
    }
  }, [sortedInstitutes]);

  const getStatus = (lastActivity: Date | null | undefined): { label: string, className: string } => {
      if (!lastActivity) return { label: 'Sin Datos', className: 'bg-gray-500' };
      
      const daysSinceActivity = differenceInDays(new Date(), lastActivity);

      if (daysSinceActivity <= 30) {
          return { label: 'Activo', className: 'bg-green-600' };
      }
      if (daysSinceActivity <= 60) {
          return { label: 'Inactivo', className: 'bg-yellow-600' };
      }
      return { label: 'En Riesgo', className: 'bg-red-600' };
  }

  if (authLoading || pageLoading) {
    return (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Panel de Superadministrador"
        description="Vista general de todos los institutos en la plataforma."
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Institutos</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalMetrics.totalInstitutes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alumnos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalMetrics.totalPeople}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Sesiones</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalMetrics.totalSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Actividades</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalMetrics.totalActividades}</div>
          </CardContent>
        </Card>
      </div>

      <AdminCharts monthlyNewPeople={monthlyNewPeople} />

      <Card>
        <CardHeader>
          <CardTitle>Institutos Registrados</CardTitle>
          <CardDescription>
            Lista de todos los centros que utilizan Agendia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                <TableHead>Nombre del Instituto</TableHead>
                <TableHead>Nº de Alumnos</TableHead>
                <TableHead>Nº de Sesiones</TableHead>
                <TableHead>Nº de Actividades</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead>Última Actividad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInstitutes.length > 0 ? (
                sortedInstitutes.map(institute => {
                  const status = getStatus(institute.lastActivity);
                  const instituteCreatedAt = institute.createdAt;
                  
                  return (
                    <TableRow key={institute.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2.5 w-2.5 rounded-full", status.className)}></span>
                          <span className="text-sm font-medium">{status.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{institute.name}</TableCell>
                      <TableCell>
                        <span className="font-semibold">{institute.peopleCount ?? <Loader2 className="h-4 w-4 animate-spin" />}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{institute.sessionsCount ?? <Loader2 className="h-4 w-4 animate-spin" />}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{institute.actividadesCount ?? <Loader2 className="h-4 w-4 animate-spin" />}</span>
                      </TableCell>
                      <TableCell>
                        {instituteCreatedAt ? format(instituteCreatedAt, "dd 'de' MMMM, yyyy", { locale: es }) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {institute.lastActivity ? format(institute.lastActivity, "dd/MM/yyyy, HH:mm", { locale: es }) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Aún no hay institutos registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
