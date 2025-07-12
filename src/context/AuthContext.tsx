
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, writeBatch } from 'firebase/firestore';
import type { LoginCredentials, SignupCredentials, UserProfile } from '@/types';
import { usePathname, useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
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
                    // This can happen briefly during signup before the user profile is created.
                    // We don't treat it as an error here.
                    setUserProfile(null);
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
        const userIsPending = !!user && userProfile && userProfile.status === 'pending';

        if (!userIsLoggedIn && isProtectedRoute) {
            router.push('/login');
        } else if (userIsLoggedIn && isAuthRoute) {
            router.push('/');
        }
        
        // If user is logged in but pending, keep them on login page
        // The login page should show a "pending approval" message if it detects this state.
        if (userIsPending && isProtectedRoute) {
            router.push('/login');
        }

    }, [user, userProfile, loading, pathname, router]);

    const login = async ({ email, password }: LoginCredentials) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signup = async ({ instituteName, email, password, ownerPin, recoveryEmail }: SignupCredentials) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;

        // Use a batch write to create both documents atomically
        const batch = writeBatch(db);

        // 1. Create the new institute document
        const instituteRef = doc(collection(db, 'institutes'));
        batch.set(instituteRef, {
            name: instituteName,
            ownerId: newUser.uid,
            createdAt: new Date(),
            // TODO: Encrypt PIN before saving
            ownerPin: ownerPin, // Storing PIN
            recoveryEmail: recoveryEmail, // Storing recovery email
        });

        // 2. Create the user profile document
        const userRef = doc(db, 'users', newUser.uid);
        batch.set(userRef, {
            email: newUser.email,
            instituteId: instituteRef.id,
            status: 'pending', // Key change: new users are pending approval
            createdAt: new Date(),
        });
        
        await batch.commit();
        // The onAuthStateChanged listener will pick up the new user and their (pending) profile
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
        signup,
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
