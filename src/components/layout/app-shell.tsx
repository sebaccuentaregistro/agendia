'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode } from 'react';
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
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const publicRoutes = ['/login', '/signup', '/terms'];
    const isPublicRoute = publicRoutes.includes(pathname);
    const instituteId = userProfile?.instituteId;

    if (loading) {
        return <FullscreenLoader />;
    }

    if (!user) {
        if (isPublicRoute) {
            return <>{children}</>;
        }
        router.push('/login');
        return <FullscreenLoader />;
    }
    
    if (isPublicRoute) {
        router.push('/dashboard');
        return <FullscreenLoader />;
    }

    if (!userProfile) {
        return (
            <ErrorShell 
                title="Error de Perfil de Usuario"
                description="Tu cuenta está autenticada, pero no pudimos encontrar tu perfil de datos. Esto puede ocurrir si el registro inicial no se completó correctamente. Por favor, intenta cerrar sesión y volver a registrarte."
            />
        );
    }

    switch (userProfile.status) {
        case 'pending':
            return <PendingApprovalShell />;
        
        case 'active':
            if (!instituteId) {
                return (
                    <ErrorShell 
                        title="Cuenta no Asignada"
                        description="Tu cuenta ha sido aprobada, pero aún no está asignada a ningún instituto. Por favor, contacta al administrador para completar el proceso."
                    />
                );
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
            return (
                 <ErrorShell 
                    title="Estado de Cuenta Desconocido"
                    description="No podemos determinar el estado de tu cuenta. Por favor, contacta al administrador."
                />
            );
    }
}
