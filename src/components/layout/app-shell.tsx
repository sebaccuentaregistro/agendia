'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { StudioProvider } from '@/context/StudioContext';
import { AlertTriangle, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { doLogout } from '@/lib/firebase-auth';
import { getFirebaseDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
    const handleLogout = async () => {
        await doLogout();
        // The router will automatically handle redirection via the main useEffect in AppShell
    };
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background p-4">
            <div className="flex flex-col items-center gap-4 text-center">
                <Clock className="h-12 w-12 text-primary" />
                <h1 className="text-2xl font-bold text-primary">Cuenta Pendiente de Aprobación</h1>
                <p className="max-w-md text-muted-foreground">
                    Gracias por registrarte. Tu cuenta está siendo revisada por un administrador. Recibirás una notificación cuando sea aprobada.
                </p>
                <Button variant="outline" onClick={handleLogout} className="mt-4">
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

    const publicRoutes = ['/login', '/signup'];
    const isPublicRoute = publicRoutes.includes(pathname);
    const instituteId = userProfile?.instituteId;

    useEffect(() => {
        if (authLoading) return; // Wait for firebase auth to be ready first.
        
        if (user) {
            setProfileLoading(true);
            const db = getFirebaseDb();
            const userDocRef = doc(db, 'users', user.uid);
            getDoc(userDocRef).then(docSnap => {
                if (docSnap.exists()) {
                    setUserProfile(docSnap.data() as AppUserProfile);
                } else {
                    setUserProfile(null);
                }
            }).catch(error => {
                console.error("Error fetching user profile:", error);
                setUserProfile(null);
            }).finally(() => {
                setProfileLoading(false);
            });
        } else {
            // No user, so not loading a profile.
            setUserProfile(null);
            setProfileLoading(false);
        }
    }, [user, authLoading]);

    useEffect(() => {
        const totalLoading = authLoading || profileLoading;
        if (totalLoading) return;

        // If user is not logged in and not on a public route, redirect to login
        if (!user && !isPublicRoute) {
            router.push('/login');
        }

        // If user is logged in and on a public route, redirect to dashboard if profile is active
        if (user && isPublicRoute) {
            if (userProfile?.status === 'active' && instituteId) {
                router.push('/dashboard');
            }
        }
    }, [user, userProfile, authLoading, profileLoading, router, pathname, instituteId, isPublicRoute]);

    const isLoading = authLoading || profileLoading;

    if (isLoading) {
        return <FullscreenLoader />;
    }

    // Render public routes if user is not logged in
    if (!user && isPublicRoute) {
        return <>{children}</>;
    }
    
    // After loading, if user is logged in, check their status
    if (user) {
        if (userProfile?.status === 'pending') {
            return <PendingApprovalShell />;
        }

        if (userProfile?.status === 'active' && !instituteId) {
            const handleLogout = async () => {
                await doLogout();
            };
            return (
              <ErrorShell 
                  title="Cuenta no activada"
                  description="Tu cuenta ha sido aprobada, pero aún no está asignada a ningún instituto. Por favor, contacta al administrador para completar el proceso." 
              >
                  <Button variant="outline" onClick={handleLogout} className="mt-4">
                      Cerrar Sesión
                  </Button>
              </ErrorShell>
            );
        }

        // If user has an active profile and instituteId, and is on a protected route, show the app
        if (instituteId && !isPublicRoute) {
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
    }
    
    // Fallback loader for edge cases during redirection
    return <FullscreenLoader />;
}
