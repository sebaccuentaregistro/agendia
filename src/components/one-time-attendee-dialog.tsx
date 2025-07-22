
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useStudio } from '@/context/StudioContext';
import { Session } from '@/types';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const oneTimeAttendeeSchema = z.object({
    personId: z.string().min(1, { message: 'Debes seleccionar una persona.' }),
    date: z.date({ required_error: 'Debes seleccionar una fecha.' }),
});

export function OneTimeAttendeeDialog({ session, preselectedPersonId, onClose }: { session: Session; preselectedPersonId?: string | null; onClose: () => void }) {
  const { people, addOneTimeAttendee, actividades, attendance, spaces, isPersonOnVacation } = useStudio();
  const actividad = actividades.find(a => a.id === session.actividadId);
  const space = spaces.find(s => s.id === session.spaceId);
  const capacity = space?.capacity ?? 0;
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const form = useForm<z.infer<typeof oneTimeAttendeeSchema>>({
    resolver: zodResolver(oneTimeAttendeeSchema),
    defaultValues: {
        personId: preselectedPersonId || undefined,
        date: undefined,
    }
  });
  
  useEffect(() => {
    if (preselectedPersonId) {
      form.setValue('personId', preselectedPersonId, { shouldValidate: true });
    }
  }, [preselectedPersonId, form]);

  const selectedDate = form.watch('date');

  const dayMap: { [key in Session['dayOfWeek']]: number } = useMemo(() => ({
    'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6,
  }), []);

  const sessionDayNumber = dayMap[session.dayOfWeek];

  const { occupationMessage, isFull } = useMemo(() => {
    if (!selectedDate) return { occupationMessage: 'Selecciona una fecha para ver la disponibilidad.', isFull: true };
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const attendanceRecord = attendance.find(a => a.sessionId === session.id && a.date === dateStr);
    const oneTimeIds = attendanceRecord?.oneTimeAttendees || [];

    const vacationingPeople = session.personIds
        .map(pid => people.find(p => p.id === pid))
        .filter((p): p is NonNullable<typeof p> => !!p && isPersonOnVacation(p, selectedDate));
    
    const fixedEnrolledCount = session.personIds.length;
    const currentOccupation = (fixedEnrolledCount - vacationingPeople.length) + oneTimeIds.length;
    
    if (currentOccupation >= capacity) {
        return { occupationMessage: 'No hay cupos disponibles para esta fecha.', isFull: true };
    }

    const availableSpots = capacity - currentOccupation;
    return {
      occupationMessage: `Hay ${availableSpots} cupo(s) disponible(s).`,
      isFull: false
    }
  }, [selectedDate, session, attendance, people, isPersonOnVacation, capacity]);

  const eligiblePeople = useMemo(() => {
    const balances: Record<string, number> = {};
    people.forEach(p => (balances[p.id] = 0));

    attendance.forEach(record => {
      (record.justifiedAbsenceIds || []).forEach(personId => {
        if (balances[personId] !== undefined) balances[personId]++;
      });
      (record.oneTimeAttendees || []).forEach(personId => {
        if (balances[personId] !== undefined) balances[personId]--;
      });
    });
    
    const list = people
      .filter(person => (balances[person.id] > 0))
      .sort((a, b) => a.name.localeCompare(b.name));
      
    // Manually add the preselected person if they are not in the list
    if (preselectedPersonId) {
        const preselectedPerson = people.find(p => p.id === preselectedPersonId);
        if (preselectedPerson && !list.some(p => p.id === preselectedPersonId)) {
            list.unshift(preselectedPerson);
        }
    }

    return list;
  }, [people, attendance, preselectedPersonId]);


  function onSubmit(values: z.infer<typeof oneTimeAttendeeSchema>) {
    addOneTimeAttendee(session.id, values.personId, values.date);
    onClose();
  }
  
  return (
    <Dialog open onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Añadir Asistente Puntual</DialogTitle>
                <DialogDescription>
                    Inscribe a una persona en la sesión de "{actividad?.name}" solo para una fecha específica.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                     <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Fecha de la clase</FormLabel>
                                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
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
                                            onSelect={(date) => {
                                                field.onChange(date);
                                                setIsCalendarOpen(false);
                                            }}
                                            disabled={(date) => {
                                                const isPast = date < new Date(new Date().setDate(new Date().getDate() - 1));
                                                const isWrongDay = date.getDay() !== sessionDayNumber;
                                                return isPast || isWrongDay;
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                {occupationMessage && (
                                    <div className={cn("text-sm mt-2 p-2 rounded-md", isFull ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>
                                        <p className="font-semibold">{occupationMessage}</p>
                                    </div>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="personId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Persona con recuperos pendientes</FormLabel>
                                <Select 
                                    onValueChange={field.onChange} 
                                    value={field.value} 
                                    disabled={!selectedDate || isFull}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona una persona" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {eligiblePeople.map(person => (
                                            <SelectItem key={person.id} value={person.id}>
                                              {person.name}
                                            </SelectItem>
                                        ))}
                                        {eligiblePeople.length === 0 && (
                                            <div className="p-4 text-center text-sm text-muted-foreground">No hay personas con recuperos pendientes.</div>
                                        )}
                                    </SelectContent>
                                </Select>
                                {!selectedDate && <p className="text-xs text-muted-foreground">Debes seleccionar una fecha para habilitar esta lista.</p>}
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* --- DEBUG BOX --- */}
                    <div className="mt-4 p-3 border-2 border-dashed border-red-500 rounded-md bg-red-500/10 text-xs">
                        <h3 className="font-bold text-red-700 dark:text-red-300">DEBUG INFO</h3>
                        <pre className="whitespace-pre-wrap font-mono">
                            {JSON.stringify({
                                isValid: form.formState.isValid,
                                errors: form.formState.errors,
                                values: form.watch(),
                                isFull,
                                eligiblePeopleCount: eligiblePeople.length,
                            }, null, 2)}
                        </pre>
                    </div>
                    {/* --- END DEBUG BOX --- */}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={!form.formState.isValid || isFull}>Añadir Persona</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}

    