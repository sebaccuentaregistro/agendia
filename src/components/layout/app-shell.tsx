'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { StudioProvider } from '@/context/StudioContext';
import { AlertTriangle, Clock } from 'lucide-react';
import { Button } from '../ui/button';

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

function ErrorShell({ title, description }: { title: string, description: string }) {
    const { logout } = useAuth();
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background p-4">
            <div className="flex flex-col items-center gap-4 text-center">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <h1 className="text-2xl font-bold text-destructive">{title}</h1>
                <p className="max-w-md text-muted-foreground">{description}</p>
                 <Button variant="outline" onClick={logout} className="mt-4">
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    );
}

function PendingApprovalShell() {
    const { logout } = useAuth();
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background p-4">
            <div className="flex flex-col items-center gap-4 text-center">
                <Clock className="h-12 w-12 text-primary" />
                <h1 className="text-2xl font-bold text-primary">Cuenta Pendiente de Aprobación</h1>
                <p className="max-w-md text-muted-foreground">
                    Gracias por registrarte. Tu cuenta está siendo revisada por un administrador. Recibirás una notificación cuando sea aprobada.
                </p>
                <Button variant="outline" onClick={logout} className="mt-4">
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    );
}

export function AppShell({ children }: { children: ReactNode }) {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const publicRoutes = ['/login', '/signup', '/terms'];
    const isPublicRoute = publicRoutes.includes(pathname);

    useEffect(() => {
        // Don't do anything until the auth state is fully resolved.
        if (loading) {
            return;
        }

        // If not logged in and trying to access a protected route, redirect to login.
        if (!user && !isPublicRoute) {
            router.push('/login');
        }

        // If logged in and on a public route, redirect to the dashboard.
        if (user && isPublicRoute) {
            router.push('/dashboard');
        }

    }, [user, loading, isPublicRoute, pathname, router]);

    // Now, handle the RENDERING based on the current state, without redirection logic.
    if (loading) {
        return <FullscreenLoader />;
    }

    // If we're on a public route, let it render. 
    // The useEffect will handle redirecting away if the user is logged in.
    if (isPublicRoute) {
        return <>{children}</>;
    }

    // If we reach here, we are on a PROTECTED route.
    // If there's no user, the useEffect is redirecting them, so show a loader.
    if (!user) {
        return <FullscreenLoader />;
    }
    
    // User exists, check profile status.
    if (userProfile?.status === 'pending') {
        return <PendingApprovalShell />;
    }

    if (userProfile?.status === 'active' && !userProfile.instituteId) {
        return <ErrorShell 
            title="Cuenta no activada"
            description="Tu cuenta ha sido aprobada, pero aún no está asignada a ningún instituto. Por favor, contacta al administrador para completar el proceso." 
        />;
    }
    
    if (userProfile?.status === 'active' && userProfile.instituteId) {
        return (
            <StudioProvider instituteId={userProfile.instituteId}>
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
    
    // This is the fallback for when `user` exists but `userProfile` is not yet loaded or invalid.
    // Instead of an error, let's just show the loader. This is a more graceful "in-between" state.
    return <FullscreenLoader />;
}
