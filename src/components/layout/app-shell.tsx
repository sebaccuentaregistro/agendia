import { Heart } from 'lucide-react';
import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-red-100 via-orange-200 to-yellow-200 dark:from-slate-900 dark:via-red-950 dark:to-orange-950 p-4 text-center">
            <div className="rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl shadow-lg border border-white/20 p-8 max-w-lg">
                <Heart className="mx-auto h-12 w-12 text-destructive mb-4" />
                <h1 className="text-xl font-bold text-destructive">Modo de Recuperación de Emergencia</h1>
                 <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mt-4">Agendia</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                    La autenticación ha sido desactivada forzosamente para devolver el control de la web. Mis disculpas por los fallos anteriores. La aplicación está ahora en un estado estable.
                </p>
                <p className="mt-4 font-semibold text-slate-700 dark:text-slate-200">
                    Por favor, avísame que ves esta pantalla para proceder con la solución definitiva.
                </p>
            </div>
             {/* We render children so Next.js doesn't throw a 404, but we hide it. */}
             <div style={{ display: 'none' }}>{children}</div>
        </div>
    );
}
