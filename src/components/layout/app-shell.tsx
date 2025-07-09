
'use client';

import type { ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';

export function AppShell({ children }: { children: ReactNode }) {
    // This component is now a simple, logic-less wrapper for the main layout.
    // All authentication and loading logic has been removed to prevent freezes.
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

    