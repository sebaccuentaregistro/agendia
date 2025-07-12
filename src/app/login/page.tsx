
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Heart, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { TermsDialog } from '@/components/terms-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un correo electrónico válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

const signupSchema = z.object({
  instituteName: z.string().min(3, { message: 'El nombre del instituto debe tener al menos 3 caracteres.' }),
  email: z.string().email({ message: 'Por favor, introduce un correo electrónico válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
  confirmPassword: z.string(),
  ownerPin: z.string().regex(/^\d{4}$/, { message: 'El PIN debe ser de 4 dígitos numéricos.' }),
  recoveryEmail: z.string().email({ message: 'Por favor, introduce un correo de recuperación válido.' }),
  terms: z.literal<boolean>(true, {
    errorMap: () => ({ message: 'Debes aceptar los términos y condiciones para registrarte.' }),
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

const resetPasswordSchema = z.object({
    email: z.string().email({ message: 'Por favor, introduce un correo electrónico válido.' }),
});


export default function LoginPage() {
  const { login, signup, sendPasswordReset } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { instituteName: '', email: '', password: '', confirmPassword: '', ownerPin: '', recoveryEmail: '', terms: false },
  });

  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    setError(null);
    setLoading(true);
    try {
      await login(values);
      router.push('/');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('El correo electrónico o la contraseña son incorrectos.');
      } else {
        setError('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
      }
      console.error(err);
    } finally {
        setLoading(false);
    }
  }

  async function onSignupSubmit(values: z.infer<typeof signupSchema>) {
    setError(null);
    setLoading(true);
    try {
      await signup(values);
      setSignupSuccess(true);
    } catch (err: any) {
       if (err.code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya está registrado.');
      } else {
        setError('Ocurrió un error inesperado durante el registro. Por favor, inténtalo de nuevo.');
      }
      console.error(err);
    } finally {
        setLoading(false);
    }
  }
  
  async function onResetPasswordSubmit(values: z.infer<typeof resetPasswordSchema>) {
    setResetError(null);
    setResetSuccess(null);
    setLoading(true);
    try {
      await sendPasswordReset(values.email);
      setResetSuccess(`Se ha enviado un correo de recuperación a ${values.email}. Por favor, revisa tu bandeja de entrada.`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setResetError('No se encontró ninguna cuenta con ese correo electrónico.');
      } else {
        setResetError('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (signupSuccess) {
    return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="flex items-center gap-3 mb-8">
         <Heart className="h-10 w-10 text-fuchsia-500" />
         <h1 className="text-4xl font-bold">Agendia</h1>
        </div>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>¡Registro Exitoso!</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="default" className="border-primary/50 text-primary">
                <AlertTitle>Cuenta Pendiente de Aprobación</AlertTitle>
                <AlertDescription>
                    Gracias por registrarte. Tu cuenta ha sido creada y está esperando la aprobación de un administrador. Recibirás una notificación por correo electrónico una vez que esté activa.
                </AlertDescription>
            </Alert>
            <Button onClick={() => setSignupSuccess(false)} className="w-full mt-6">Volver al inicio</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
    <TermsDialog isOpen={isTermsOpen} onOpenChange={setIsTermsOpen} />
    <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Recuperar Contraseña</DialogTitle>
                <DialogDescription>
                    Introduce tu correo electrónico para recibir un enlace de recuperación.
                </DialogDescription>
            </DialogHeader>
            {resetSuccess ? (
                <Alert variant="default" className="border-primary/50 text-primary">
                    <AlertTitle>¡Correo Enviado!</AlertTitle>
                    <AlertDescription>{resetSuccess}</AlertDescription>
                </Alert>
            ) : (
                <Form {...resetPasswordForm}>
                    <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
                        <FormField
                        control={resetPasswordForm.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Correo Electrónico</FormLabel>
                            <FormControl>
                                <Input placeholder="tu@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        {resetError && (
                            <Alert variant="destructive">
                                <AlertDescription>{resetError}</AlertDescription>
                            </Alert>
                        )}
                         <DialogFooter>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Enviando...' : 'Enviar enlace'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            )}
        </DialogContent>
    </Dialog>
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex items-center gap-3 mb-8">
         <Heart className="h-10 w-10 text-fuchsia-500" />
         <h1 className="text-4xl font-bold">Agendia</h1>
      </div>
      <Card className="w-full max-w-sm">
         <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="signup" className={cn(
                    "data-[state=inactive]:bg-primary/10 data-[state=inactive]:text-primary data-[state=inactive]:shadow-inner"
                )}>
                    Registrarse
                </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <CardHeader>
                    <CardTitle>Iniciar Sesión</CardTitle>
                    <CardDescription>Bienvenido de nuevo. Ingresa a tu cuenta.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Correo Electrónico</FormLabel>
                            <FormControl>
                                <Input placeholder="tu@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex justify-between items-center">
                                    <FormLabel>Contraseña</FormLabel>
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="p-0 h-auto text-xs text-primary font-semibold"
                                        onClick={() => setIsResetDialogOpen(true)}
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </Button>
                                </div>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? 'Ingresando...' : 'Ingresar'}
                        </Button>
                    </form>
                    </Form>
                </CardContent>
            </TabsContent>
            <TabsContent value="signup">
                <CardHeader>
                    <CardTitle>Crear Cuenta</CardTitle>
                    <CardDescription>Registra tu instituto para empezar a gestionar.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                         <FormField
                        control={signupForm.control}
                        name="instituteName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nombre de tu Instituto</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Centro de Yoga Flow" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={signupForm.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Correo Electrónico de Login</FormLabel>
                            <FormControl>
                                <Input placeholder="tu@email.com" {...field} />
                            </FormControl>
                             <FormDescription className="text-xs">
                                Este será el email para iniciar sesión. Puede ser uno compartido.
                             </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={signupForm.control}
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
                         <FormField
                        control={signupForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Confirmar Contraseña</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="Repite la contraseña" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={signupForm.control}
                        name="ownerPin"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>PIN de Propietario</FormLabel>
                            <FormControl>
                                <Input type="password" maxLength={4} placeholder="PIN de 4 dígitos" {...field} />
                            </FormControl>
                            <FormDescription className="text-xs">
                                Para acceder a métricas y funciones de dueño.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={signupForm.control}
                        name="recoveryEmail"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Email de Recuperación de PIN</FormLabel>
                            <FormControl>
                                <Input placeholder="tu-email-personal@email.com" {...field} />
                            </FormControl>
                             <FormDescription className="text-xs">
                                Tu email personal. Se usará solo si olvidas el PIN.
                             </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                          control={signupForm.control}
                          name="terms"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Acepto los{' '}
                                  <Button
                                    type="button"
                                    variant="link"
                                    className="p-0 h-auto text-primary font-semibold"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setIsTermsOpen(true);
                                    }}
                                  >
                                    Términos y Condiciones
                                  </Button>
                                  .
                                </FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                        {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? 'Registrando...' : 'Registrarse'}
                        </Button>
                    </form>
                    </Form>
                </CardContent>
            </TabsContent>
         </Tabs>
      </Card>
    </div>
    </>
  );
}
