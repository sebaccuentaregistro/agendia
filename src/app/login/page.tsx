'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { GoogleIcon } from '@/components/google-icon';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const { toast } = useToast();

  async function handleGoogleLogin() {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      // AppShell will handle redirection automatically.
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al iniciar sesión',
        description: 'No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.',
      });
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-purple-200 to-violet-200 dark:from-slate-900 dark:via-purple-950 dark:to-blue-950 p-4">
       <Card className="w-full max-w-sm bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
         <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
                <Heart className="h-8 w-8 text-fuchsia-500" />
                <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">Agendia</CardTitle>
            </div>
          <CardDescription>
            Ingresa a tu cuenta para gestionar tu estudio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleGoogleLogin} 
            className="w-full" 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Ingresando...' : (
              <>
                <GoogleIcon className="mr-2 h-5 w-5" />
                Ingresar con Google
              </>
            )}
          </Button>
           <div className="mt-4 text-center text-sm">
            ¿No tienes cuenta?{" "}
            <Link href="/signup" className="underline">
              Regístrate
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
