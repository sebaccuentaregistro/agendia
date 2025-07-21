
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

interface TopDebtor extends Person {
  debt: number;
  daysOverdue: number;
}

interface PaymentRemindersProps {
  reminders: PaymentReminderInfo[];
  topDebtors: TopDebtor[];
  onSendReminder: (reminder: PaymentReminderInfo) => void;
  onSendAll: () => void;
}

export function PaymentReminders({ reminders, topDebtors, onSendReminder, onSendAll }: PaymentRemindersProps) {

    const formatDaysUntilDue = (days: number) => {
        if (days === 0) return 'Hoy';
        return `en ${formatDistanceToNowStrict(new Date(new Date().getTime() + days * 24 * 60 * 60 * 1000), { locale: es, unit: 'day', roundingMethod: 'ceil' })}`;
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
                    {reminders.length > 1 && (
                        <Button variant="link" size="sm" className="p-0 h-auto" onClick={onSendAll}>
                            Enviar a todos
                        </Button>
                    )}
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
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-blue-600 dark:text-blue-400"><Bell className="h-4 w-4"/>Vencimientos Próximos</h4>
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
