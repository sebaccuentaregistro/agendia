'use client';

import type { ReactNode } from 'react';
import { Heart } from 'lucide-react';

function RecoveryPage() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-4 text-center">
      <Heart className="h-12 w-12 text-primary mb-4" />
      <h1 className="text-2xl font-bold text-primary">Modo de Recuperación</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        El sistema está en modo de recuperación para asegurar que la web sea accesible.
        No te preocupes, tus datos están a salvo.
      </p>
      <p className="mt-4 font-semibold text-foreground">
        Por favor, avísame que ves esta pantalla para proceder con la solución definitiva.
      </p>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  // Forzamos la visualización de la página de recuperación para eludir cualquier error.
  return <RecoveryPage />;
}
