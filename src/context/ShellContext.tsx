
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { Session } from '@/types';

interface ShellContextType {
    openPersonDialog: () => void;
    openSessionDialog: (session: Session | null) => void;
}

const ShellContext = createContext<ShellContextType | undefined>(undefined);

export function ShellProvider({ children, openPersonDialog, openSessionDialog }: { children: ReactNode } & ShellContextType) {
    return (
        <ShellContext.Provider value={{ openPersonDialog, openSessionDialog }}>
            {children}
        </ShellContext.Provider>
    );
}

export function useShell() {
    const context = useContext(ShellContext);
    if (context === undefined) {
        throw new Error('useShell must be used within a ShellProvider');
    }
    return context;
}
