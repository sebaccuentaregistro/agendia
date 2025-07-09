'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { StudioProvider } from '@/context/StudioContext';

export function AppShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const publicRoutes = ['/login', '/signup', '/terms'];

    // Esta es una medida temporal para omitir la autenticación para la depuración.
    // Si se encuentra en una ruta pública, no se muestra el shell principal de la aplicación.
    if (publicRoutes.includes(pathname)) {
        return <>{children}</>;
    }
    
    // Para todas las demás rutas, renderiza el shell de la aplicación con un ID de instituto codificado.
    // Esto permite que el contexto de datos se cargue sin un usuario que haya iniciado sesión.
    return (
        <StudioProvider instituteId="yogaflow-manager-uqjpc">
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
