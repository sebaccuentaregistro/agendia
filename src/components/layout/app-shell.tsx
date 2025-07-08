'use client';

import type { ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { StudioProvider } from '@/context/StudioContext';

// NOTA: Este es un shell de recuperación de emergencia.
// La autenticación está desactivada. Se usa un ID de instituto de marcador de posición
// para permitir que la aplicación se renderice. Los datos pueden aparecer vacíos.
const TEMP_INSTITUTE_ID = "placeholder-institute-id";

export function AppShell({ children }: { children: ReactNode }) {
    return (
        <StudioProvider instituteId={TEMP_INSTITUTE_ID}>
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
