'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { GoogleIcon } from '@/components/google-icon';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signupWithEmail, loginWithGoogle } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await signupWithEmail(values);
      toast({
        title: '¡Registro exitoso!',
        description: 'Tu cuenta ha sido creada y está pendiente de aprobación.',
      });
      router.push('/login'); // Redirect to login, where they'll see the pending state
    } catch (error: any) {
      console.error(error);
      const description = error.code === 'auth/email-already-in-use' 
        ? 'Este email ya está registrado. Por favor, inicia sesión.'
        : 'No se pudo crear la cuenta. Inténtalo de nuevo.';
      toast({
        variant: 'destructive',
        title: 'Error en el registro',
        description,
      });
    } finally {
        setIsLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
       toast({
        title: '¡Registro exitoso!',
        description: 'Tu cuenta ha sido creada y está pendiente de aprobación.',
      });
      router.push('/dashboard'); // Will be caught by app shell to show pending state
    } catch (error: any) {
       console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error de Google',
        description: 'No se pudo registrar con Google. Por favor, inténtalo de nuevo.',
      });
    } finally {
        setIsGoogleLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-purple-200 to-violet-200 dark:from-slate-900 dark:via-purple-950 dark:to-blue-950 p-4">
       <Card className="w-full max-w-sm bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
         <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
                <Heart className="h-8 w-8 text-fuchsia-500" />
                <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">Crear Cuenta</CardTitle>
            </div>
          <CardDescription>
            Regístrate para empezar a gestionar tu estudio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="tu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>
            </form>
          </Form>

            <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">O</span>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={isLoading || isGoogleLoading}>
                <GoogleIcon className="mr-2 h-5 w-5" />
                {isGoogleLoading ? 'Cargando...' : 'Registrarse con Google'}
            </Button>
          
           <p className="mt-4 text-center text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                  Inicia Sesión
              </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
