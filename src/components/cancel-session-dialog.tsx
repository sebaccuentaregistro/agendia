
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useStudio } from '@/context/StudioContext';
import { Session } from '@/types';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const cancelSessionSchema = z.object({
  grantRecoveryCredits: z.boolean().default(true).optional(),
});

interface CancelSessionDialogProps {
  session: Session | null;
  date: Date | null; // <-- Now accepts a date
  onClose: () => void;
}

export function CancelSessionDialog({ session, date, onClose }: CancelSessionDialogProps) {
  const { cancelSessionForDay, actividades } = useStudio();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof cancelSessionSchema>>({
    resolver: zodResolver(cancelSessionSchema),
    defaultValues: { grantRecoveryCredits: true },
  });

  const onSubmit = async (values: z.infer<typeof cancelSessionSchema>) => {
    if (session && date) {
      setLoading(true);
      await cancelSessionForDay(session, date, !!values.grantRecoveryCredits);
      setLoading(false);
      onClose();
    }
  };
  
  if (!session || !date) return null;

  const actividad = actividades.find(a => a.id === session.actividadId);
  const dateStr = format(date, "eeee, dd 'de' MMMM", { locale: es });

  return (
    <Dialog open={!!session} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>Cancelar Sesión</DialogTitle>
          <DialogDescription>
            Estás a punto de cancelar la clase de <strong>{actividad?.name}</strong> del día <strong>{dateStr}</strong>.
          </DialogDescription>
        </DialogHeader>
        <Alert>
          <AlertDescription>
            Esta acción no puede deshacerse. La sesión se marcará como cancelada para esa fecha y no se registrará asistencia.
          </AlertDescription>
        </Alert>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="grantRecoveryCredits"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Otorgar crédito de recupero a los asistentes
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Marcando esto, todos los inscriptos para esa fecha recibirán un crédito para recuperar la clase.
                    </p>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                No cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Sí, cancelar la clase
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
