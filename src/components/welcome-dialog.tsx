
'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import type { Person, NewPersonData } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useStudio } from '@/context/StudioContext';

// Accept a more generic type that covers both Person and NewPersonData
type WelcomePerson = Partial<Person> & Pick<NewPersonData, 'name' | 'phone'>;

export function WelcomeDialog({ person, onOpenChange }: { person: WelcomePerson | null; onOpenChange: (open: boolean) => void; }) {
    const { institute } = useAuth();
    const { tariffs } = useStudio();
    
    if (!person) return null;

    const tariff = person.tariffId ? tariffs.find(t => t.id === person.tariffId) : null;

    const welcomeMessage = `¡Hola, ${person.name}! 👋 Te damos la bienvenida a ${institute?.name || 'nuestro estudio'}. ¡Estamos muy contentos de tenerte con nosotros!${tariff ? ` Tu plan es "${tariff.name}".` : ''} ¡Nos vemos pronto en clase!`;

    const encodedMessage = encodeURIComponent(welcomeMessage);
    const whatsappLink = `https://wa.me/${person.phone.replace(/\D/g, '')}?text=${encodedMessage}`;

    return (
        <Dialog open={!!person} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>¡Nueva Persona Añadida!</DialogTitle>
                    <DialogDescription>
                        ¿Quieres enviarle un mensaje de bienvenida a {person.name} por WhatsApp?
                    </DialogDescription>
                </DialogHeader>
                <div className="my-4 space-y-4">
                    <div className="rounded-md border bg-muted/50 p-4 text-sm">
                        <p>{welcomeMessage}</p>
                    </div>
                    <Button asChild className="w-full">
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" onClick={() => onOpenChange(false)}>
                            <Send className="mr-2 h-4 w-4" />
                            Enviar Bienvenida por WhatsApp
                        </a>
                    </Button>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        No, gracias
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
