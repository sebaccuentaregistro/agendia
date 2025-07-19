
'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Person, Payment, Tariff } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface PaymentHistoryDialogProps {
  person: Person | null;
  payments: Payment[];
  tariffs: Tariff[];
  onClose: () => void;
}

export function PaymentHistoryDialog({ person, payments, tariffs, onClose }: PaymentHistoryDialogProps) {
    // Early return BEFORE any hooks are called if person is null. This fixes the "Rendered more hooks" error.
    if (!person) {
        return null;
    }

    const personPayments = useMemo(() => {
        if (!payments) {
            return [];
        }
        return payments
            .filter(payment => String(payment.personId).trim() === String(person.id).trim())
            .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
    }, [person, payments]);

    const paymentIdsForDebug = useMemo(() => {
        return payments.map(p => p.personId);
    }, [payments]);
    
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

                <Card className="bg-destructive/10 border-destructive">
                    <CardHeader>
                        <CardTitle className="text-sm">Información de Depuración</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-2">
                        <p><strong>ID de la persona que se está revisando:</strong> {person.id}</p>
                        <p><strong>Total de pagos recibidos por el diálogo:</strong> {payments.length}</p>
                        <p><strong>Pagos encontrados para esta persona:</strong> {personPayments.length}</p>
                        <p><strong>IDs de persona en los registros de pago:</strong></p>
                        <pre className="p-2 bg-background/50 rounded-md text-[10px] max-h-28 overflow-auto">
                          {JSON.stringify(paymentIdsForDebug, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
                
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
