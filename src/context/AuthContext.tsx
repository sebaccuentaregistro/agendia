
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { LoginCredentials, UserProfile } from '@/types';
import { usePathname, useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const protectedRoutes = ['/', '/schedule', '/students', '/instructors', '/specializations', '/spaces', '/levels', '/tariffs', '/statistics'];
const authRoutes = ['/login'];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                // User is signed in, let's fetch their profile.
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const profileData = userDocSnap.data() as UserProfile;
                    setUserProfile(profileData);
                } else {
                    // Handle case where user exists in Auth but not in Firestore users collection
                    console.error("No user profile found in Firestore for UID:", user.uid);
                    setUserProfile(null);
                    // Optional: logout the user if profile is required
                    await signOut(auth);
                }
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (loading) return;

        const userIsLoggedIn = !!user && !!userProfile && userProfile.status === 'active';
        const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
        const isAuthRoute = authRoutes.includes(pathname);

        if (!userIsLoggedIn && isProtectedRoute) {
            router.push('/login');
        } else if (userIsLoggedIn && isAuthRoute) {
            router.push('/');
        }
    }, [user, userProfile, loading, pathname, router]);

    const login = async ({ email, password }: LoginCredentials) => {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle fetching the profile
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setUserProfile(null);
        router.push('/login');
    };

    const value = {
        user,
        userProfile,
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
