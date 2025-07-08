
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
    const isPublicRoute = publicRoutes.includes(pathname);
    const instituteId = userProfile?.instituteId;

    useEffect(() => {
        if (loading) return;

        // Redirect to login if not authenticated and trying to access a private route.
        if (!user && !isPublicRoute) {
            router.push('/login');
        }

        // Redirect to dashboard if authenticated and trying to access a public route.
        if (user && userProfile && isPublicRoute) {
            router.push('/dashboard');
        }
    }, [user, userProfile, loading, router, pathname, isPublicRoute]);

    // 1. Show loader while auth state is being determined.
    if (loading) {
        return <FullscreenLoader />;
    }

    // 2. If user is NOT authenticated.
    if (!user) {
        // If on a public route, show the page. Otherwise, show loader during redirect.
        return isPublicRoute ? <>{children}</> : <FullscreenLoader />;
    }

    // 3. If user IS authenticated, but profile is missing. THIS IS THE KEY FIX.
    if (!userProfile) {
        return (
            <ErrorShell 
                title="Error de Perfil"
                description="Tu cuenta está autenticada, pero no pudimos encontrar tu perfil. Esto puede ocurrir si el registro no se completó. Por favor, contacta a soporte o intenta cerrar sesión y volver a registrarte."
            >
                <Button variant="outline" onClick={logout} className="mt-4">
                    Cerrar Sesión
                </Button>
            </ErrorShell>
        );
    }
    
    // 4. Handle different profile statuses.
    switch (userProfile.status) {
        case 'pending':
            return <PendingApprovalShell />;
        
        case 'active':
            if (!instituteId) {
                return (
                    <ErrorShell 
                        title="Cuenta no Asignada"
                        description="Tu cuenta ha sido aprobada, pero aún no está asignada a ningún instituto. Por favor, contacta al administrador para completar el proceso."
                    >
                        <Button variant="outline" onClick={logout} className="mt-4">
                            Cerrar Sesión
                        </Button>
                    </ErrorShell>
                );
            }
            // If profile is active and has an institute, show the app.
            // If on a public route, the useEffect will redirect, so we show a loader.
            if (isPublicRoute) {
                return <FullscreenLoader />;
            }
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

        default:
            // Fallback for any unknown status.
            return (
                 <ErrorShell 
                    title="Estado de Cuenta Desconocido"
                    description="No podemos determinar el estado de tu cuenta. Por favor, contacta al administrador."
                >
                    <Button variant="outline" onClick={logout} className="mt-4">
                        Cerrar Sesión
                    </Button>
                </ErrorShell>
            );
    }
}
