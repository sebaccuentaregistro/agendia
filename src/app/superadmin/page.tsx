
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import type { Institute } from '@/types';
import { getAllInstitutes, getPeopleCountForInstitute, getSessionsCountForInstitute, getLatestActivityForInstitute } from '@/lib/superadmin-actions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface InstituteWithCount extends Institute {
    peopleCount?: number;
    sessionsCount?: number;
    lastActivity?: string | null;
}

export default function SuperAdminPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [institutes, setInstitutes] = useState<InstituteWithCount[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (userProfile?.isSuperAdmin !== true) {
        router.push('/');
        return;
      }
      
      const fetchInstitutesAndCounts = async () => {
        setPageLoading(true);
        const instituteList = await getAllInstitutes();
        
        const institutesWithCounts = await Promise.all(
            instituteList.map(async (institute) => {
                const peopleCount = await getPeopleCountForInstitute(institute.id);
                const sessionsCount = await getSessionsCountForInstitute(institute.id);
                const lastActivity = await getLatestActivityForInstitute(institute.id);
                return { ...institute, peopleCount, sessionsCount, lastActivity };
            })
        );

        setInstitutes(institutesWithCounts);
        setPageLoading(false);
      };

      if (userProfile?.isSuperAdmin) {
        fetchInstitutesAndCounts();
      }
    }
  }, [userProfile, authLoading, router]);

  const sortedInstitutes = useMemo(() => {
      return [...institutes].sort((a, b) => (b.peopleCount ?? 0) - (a.peopleCount ?? 0));
  }, [institutes]);


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
                <TableHead>Nombre del Instituto</TableHead>
                <TableHead>Nº de Alumnos</TableHead>
                <TableHead>Nº de Sesiones</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead>Última Actividad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInstitutes.length > 0 ? (
                sortedInstitutes.map(institute => (
                  <TableRow key={institute.id}>
                    <TableCell className="font-medium">{institute.name}</TableCell>
                    <TableCell>
                      <span className="font-semibold">{institute.peopleCount ?? <Loader2 className="h-4 w-4 animate-spin" />}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{institute.sessionsCount ?? <Loader2 className="h-4 w-4 animate-spin" />}</span>
                    </TableCell>
                    <TableCell>
                      {institute.createdAt ? format(institute.createdAt, "dd 'de' MMMM, yyyy", { locale: es }) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {institute.lastActivity ? format(new Date(institute.lastActivity), "dd/MM/yyyy, HH:mm", { locale: es }) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
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

