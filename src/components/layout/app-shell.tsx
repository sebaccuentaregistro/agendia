'use client';

import { type ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';

// THIS IS A TEMPORARY RECOVERY SHELL.
// It bypasses all authentication and data loading to ensure the UI loads.
// The app will not be functional until the .env.local file is configured correctly.

export function AppShell({ children }: { children: ReactNode }) {
    // Bypassing StudioProvider and all auth logic
    return (
        <div className="flex min-h-screen w-full flex-col">
            <AppHeader />
            <main className="flex-grow p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
                 <div className="flex h-full w-full items-center justify-center rounded-2xl border-2 border-dashed border-amber-500/50 bg-amber-500/10 p-12">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-amber-700 dark:text-amber-300">Modo de Recuperación</h2>
                        <p className="mt-2 max-w-lg text-muted-foreground">
                            La aplicación se está ejecutando sin conexión a la base de datos.
                            Por favor, sigue las instrucciones para configurar tus credenciales de Firebase en el archivo <strong>.env.local</strong> y que todo vuelva a funcionar.
                        </p>
                    </div>
                </div>
            </main>
            <MobileBottomNav />
        </div>
    );
}
