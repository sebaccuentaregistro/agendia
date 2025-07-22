

'use client';

import type { ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { StudioProvider } from '@/context/StudioContext';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { OperatorLoginScreen } from './operator-login-screen';
import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react';

function ShellContent({ children }: { children: ReactNode }) {
    const { activeOperator } = useAuth();
    const pathname = usePathname();
    const isOperatorsPage = pathname === '/operators';
    const isSuperAdminPage = pathname.startsWith('/superadmin');

    // Allow access to operators page and superadmin page without an active operator selected
    if (!activeOperator && !isOperatorsPage && !isSuperAdminPage) {
        return <OperatorLoginScreen />;
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

export function AppShell({ children }: { children: ReactNode }) {
    const { user, userProfile, loading } = useAuth();
    const pathname = usePathname();
    const isAuthPage = pathname === '/login';

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Heart className="h-12 w-12 text-fuchsia-500 animate-pulse" />
                    <p className="text-muted-foreground">Cargando tu estudio...</p>
                </div>
            </div>
        );
    }
    
    if (isAuthPage) {
        return <>{children}</>;
    }
    
    if (!user || !userProfile || userProfile.status !== 'active') {
        if (pathname === '/login') {
             return <>{children}</>;
        }
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                 <div className="flex flex-col items-center gap-4">
                    <Heart className="h-12 w-12 text-fuchsia-500 animate-pulse" />
                    <p className="text-muted-foreground">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <StudioProvider>
            <ShellContent>{children}</ShellContent>
        </StudioProvider>
    );
}
