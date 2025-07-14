

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Landmark, Users, Calendar, Star, MoreHorizontal, Edit } from 'lucide-react';
import type { Institute } from '@/types';
import { getAllInstitutes } from '@/lib/superadmin-actions';
import { format, differenceInDays, addMonths, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AdminCharts } from './charts';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { UpdatePaymentStatusDialog } from './update-payment-status-dialog';

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
  const [selectedInstitute, setSelectedInstitute] = useState<InstituteWithCount | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const fetchAllData = async () => {
    const [instituteList, monthlyData] = await Promise.all([
        getAllInstitutes(),
        getMonthlyNewPeopleCount()
    ]);
    
    setInstitutes(instituteList);
    setMonthlyNewPeople(monthlyData);
    setPageLoading(false);
  };

  useEffect(() => {
    if (!authLoading) {
      if (userProfile?.isSuperAdmin !== true) {
        router.push('/');
        return;
      }
      
      if (userProfile?.isSuperAdmin) {
        setPageLoading(true);
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

  const getUsageStatus = (lastActivity: Date | null | undefined): { label: string, className: string } => {
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
  
  const getPaymentStatusBadge = (status: Institute['paymentStatus']) => {
    switch (status) {
        case 'pagado':
            return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
        case 'vencido':
            return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700';
        case 'pendiente':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const handleManagePayment = (institute: InstituteWithCount) => {
    setSelectedInstitute(institute);
    setIsPaymentDialogOpen(true);
  };
  
  const handleDialogClose = (updated: boolean) => {
    setIsPaymentDialogOpen(false);
    setSelectedInstitute(null);
    if (updated) {
      setPageLoading(true);
      fetchAllData();
    }
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
                <TableHead>Estado de Uso</TableHead>
                <TableHead>Nombre del Instituto</TableHead>
                <TableHead>Estado de Pago</TableHead>
                <TableHead>Próximo Vencimiento</TableHead>
                <TableHead>Nº de Alumnos</TableHead>
                <TableHead>Última Actividad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInstitutes.length > 0 ? (
                sortedInstitutes.map(institute => {
                  const usageStatus = getUsageStatus(institute.lastActivity);
                  const instituteCreatedAt = institute.createdAt;
                  
                  return (
                    <TableRow key={institute.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2.5 w-2.5 rounded-full", usageStatus.className)}></span>
                          <span className="text-sm font-medium">{usageStatus.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{institute.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("capitalize", getPaymentStatusBadge(institute.paymentStatus))}>
                            {institute.paymentStatus || 'N/A'}
                        </Badge>
                      </TableCell>
                       <TableCell>
                        {institute.nextDueDate ? format(institute.nextDueDate, "dd 'de' MMMM, yyyy", { locale: es }) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{institute.peopleCount ?? <Loader2 className="h-4 w-4 animate-spin" />}</span>
                      </TableCell>
                      <TableCell>
                        {institute.lastActivity ? format(institute.lastActivity, "dd/MM/yyyy, HH:mm", { locale: es }) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => handleManagePayment(institute)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Gestionar Pago
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
      
      {selectedInstitute && (
        <UpdatePaymentStatusDialog
            isOpen={isPaymentDialogOpen}
            onClose={handleDialogClose}
            institute={selectedInstitute}
        />
      )}
    </div>
  );
}
