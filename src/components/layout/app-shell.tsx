'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

function FullscreenLoader({ message }: { message: string }) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background p-4">
            <div className="flex flex-col items-center gap-4 text-center">
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
                <p className="max-w-md text-muted-foreground">{message}</p>
            </div>
        </div>
    );
}

export function AppShell({ children }: { children: ReactNode }) {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    console.log('--- AppShell RENDER ---');
    console.log('Loading:', loading);
    console.log('User:', user ? { uid: user.uid, email: user.email } : null);
    console.log('User Profile:', userProfile);
    console.log('-----------------------');

    const publicRoutes = ['/login', '/signup', '/terms'];
    const instituteId = userProfile?.instituteId;

    useEffect(() => {
        console.log('--- useEffect RUNNING ---');
        console.log('Dep [loading]:', loading);
        console.log('Dep [user]:', user ? { uid: user.uid, email: user.email } : null);
        console.log('Dep [userProfile]:', userProfile);
        
        if (loading) {
            console.log('useEffect: Still loading, no action taken.');
            return;
        }

        const isPublicRoute = publicRoutes.includes(pathname);
        console.log('useEffect: Is on public route?', isPublicRoute);

        if (!user && !isPublicRoute) {
            console.log('useEffect: No user, not on public route. Redirecting to /login.');
            router.push('/login');
        } else if (user && isPublicRoute) {
            console.log('useEffect: User exists and is on a public route.');
            if (userProfile?.status === 'active' && instituteId) {
                console.log('useEffect: Profile active. Redirecting to /dashboard.');
                router.push('/dashboard');
            } else {
                 console.log('useEffect: Profile not ready for dashboard. Staying on public route.');
            }
        }
        console.log('--- useEffect FINISHED ---');
    }, [user, userProfile, loading, router, pathname, instituteId]);

    if (loading) {
        return <FullscreenLoader message="Obteniendo datos de autenticación... Revisa la consola." />;
    }

    // After loading, if user is on a public route, just render children (login/signup)
    if (publicRoutes.includes(pathname)) {
        console.log('Rendering public route children.');
        return <>{children}</>;
    }
    
    // After loading, if user is authenticated:
    if (user) {
        if (!userProfile) {
            return <FullscreenLoader message="Usuario autenticado, pero esperando perfil... Revisa la consola." />;
        }

        if (userProfile.status === 'pending') {
             return <FullscreenLoader message="Cuenta pendiente de aprobación... Revisa la consola." />;
        }

        if (userProfile.status === 'active') {
            if (instituteId) {
                // This is where the app would normally render.
                // Forcing a loader to prevent other components from interfering with the log.
                 return <FullscreenLoader message="¡Perfil cargado! Deberías ser redirigido. Revisa la consola para ver por qué no." />;
            } else {
                return <FullscreenLoader message="Cuenta activa pero sin instituto. Revisa la consola." />;
            }
        }
    }
    
    return <FullscreenLoader message="Estado no manejado. Revisa la consola para ver los valores." />;
}
