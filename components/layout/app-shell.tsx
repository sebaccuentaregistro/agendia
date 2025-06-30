'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { StudioProvider } from '@/context/StudioContext';

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
    const { user, instituteId, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const publicRoutes = ['/login'];

    useEffect(() => {
        if (loading) return;

        const isPublicRoute = publicRoutes.includes(pathname);

        if (!user && !isPublicRoute) {
            router.push('/login');
        }

        if (user && isPublicRoute) {
            router.push('/dashboard');
        }

    }, [user, loading, router, pathname]);

    if (loading) {
        return <FullscreenLoader />;
    }
    
    // This handles the case where the user is logged in, but we are still fetching the instituteId.
    // Or for public routes which don't need an instituteId.
    if (!instituteId && !publicRoutes.includes(pathname) && user) {
        return <FullscreenLoader />;
    }

    if (!user && publicRoutes.includes(pathname)) {
        return <>{children}</>;
    }

    if (user && !publicRoutes.includes(pathname)) {
        return (
            <StudioProvider instituteId={instituteId}>
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
    
    // Fallback for edge cases, like redirecting.
    return <FullscreenLoader />;
}
