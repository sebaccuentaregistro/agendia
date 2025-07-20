
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Send } from 'lucide-react';
import type { PaymentReminderInfo } from '@/types';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';

interface PaymentRemindersProps {
  reminders: PaymentReminderInfo[];
  onSendReminder: (reminder: PaymentReminderInfo) => void;
  onSendAll: () => void;
}

export function PaymentReminders({ reminders, onSendReminder, onSendAll }: PaymentRemindersProps) {

    const formatDaysUntilDue = (days: number) => {
        if (days === 0) return 'Hoy';
        return `en ${formatDistanceToNowStrict(new Date(new Date().getTime() + days * 24 * 60 * 60 * 1000), { locale: es, unit: 'day', roundingMethod: 'ceil' })}`;
    };

    return (
        <Card className="bg-card/80 backdrop-blur-lg rounded-2xl shadow-lg border-blue-500/20">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                        <Bell className="h-5 w-5 text-blue-500" />
                        Recordatorios de Pago
                    </CardTitle>
                    {reminders.length > 1 && (
                        <Button variant="link" size="sm" className="p-0 h-auto" onClick={onSendAll}>
                            Enviar a todos
                        </Button>
                    )}
                </div>
                <CardDescription>
                    Pagos que vencen en los próximos 3 días.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {reminders.length > 0 ? (
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
                ) : (
                    <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No hay vencimientos próximos.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
