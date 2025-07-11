
'use client';

import type { ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { StudioProvider } from '@/context/StudioContext';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export function AppShell({ children }: { children: ReactNode }) {
    const { user, userProfile, loading } = useAuth();
    const pathname = usePathname();

    const isAuthPage = pathname === '/login';

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }
    
    // If we are on an auth page (like /login)
    if (isAuthPage) {
        return <>{children}</>;
    }
    
    // If the user is not logged in or their profile is not active yet, and it's a protected route
    if (!user || !userProfile || userProfile.status !== 'active') {
        // The redirect logic is handled in AuthContext, so we can just return null or a loader here
        // to prevent rendering the main layout.
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    // If we are on a protected route and the user is fully authenticated
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
