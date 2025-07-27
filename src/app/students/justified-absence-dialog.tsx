
'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useStudio } from '@/context/StudioContext';
import { Person, Session } from '@/types';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format, nextDay, addDays, isPast, startOfDay, type Day } from 'date-fns';
import { es } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const justifiedAbsenceSchema = z.object({
  sessionId: z.string().min(1, { message: 'Debes seleccionar una clase.' }),
  date: z.date({ required_error: 'Debes seleccionar la fecha de la ausencia.' }),
});

interface JustifiedAbsenceDialogProps {
  person: Person | null;
  onClose: () => void;
}

const dayMap: { [key in Session['dayOfWeek']]: Day } = {
  'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6,
};

export function JustifiedAbsenceDialog({ person, onClose }: JustifiedAbsenceDialogProps) {
  const { sessions, addJustifiedAbsence, actividades } = useStudio();
  const [selectedSessionDay, setSelectedSessionDay] = useState<Day | null>(null);

  const form = useForm<z.infer<typeof justifiedAbsenceSchema>>({
    resolver: zodResolver(justifiedAbsenceSchema),
  });

  const personSessions = useMemo(() => {
    if (!person) return [];
    return sessions.filter(s => s.personIds.includes(person.id));
  }, [sessions, person]);

  const handleSessionChange = (sessionId: string) => {
    const session = personSessions.find(s => s.id === sessionId);
    if (session) {
      setSelectedSessionDay(dayMap[session.dayOfWeek]);
      form.setValue('sessionId', sessionId);
      form.setValue('date', nextDay(new Date(), dayMap[session.dayOfWeek]));
    }
  };
  
  const onSubmit = (values: z.infer<typeof justifiedAbsenceSchema>) => {
    if (person) {
      addJustifiedAbsence(person.id, values.sessionId, values.date);
    }
    onClose();
  };
  
  if (!person) return null;

  return (
    <Dialog open={!!person} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notificar Ausencia Justificada</DialogTitle>
          <DialogDescription>
            Registra una ausencia para {person.name}. Esto le generará un crédito para recuperar la clase.
          </DialogDescription>
        </DialogHeader>
        {personSessions.length > 0 ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                    control={form.control}
                    name="sessionId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Clase a la que faltará</FormLabel>
                             <Select onValueChange={handleSessionChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar una clase..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {personSessions.map(s => {
                                        const actividad = actividades.find(a => a.id === s.actividadId);
                                        return (
                                            <SelectItem key={s.id} value={s.id}>
                                                {actividad?.name} ({s.dayOfWeek}, {s.time})
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Fecha de la ausencia</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            disabled={!selectedSessionDay}
                                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP", { locale: es })
                                            ) : (
                                                <span>Selecciona una fecha</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => {
                                            if (selectedSessionDay === null) return true;
                                            return isPast(date) && !isToday(date) || date.getDay() !== selectedSessionDay;
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                             {!selectedSessionDay && <p className="text-xs text-muted-foreground">Selecciona una clase para habilitar el calendario.</p>}
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Justificar Ausencia</Button>
                </DialogFooter>
              </form>
            </Form>
        ) : (
            <>
                <Alert variant="destructive">
                    <AlertTitle>Sin clases asignadas</AlertTitle>
                    <AlertDescription>
                        Esta persona no está inscripta en ninguna clase. Para justificar una ausencia, primero debe estar inscripta.
                    </AlertDescription>
                </Alert>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function isToday(date: Date) {
    return startOfDay(date).getTime() === startOfDay(new Date()).getTime();
}
