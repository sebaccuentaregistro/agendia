'use client';

import type { ReactNode } from 'react';
import { Heart, AlertTriangle } from 'lucide-react';

export function AppShell({ children }: { children: ReactNode }) {
    // Este componente representará un mensaje de recuperación autónomo.
    // No procesará a sus hijos para evitar fallos de otros componentes.
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-purple-200 to-violet-200 dark:from-slate-900 dark:via-purple-950 dark:to-blue-950 p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/40 p-8 text-center shadow-lg backdrop-blur-xl dark:bg-zinc-900/40">
                <div className="flex flex-col items-center gap-4">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                    <h1 className="text-2xl font-bold text-destructive">Modo de Recuperación</h1>
                    <div className="flex items-center justify-center gap-2">
                        <Heart className="h-6 w-6 text-fuchsia-500" />
                        <span className="text-xl font-semibold text-slate-800 dark:text-slate-100">Agendia</span>
                    </div>
                    <p className="max-w-md text-muted-foreground">
                        El sistema está en modo de recuperación para asegurar que la web sea accesible.
                        <br />
                        No te preocupes, tus datos están a salvo.
                        <br /><br />
                        Por favor, avísame que ves esta pantalla para proceder con la solución definitiva.
                    </p>
                </div>
            </div>
        </div>
    );
}
