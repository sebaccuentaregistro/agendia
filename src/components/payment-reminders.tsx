
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, DollarSign, Send } from 'lucide-react';
import type { PaymentReminderInfo, Person, Tariff } from '@/types';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { WhatsAppIcon } from './whatsapp-icon';
import { useStudio } from '@/context/StudioContext';

interface PaymentRemindersProps {
  reminders: PaymentReminderInfo[];
  onSendReminder: (reminder: PaymentReminderInfo) => void;
  onSendAll: () => void;
}

export function PaymentReminders({ reminders, onSendReminder, onSendAll }: PaymentRemindersProps) {

    const { tariffs, people } = useStudio();
    const overduePeople = people.filter(p => p.outstandingPayments && p.outstandingPayments > 0);
    const topDebtors = overduePeople.map(person => {
        const tariff = tariffs.find(t => t.id === person.tariffId);
        const debtAmount = (tariff?.price || 0) * (person.outstandingPayments || 1);
        const daysOverdue = person.lastPaymentDate ? Math.max(0, Math.floor((new Date().getTime() - person.lastPaymentDate.getTime()) / (1000 * 3600 * 24))) : 0;
        return { ...person, debt: debtAmount, daysOverdue };
    }).sort((a, b) => b.debt - a.debt).slice(0, 5);


    const formatDaysUntilDue = (days: number) => {
        if (days === 0) return 'Hoy';
        if (days === 1) return 'Mañana';
        return `en ${days} días`;
    };
    
    const formatPrice = (price: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);

    return (
        <Card className="bg-card/80 backdrop-blur-lg rounded-2xl shadow-lg border-blue-500/20">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                        <Bell className="h-5 w-5 text-blue-500" />
                        Estado de Pagos
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 {topDebtors.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-destructive"><DollarSign className="h-4 w-4"/>Top Deudores</h4>
                         <ul className="space-y-3">
                            {topDebtors.map(person => {
                                return (
                                <li key={person.id} className="flex items-center justify-between text-sm p-3 rounded-lg bg-destructive/10">
                                    <div>
                                        <Link href={`/students?search=${encodeURIComponent(person.name)}`} className="group">
                                            <div className="font-medium text-destructive/90 group-hover:text-destructive group-hover:underline">{person.name}</div>
                                        </Link>
                                        <div className="flex items-center gap-2 text-xs text-destructive/70">
                                            <span>{person.phone}</span>
                                            <a href={`https://wa.me/${person.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                <WhatsAppIcon className="text-green-600 hover:text-green-700 transition-colors" />
                                                <span className="sr-only">Enviar WhatsApp a {person.name}</span>
                                            </a>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-semibold text-red-600 dark:text-red-400">{formatPrice(person.debt)}</span>
                                        <p className="text-xs text-destructive/70">hace {person.daysOverdue} {person.daysOverdue === 1 ? 'día' : 'días'}</p>
                                    </div>
                                </li>
                            )})}
                        </ul>
                    </div>
                )}
                {reminders.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-sm flex items-center gap-2 text-blue-600 dark:text-blue-400"><Bell className="h-4 w-4"/>Vencimientos Próximos</h4>
                             {reminders.length > 1 && (
                                <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={onSendAll}>
                                    Enviar a todos
                                </Button>
                            )}
                        </div>
                        <ul className="space-y-3">
                            {reminders.map(reminder => (
                                <li key={reminder.person.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-blue-500/10 text-sm">
                                    <div className="flex-grow text-blue-800 dark:text-blue-200">
                                        <span className="font-semibold">{reminder.person.name}</span>
                                        <p className="text-xs">Vence {formatDaysUntilDue(reminder.daysUntilDue)}</p>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-8 px-2 shrink-0 self-end sm:self-center" onClick={() => onSendReminder(reminder)}>
                                        <Send className="h-4 w-4 mr-2"/>
                                        Recordar
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {topDebtors.length === 0 && reminders.length === 0 && (
                    <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No hay deudas ni vencimientos próximos.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
