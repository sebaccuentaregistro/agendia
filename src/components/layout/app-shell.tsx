

'use client';

import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AppHeader } from './app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { StudioProvider, useStudio } from '@/context/StudioContext';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { OperatorLoginScreen } from './operator-login-screen';
import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react';
import { PersonDialog } from '@/components/students/person-dialog';
import { WelcomeDialog } from '@/components/welcome-dialog';
import { SessionDialog } from '@/components/schedule/session-dialog';
import type { Person, Session } from '@/types';

function ShellLogic({ children }: { children: ReactNode }) {
    const { activeOperator, setPeopleCount, isLimitReached } = useAuth();
    const { people } = useStudio();

    // Global Dialog State
    const [isPersonDialogGloballyOpen, setIsPersonDialogGloballyOpen] = useState(false);
    const [isSessionDialogGloballyOpen, setIsSessionDialogGloballyOpen] = useState(false);
    const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
    const [personForWelcome, setPersonForWelcome] = useState<Person | null>(null);

    const openPersonDialog = () => setIsPersonDialogGloballyOpen(true);
    const openSessionDialog = (session: Session | null) => {
        setSessionToEdit(session);
        setIsSessionDialogGloballyOpen(true);
    };
    
    useEffect(() => {
        setPeopleCount(people.length);
    }, [people, setPeopleCount]);

    const pathname = usePathname();
    const isOperatorsPage = pathname === '/operators';
    const isSuperAdminPage = pathname.startsWith('/superadmin');

    if (!activeOperator && !isOperatorsPage && !isSuperAdminPage) {
        return <OperatorLoginScreen />;
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <AppHeader 
                openPersonDialog={openPersonDialog}
                openSessionDialog={openSessionDialog}
            />
            <main className="flex-grow p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
                {children}
            </main>
            <MobileBottomNav />
            
             <PersonDialog
                open={isPersonDialogGloballyOpen}
                onOpenChange={setIsPersonDialogGloballyOpen}
                onPersonCreated={(person) => {
                  if (person.tariffId) {
                    setPersonForWelcome(person);
                  }
                }}
                isLimitReached={isLimitReached}
            />
            <WelcomeDialog person={personForWelcome} onOpenChange={() => setPersonForWelcome(null)} />
            <SessionDialog
              isOpen={isSessionDialogGloballyOpen}
              onClose={() => {
                setIsSessionDialogGloballyOpen(false);
                setSessionToEdit(null);
              }}
              session={sessionToEdit}
            />
        </div>
    );
}

export function AppShell({ children }: { children: ReactNode }) {
    const { user, userProfile, loading } = useAuth();
    const pathname = usePathname();
    const isAuthPage = pathname === '/login';

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Heart className="h-12 w-12 text-fuchsia-500 animate-pulse" />
                    <p className="text-muted-foreground">Cargando tu estudio...</p>
                </div>
            </div>
        );
    }
    
    if (isAuthPage) {
        return <>{children}</>;
    }
    
    if (!user || !userProfile || userProfile.status !== 'active') {
        if (pathname === '/login') {
             return <>{children}</>;
        }
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                 <div className="flex flex-col items-center gap-4">
                    <Heart className="h-12 w-12 text-fuchsia-500 animate-pulse" />
                    <p className="text-muted-foreground">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <StudioProvider>
            <ShellLogic>{children}</ShellLogic>
        </StudioProvider>
    );
}
