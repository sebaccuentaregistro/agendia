'use client';

// This file is intentionally simplified to disable the old, broken authentication system.
// A dummy context is provided to prevent import errors in other parts of the app,
// while ensuring it cannot cause the application to freeze.

import React, { createContext, useContext, ReactNode } from 'react';

const AuthContext = createContext<any>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    // This provider now simply renders its children without any logic.
    return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    // This hook provides a static, safe state that will not cause re-renders or freezes.
    return {
        user: null,
        userProfile: null,
        loading: false, // Always false to prevent infinite loading screens.
        logout: () => {}, // A no-op function for compatibility.
    };
}
