'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doLogout, doLoginWithEmailAndPassword, doSignupWithEmailAndPassword, type SignupCredentials } from '@/lib/firebase-auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, writeBatch } from 'firebase/firestore';
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
            // This can happen if a user is created in Auth but the Firestore doc creation fails.
            // The new signup logic ensures this is an atomic operation, but for existing users, this might be an issue.
            // For now, we set profile to null, which will keep them on the login/signup page.
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
      
      // Use a batch to perform multiple writes atomically
      const batch = writeBatch(db);

      // 1. Create a new institute document for this user
      const newInstituteRef = doc(collection(db, 'institutes'));
      batch.set(newInstituteRef, {
        name: 'Mi Estudio', // Default name
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });
      
      // 2. Create the user's profile and link it to the new institute, making them active immediately
      const userDocRef = doc(db, 'users', user.uid);
      batch.set(userDocRef, {
        email: user.email,
        status: 'active', // User is active immediately
        instituteId: newInstituteRef.id, // Link to the new institute
        createdAt: serverTimestamp(),
      });

      try {
        // Commit both operations at once
        await batch.commit();
        toast({
            title: '¡Bienvenido/a a Agendia!',
            description: 'Tu cuenta y tu estudio han sido creados.',
        });
        // AppShell will handle redirection now that user will have an active profile
      } catch (dbError) {
        console.error("Error creating user profile and institute:", dbError);
        toast({ variant: 'destructive', title: 'Error de Perfil', description: 'Tu cuenta fue creada, pero no pudimos configurar tu estudio. Contacta a soporte.' });
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
