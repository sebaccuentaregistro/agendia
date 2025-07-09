
'use client';

// This file is intentionally left blank to disable the old authentication system.
// The new simplified logic is handled directly in AppShell and StudioContext.
// Keeping the file prevents import errors in other parts of the app that have not been updated yet.

import React, { createContext, useContext, ReactNode } from 'react';

const AuthContext = createContext<any>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return {
        user: null,
        userProfile: null,
        loading: true,
        logout: () => {},
    };
}
