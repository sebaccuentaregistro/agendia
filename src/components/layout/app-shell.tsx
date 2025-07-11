
'use client';

import type { ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { StudioProvider } from '@/context/StudioContext';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export function AppShell({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();

    const isAuthPage = pathname === '/login';

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (isAuthPage) {
        return <>{children}</>;
    }

    // This check should ideally be handled by the AuthProvider redirect,
    // but it's a good failsafe.
    if (!user) {
        return null;
    }

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
