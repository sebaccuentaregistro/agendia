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

    const isPublicRoute = ['/login', '/signup', '/terms'].some(route => pathname.startsWith(route));

    // --- Redirection Logic ---
    useEffect(() => {
        if (loading) return; 

        if (user && userProfile?.status === 'active' && userProfile.instituteId && isPublicRoute) {
            router.push('/dashboard');
        }

        if (!user && !isPublicRoute) {
            router.push('/login');
        }
    }, [user, userProfile, loading, router, pathname, isPublicRoute]);


    // --- Rendering Logic ---

    // 1. Still loading auth state
    if (loading) {
        return <FullscreenLoader />;
    }

    // 2. Not logged in, on a public route (e.g., /login) -> Show the page
    if (!user && isPublicRoute) {
        return <>{children}</>;
    }

    // --- From here, we handle all states for a logged-in user ---

    // 3. Logged in, but profile is missing. THIS IS THE CRITICAL ERROR CASE.
    if (user && !userProfile) {
        return (
            <ErrorShell 
                title="Error de Perfil de Usuario"
                description="Hemos podido autenticarte, pero no encontramos los datos de tu perfil. Esto puede deberse a un problema durante el registro. Por favor, cierra sesión y contacta a soporte."
            >
                <Button variant="outline" onClick={logout} className="mt-4">
                    Cerrar Sesión
                </Button>
            </ErrorShell>
        );
    }
    
    // 4. Logged in, profile exists, but status is pending.
    if (user && userProfile?.status === 'pending') {
        return <PendingApprovalShell />;
    }
    
    // 5. Logged in, profile active, but no institute assigned.
    if (user && userProfile?.status === 'active' && !userProfile.instituteId) {
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
    
    // 6. The "golden path": User logged in, profile active, institute assigned, on a protected route.
    if (user && userProfile?.status === 'active' && userProfile.instituteId && !isPublicRoute) {
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
    
    // 7. Fallback loader for any other transient state (e.g., during redirects).
    return <FullscreenLoader />;
}
