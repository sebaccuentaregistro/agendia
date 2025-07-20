'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const pinSetupSchema = z.object({
  ownerPin: z.string().regex(/^\d{4}$/, { message: 'El PIN debe ser de 4 dígitos numéricos.' }),
  recoveryEmail: z.string().email({ message: 'Por favor, introduce un correo de recuperación válido.' }),
});

interface PinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPinVerified: () => void;
}

export function PinDialog({ open, onOpenChange, onPinVerified }: PinDialogProps) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const { institute, validatePin, setupOwnerPin } = useAuth();
    const { toast } = useToast();
    const [isSetupMode, setIsSetupMode] = useState(false);
    
    const setupForm = useForm<z.infer<typeof pinSetupSchema>>({
      resolver: zodResolver(pinSetupSchema),
      defaultValues: { ownerPin: '', recoveryEmail: institute?.recoveryEmail || '' },
    });

    useEffect(() => {
        if (open && institute) {
            if (!institute.ownerPin) {
                setIsSetupMode(true);
            } else {
                setIsSetupMode(false);
            }
        }
        setError('');
        setPin('');
        setupForm.reset({ ownerPin: '', recoveryEmail: institute?.recoveryEmail || '' });
    }, [open, institute, setupForm]);

    const handlePinSubmit = async () => {
        setError('');
        if (pin.length !== 4) {
            setError('El PIN debe tener 4 dígitos.');
            return;
        }

        const isValid = await validatePin(pin);
        
        if (isValid) {
            onPinVerified();
            onOpenChange(false);
            setPin('');
        } else {
            setError('PIN incorrecto. Inténtalo de nuevo.');
        }
    };
    
    const handleSetupSubmit = async (values: z.infer<typeof pinSetupSchema>) => {
        setError('');
        try {
            await setupOwnerPin(values);
            toast({
                title: '¡PIN configurado!',
                description: 'Tu PIN de propietario ha sido guardado de forma segura.',
            });
            onPinVerified();
            onOpenChange(false);
        } catch (err) {
            setError('Hubo un error al guardar el PIN. Inténtalo de nuevo.');
            console.error(err);
        }
    };

    if (isSetupMode) {
      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <Form {...setupForm}>
                    <form onSubmit={setupForm.handleSubmit(handleSetupSubmit)} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>Configura tu PIN de Propietario</DialogTitle>
                            <DialogDescription>
                                Es la primera vez que accedes a esta sección. Crea un PIN de 4 dígitos para proteger tus datos sensibles.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <FormField
                            control={setupForm.control}
                            name="ownerPin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nuevo PIN de 4 dígitos</FormLabel>
                                    <FormControl>
                                        <Input type="password" maxLength={4} placeholder="----" {...field} className="w-40 text-center text-2xl tracking-[1rem]" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={setupForm.control}
                            name="recoveryEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email de Recuperación de PIN</FormLabel>
                                    <FormControl>
                                        <Input placeholder="tu-email-personal@email.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit">Guardar PIN</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
      );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Acceso a Gestión Avanzada</DialogTitle>
                    <DialogDescription>
                        Introduce el PIN de 4 dígitos del propietario para continuar.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                    <Input
                        type="password"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-40 text-center text-2xl tracking-[1rem]"
                        placeholder="----"
                    />
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                    <Button onClick={handlePinSubmit}>Desbloquear</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}