'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import AppHeader from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';

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
    const { user, loading } = useAuth();
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

    if (!user && publicRoutes.includes(pathname)) {
        return <>{children}</>;
    }

    if (user && !publicRoutes.includes(pathname)) {
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
    
    // Fallback while redirecting
    return <FullscreenLoader />;
}
