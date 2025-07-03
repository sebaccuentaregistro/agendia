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

    const isPublicRoute = ['/login', '/signup'].includes(pathname);
    const instituteId = userProfile?.instituteId;

    useEffect(() => {
        if (loading) return; // Don't run redirects until auth state is known

        // If logged in, but on a public route, redirect to dashboard
        if (user && isPublicRoute) {
            router.push('/dashboard');
        }

        // If not logged in, and on a protected route, redirect to login
        if (!user && !isPublicRoute) {
            router.push('/login');
        }

    }, [user, isPublicRoute, loading, router]);

    if (loading) {
        return <FullscreenLoader />;
    }

    // After loading, decide what to render based on auth state
    if (user) {
        // User is authenticated
        if (userProfile?.status === 'pending') {
            return <PendingApprovalShell />;
        }

        if (userProfile?.status === 'active' && !instituteId) {
            return <ErrorShell 
                title="Cuenta no activada"
                description="Tu cuenta ha sido aprobada, pero aún no está asignada a ningún instituto. Por favor, contacta al administrador para completar el proceso." 
            />;
        }

        if (instituteId) {
            // This is the main path for an active, logged-in user
            // If they are on a public route, the useEffect will redirect them,
            // so we show a loader in the meantime.
            if (isPublicRoute) {
                return <FullscreenLoader />;
            }
            
            // Otherwise, show the full app shell
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
    } else {
        // User is not authenticated
        // If on a public route, render it.
        if (isPublicRoute) {
            return <>{children}</>;
        }
    }

    // Fallback for any other case (e.g., redirecting) is the loader.
    return <FullscreenLoader />;
}
