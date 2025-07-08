'use client';

import type { ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { StudioProvider } from '@/context/StudioContext';

// THIS IS A TEMPORARY RECOVERY SHELL TO BYPASS AUTHENTICATION.
// The normal authentication logic has been removed to restore access to the app.

export function AppShell({ children }: { children: ReactNode }) {
    // We are bypassing all authentication checks and forcing the app to load.
    // A temporary instituteId is provided to allow the main context to initialize.
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
