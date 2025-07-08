'use client';

import type { ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { StudioProvider } from '@/context/StudioContext';

export function AppShell({ children }: { children: ReactNode }) {
    // We use a temporary placeholder ID to allow the application to load
    // without a logged-in user. The UI will show, but data will be empty.
    const recoveryInstituteId = 'FORCE_LOAD_RECOVERY_MODE';

    return (
        <StudioProvider instituteId={recoveryInstituteId}>
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
