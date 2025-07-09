'use client';

import { type ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { StudioProvider } from '@/context/StudioContext';

// Hardcoding the institute ID to bypass authentication for debugging.
// This might result in no data being shown if the ID is incorrect,
// but it is intended to stop the application's loading loop.
const DEBUG_INSTITUTE_ID = "yogaflow-manager-uqjpc";

export function AppShell({ children }: { children: ReactNode }) {
    return (
        <StudioProvider instituteId={DEBUG_INSTITUTE_ID}>
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
