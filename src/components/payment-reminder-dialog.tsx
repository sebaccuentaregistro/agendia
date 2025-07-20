
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PaymentReminderInfo } from '@/types';

interface PaymentReminderDialogProps {
  reminderInfo: PaymentReminderInfo | null;
  onOpenChange: (open: boolean) => void;
}

export function PaymentReminderDialog({ reminderInfo, onOpenChange }: PaymentReminderDialogProps) {
    const { institute } = useAuth();

    if (!reminderInfo) return null;

    const { person, dueDate } = reminderInfo;
    const formattedDueDate = format(dueDate, "dd 'de' MMMM", { locale: es });
    const reminderMessage = `¡Hola, ${person.name}! Te recordamos que tu próximo pago para ${institute?.name || 'el estudio'} vence el ${formattedDueDate}. ¡Puedes abonar en tu próxima clase! Gracias 😊`;

    const encodedMessage = encodeURIComponent(reminderMessage);
    const whatsappLink = `https://wa.me/${person.phone.replace(/\D/g, '')}?text=${encodedMessage}`;

    return (
        <Dialog open={!!reminderInfo} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Recordatorio para {person.name}</DialogTitle>
                    <DialogDescription>
                        Puedes copiar este mensaje o enviarlo directamente por WhatsApp.
                    </DialogDescription>
                </DialogHeader>
                <div className="my-4 space-y-4">
                    <div className="rounded-md border bg-muted/50 p-4 text-sm">
                        <p>{reminderMessage}</p>
                    </div>
                    <Button asChild className="w-full">
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" onClick={() => onOpenChange(false)}>
                            <Send className="mr-2 h-4 w-4" />
                            Enviar Recordatorio por WhatsApp
                        </a>
                    </Button>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
