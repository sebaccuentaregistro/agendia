'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode, useState } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { StudioProvider } from '@/context/StudioContext';
import { AlertTriangle, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { doLogout } from '@/lib/firebase-auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AppUserProfile {
  email: string;
  status: 'pending' | 'active';
  instituteId: string | null;
}

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
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background p-4">
            <div className="flex flex-col items-center gap-4 text-center">
                <Clock className="h-12 w-12 text-primary" />
                <h1 className="text-2xl font-bold text-primary">Cuenta Pendiente de Aprobación</h1>
                <p className="max-w-md text-muted-foreground">
                    Gracias por registrarte. Tu cuenta está siendo revisada por un administrador. Recibirás una notificación cuando sea aprobada.
                </p>
                <Button variant="outline" onClick={doLogout} className="mt-4">
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    );
}

export function AppShell({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (authLoading) return;

        const fetchUserProfile = async () => {
            if (user) {
                setProfileLoading(true);
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(userDocRef);
                    if (docSnap.exists()) {
                        setUserProfile(docSnap.data() as AppUserProfile);
                    } else {
                        setUserProfile(null);
                    }
                } catch (error) {
                    console.error("Error fetching user profile in AppShell:", error);
                    setUserProfile(null);
                } finally {
                    setProfileLoading(false);
                }
            } else {
                setUserProfile(null);
                setProfileLoading(false);
            }
        };

        fetchUserProfile();
    }, [user, authLoading]);

    useEffect(() => {
        if (authLoading || profileLoading) return;

        const publicRoutes = ['/login', '/signup'];
        const isPublicRoute = publicRoutes.includes(pathname);
        const instituteId = userProfile?.instituteId;

        if (!user && !isPublicRoute) {
            router.push('/login');
        } else if (user && isPublicRoute) {
            if (userProfile?.status === 'active' && instituteId) {
                router.push('/dashboard');
            }
        }
    }, [user, userProfile, authLoading, profileLoading, router, pathname]);

    const isLoading = authLoading || profileLoading;

    if (isLoading) {
        return <FullscreenLoader />;
    }
    
    const publicRoutes = ['/login', '/signup'];
    if (publicRoutes.includes(pathname)) {
        // If user is logged in, FullscreenLoader is shown until redirection happens.
        // If not logged in, render the public route.
        return user ? <FullscreenLoader /> : <>{children}</>;
    }
    
    // ----- Protected Routes Logic -----

    if (!user) {
        // This case is handled by the redirect effect, but as a fallback:
        return <FullscreenLoader />;
    }

    if (userProfile?.status === 'pending') {
        return <PendingApprovalShell />;
    }

    if (userProfile?.status === 'active' && !userProfile.instituteId) {
        return <ErrorShell 
            title="Cuenta no activada"
            description="Tu cuenta ha sido aprobada, pero aún no está asignada a ningún instituto. Por favor, contacta al administrador para completar el proceso." 
        >
            <Button variant="outline" onClick={doLogout} className="mt-4">
                Cerrar Sesión
            </Button>
        </ErrorShell>;
    }

    if (userProfile?.instituteId) {
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

    // Fallback for any other state
    return <FullscreenLoader />;
}
