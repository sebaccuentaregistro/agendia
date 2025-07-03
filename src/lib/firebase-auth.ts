'use client';

import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, UserCredential } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

// This is a generic error handler for Firebase Auth errors.
const handleAuthError = (error: any, toast: (options: any) => void) => {
  console.error("Authentication Error:", error.code, error.message);
  let description = 'Ocurrió un error. Por favor, inténtalo de nuevo.';
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
    case 'auth/popup-closed-by-user':
        description = 'Has cerrado la ventana de inicio de sesión.';
        break;
    case 'auth/network-request-failed':
        description = 'Error de red. Por favor, comprueba tu conexión a internet.';
        break;
  }
  toast({ variant: 'destructive', title: 'Error de Autenticación', description });
  throw error; // Re-throw the error to be caught by the caller if needed
};


// --- EXPORTED AUTH FUNCTIONS ---
type LoginCredentials = {
  email: string;
  password: string;
}

export const doLoginWithEmailAndPassword = async (credentials: LoginCredentials, toast: (options: any) => void): Promise<UserCredential | undefined> => {
  const auth = getFirebaseAuth();
  try {
    return await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
  } catch (error: any) {
    handleAuthError(error, toast);
  }
};

export const doSignupWithEmailAndPassword = async (credentials: LoginCredentials, toast: (options: any) => void): Promise<UserCredential | undefined> => {
  const auth = getFirebaseAuth();
  try {
    return await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
  } catch (error: any) {
    handleAuthError(error, toast);
  }
};

export const doSendPasswordReset = async (email: string, toast: (options: any) => void) => {
  const auth = getFirebaseAuth();
  try {
    await sendPasswordResetEmail(auth, email);
    toast({
      title: 'Correo de recuperación enviado',
      description: 'Revisa tu bandeja de entrada para restablecer tu contraseña.',
    });
  } catch (error: any) {
    console.error("Password Reset Error:", error.code, error.message);
    let description = 'Ocurrió un error. Por favor, inténtalo de nuevo.';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
        description = 'No se encontró ninguna cuenta con este correo electrónico.';
    }
    toast({ variant: 'destructive', title: 'Error al enviar correo', description });
    throw error;
  }
};

export const doLogout = () => {
  const auth = getFirebaseAuth();
  return signOut(auth);
};
