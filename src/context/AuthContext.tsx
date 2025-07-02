'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, onSnapshot, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { LoginCredentials } from '@/types';

interface AppUserProfile {
  email: string;
  status: 'pending' | 'active';
  instituteId: string | null;
}

interface AuthContextType {
  user: User | null;
  userProfile: AppUserProfile | null;
  loading: boolean;
  loginWithEmailAndPassword: (credentials: LoginCredentials) => Promise<any>;
  signupWithEmailAndPassword: (credentials: LoginCredentials) => Promise<any>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleAuthSuccess = async (userCredential: any) => {
    const user = userCredential.user;
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // This is a new user signing up.
      await setDoc(userDocRef, {
        email: user.email,
        status: 'pending', // All new users start as pending
        instituteId: null,   // An admin must assign an institute
        createdAt: serverTimestamp(),
      });
      toast({
        title: '¡Registro Exitoso!',
        description: 'Tu cuenta ha sido creada y está pendiente de aprobación por un administrador.',
      });
    }
    // For existing users, onAuthStateChanged will handle loading their profile.
    return userCredential;
  };
  
  const handleAuthError = (error: any) => {
      console.error("Authentication Error:", error.code, error.message);
      let description = 'Ocurrió un error. Por favor, inténtalo de nuevo.';
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            description = 'El email o la contraseña son incorrectos. Por favor, verifica tus credenciales.';
            break;
        case 'auth/email-already-in-use':
            description = 'Este email ya está registrado. Por favor, intenta iniciar sesión.';
            break;
        case 'auth/weak-password':
            description = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
            break;
        case 'auth/popup-closed-by-user':
            description = 'Has cerrado la ventana de inicio de sesión.';
            break;
        case 'auth/network-request-failed':
            description = 'Error de red. Por favor, comprueba tu conexión a internet.';
            break;
      }

      toast({
        variant: 'destructive',
        title: 'Error de Autenticación',
        description: description,
      });
  }
  
  const loginWithEmailAndPassword = async ({ email, password }: LoginCredentials) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      handleAuthError(error);
      throw error;
    }
  };

  const signupWithEmailAndPassword = async ({ email, password }: LoginCredentials) => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return handleAuthSuccess(result);
    } catch (error: any) {
        handleAuthError(error);
        throw error;
    }
  };

  const logout = () => {
    setUserProfile(null);
    return signOut(auth);
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Correo de recuperación enviado',
        description: 'Revisa tu bandeja de entrada para restablecer tu contraseña.',
      });
    } catch (error: any) {
      console.error("Password Reset Error:", error.code, error.message);
      let description = 'Ocurrió un error. Por favor, inténtalo de nuevo.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
          description = 'No se encontró ninguna cuenta con este correo electrónico.';
      }
      toast({
        variant: 'destructive',
        title: 'Error al enviar correo',
        description,
      });
      throw error;
    }
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
            // This can happen briefly if a user signs up and the doc hasn't been created yet.
            // The handleAuthSuccess function ensures the doc is created.
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
    loginWithEmailAndPassword,
    signupWithEmailAndPassword,
    logout,
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
