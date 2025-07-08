'use client';

// THIS IS A TEMPORARY RECOVERY SHELL.
// It bypasses ALL providers and app logic to guarantee the UI loads.

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
             <div className="flex max-w-lg flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-amber-500/50 bg-amber-500/10 p-12 text-center">
                <h1 className="text-2xl font-bold text-amber-700 dark:text-amber-300">SISTEMA EN RECUPERACIÓN</h1>
                <p className="text-muted-foreground">
                    ¡La web ha vuelto! Ignora el diseño. Esto es un estado de emergencia para solucionar el bloqueo.
                </p>
                <p className="text-muted-foreground">
                    El problema es que la aplicación no encuentra las credenciales de Firebase. Por favor, avísame que ves este mensaje y te guiaré para solucionarlo de forma definitiva.
                </p>
             </div>
        </div>
    );
}
