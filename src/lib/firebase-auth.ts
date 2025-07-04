import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, UserCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export type SignupCredentials = {
  email: string;
  password: string;
}

type AuthResult = {
    success: boolean;
    userCredential?: UserCredential;
    error?: { code: string, message: string };
};

export const doLoginWithEmailAndPassword = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, userCredential };
  } catch (error: any) {
    return { success: false, error: { code: error.code, message: error.message } };
  }
};

export const doSignupWithEmailAndPassword = async (credentials: SignupCredentials): Promise<AuthResult> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
    return { success: true, userCredential };
  } catch (error: any) {
    return { success: false, error: { code: error.code, message: error.message } };
  }
};

export const doSendPasswordReset = async (email: string): Promise<{ success: boolean; error?: any; }> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    return { success: false, error };
  }
};

export const doLogout = () => {
  return signOut(auth);
};
