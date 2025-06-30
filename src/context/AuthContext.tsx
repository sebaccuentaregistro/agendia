'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, db, googleProvider } from '@/lib/firebase';
import type { LoginCredentials } from '@/types';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, Timestamp } from 'firebase/firestore';
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
  loginWithGoogle: () => Promise<any>;
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
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        if (!data.status) {
          // The user document exists but is incomplete. Repair it.
          await setDoc(userDocRef, {
            status: 'pending',
            instituteId: null,
            createdAt: data.createdAt || serverTimestamp(), // Preserve original creation date
            email: user.email,
            name: user.displayName,
          }, { merge: true });
        }
      } else {
        // The user document does not exist. Create it from scratch.
        await setDoc(userDocRef, {
          email: user.email,
          status: 'pending',
          instituteId: null,
          createdAt: serverTimestamp(),
          name: user.displayName,
        });
      }
      
      return result;
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Google Sign-In popup closed by user.');
        throw error;
      }

      console.error("Error during Google Sign-In or Firestore operation:", error);
      toast({
        variant: 'destructive',
        title: 'Error de Google',
        description: `No se pudo completar la operación. ${error.message}`,
      });
      throw error;
    }
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
            // This case can happen briefly when a new user signs up.
            // We don't nullify the profile, just wait for the doc to be created.
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
