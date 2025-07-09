
'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// This is a DUMMY user profile for demonstration purposes.
// It ensures the app thinks a user is logged in and has an institute.
const dummyUser = { uid: 'dummy-user' };
const dummyProfile = {
    instituteId: 'dummy-institute-id',
    status: 'active',
};

const AuthContext = createContext<any>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    // This provider now gives a static, "logged-in" state to the whole app.
    const value = {
        user: dummyUser,
        userProfile: dummyProfile,
        loading: false, // Always false to prevent loading screens.
        logout: () => console.log("Logout action disabled."), // A safe, no-op function.
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
