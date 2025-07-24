

'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudio } from '@/context/StudioContext';
import { getStudentPaymentStatus } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { CalendarClock, Plane, FileText } from 'lucide-react';
import type { Person, Tariff, PaymentStatusInfo } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface PersonCardProps {
    person: Person;
    tariff?: Tariff;
    recoveryCreditsCount: number;
    hasNotes: boolean;
}

export function PersonCard({ person, tariff, recoveryCreditsCount, hasNotes }: PersonCardProps) {
    const { isPersonOnVacation } = useStudio();
    const paymentStatusInfo = getStudentPaymentStatus(person, new Date());
    const onVacation = isPersonOnVacation(person, new Date());

    const getStatusBadgeClass = () => {
        switch (paymentStatusInfo.status) {
            case 'Al día': return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700";
            case 'Atrasado': return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700";
            case 'Próximo a Vencer': return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700";
            case 'Pendiente de Pago': return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700";
            default: return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
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
            <Card className="flex flex-col h-full rounded-2xl shadow-lg border-border/20 bg-card transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-primary">
                <CardHeader className="p-4 flex-grow">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="text-lg font-bold truncate">{person.name}</CardTitle>
                            <CardDescription className="text-xs">{person.phone}</CardDescription>
                        </div>
                        <TooltipProvider>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                               {hasNotes && (
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="h-4 w-4 text-muted-foreground"><FileText className="h-4 w-4"/></div>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Tiene notas o info de salud</p></TooltipContent>
                                 </Tooltip>
                               )}
                               {onVacation && (
                                 <Tooltip>
                                     <TooltipTrigger asChild>
                                        <div className="h-4 w-4 text-muted-foreground"><Plane className="h-4 w-4"/></div>
                                    </TooltipTrigger>
                                    <TooltipContent><p>De vacaciones</p></TooltipContent>
                                 </Tooltip>
                               )}
                               {recoveryCreditsCount > 0 && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="h-4 w-4 text-muted-foreground"><CalendarClock className="h-4 w-4"/></div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{recoveryCreditsCount} recupero(s) pendiente(s)</p>
                                    </TooltipContent>
                                </Tooltip>
                               )}
                            </div>
                        </TooltipProvider>
                    </div>
                </CardHeader>
                
                 <CardFooter className="p-4 pt-0 flex justify-between items-end">
                    <Badge variant="outline" className={cn("font-semibold text-xs", getStatusBadgeClass())}>
                        {renderPaymentStatus(paymentStatusInfo)}
                    </Badge>
                     {paymentStatusInfo.status === 'Atrasado' && totalDebt > 0 ? (
                        <div className="text-right">
                            <p className="text-xs text-destructive">Deuda Total</p>
                            <p className="text-lg font-bold text-destructive">{formatPrice(totalDebt)}</p>
                        </div>
                    ) : (
                         tariff && <p className="text-lg font-bold text-foreground">{formatPrice(tariff.price)}</p>
                    )}
                </CardFooter>
            </Card>
        </Link>
    );
}
