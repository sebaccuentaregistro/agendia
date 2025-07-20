'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Send } from 'lucide-react';
import type { PaymentReminderInfo } from '@/types';

interface PaymentRemindersProps {
  reminders: PaymentReminderInfo[];
  onSendReminder: (reminder: PaymentReminderInfo) => void;
  onSendAll: () => void;
}

export function PaymentReminders({ reminders, onSendReminder, onSendAll }: PaymentRemindersProps) {
  if (reminders.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card/80 backdrop-blur-lg rounded-2xl shadow-lg border-yellow-500/20">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Bell className="h-5 w-5 text-yellow-500" />
          Recordatorios de Vencimiento
        </CardTitle>
        <Button variant="outline" size="sm" onClick={onSendAll}>
          <Send className="mr-2 h-4 w-4" />
          Enviar a Todos
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {reminders.map(reminder => (
          <div key={reminder.person.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-yellow-500/10 text-sm">
            <p className="flex-grow text-yellow-800 dark:text-yellow-200">
              A <span className="font-semibold">{reminder.person.name}</span> le vence el pago en <span className="font-semibold">{reminder.daysUntilDue} {reminder.daysUntilDue === 1 ? 'día' : 'días'}</span>.
            </p>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Button size="sm" onClick={() => onSendReminder(reminder)}>Enviar Recordatorio</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
