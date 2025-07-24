

'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudio } from '@/context/StudioContext';
import { getStudentPaymentStatus } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { CalendarClock, Plane } from 'lucide-react';
import type { Person, Tariff, PaymentStatusInfo } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface PersonCardProps {
    person: Person;
    tariff?: Tariff;
    recoveryCreditsCount: number;
}

export function PersonCard({ person, tariff, recoveryCreditsCount }: PersonCardProps) {
    const { isPersonOnVacation } = useStudio();
    const paymentStatusInfo = getStudentPaymentStatus(person, new Date());
    const onVacation = isPersonOnVacation(person, new Date());

    const getStatusBadgeClass = () => {
        switch (paymentStatusInfo.status) {
            case 'Al día': return "bg-green-600 hover:bg-green-700 border-green-700 text-white";
            case 'Atrasado': return "bg-red-600 hover:bg-red-700 border-red-700 text-white";
            case 'Próximo a Vencer': return "bg-amber-500 hover:bg-amber-600 border-amber-600 text-white";
            case 'Pendiente de Pago': return "bg-blue-600 hover:bg-blue-700 border-blue-700 text-white";
            default: return "bg-gray-500 hover:bg-gray-600 border-gray-600 text-white";
        }
    };
    
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
      }).format(price);
    };

    const renderPaymentStatus = (statusInfo: PaymentStatusInfo) => {
        if (statusInfo.status === 'Próximo a Vencer') {
            if (statusInfo.daysUntilDue === 0) return 'Vence Hoy';
            if (statusInfo.daysUntilDue === 1) return 'Vence Mañana';
            return `Vence en ${statusInfo.daysUntilDue} días`;
        }
        if (statusInfo.status === 'Atrasado') {
            return `Atrasado (${statusInfo.daysOverdue}d)`;
        }
        return statusInfo.status === 'Pendiente de Pago' ? 'Pago Pendiente' : statusInfo.status;
    };

    const totalDebt = (tariff?.price || 0) * (person.outstandingPayments || 0);
    
    return (
        <Link href={`/students/${person.id}`} className="block">
            <Card className="flex flex-col h-full rounded-2xl shadow-lg border-border/20 bg-card overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-primary">
                <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold truncate">{person.name}</CardTitle>
                        <TooltipProvider>
                            <div className="flex items-center gap-2">
                               {onVacation && (
                                 <Tooltip>
                                    <TooltipTrigger><Plane className="h-4 w-4 text-muted-foreground"/></TooltipTrigger>
                                    <TooltipContent><p>De vacaciones</p></TooltipContent>
                                 </Tooltip>
                               )}
                               {recoveryCreditsCount > 0 && (
                                <Tooltip>
                                    <TooltipTrigger><CalendarClock className="h-4 w-4 text-muted-foreground"/></TooltipTrigger>
                                    <TooltipContent><p>{recoveryCreditsCount} recupero(s) pendiente(s)</p></TooltipContent>
                                </Tooltip>
                               )}
                            </div>
                        </TooltipProvider>
                    </div>
                    <CardDescription className="text-xs">{person.phone}</CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-0 flex-grow">
                     <Badge variant="secondary" className={cn("font-semibold text-xs", getStatusBadgeClass())}>
                        {renderPaymentStatus(paymentStatusInfo)}
                    </Badge>
                </CardContent>
                
                 <CardFooter className="p-4 pt-0 text-right">
                     {paymentStatusInfo.status === 'Atrasado' && totalDebt > 0 ? (
                        <div className="text-right w-full">
                            <p className="text-xs text-destructive">Deuda Total</p>
                            <p className="text-lg font-bold text-destructive">{formatPrice(totalDebt)}</p>
                        </div>
                    ) : (
                         tariff && <p className="text-lg w-full font-bold text-foreground">{formatPrice(tariff.price)}</p>
                    )}
                </CardFooter>
            </Card>
        </Link>
    );
}
