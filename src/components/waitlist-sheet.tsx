
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
import { Badge } from './ui/badge';

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
            Aquí se muestran todas las personas en listas de espera de todas las clases.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-grow my-4">
            <div className="pr-4 space-y-3">
                {unifiedWaitlist.length > 0 ? (
                    unifiedWaitlist.map((item, index) => (
                        <div key={index} className="p-3 rounded-md bg-muted/50">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-foreground">{item.name}</p>
                                        <Badge variant={item.isProspect ? 'outline' : 'secondary'}>
                                            {item.isProspect ? 'Nuevo' : 'Alumno'}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Esperando en: {item.className}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                     <a href={`https://wa.me/${item.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 transition-colors">
                                        <WhatsAppIcon />
                                     </a>
                                     <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => {}}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Eliminar de la lista</span>
                                     </Button>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{item.phone}</p>
                        </div>
                    ))
                ) : (
                    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/30 py-10">
                        <p className="text-sm text-muted-foreground text-center">No hay nadie en ninguna lista de espera.</p>
                    </div>
                )}
            </div>
        </ScrollArea>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cerrar</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
