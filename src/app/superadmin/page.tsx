
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function SuperAdminPage() {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && userProfile?.isSuperAdmin !== true) {
      router.push('/');
    }
  }, [userProfile, loading, router]);

  if (loading || userProfile?.isSuperAdmin !== true) {
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
          <CardTitle>Próximamente</CardTitle>
          <CardDescription>
            Aquí se mostrarán las estadísticas de la plataforma y la lista de institutos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>¡Hemos creado la página del panel de forma segura!</p>
        </CardContent>
      </Card>
    </div>
  );
}
