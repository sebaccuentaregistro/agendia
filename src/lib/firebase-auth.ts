'use client';

import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, UserCredential } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

type AuthResult = {
    success: boolean;
    userCredential?: UserCredential;
    error?: { code: string, message: string };
};

export const doLoginWithEmailAndPassword = async (email: string, password: string): Promise<AuthResult> => {
  const auth = getFirebaseAuth();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, userCredential };
  } catch (error: any) {
    return { success: false, error: { code: error.code, message: error.message } };
  }
};

type SignupCredentials = {
  email: string;
  password: string;
}

export const doSignupWithEmailAndPassword = async (credentials: SignupCredentials): Promise<AuthResult> => {
  const auth = getFirebaseAuth();
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
    return { success: true, userCredential };
  } catch (error: any) {
    return { success: false, error: { code: error.code, message: error.message } };
  }
};

export const doSendPasswordReset = async (email: string): Promise<{ success: boolean; error?: any; }> => {
  const auth = getFirebaseAuth();
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    return { success: false, error };
  }
};

export const doLogout = () => {
  const auth = getFirebaseAuth();
  return signOut(auth);
};