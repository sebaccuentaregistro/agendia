
'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useStudio } from '@/context/StudioContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, User, Calendar, Trash2 } from 'lucide-react';
import type { Person } from '@/types';

export type ConflictInfo = {
    person: Person;
    conflicts: {
        date: string;
        attendeeName: string;
        sessionId: string;
        attendeeId: string;
    }[];
    onResolve: (resolution: 'proceed' | 'cancel') => void;
};

interface ConflictResolutionDialogProps {
  conflictInfo: ConflictInfo | null;
  onClose: () => void;
}

export function ConflictResolutionDialog({ conflictInfo, onClose }: ConflictResolutionDialogProps) {
  const { removeOneTimeAttendee } = useStudio();
  
  if (!conflictInfo) return null;

  const { person, conflicts, onResolve } = conflictInfo;

  const handleProceed = async () => {
    // This will cancel all conflicting one-time attendees
    for (const conflict of conflicts) {
        await removeOneTimeAttendee(conflict.sessionId, conflict.attendeeId, conflict.date);
    }
    onResolve('proceed');
    onClose();
  };
  
  const handleCancel = () => {
    onResolve('cancel');
    onClose();
  };

  return (
    <Dialog open={!!conflictInfo} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                    Alerta de Sobre-cupo
                </DialogTitle>
                <DialogDescription>
                    Al modificar las vacaciones de <strong>{person.name}</strong>, se crea un conflicto con recuperos ya agendados.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <p>El cupo de {person.name} en las siguientes fechas ya fue asignado a otra persona para recuperar:</p>
                <div className="space-y-2 max-h-40 overflow-y-auto rounded-md border p-2">
                    {conflicts.map((conflict, index) => (
                         <div key={index} className="flex items-center justify-between gap-2 text-sm p-2 rounded-md bg-muted/50">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{format(new Date(conflict.date), "PPP", { locale: es })}</span>
                            </div>
                            <div className="flex items-center gap-2 font-semibold">
                                <User className="h-4 w-4" />
                                <span>{conflict.attendeeName}</span>
                            </div>
                        </div>
                    ))}
                </div>
                 <Alert variant="destructive">
                    <AlertTitle>¿Cómo quieres proceder?</AlertTitle>
                    <AlertDescription>
                        Puedes cancelar los recuperos para devolverle el lugar a {person.name}, o cancelar esta operación para mantener los recuperos agendados.
                    </AlertDescription>
                </Alert>
            </div>
            <DialogFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button variant="outline" onClick={handleCancel}>
                    No hacer nada (Cancelar)
                </Button>
                <Button variant="destructive" onClick={handleProceed}>
                   <Trash2 className="mr-2 h-4 w-4" />
                   Cancelar recuperos y devolver el cupo
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}

