
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
// import { useStudio } from '@/context/StudioContext';
// import type { Person, WaitlistProspect } from '@/types';
// import { WhatsAppIcon } from './whatsapp-icon';
// import { Trash2 } from 'lucide-react';

interface WaitlistSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function WaitlistSheet({ isOpen, onOpenChange }: WaitlistSheetProps) {
  // Logic for fetching and displaying waitlist will go here in future steps.
  // For now, it's just a placeholder.

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
