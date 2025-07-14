'use client';

import { useState } from 'react';
import { useStudio } from '@/context/StudioContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, LogOut, UserCheck } from 'lucide-react';
import type { Operator } from '@/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function OperatorLoginScreen() {
    const { operators, loading: studioLoading } = useStudio();
    const { setActiveOperator, logout: fullLogout, institute } = useAuth();
    const router = useRouter();

    const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleOperatorSelect = (operator: Operator) => {
        setSelectedOperator(operator);
        setError('');
        setPin('');
    };

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOperator || pin.length !== 4) {
            setError('PIN inválido. Debe tener 4 dígitos.');
            return;
        }

        setLoading(true);
        setError('');

        // Simulate a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 300));

        if (selectedOperator.pin === pin) {
            setActiveOperator(selectedOperator);
        } else {
            setError('PIN incorrecto. Inténtalo de nuevo.');
            setPin('');
        }

        setLoading(false);
    };
    
    const handleFullLogout = async () => {
        await fullLogout();
        router.push('/login');
    };

    if (studioLoading) {
        return (
             <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    if (operators.length === 0) {
       return (
         <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Card className="w-full max-w-sm text-center">
                <CardHeader>
                    <CardTitle>¡Primer Paso!</CardTitle>
                    <CardDescription>
                       Para empezar, el propietario del estudio debe crear su propio perfil de operador. Esto le permitirá acceder y gestionar el sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <Alert>
                        <AlertTitle>Acción Requerida</AlertTitle>
                        <AlertDescription>
                           Ve a la sección de "Operadores" para crear tu perfil de administrador. Necesitarás tu PIN de propietario para acceder.
                        </AlertDescription>
                    </Alert>
                    <Button asChild className="w-full">
                        <Link href="/operators">Ir a Crear Operador</Link>
                    </Button>
                     <Button type="button" variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleFullLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar sesión de {institute?.name || 'la cuenta'}
                    </Button>
                </CardContent>
            </Card>
        </div>
       )
    }

    if (selectedOperator) {
        return (
             <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
                <Card className="w-full max-w-sm">
                    <CardHeader className="items-center text-center">
                         <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                            <UserCheck className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>Hola, {selectedOperator.name}</CardTitle>
                        <CardDescription>Ingresa tu PIN de 4 dígitos para continuar</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePinSubmit} className="space-y-4">
                            <Input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                maxLength={4}
                                className="h-12 text-center text-2xl tracking-[1rem]"
                                placeholder="••••"
                                autoFocus
                            />
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Ingresar
                                </Button>
                                 <Button type="button" variant="outline" className="w-full" onClick={() => setSelectedOperator(null)}>
                                    Cambiar de usuario
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>¿Quién está usando la aplicación?</CardTitle>
                    <CardDescription>Selecciona tu perfil para iniciar sesión.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                    {operators.length > 0 ? operators.map(op => (
                        <Button
                            key={op.id}
                            variant="outline"
                            className="w-full justify-start h-12"
                            onClick={() => handleOperatorSelect(op)}
                        >
                            {op.name}
                        </Button>
                    )) : (
                         <Alert>
                            <AlertTitle>No hay operadores</AlertTitle>
                            <AlertDescription>
                                El propietario del estudio debe crear al menos un operador.
                            </AlertDescription>
                        </Alert>
                    )}
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleFullLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar sesión de {institute?.name || 'la cuenta'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
