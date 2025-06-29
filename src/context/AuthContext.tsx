'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { LoginCredentials } from '@/types';
import { doc, getDoc, collection, getDocs, setDoc, query, addDoc } from 'firebase/firestore';

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
            console.log("User document not found in 'users'. Checking for existing institutes...");
            
            const institutesQuery = query(collection(db, 'institutes'));
            const institutesSnapshot = await getDocs(institutesQuery);
            
            let newInstituteId: string | null = null;

            if (institutesSnapshot.empty) {
              // This is the very first user for this entire project. Create an institute for them.
              console.log("No institutes found. Creating a new one for the first user.");
              const instituteRef = await addDoc(collection(db, 'institutes'), {
                name: "Mi Instituto", // A default name
                createdAt: new Date(),
                owner: user.uid
              });
              newInstituteId = instituteRef.id;
              console.log(`New institute created with ID: ${newInstituteId}`);
            } else if (institutesSnapshot.size === 1) {
              // Exactly one institute exists. Link this new user to it.
              const singleInstitute = institutesSnapshot.docs[0];
              newInstituteId = singleInstitute.id;
              console.log(`Found a single institute (ID: ${newInstituteId}). Linking user ${user.uid}...`);
            }

            if (newInstituteId) {
              // We have an institute ID, either new or existing. Link the user.
              await setDoc(doc(db, 'users', user.uid), {
                instituteId: newInstituteId,
              });
              setInstituteId(newInstituteId);
              console.log("User successfully linked to institute.");
            } else {
              // This case handles institutesSnapshot.size > 1, which is an ambiguous state.
              console.error(`Could not auto-link user. Found ${institutesSnapshot.size} institutes, but expected 0 or 1 for a new user.`);
              await logout();
            }
          }
        } else {
          setUser(null);
          setInstituteId(null);
        }
      } catch (error) {
        console.error("Error during authentication state change:", error);
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
