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
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background p-4">
            <div className="flex flex-col items-center gap-4 text-center">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <h1 className="text-2xl font-bold text-destructive">{title}</h1>
                <p className="max-w-md text-muted-foreground">{description}</p>
                 {children}
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
    const { user, userProfile, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const publicRoutes = ['/login', '/signup', '/terms'];
    const instituteId = userProfile?.instituteId;

    useEffect(() => {
        if (loading) return;
        const isPublicRoute = publicRoutes.includes(pathname);

        // Redirect to login if not authenticated and on a private route
        if (!user && !isPublicRoute) {
            router.push('/login');
        }

        // Redirect to dashboard if authenticated, profile is OK, and on a public route
        if (user && userProfile?.status === 'active' && instituteId && isPublicRoute) {
            router.push('/dashboard');
        }
    }, [user, userProfile, loading, router, pathname, instituteId]);

    // 1. Loading state
    if (loading) {
        return <FullscreenLoader />;
    }

    // 2. Not Logged In
    if (!user) {
        // The useEffect will handle redirect from private routes.
        // If we are on a public route, show the page content.
        if (publicRoutes.includes(pathname)) {
             return <>{children}</>;
        }
        // Otherwise, show loader while redirecting.
        return <FullscreenLoader />;
    }

    // 3. Logged In (user is not null)
    // Profile is missing
    if (!userProfile) {
        return (
            <ErrorShell 
                title="Error de Perfil"
                description="Tu cuenta está autenticada, pero no pudimos encontrar tu perfil en la base de datos. Por favor, contacta a soporte o intenta cerrar sesión y volver a registrarte."
            >
                <Button variant="outline" onClick={logout} className="mt-4">
                    Cerrar Sesión
                </Button>
            </ErrorShell>
        );
    }
    
    // Profile is pending
    if (userProfile.status === 'pending') {
        return <PendingApprovalShell />;
    }

    // Profile is active but no institute
    if (userProfile.status === 'active' && !instituteId) {
        return (
             <ErrorShell 
                title="Cuenta no activada"
                description="Tu cuenta ha sido aprobada, pero aún no está asignada a ningún instituto. Por favor, contacta al administrador para completar el proceso."
            >
                 <Button variant="outline" onClick={logout} className="mt-4">
                    Cerrar Sesión
                </Button>
            </ErrorShell>
        );
    }

    // Profile is active and OK
    if (userProfile.status === 'active' && instituteId) {
        // The useEffect will handle redirect from public routes.
        // If we are on a private route, show the app content.
        if (!publicRoutes.includes(pathname)) {
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
        // Otherwise, show loader while redirecting.
        return <FullscreenLoader />;
    }

    // Fallback for any unhandled state (should not be reached)
    return <FullscreenLoader />;
}
