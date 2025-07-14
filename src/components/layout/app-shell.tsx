'use client';

import type { ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { StudioProvider } from '@/context/StudioContext';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { OperatorLoginScreen } from './operator-login-screen';

export function AppShell({ children }: { children: ReactNode }) {
    const { user, userProfile, loading, activeOperator } = useAuth();
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
    
    if (!user || !userProfile || userProfile.status !== 'active') {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    // After main login, if no operator is active, show the PIN screen.
    // The PIN screen needs StudioProvider to get the list of operators.
    if (!activeOperator) {
        return (
             <StudioProvider>
                <OperatorLoginScreen />
            </StudioProvider>
        )
    }

    // If we are on a protected route and the user and operator are fully authenticated
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
