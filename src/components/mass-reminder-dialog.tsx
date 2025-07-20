
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { WhatsAppIcon } from './whatsapp-icon';
import type { PaymentReminderInfo } from '@/types';

interface MassReminderDialogProps {
  reminders: PaymentReminderInfo[];
  onOpenChange: (open: boolean) => void;
}

export function MassReminderDialog({ reminders, onOpenChange }: MassReminderDialogProps) {
    const { institute } = useAuth();
    const { toast } = useToast();
    
    if (reminders.length === 0) return null;

    const genericMessage = `¡Hola! Te recordamos que tu próximo pago para ${institute?.name || 'el estudio'} está por vencer. ¡Puedes abonar en tu próxima clase! Gracias 😊`;

    const handleCopy = () => {
        navigator.clipboard.writeText(genericMessage);
        toast({ title: 'Mensaje copiado', description: 'El recordatorio está listo para ser pegado.' });
    };

    return (
        <Dialog open={true} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Enviar Recordatorios a Todos</DialogTitle>
                    <DialogDescription>
                        Copia el mensaje y luego haz clic en cada contacto para enviar el recordatorio por WhatsApp.
                    </DialogDescription>
                </DialogHeader>
                <div className="my-4 space-y-4">
                    <div>
                        <Label htmlFor="reminder-message" className="text-sm font-medium">Mensaje a Enviar</Label>
                        <Textarea id="reminder-message" readOnly value={genericMessage} rows={4} className="mt-2" />
                        <Button onClick={handleCopy} size="sm" className="w-full mt-2">Copiar Mensaje</Button>
                    </div>
                    <div>
                        <h4 className="font-medium text-sm mb-2">Destinatarios ({reminders.length})</h4>
                         <ScrollArea className="h-48 rounded-md border">
                            <div className="p-2 space-y-1">
                                {reminders.map(reminder => (
                                    <div key={reminder.person.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                        <p className="font-medium text-sm">{reminder.person.name}</p>
                                        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700">
                                            <a href={`https://wa.me/${reminder.person.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                                                <WhatsAppIcon />
                                            </a>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
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
