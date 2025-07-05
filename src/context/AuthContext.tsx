
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
  login: (email: string, password: string) => Promise<void>;
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
    let description = 'Ocurrió un error inesperado. Por favor, revisa tu conexión y vuelve a intentarlo.';
    const title = action === 'login' ? 'Error al Iniciar Sesión' : 'Error de Registro';

    switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            description = 'El email o la contraseña son incorrectos. Por favor, verifica tus credenciales e inténtalo de nuevo.';
            break;
        case 'auth/email-already-in-use':
          description = 'Este email ya está en uso. Por favor, intenta iniciar sesión o recuperar tu contraseña.';
          break;
        case 'auth/weak-password':
          description = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
          break;
        case 'auth/network-request-failed':
            description = 'Error de red. Por favor, comprueba tu conexión a internet e inténtalo de nuevo.';
            break;
        case 'auth/api-key-not-valid':
            description = 'La clave de API de Firebase no es válida. Asegúrate de que las credenciales en tu archivo .env.local sean correctas.';
            break;
        default:
             console.error(`Unhandled Auth Error (${action}):`, error.code, error.message);
             // The generic description defined above will be used.
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

  const login = async (email: string, password: string) => {
    const result = await doLoginWithEmailAndPassword(email, password);
    if (result.error) {
      handleAuthError(result.error, 'login');
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    const result = await doSignupWithEmailAndPassword(credentials);
    if (result.success && result.userCredential?.user) {
      const user = result.userCredential.user;
      const batch = writeBatch(db);
      const newInstituteRef = doc(collection(db, 'institutes'));
      batch.set(newInstituteRef, {
        name: 'Agendia',
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });
      
      const userDocRef = doc(db, 'users', user.uid);
      batch.set(userDocRef, {
        email: user.email,
        status: 'active',
        instituteId: newInstituteRef.id,
        createdAt: serverTimestamp(),
      });

      try {
        await batch.commit();
        toast({
            title: '¡Bienvenido/a a Agendia!',
            description: 'Tu cuenta y tu estudio han sido creados.',
        });
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
