'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doLogout, doLoginWithEmailAndPassword, doSignupWithEmailAndPassword, type SignupCredentials } from '@/lib/firebase-auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  login: (credentials: SignupCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleAuthError = (error: { code: string, message: string }, action: 'login' | 'signup') => {
    let description = 'Ocurrió un error. Por favor, inténtalo de nuevo.';
    const title = action === 'login' ? 'Error de Autenticación' : 'Error de Registro';

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
        case 'auth/network-request-failed':
            description = 'Error de red. Por favor, comprueba tu conexión a internet.';
            break;
    }
    toast({ variant: 'destructive', title, description });
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as AppUserProfile);
          } else {
            setUserProfile(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (credentials: SignupCredentials) => {
    const result = await doLoginWithEmailAndPassword(credentials.email, credentials.password);
    if (result.error) {
      handleAuthError(result.error, 'login');
    }
    // AppShell handles redirection on success
  };

  const signup = async (credentials: SignupCredentials) => {
    const result = await doSignupWithEmailAndPassword(credentials);
    if (result.success && result.userCredential?.user) {
      const user = result.userCredential.user;
      const userDocRef = doc(db, 'users', user.uid);
      try {
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
        // AppShell handles redirection
      } catch (dbError) {
        console.error("Error creating user profile in Firestore:", dbError);
        toast({ variant: 'destructive', title: 'Error de Perfil', description: 'Tu cuenta fue creada, pero no pudimos guardar tu perfil. Contacta a soporte.' });
      }
    } else if (result.error) {
      handleAuthError(result.error, 'signup');
    }
  };


  const logout = async () => {
    await doLogout();
    // onAuthStateChanged will handle setting user and userProfile to null
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
