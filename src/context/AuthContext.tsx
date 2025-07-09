'use client';
import React, { createContext, useContext, ReactNode } from 'react';

// This context is intentionally left empty to disable authentication and remove its faulty logic.
const AuthContext = createContext<any>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
export function useAuth() {
  // Return a dummy object that matches the expected shape to prevent errors in components that might still call it.
  return { user: null, userProfile: null, loading: false, logout: () => {}, login: () => {}, signup: () => {} };
}
