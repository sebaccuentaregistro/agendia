'use client';

import type { ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { StudioProvider } from '@/context/StudioContext';

export function AppShell({ children }: { children: ReactNode }) {
    // The instituteId is hardcoded because there is no logged-in user to determine it from.
    // This will cause the app to load with empty lists, which is the expected behavior in this recovery mode.
    const instituteId = "recovery-mode-institute";

    return (
        <StudioProvider instituteId={instituteId}>
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
