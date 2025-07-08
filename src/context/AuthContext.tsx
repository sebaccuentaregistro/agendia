'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { doLoginWithEmailAndPassword, doSignupWithEmailAndPassword, doLogout, SignupCredentials } from '@/lib/firebase-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type UserProfile = {
  instituteId: string;
  status: 'pending' | 'active';
};

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserProfile(userDocSnap.data() as UserProfile);
          } else {
            console.warn("User document not found in Firestore for UID:", firebaseUser.uid);
            setUserProfile(null); // User exists in Auth, but not in Firestore DB.
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
          toast({ variant: 'destructive', title: 'Error de Perfil', description: 'No se pudo cargar tu perfil de usuario.' });
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const result = await doLoginWithEmailAndPassword(email, password);
    if (!result.success) {
      console.error("Login Error:", result.error?.code, result.error?.message);
      let description = 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
      if (result.error?.code === 'auth/wrong-password' || result.error?.code === 'auth/user-not-found' || result.error?.code === 'auth/invalid-credential') {
        description = 'El email o la contraseña son incorrectos. Por favor, verifica tus datos.';
      } else if (result.error?.code === 'auth/too-many-requests') {
        description = 'Demasiados intentos de inicio de sesión fallidos. Por favor, intenta de nuevo más tarde.';
      }
      toast({ variant: 'destructive', title: 'Error de inicio de sesión', description });
      setLoading(false);
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    setLoading(true);
    const result = await doSignupWithEmailAndPassword(credentials);
    if (!result.success) {
      let description = 'Ocurrió un error inesperado al crear tu cuenta.';
      if (result.error?.code === 'auth/email-already-in-use') {
        description = 'Este email ya está registrado. Por favor, intenta con otro.';
      }
      toast({ variant: 'destructive', title: 'Error de Registro', description });
      setLoading(false);
    } else {
       toast({
          title: '¡Registro Exitoso!',
          description: "Tu cuenta ha sido creada. Ahora un administrador debe aprobarla.",
        });
        // The onAuthStateChanged listener will handle setting user state and redirecting.
    }
  };

  const logout = async () => {
    setLoading(true);
    await doLogout();
    setUser(null);
    setUserProfile(null);
    // No need to setLoading(false) here because the onAuthStateChanged will trigger and do it.
  };

  const value = { user, userProfile, loading, login, signup, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
