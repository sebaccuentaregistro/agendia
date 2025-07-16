
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, writeBatch, updateDoc } from 'firebase/firestore';
import type { LoginCredentials, SignupCredentials, UserProfile, Institute, Operator } from '@/types';
import { usePathname, useRouter } from 'next/navigation';

const PIN_VERIFIED_KEY = 'agendia-pin-verified';
const ACTIVE_OPERATOR_KEY = 'agendia-active-operator';

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  institute: Institute | null;
  loading: boolean;
  isPinVerified: boolean;
  activeOperator: Operator | null;
  setPinVerified: (isVerified: boolean) => void;
  setActiveOperator: (operator: Operator) => void;
  logoutOperator: () => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  validatePin: (pin: string) => Promise<boolean>;
  setupOwnerPin: (data: { ownerPin: string; recoveryEmail: string }) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const protectedRoutes = ['/', '/schedule', '/students', '/instructors', '/specializations', '/spaces', '/levels', '/tariffs', '/statistics', '/payments', '/operators'];
const authRoutes = ['/login'];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [institute, setInstitute] = useState<Institute | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPinVerified, setIsPinVerified] = useState(false);
    const [activeOperator, _setActiveOperator] = useState<Operator | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    const fetchInstituteData = useCallback(async (instituteId: string) => {
        const instituteDocRef = doc(db, 'institutes', instituteId);
        const instituteDocSnap = await getDoc(instituteDocRef);
        if (instituteDocSnap.exists()) {
            const instituteData = { id: instituteDocSnap.id, ...instituteDocSnap.data() } as Institute;
            setInstitute(instituteData);
            return instituteData;
        }
        setInstitute(null);
        return null;
    }, []);
    
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

    const setActiveOperator = useCallback((operator: Operator | null) => {
        _setActiveOperator(operator);
        if (operator) {
            try {
                sessionStorage.setItem(ACTIVE_OPERATOR_KEY, JSON.stringify(operator));
            } catch (e) {
                console.warn("Could not set sessionStorage item for active operator.");
            }
        } else {
            try {
                sessionStorage.removeItem(ACTIVE_OPERATOR_KEY);
            } catch (e) {
                console.warn("Could not remove sessionStorage item for active operator.");
            }
        }
    }, []);

    const logoutOperator = () => {
        setActiveOperator(null);
    };

    const fetchUserData = useCallback(async (user: User) => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const profileData = userDocSnap.data() as UserProfile;
            setUserProfile(profileData);

            if (profileData.instituteId) {
                await fetchInstituteData(profileData.instituteId);
            }
            return profileData;
        } else {
            setUserProfile(null);
            setInstitute(null);
            return null;
        }
    }, [fetchInstituteData]);

    useEffect(() => {
        try {
            const storedPinStatus = sessionStorage.getItem(PIN_VERIFIED_KEY);
            if (storedPinStatus === 'true') {
                setIsPinVerified(true);
            }
            const storedOperator = sessionStorage.getItem(ACTIVE_OPERATOR_KEY);
            if (storedOperator) {
                _setActiveOperator(JSON.parse(storedOperator));
            }
        } catch(e) {
            console.warn("Could not access sessionStorage.");
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoading(true); // Start loading when auth state changes
            if (user) {
                setUser(user);
                await fetchUserData(user);
            } else {
                setUser(null);
                setUserProfile(null);
                setInstitute(null);
                setPinVerified(false); // Clear pin status on logout
                setActiveOperator(null); // Clear active operator on logout
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [setPinVerified, fetchUserData, setActiveOperator]);

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
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
            // Force refetch of user data upon login
            await fetchUserData(userCredential.user);
        }
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
        setActiveOperator(null);
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

    const sendPasswordReset = async (email: string) => {
        return sendPasswordResetEmail(auth, email);
    };

    const value = {
        user,
        userProfile,
        institute,
        loading,
        isPinVerified,
        activeOperator,
        setPinVerified,
        setActiveOperator,
        logoutOperator,
        login,
        signup,
        logout,
        validatePin,
        setupOwnerPin,
        sendPasswordReset,
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
