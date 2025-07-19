
'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Person, Payment, Tariff } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PaymentHistoryDialogProps {
  person: Person | null;
  payments: Payment[];
  tariffs: Tariff[];
  onClose: () => void;
}

export function PaymentHistoryDialog({ person, payments, tariffs, onClose }: PaymentHistoryDialogProps) {

    const personPayments = useMemo(() => {
        if (!person || !payments) {
            return [];
        }
        // Direct, simple filtering.
        return payments
            .filter(payment => String(payment.personId).trim() === String(person.id).trim())
            .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
    }, [person, payments]);


    if (!person) {
        return null;
    }
    
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
      }).format(price);
    };

    return (
        <Dialog open={!!person} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Historial de Pagos: {person?.name}</DialogTitle>
                    <DialogDescription>
                        Registro de todos los pagos realizados por esta persona.
                    </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="h-60 my-4">
                    {personPayments.length > 0 ? (
                        <div className="space-y-3 pr-4">
                            {personPayments.map(payment => {
                                const tariff = tariffs.find(t => t.id === payment.tariffId);
                                return (
                                    <div key={payment.id} className="flex justify-between items-center p-3 rounded-lg bg-background border">
                                        <div>
                                            <p className="font-semibold">{tariff ? tariff.name : 'Pago registrado'}</p>
                                            <p className="text-sm text-muted-foreground">{payment.date ? format(payment.date, 'dd MMMM, yyyy', { locale: es }) : 'Fecha no disponible'}</p>
                                        </div>
                                        <p className="font-bold text-lg">{tariff ? formatPrice(tariff.price) : (payment.amount ? formatPrice(payment.amount) : '')}</p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center">
                           <p className="text-sm text-muted-foreground">No hay pagos registrados para esta persona.</p>
                        </div>
                    )}
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
