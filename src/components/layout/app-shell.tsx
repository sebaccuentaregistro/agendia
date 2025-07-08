'use client';
import { type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6">
        <h1 className="text-lg font-semibold text-foreground">Agendia - Modo de Recuperación del Sistema</h1>
      </header>
      <main className="flex flex-grow items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-lg border-2 border-dashed border-destructive/50 bg-card p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h2 className="text-2xl font-bold text-destructive">Error Crítico de Compilación</h2>
            <p className="text-muted-foreground">
                La aplicación no pudo cargar sus archivos principales (error 404), lo que indica un fallo en el proceso de construcción de Next.js. He simplificado la aplicación al mínimo absoluto para forzar una nueva compilación limpia.
            </p>
             <p className="mt-4 font-semibold text-foreground">
                Si estás viendo este mensaje, significa que el servidor ha vuelto a funcionar y los errores 404 han desaparecido. Por favor, avísame para que podamos restaurar la funcionalidad completa de forma segura.
            </p>
        </div>
      </main>
    </div>
  );
}
