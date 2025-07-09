
'use client';

import type { ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { useStudio } from '@/context/StudioContext';

function FullscreenLoader() {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-spin text-primary"
            >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
        </div>
    );
}


export function AppShell({ children }: { children: ReactNode }) {
    const { loading } = useStudio();
    
    if (loading) {
        return <FullscreenLoader />;
    }

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
