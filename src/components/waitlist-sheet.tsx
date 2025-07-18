
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudio } from '@/context/StudioContext';
import type { Person, WaitlistProspect } from '@/types';
import { WhatsAppIcon } from './whatsapp-icon';
import { Trash2 } from 'lucide-react';
import { useMemo } from 'react';

interface WaitlistSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

type UnifiedWaitlistItem = {
  sessionId: string;
  className: string;
  isProspect: boolean;
  entry: string | WaitlistProspect;
  name: string;
  phone: string;
};

export function WaitlistSheet({ isOpen, onOpenChange }: WaitlistSheetProps) {
  const { sessions, people, actividades } = useStudio();
  
  const unifiedWaitlist = useMemo((): UnifiedWaitlistItem[] => {
    const list: UnifiedWaitlistItem[] = [];

    sessions.forEach(session => {
        if (session.waitlist && session.waitlist.length > 0) {
            const className = actividades.find(a => a.id === session.actividadId)?.name || 'Clase desconocida';

            session.waitlist.forEach(entry => {
                if (typeof entry === 'string') {
                    // It's an existing person (ID)
                    const person = people.find(p => p.id === entry);
                    if (person) {
                        list.push({
                            sessionId: session.id,
                            className: className,
                            isProspect: false,
                            entry: entry,
                            name: person.name,
                            phone: person.phone,
                        });
                    }
                } else {
                    // It's a prospect
                    list.push({
                        sessionId: session.id,
                        className: className,
                        isProspect: true,
                        entry: entry,
                        name: entry.name,
                        phone: entry.phone,
                    });
                }
            });
        }
    });

    return list.sort((a,b) => a.name.localeCompare(b.name));
  }, [sessions, people, actividades]);


  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Lista de Espera General</SheetTitle>
          <SheetDescription>
            Aquí se mostrarán todas las personas en listas de espera de todas las clases.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-grow my-4 flex items-center justify-center rounded-lg border border-dashed border-border/30">
            <p className="text-sm text-muted-foreground">El contenido se añadirá en el próximo paso.</p>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cerrar</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
