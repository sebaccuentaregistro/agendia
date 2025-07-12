
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, writeBatch, updateDoc } from 'firebase/firestore';
import type { LoginCredentials, SignupCredentials, UserProfile, Institute } from '@/types';
import { usePathname, useRouter } from 'next/navigation';

const PIN_VERIFIED_KEY = 'agendia-pin-verified';

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  institute: Institute | null;
  loading: boolean;
  isPinVerified: boolean;
  setPinVerified: (isVerified: boolean) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  validatePin: (pin: string) => Promise<boolean>;
  setupOwnerPin: (data: { ownerPin: string; recoveryEmail: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const protectedRoutes = ['/', '/schedule', '/students', '/instructors', '/specializations', '/spaces', '/levels', '/tariffs', '/statistics', '/payments'];
const authRoutes = ['/login'];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [institute, setInstitute] = useState<Institute | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPinVerified, setIsPinVerified] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const fetchInstituteData = async (instituteId: string) => {
        const instituteDocRef = doc(db, 'institutes', instituteId);
        const instituteDocSnap = await getDoc(instituteDocRef);
        if (instituteDocSnap.exists()) {
            const instituteData = { id: instituteDocSnap.id, ...instituteDocSnap.data() } as Institute;
            setInstitute(instituteData);
            return instituteData;
        }
        setInstitute(null);
        return null;
    };
    
    const setPinVerified = useCallback((isVerified: boolean) => {
        setIsPinVerified(isVerified);
        if (isVerified) {
            try {
                sessionStorage.setItem(PIN_VERIFIED_KEY, 'true');
            } catch (e) {
                console.warn("Could not set sessionStorage item for PIN verification.");
            }
        } else {
            try {
                sessionStorage.removeItem(PIN_VERIFIED_KEY);
            } catch (e) {
                console.warn("Could not remove sessionStorage item for PIN verification.");
            }
        }
    }, []);

    useEffect(() => {
        try {
            const storedPinStatus = sessionStorage.getItem(PIN_VERIFIED_KEY);
            if (storedPinStatus === 'true') {
                setIsPinVerified(true);
            }
        } catch(e) {
            console.warn("Could not access sessionStorage for PIN verification.");
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const profileData = userDocSnap.data() as UserProfile;
                    setUserProfile(profileData);

                    if (profileData.instituteId) {
                       await fetchInstituteData(profileData.instituteId);
                    }

                } else {
                    setUserProfile(null);
                    setInstitute(null);
                }
            } else {
                setUser(null);
                setUserProfile(null);
                setInstitute(null);
                setPinVerified(false); // Clear pin status on logout
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [setPinVerified]);

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

        const batch = writeBatch(db);

        const instituteRef = doc(collection(db, 'institutes'));
        batch.set(instituteRef, {
            name: instituteName,
            ownerId: newUser.uid,
            createdAt: new Date(),
            ownerPin: ownerPin,
            recoveryEmail: recoveryEmail,
        });

        const userRef = doc(db, 'users', newUser.uid);
        batch.set(userRef, {
            email: newUser.email,
            instituteId: instituteRef.id,
            status: 'pending',
            createdAt: new Date(),
        });
        
        await batch.commit();
    };

    const logout = async () => {
        await signOut(auth);
        setPinVerified(false);
        router.push('/login');
    };
    
    const validatePin = async (pin: string): Promise<boolean> => {
        if (!institute) return false;
        return institute.ownerPin === pin;
    };

    const setupOwnerPin = async (data: { ownerPin: string; recoveryEmail: string }) => {
        if (!institute) throw new Error("No hay un instituto cargado.");
        
        const instituteRef = doc(db, 'institutes', institute.id);
        await updateDoc(instituteRef, {
            ownerPin: data.ownerPin,
            recoveryEmail: data.recoveryEmail,
        });
        const updatedInstitute = await fetchInstituteData(institute.id);
        setInstitute(updatedInstitute);
    };

    const value = {
        user,
        userProfile,
        institute,
        loading,
        isPinVerified,
        setPinVerified,
        login,
        signup,
        logout,
        validatePin,
        setupOwnerPin,
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
