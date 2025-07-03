'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { doSignupWithEmailAndPassword } from '@/lib/firebase-auth';
import { useToast } from '@/hooks/use-toast';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { getFirebaseDb } from '@/lib/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const handleAuthError = (error: { code: string, message: string }) => {
    let description = 'Ocurrió un error. Por favor, inténtalo de nuevo.';
    switch (error.code) {
      case 'auth/email-already-in-use':
          description = 'Este email ya está registrado. Por favor, intenta iniciar sesión.';
          break;
      case 'auth/weak-password':
          description = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
          break;
      case 'auth/network-request-failed':
          description = 'Error de red. Por favor, comprueba tu conexión a internet.';
          break;
    }
    toast({ variant: 'destructive', title: 'Error de Registro', description });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await doSignupWithEmailAndPassword(values);

    if (result.success && result.userCredential?.user) {
      const user = result.userCredential.user;
      const db = getFirebaseDb();
      const userDocRef = doc(db, 'users', user.uid);
      
      try {
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
        // AppShell will handle redirection automatically upon auth state change.
      } catch (dbError) {
        console.error("Error creating user profile in Firestore:", dbError);
        toast({ variant: 'destructive', title: 'Error de Perfil', description: 'Tu cuenta fue creada, pero no pudimos guardar tu perfil. Contacta a soporte.' });
      }
    } else if (result.error) {
      handleAuthError(result.error);
    }
    
    setIsLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-purple-200 to-violet-200 dark:from-slate-900 dark:via-purple-950 dark:to-blue-950 p-4">
      <Card className="w-full max-w-sm bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-fuchsia-500" />
            <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              YogaFlow
            </DCardTitle>
          </div>
          <CardDescription>
            Crea una cuenta para empezar a gestionar tu estudio.
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
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creando cuenta...' : 'Registrarse'}
              </Button>
            </form>
          </Form>
          
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
