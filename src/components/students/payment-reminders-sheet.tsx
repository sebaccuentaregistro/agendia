

'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, DollarSign, Send } from 'lucide-react';
import { WhatsAppIcon } from '../whatsapp-icon';
import { useStudio } from '@/context/StudioContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getStudentPaymentStatus } from '@/lib/utils';
import type { PaymentReminderInfo, Person } from '@/types';
import Link from 'next/link';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

interface PaymentRemindersSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialFocus?: 'overdue' | 'upcoming' | null;
}

export function PaymentRemindersSheet({ isOpen, onOpenChange, initialFocus }: PaymentRemindersSheetProps) {
  const { people, tariffs } = useStudio();
  const { institute } = useAuth();
  const { toast } = useToast();
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const overdueRef = useRef<HTMLDivElement>(null);
  const upcomingRef = useRef<HTMLDivElement>(null);

  const { overduePeople, upcomingReminders } = useMemo(() => {
    const overdue = people.filter(p => getStudentPaymentStatus(p, new Date()).status === 'Atrasado');
    const upcoming = people
      .map(person => {
        const statusInfo = getStudentPaymentStatus(person, new Date());
        if (statusInfo.status === 'Próximo a Vencer' && statusInfo.daysUntilDue !== undefined) {
          return { person, dueDate: person.lastPaymentDate || new Date(), daysUntilDue: statusInfo.daysUntilDue };
        }
        return null;
      })
      .filter((p): p is PaymentReminderInfo => p !== null)
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    const debtors = overdue.map(person => {
        const tariff = tariffs.find(t => t.id === person.tariffId);
        const debtAmount = (tariff?.price || 0) * (person.outstandingPayments || 1);
        const daysOverdue = person.lastPaymentDate ? Math.max(0, Math.floor((new Date().getTime() - person.lastPaymentDate.getTime()) / (1000 * 3600 * 24))) : 0;
        return { ...person, debt: debtAmount, daysOverdue };
    }).sort((a, b) => b.debt - a.debt);

    return { overduePeople: debtors, upcomingReminders: upcoming };
  }, [people, tariffs]);
  
  useEffect(() => {
    if (isOpen && initialFocus) {
      setTimeout(() => {
        const refToScroll = initialFocus === 'overdue' ? overdueRef : upcomingRef;
        refToScroll.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [isOpen, initialFocus]);


  const generateMessage = (person: Person, isOverdue: boolean) => {
    if (isOverdue) {
      return `¡Hola, ${person.name}! 👋 Te recordamos que tienes un pago pendiente en ${institute?.name || 'el estudio'}. ¡Puedes abonar en tu próxima clase! Muchas gracias 😊`;
    }
    const reminderInfo = upcomingReminders.find(r => r.person.id === person.id);
    if (!reminderInfo) return '';
    const days = reminderInfo.daysUntilDue;
    const when = days === 0 ? 'hoy' : days === 1 ? 'mañana' : `en ${days} días`;
    return `¡Hola, ${person.name}! Te recordamos que tu próximo pago para ${institute?.name || 'el estudio'} vence ${when}. ¡Puedes abonar en tu próxima clase! Gracias 😊`;
  };
  
  const activeMessage = selectedPerson ? generateMessage(selectedPerson, overduePeople.some(p => p.id === selectedPerson.id)) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(activeMessage);
    toast({ title: 'Mensaje copiado', description: 'El recordatorio está listo para ser pegado.' });
  };
  
  const getWhatsAppLink = (phone: string, text: string) => `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
  const formatPrice = (price: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);
  
  const renderList = (title: string, peopleList: (Person & { debt?: number, daysOverdue?: number })[], isOverdue = false, ref: React.RefObject<HTMLDivElement>) => (
    <div ref={ref}>
        <h4 className={`font-semibold text-sm flex items-center gap-2 mb-2 ${isOverdue ? 'text-destructive' : 'text-blue-600 dark:text-blue-400'}`}>
            {isOverdue ? <DollarSign className="h-4 w-4"/> : <Bell className="h-4 w-4"/>}
            {title} ({peopleList.length})
        </h4>
        <div className="space-y-2">
        {peopleList.length > 0 ? peopleList.map(person => (
            <div key={person.id} className={`flex items-center justify-between text-sm p-3 rounded-lg ${isOverdue ? 'bg-destructive/10' : 'bg-blue-500/10'}`}>
                <div>
                    <Link href={`/students?search=${encodeURIComponent(person.name)}`} className="group">
                        <div className="font-medium group-hover:underline">{person.name}</div>
                    </Link>
                    <div className="flex items-center gap-2 text-xs opacity-80">
                        <span>{person.phone}</span>
                    </div>
                </div>
                <div className="text-right">
                    {isOverdue && person.debt ? (
                        <span className="font-semibold">{formatPrice(person.debt)}</span>
                    ) : (
                        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setSelectedPerson(person)}>
                            <Send className="h-4 w-4 mr-2"/> Recordar
                        </Button>
                    )}
                </div>
            </div>
        )) : <p className="text-xs text-muted-foreground text-center py-2">No hay personas en esta categoría.</p>}
        </div>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Recordatorios de Pago</SheetTitle>
          <SheetDescription>
            Gestiona los recordatorios para alumnos con pagos próximos a vencer o atrasados.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-grow my-4">
            <div className="pr-4 space-y-6">
                {renderList("Deudores", overduePeople, true, overdueRef)}
                {renderList("Vencimientos Próximos", upcomingReminders.map(r => r.person), false, upcomingRef)}
            </div>
        </ScrollArea>
        {selectedPerson && (
             <div className="mt-auto border-t pt-4 space-y-3 animate-in fade-in-50">
                <h4 className="font-semibold text-sm">Mensaje para {selectedPerson.name}</h4>
                 <Textarea readOnly value={activeMessage} rows={4} />
                 <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={handleCopy}>Copiar</Button>
                    <a href={getWhatsAppLink(selectedPerson.phone, activeMessage)} target="_blank" rel="noopener noreferrer" className="w-full">
                        <Button className="w-full">Enviar por WhatsApp</Button>
                    </a>
                 </div>
                 <Button variant="link" size="sm" className="w-full h-auto p-0 text-xs" onClick={() => setSelectedPerson(null)}>Cerrar mensaje</Button>
            </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
