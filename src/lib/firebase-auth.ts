
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { LoginCredentials } from '@/types';

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

// This function is called upon successful signup to create a user profile document.
const handleAuthSuccess = async (userCredential: any, toast: (options: any) => void) => {
  const user = userCredential.user;
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    await setDoc(userDocRef, {
      email: user.email,
      status: 'pending',
      instituteId: null,
      createdAt: serverTimestamp(),
    });
    toast({
      title: '¡Registro Exitoso!',
      description: 'Tu cuenta ha sido creada y está pendiente de aprobación por un administrador.',
    });
  }
  return userCredential;
};

// --- EXPORTED AUTH FUNCTIONS ---

export const doLoginWithEmailAndPassword = async (credentials: LoginCredentials, toast: (options: any) => void) => {
  try {
    return await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
  } catch (error: any) {
    handleAuthError(error, toast);
    // The error is re-thrown by handleAuthError
  }
};

export const doSignupWithEmailAndPassword = async (credentials: LoginCredentials, toast: (options: any) => void) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
    return await handleAuthSuccess(result, toast);
  } catch (error: any) {
    handleAuthError(error, toast);
    // The error is re-thrown by handleAuthError
  }
};

export const doSendPasswordReset = async (email: string, toast: (options: any) => void) => {
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
  return signOut(auth);
};
