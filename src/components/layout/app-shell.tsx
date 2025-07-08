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

function ErrorShell({ title, description, children }: { title: string, description: string, children?: ReactNode }) {
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
        if (loading) return;

        // If user is not logged in and is on a protected route, redirect to login.
        if (!user && !isPublicRoute) {
            router.push('/login');
        }

        // If user is logged in and on a public route, redirect to dashboard.
        // This should only happen once the user profile is confirmed to be active.
        if (user && isPublicRoute && userProfile?.status === 'active' && userProfile.instituteId) {
            router.push('/dashboard');
        }
    }, [user, userProfile, loading, isPublicRoute, router, pathname]);

    // Render logic is a simple state machine, preventing loops.
    if (loading) {
        return <FullscreenLoader />;
    }

    if (!user) {
        // If not logged in, only render children if it's a public route.
        // Otherwise, show loader while useEffect redirects.
        return isPublicRoute ? <>{children}</> : <FullscreenLoader />;
    }

    // From here, we know a user object exists.
    if (userProfile?.status === 'pending') {
        return <PendingApprovalShell />;
    }

    if (userProfile?.status === 'active' && userProfile.instituteId) {
        // This is the main success path. Render the protected app.
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
    
    if (userProfile?.status === 'active' && !userProfile.instituteId) {
        // Edge case: User is active but not assigned to an institute.
        return <ErrorShell 
            title="Cuenta no activada"
            description="Tu cuenta ha sido aprobada, pero aún no está asignada a ningún instituto. Por favor, contacta al administrador para completar el proceso." 
        />;
    }

    // This is the crucial fallback state.
    // It handles the case where `user` exists, but `userProfile` is still null (loading) or has an invalid state.
    // By showing a loader here, we prevent the redirect loop.
    return <FullscreenLoader />;
}
