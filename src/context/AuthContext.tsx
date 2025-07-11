
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { LoginCredentials } from '@/types';
import { usePathname, useRouter } from 'next/navigation';

type UserProfile = {
  instituteId: string;
  status: 'active' | 'pending';
};

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This is a TEMPORARY profile.
// In the next step, we will load this dynamically from Firestore.
const tempProfile: UserProfile = {
    instituteId: 'yogaflow-manager-uqjpc',
    status: 'active',
};

const protectedRoutes = ['/', '/schedule', '/students', '/instructors', '/specializations', '/spaces', '/levels', '/tariffs', '/statistics'];
const authRoutes = ['/login'];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (loading) return;

        const userIsLoggedIn = !!user;
        const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
        const isAuthRoute = authRoutes.includes(pathname);

        if (!userIsLoggedIn && isProtectedRoute) {
            router.push('/login');
        } else if (userIsLoggedIn && isAuthRoute) {
            router.push('/');
        }
    }, [user, loading, pathname, router]);

    const login = async ({ email, password }: LoginCredentials) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    const value = {
        user,
        // We use the temporary profile for now. The user object is real.
        userProfile: user ? tempProfile : null,
        loading,
        login,
        logout,
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
