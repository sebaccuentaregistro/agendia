
'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// This is a mock user profile that simulates a successfully logged-in user.
const mockUserProfile = {
    instituteId: 'yogaflow-manager-uqjpc', // A valid institute ID is required.
    status: 'active',
};

// This is a mock user object that mimics Firebase Auth's user object.
const mockUser = {
    uid: 'mock-user-uid-12345',
    email: 'test@agendia.app',
};

const AuthContext = createContext<any>(undefined);

/**
 * This is a mock AuthProvider. It provides a "logged-in" context to the entire app,
 * bypassing the need for a real login and fixing the redirect loops.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const value = {
        user: mockUser,
        userProfile: mockUserProfile,
        loading: false, // Crucially, we are never in a loading state.
        logout: () => {
            console.log("Logout clicked. In a real app, this would sign the user out.");
            // We can redirect to a hypothetical login page, but for now, it does nothing.
        },
        // Provide dummy functions for other methods that might be called.
        login: async () => { console.log("Login action is disabled."); },
        signup: async () => { console.log("Signup action is disabled."); },
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
