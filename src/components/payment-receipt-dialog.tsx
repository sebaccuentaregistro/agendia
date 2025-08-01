
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
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';

// Definimos la estructura de la información que necesitará el diálogo.
export type ReceiptInfo = {
  personName: string;
  personPhone: string;
  tariffName: string;
  tariffPrice: number;
  nextDueDate: Date | null;
  instituteName: string;
};

interface PaymentReceiptDialogProps {
  receiptInfo: ReceiptInfo | null;
  onOpenChange: (open: boolean) => void;
}

export function PaymentReceiptDialog({ receiptInfo, onOpenChange }: PaymentReceiptDialogProps) {
  const { toast } = useToast();
  // Si no hay información de recibo, no mostramos nada.
  if (!receiptInfo) {
    return null;
  }
  
  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(receiptInfo.tariffPrice);
  
  const receiptMessage = `¡Hola, ${receiptInfo.personName}! 👋 Confirmamos tu pago de ${formattedPrice} por tu plan '${receiptInfo.tariffName}' en ${receiptInfo.instituteName}.\n\n${receiptInfo.nextDueDate ? `Tu próxima fecha de vencimiento es el ${receiptInfo.nextDueDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}.` : ''}\n\n¡Muchas gracias!`;
  
  const encodedMessage = encodeURIComponent(receiptMessage);
  const whatsappLink = `https://wa.me/${receiptInfo.personPhone.replace(/\D/g, '')}?text=${encodedMessage}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(receiptMessage);
    toast({ title: 'Mensaje copiado', description: 'El comprobante está listo para ser pegado.' });
  };

  return (
    <Dialog open={!!receiptInfo} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pago Registrado con Éxito</DialogTitle>
          <DialogDescription>
            Comprobante para {receiptInfo.personName}. Puedes copiar el mensaje o enviarlo directamente.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 space-y-4">
            <div>
                <Label htmlFor="receipt-message" className="text-sm font-medium">Mensaje de Confirmación</Label>
                <Textarea id="receipt-message" readOnly value={receiptMessage} rows={5} className="mt-2" />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleCopy} variant="outline">Copiar Mensaje</Button>
                <Button asChild>
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" onClick={() => onOpenChange(false)}>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar por WhatsApp
                    </a>
                </Button>
            </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
