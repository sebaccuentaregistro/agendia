'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { GoogleIcon } from '@/components/google-icon';

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { signupWithGoogle } = useAuth();

  async function handleGoogleSignup() {
    setIsLoading(true);
    try {
      await signupWithGoogle();
      // AppShell will handle redirection automatically upon login.
    } catch (error: any) {
      // The context will show a toast on error
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-purple-200 to-violet-200 dark:from-slate-900 dark:via-purple-950 dark:to-blue-950 p-4">
      <Card className="w-full max-w-sm bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-fuchsia-500" />
            <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Agendia
            </CardTitle>
          </div>
          <CardDescription>
            Crea una cuenta para empezar a gestionar tu estudio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <Button 
            onClick={handleGoogleSignup} 
            className="w-full" 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Creando cuenta...' : (
              <>
                <GoogleIcon className="mr-2 h-5 w-5" />
                Registrarse con Google
              </>
            )}
          </Button>
          <div className="mt-4 text-center text-sm">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="underline">
              Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
