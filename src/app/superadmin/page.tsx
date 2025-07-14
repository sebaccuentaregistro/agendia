
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import type { Institute } from '@/types';
import { getAllInstitutes } from '@/lib/superadmin-actions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SuperAdminPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && userProfile?.isSuperAdmin !== true) {
      router.push('/');
      return;
    }
    
    if (userProfile?.isSuperAdmin) {
      const fetchInstitutes = async () => {
        setPageLoading(true);
        const instituteList = await getAllInstitutes();
        setInstitutes(instituteList);
        setPageLoading(false);
      };
      fetchInstitutes();
    }
  }, [userProfile, authLoading, router]);

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
                <TableHead>Fecha de Creación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {institutes.length > 0 ? (
                institutes.map(institute => (
                  <TableRow key={institute.id}>
                    <TableCell className="font-medium">{institute.name}</TableCell>
                    <TableCell>
                      {institute.createdAt ? format(institute.createdAt, "dd 'de' MMMM, yyyy", { locale: es }) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
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
