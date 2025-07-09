'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';

export function AppShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const publicRoutes = ['/login', '/signup', '/terms'];

    // Si la ruta es pública (como /login), se renderiza sola, sin la barra de navegación principal.
    if (publicRoutes.includes(pathname)) {
        return <>{children}</>;
    }
    
    // Para todas las demás rutas, renderizamos la estructura principal de la aplicación.
    // El StudioProvider ahora envuelve este componente desde layout.tsx.
    return (
        <div className="flex min-h-screen w-full flex-col">
            <AppHeader />
            <main className="flex-grow p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
                {children}
            </main>
            <MobileBottomNav />
        </div>
    );
}
