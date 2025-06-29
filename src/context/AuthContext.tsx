'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { LoginCredentials } from '@/types';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  instituteId: string | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [instituteId, setInstituteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Find the user's institute
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setInstituteId(userDocSnap.data().instituteId);
        } else {
          // Handle case where user exists in Auth but not in 'users' collection
          console.error("User document not found in Firestore.");
          setInstituteId(null);
        }
      } else {
        setUser(null);
        setInstituteId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (credentials: LoginCredentials) => {
    return signInWithEmailAndPassword(auth, credentials.email, credentials.password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    instituteId,
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
