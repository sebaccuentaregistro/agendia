'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, onSnapshot, getDoc } from 'firebase/firestore';
import type { LoginCredentials } from '@/types';

// --- AUTHENTICATION LOGIC ---
// By defining these functions outside the React component, we decouple them from the component lifecycle,
// which prevents production build optimizers from breaking them.

const handleAuthError = (error: any, toast: (options: any) => void) => {
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
  toast({ variant: 'destructive', title: 'Error de Autenticación', description });
};

const handleAuthSuccess = async (userCredential: any, toast: (options: any) => void) => {
  const user = userCredential.user;
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    await setDoc(userDocRef, {
      email: user.email,
      status: 'pending',
      instituteId: null,
      createdAt: serverTimestamp(),
    });
    toast({
      title: '¡Registro Exitoso!',
      description: 'Tu cuenta ha sido creada y está pendiente de aprobación por un administrador.',
    });
  }
  return userCredential;
};

export const doLoginWithEmailAndPassword = async (credentials: LoginCredentials, toast: (options: any) => void) => {
  try {
    return await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
  } catch (error: any) {
    handleAuthError(error, toast);
    throw error;
  }
};

export const doSignupWithEmailAndPassword = async (credentials: LoginCredentials, toast: (options: any) => void) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
    return await handleAuthSuccess(result, toast);
  } catch (error: any) {
    handleAuthError(error, toast);
    throw error;
  }
};

export const doSendPasswordReset = async (email: string, toast: (options: any) => void) => {
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
    toast({ variant: 'destructive', title: 'Error al enviar correo', description });
    throw error;
  }
};

export const doLogout = () => {
  return signOut(auth);
};


// --- CONTEXT FOR STATE MANAGEMENT ---

interface AppUserProfile {
  email: string;
  status: 'pending' | 'active';
  instituteId: string | null;
}

interface AuthContextType {
  user: User | null;
  userProfile: AppUserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
