
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

    const { personPayments, debugInfo } = useMemo(() => {
        if (!person || !payments) {
            return { personPayments: [], debugInfo: { totalPayments: 0, foundPayments: 0, paymentPersonIds: [] } };
        }

        const filteredPayments = payments.filter(payment => {
            // Robust comparison
            return String(payment.personId).trim() === String(person.id).trim();
        });

        const sortedPayments = filteredPayments.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
        
        const allPaymentPersonIds = payments.map(p => p.personId);

        return { 
            personPayments: sortedPayments,
            debugInfo: {
                totalPayments: payments.length,
                foundPayments: sortedPayments.length,
                paymentPersonIds: allPaymentPersonIds,
                personIdBeingChecked: person.id
            }
        };

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
                
                <div className="border bg-muted/50 p-4 rounded-lg my-4 space-y-2">
                    <h4 className="font-bold text-center">Información de Depuración</h4>
                    <p className="text-sm"><strong>ID de la persona que se está revisando:</strong> {debugInfo.personIdBeingChecked}</p>
                    <p className="text-sm"><strong>Total de pagos recibidos por el diálogo:</strong> {debugInfo.totalPayments}</p>
                    <p className="text-sm"><strong>Pagos encontrados para esta persona:</strong> {debugInfo.foundPayments}</p>
                    <div className="text-sm">
                      <p><strong>IDs de persona en los registros de pago:</strong></p>
                      <ScrollArea className="h-24 mt-1 border bg-background p-2 rounded-md">
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(debugInfo.paymentPersonIds, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                </div>

                <ScrollArea className="h-60">
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
