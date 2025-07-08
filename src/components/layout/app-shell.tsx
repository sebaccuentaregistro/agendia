'use client';

import type { ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { StudioProvider } from '@/context/StudioContext';

export function AppShell({ children }: { children: ReactNode }) {
    // NOTA: Se ha desactivado la lógica de autenticación temporalmente para recuperar el acceso a la aplicación.
    // Se utiliza un ID de instituto temporal para permitir que el proveedor de contexto se inicialice.
    // Es probable que los datos no se carguen, pero la interfaz de usuario debería ser visible.
    const tempInstituteId = "temp-institute-id-for-recovery";

    return (
        <StudioProvider instituteId={tempInstituteId}>
            <div className="flex min-h-screen w-full flex-col">
                <AppHeader />
                <main className="flex-grow p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
                    {children}
                </main>
                <MobileBottomNav />
            </div>
        </StudioProvider>
    );
}
