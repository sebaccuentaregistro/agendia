
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
    const isOperatorsPage = pathname === '/operators';

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
        // This should be handled by the redirect effect in AuthContext, but as a fallback:
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }
    
    // If no operator is selected, show the PIN screen, UNLESS we're trying to access the operators page itself.
    if (!activeOperator && !isOperatorsPage) {
        return (
             <StudioProvider>
                <OperatorLoginScreen />
            </StudioProvider>
        )
    }

    // If we are on a protected route and the user and operator are fully authenticated (or going to operators page)
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
