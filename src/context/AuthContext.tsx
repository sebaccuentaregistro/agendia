'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { LoginCredentials } from '@/types';
import { doc, getDoc, collection, getDocs, setDoc, query } from 'firebase/firestore';

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

  const login = (credentials: LoginCredentials) => {
    return signInWithEmailAndPassword(auth, credentials.email, credentials.password);
  };

  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setUser(user);
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setInstituteId(userDocSnap.data().instituteId);
          } else {
            console.log("User document not found in 'users'. Attempting to auto-link to a single institute...");
            
            const institutesQuery = query(collection(db, 'institutes'));
            const institutesSnapshot = await getDocs(institutesQuery);
            
            if (institutesSnapshot.size === 1) {
              const singleInstitute = institutesSnapshot.docs[0];
              const singleInstituteId = singleInstitute.id;
              
              console.log(`Found a single institute (ID: ${singleInstituteId}). Linking user ${user.uid}...`);

              await setDoc(doc(db, 'users', user.uid), {
                instituteId: singleInstituteId,
              });
              setInstituteId(singleInstituteId);
              console.log("User successfully linked.");

            } else {
              console.error(`Could not auto-link user. Found ${institutesSnapshot.size} institutes, but expected exactly 1.`);
              // Gracefully log out the user if their institute can't be determined.
              // This prevents an infinite loading state.
              await logout();
            }
          }
        } else {
          setUser(null);
          setInstituteId(null);
        }
      } catch (error) {
        console.error("Error during authentication state change:", error);
        // Ensure user is logged out on error to prevent being stuck.
        await logout();
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

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
