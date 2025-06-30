'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, db, googleProvider } from '@/lib/firebase';
import type { LoginCredentials } from '@/types';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

interface AppUserProfile {
  email: string;
  status: 'pending' | 'active';
  instituteId: string | null;
}

interface AuthContextType {
  user: User | null;
  userProfile: AppUserProfile | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<any>;
  signupWithEmail: (credentials: LoginCredentials) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const login = (credentials: LoginCredentials) => {
    return signInWithEmailAndPassword(auth, credentials.email, credentials.password);
  };

  const signupWithEmail = async (credentials: LoginCredentials) => {
    const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
    const user = userCredential.user;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        email: user.email,
        status: 'pending',
        instituteId: null,
        createdAt: serverTimestamp(),
      });
    }
    return userCredential;
  };
  
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
       await setDoc(userDocRef, {
        email: user.email,
        status: 'pending',
        instituteId: null,
        createdAt: serverTimestamp(),
        name: user.displayName,
      });
    }
    return result;
  };

  const logout = () => {
    setUserProfile(null);
    return signOut(auth);
  };

  useEffect(() => {
    let unsubscribeProfile: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeProfile();

      if (user) {
        setUser(user);
        const userDocRef = doc(db, 'users', user.uid);
        
        unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserProfile({
              email: data.email,
              status: data.status,
              instituteId: data.instituteId,
            });
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    login,
    logout,
    signupWithEmail,
    loginWithGoogle
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
