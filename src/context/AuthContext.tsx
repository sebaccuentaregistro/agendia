// This is a placeholder AuthContext to restore app functionality without a real login.
// It simulates a logged-in, active user.

'use client';
import React, { createContext, useContext, ReactNode, useState, useMemo } from 'react';

type UserProfile = {
  status: 'active' | 'pending';
  instituteId: string;
};

type AuthContextType = {
  user: object | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  login: (credentials: any) => Promise<any>;
  signup: (credentials: any) => Promise<any>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [dummyUser] = useState({ uid: 'dummy-user-id' });
  const [dummyProfile] = useState<UserProfile>({ 
    status: 'active',
    instituteId: 'yogaflow-manager-uqjpc' 
  });

  const value = useMemo(() => ({
    user: dummyUser,
    userProfile: dummyProfile,
    loading: false, // Set loading to false so the app renders immediately
    logout: async () => {
      // This is a dummy function, it won't do anything in this simulated context
      console.log("Logout function called (simulated).");
    },
    login: async () => {
      console.log("Login function called (simulated).");
      return Promise.resolve();
    },
    signup: async () => {
      console.log("Signup function called (simulated).");
      return Promise.resolve();
    },
  }), [dummyUser, dummyProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
