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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setInstituteId(userDocSnap.data().instituteId);
        } else {
          // User exists in Auth, but not in our 'users' collection.
          // Let's try to automatically link them to an institute.
          console.log("User document not found. Attempting to auto-link...");
          
          const institutesQuery = query(collection(db, 'institutes'));
          const institutesSnapshot = await getDocs(institutesQuery);
          
          if (institutesSnapshot.size === 1) {
            // There is exactly one institute in the whole database.
            const singleInstitute = institutesSnapshot.docs[0];
            const singleInstituteId = singleInstitute.id;
            
            console.log(`Found a single institute (ID: ${singleInstituteId}). Linking user...`);

            // Create the user document automatically.
            await setDoc(doc(db, 'users', user.uid), {
              instituteId: singleInstituteId,
            });

            // Set the instituteId for the current session.
            setInstituteId(singleInstituteId);
            console.log("User successfully linked to institute.");

          } else {
            console.error("Could not auto-link user. Found", institutesSnapshot.size, "institutes. Expected 1.");
            setInstituteId(null);
          }
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
