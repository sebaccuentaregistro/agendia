'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { StudioProvider } from '@/context/StudioContext';
import { AlertTriangle, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
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
    const { user, loading: authLoading, logout } = useAuth();
    const [userProfile, setUserProfile] = useState<AppUserProfile | null | undefined>(undefined); // undefined means not loaded yet
    const [profileLoading, setProfileLoading] = useState(true);
    
    const router = useRouter();
    const pathname = usePathname();
    const publicRoutes = ['/login', '/signup', '/terms'];

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setUserProfile(null);
            setProfileLoading(false);
            return;
        }

        setProfileLoading(true);
        const userDocRef = doc(db, 'users', user.uid);
        getDoc(userDocRef)
            .then(docSnap => {
                if (docSnap.exists()) {
                    setUserProfile(docSnap.data() as AppUserProfile);
                } else {
                    console.error("CRITICAL: User is authenticated but no profile document exists for UID:", user.uid);
                    setUserProfile(null); // Explicitly null for "not found"
                }
            })
            .catch(error => {
                console.error("Error fetching user profile:", error);
                setUserProfile(null); // Error state
            })
            .finally(() => {
                setProfileLoading(false);
            });
    }, [user, authLoading]);

    useEffect(() => {
        const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

        if (authLoading || (user && profileLoading)) {
            return; // Don't redirect while loading
        }

        // If not authenticated and not on a public route, redirect to login
        if (!user && !isPublicRoute) {
            router.push('/login');
        }

        // If authenticated and on a public route, redirect to dashboard
        if (user && isPublicRoute) {
            router.push('/dashboard');
        }
    }, [user, profileLoading, authLoading, pathname, router, publicRoutes]);

    // Show loader while either auth or profile is loading
    if (authLoading || (user && profileLoading)) {
        return <FullscreenLoader />;
    }

    // --- Post-loading states ---

    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
    
    // If on a public route and not authenticated, show the page
    if (!user && isPublicRoute) {
        return <>{children}</>;
    }
    
    // If authenticated, but something is wrong with the profile
    if (user && !profileLoading && !userProfile) {
         return <ErrorShell 
            title="Error de Perfil"
            description="Tu cuenta está autenticada, pero no pudimos cargar tus datos de perfil. Esto puede deberse a un problema durante el registro. Por favor, contacta a soporte." 
        >
             <Button variant="outline" onClick={logout} className="mt-4">
                Cerrar Sesión
            </Button>
        </ErrorShell>;
    }

    if (user && userProfile) {
        if (userProfile.status === 'pending') {
            return <PendingApprovalShell />;
        }

        if (userProfile.status === 'active' && !userProfile.instituteId) {
            return <ErrorShell 
                title="Cuenta no Asignada"
                description="Tu cuenta ha sido aprobada, pero aún no está asignada a ningún instituto. Por favor, contacta al administrador." 
            >
                 <Button variant="outline" onClick={logout} className="mt-4">
                    Cerrar Sesión
                </Button>
            </ErrorShell>;
        }
        
        // --- Success case: User and profile are loaded and valid ---
        if (userProfile.status === 'active' && userProfile.instituteId && !isPublicRoute) {
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
    }
    
    // Fallback loader for any unhandled state or during redirects
    return <FullscreenLoader />;
}
