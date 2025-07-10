'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// This is a DUMMY user profile for demonstration purposes.
// It ensures the app thinks a user is logged in and has an institute.
const dummyUser = { uid: 'dummy-user' };
const dummyProfile = {
    instituteId: 'yogaflow-manager-uqjpc', // Using the actual project ID
    status: 'active',
};

// We define the shape of the context for TypeScript.
type AuthContextType = {
  user: typeof dummyUser | null;
  userProfile: typeof dummyProfile | null;
  loading: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    // This provider now gives a static, "logged-in" state to the whole app.
    // This removes the complex logic that was causing the application to freeze.
    const value = {
        user: dummyUser,
        userProfile: dummyProfile,
        loading: false, // Always false to prevent loading screens.
        logout: () => console.log("Logout action disabled."), // A safe, no-op function.
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
