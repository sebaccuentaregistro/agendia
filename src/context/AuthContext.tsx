
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { LoginCredentials } from '@/types';
import { doc, setDoc, serverTimestamp, onSnapshot, writeBatch, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const login = (credentials: LoginCredentials) => {
    return signInWithEmailAndPassword(auth, credentials.email, credentials.password);
  };

  const signupWithEmail = async (credentials: LoginCredentials) => {
    const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
    const user = userCredential.user;

    // This is a multi-tenant app. Create an institute for the new user.
    const batch = writeBatch(db);

    // 1. Create a new institute document
    const newInstituteRef = doc(collection(db, 'institutes'));
    batch.set(newInstituteRef, {
      name: 'Mi Estudio', // Default name
      ownerId: user.uid,
      createdAt: serverTimestamp(),
    });
    
    // 2. Create the user profile and link it to the new institute
    const userDocRef = doc(db, 'users', user.uid);
    batch.set(userDocRef, {
      email: user.email,
      status: 'active', // User is active immediately
      instituteId: newInstituteRef.id, // Link to the new institute
      createdAt: serverTimestamp(),
    });

    // Commit both operations at once
    await batch.commit();

    return userCredential;
  };

  const logout = () => {
    setUserProfile(null);
    return signOut(auth);
  };

  useEffect(() => {
    let unsubscribeProfile: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Clean up previous profile listener
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
             // This case might happen if user is created in Auth but Firestore fails.
             // The signup/login logic should handle this, but as a fallback, we clear the profile.
            setUserProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
          setLoading(false);
          toast({
            variant: "destructive",
            title: "Error de perfil",
            description: "No se pudo cargar el perfil de usuario."
          })
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
  }, [toast]);

  const value = {
    user,
    userProfile,
    loading,
    login,
    logout,
    signupWithEmail,
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
