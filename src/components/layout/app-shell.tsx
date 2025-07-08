'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { StudioProvider } from '@/context/StudioContext';
import { AlertTriangle, Clock, LogOut } from 'lucide-react';
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
                    <LogOut className="mr-2 h-4 w-4" />
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
                    <LogOut className="mr-2 h-4 w-4" />
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
    const instituteId = userProfile?.instituteId;

    useEffect(() => {
        if (loading) return;

        if (!user && !isPublicRoute) {
            router.push('/login');
        }

        if (user && isPublicRoute) {
            if (userProfile?.status === 'active' && instituteId) {
                router.push('/dashboard');
            }
        }
    }, [user, userProfile, loading, router, pathname, isPublicRoute, instituteId]);

    // This block handles what to RENDER based on the current state.
    // It is a clear, sequential check to prevent race conditions.

    // 1. Initial Loading State: covers both auth check and profile fetch.
    if (loading) {
        return <FullscreenLoader />;
    }

    // 2. User is not logged in.
    if (!user) {
        // If they are on a public route, show the public page (login/signup).
        if (isPublicRoute) {
            return <>{children}</>;
        }
        // Otherwise, the useEffect is already redirecting them. Show loader.
        return <FullscreenLoader />;
    }

    // 3. User is logged in. Now we can safely check their profile status.
    // This is the critical case that caused the infinite loop.
    // If user object exists from Auth, but their profile doc doesn't exist in Firestore.
    if (!userProfile) {
        return <ErrorShell 
            title="Error al Cargar Perfil"
            description="No pudimos encontrar los datos de tu perfil. Esto puede ser un error temporal o un problema durante el registro. Por favor, cierra la sesión y vuelve a intentarlo."
        />;
    }
    
    // Profile exists, check its status.
    switch (userProfile.status) {
        case 'pending':
            return <PendingApprovalShell />;
        case 'active':
            if (!instituteId) {
                 return <ErrorShell 
                    title="Cuenta no Asignada"
                    description="Tu cuenta ha sido aprobada, pero aún no está asignada a ningún instituto. Por favor, contacta al administrador para completar el proceso." 
                />;
            }
            // SUCCESS CASE: User is active and has an institute.
            if (!isPublicRoute) {
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
            // If they are on a public route, the useEffect will redirect them. Show loader in the meantime.
            return <FullscreenLoader />;
        default:
            return <ErrorShell 
                title="Estado de Cuenta Desconocido"
                description="El estado de tu cuenta no es válido. Por favor, contacta con el administrador."
            />;
    }
}
