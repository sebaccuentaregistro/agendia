'use client';

import type { ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { StudioProvider } from '@/context/StudioContext';

// NOTE: This AppShell has been simplified to remove the complex auth logic that was causing the app to freeze.
// It now relies on a simplified AuthContext and wraps the application in the StudioProvider.
export function AppShell({ children }: { children: ReactNode }) {
    return (
        <StudioProvider>
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
