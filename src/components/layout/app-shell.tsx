
'use client';

import type { ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { StudioProvider } from '@/context/StudioContext';

export function AppShell({ children }: { children: ReactNode }) {
    // This component now wraps the entire authenticated part of the app with StudioProvider,
    // ensuring all pages have access to the app's data and functions.
    // The complex auth logic that caused freezes has been removed.
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
