'use client';

import React, { createContext, useContext, type ReactNode } from 'react';

// Esta es una versión temporal y neutralizada de AuthContext para arreglar la compilación.
// Proporciona valores falsos para que los componentes que lo usan no se rompan.
const AuthContext = createContext<any>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = {
    user: null,
    userProfile: null,
    loading: false,
    login: async () => { console.log("Login disabled in recovery mode."); },
    signup: async () => { console.log("Signup disabled in recovery mode."); },
    logout: async () => { console.log("Logout disabled in recovery mode."); },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Devuelve un objeto falso para prevenir fallos en los componentes que lo usan.
    return { user: null, userProfile: null, loading: false };
  }
  return context;
}
