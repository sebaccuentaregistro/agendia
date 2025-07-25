

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
import { Session, Person } from '@/types';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const oneTimeAttendeeSchema = z.object({
    personId: z.string().min(1, { message: 'Debes seleccionar una persona.' }),
    date: z.date({ required_error: 'Debes seleccionar una fecha.' }),
});

interface OneTimeAttendeeDialogProps {
    session: Session | null;
    personForRecovery?: Person | null;
    onClose: () => void;
}

export function OneTimeAttendeeDialog({ session, personForRecovery, onClose }: OneTimeAttendeeDialogProps) {
  const { people, addOneTimeAttendee, actividades, attendance, spaces, isPersonOnVacation } = useStudio();
  const actividad = session ? actividades.find(a => a.id === session.actividadId) : undefined;
  const space = session ? spaces.find(s => s.id === session.spaceId) : undefined;
  const capacity = space?.capacity ?? 0;
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const form = useForm<z.infer<typeof oneTimeAttendeeSchema>>({
    resolver: zodResolver(oneTimeAttendeeSchema),
    defaultValues: {
        personId: personForRecovery?.id || undefined,
        date: undefined,
    }
  });

  const selectedDate = form.watch('date');
  const selectedPersonId = form.watch('personId');

  const dayMap: { [key in Session['dayOfWeek']]: number } = useMemo(() => ({
    'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6,
  }), []);

  const sessionDayNumber = session ? dayMap[session.dayOfWeek] : -1;
  
  const eligiblePeople = useMemo(() => {
    if (personForRecovery) {
        return [personForRecovery];
    }
    return people
      .filter(person => (person.recoveryCredits || []).some(c => c.status === 'available'))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [people, personForRecovery]);

  const { occupationMessage, isFull, isAlreadyRecovering } = useMemo(() => {
    if (!selectedDate || !session) return { occupationMessage: 'Selecciona una fecha.', isFull: true, isAlreadyRecovering: false };
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const attendanceRecord = attendance.find(a => a.sessionId === session.id && a.date === dateStr);
    const oneTimeIds = attendanceRecord?.oneTimeAttendees || [];

    // Check if the selected person is already in the one-time list for this date
    const alreadyRecovering = selectedPersonId ? oneTimeIds.includes(selectedPersonId) : false;

    const vacationingPeopleCount = session.personIds
        .filter(pid => {
            const person = people.find(p => p.id === pid);
            return person && isPersonOnVacation(person, selectedDate)
        }).length;
    
    const fixedEnrolledCount = session.personIds.length;
    const currentOccupation = (fixedEnrolledCount - vacationingPeopleCount) + oneTimeIds.length;
    const isClassFull = currentOccupation >= capacity;
    
    let message = '';
    if (alreadyRecovering) {
        message = 'Esta persona ya está anotada para recuperar en esta fecha.';
    } else if (isClassFull) {
        message = 'No hay cupos disponibles para esta fecha.';
    } else {
        const availableSpots = capacity - currentOccupation;
        message = `Hay ${availableSpots} cupo(s) disponible(s).`;
    }

    return {
        occupationMessage: message,
        isFull: isClassFull,
        isAlreadyRecovering: alreadyRecovering,
    }
  }, [selectedDate, session, attendance, people, isPersonOnVacation, capacity, selectedPersonId]);

  async function onSubmit(values: z.infer<typeof oneTimeAttendeeSchema>) {
    if (!session) return;
    await addOneTimeAttendee(session.id, values.personId, values.date);
    onClose();
  }
  
  const availableCredits = useMemo(() => {
      if (!selectedPersonId) return 0;
      const person = people.find(p => p.id === selectedPersonId);
      return (person?.recoveryCredits || []).filter(c => c.status === 'available').length;
  }, [selectedPersonId, people]);

  const hasCredits = availableCredits > 0;

  if (!session) return null;

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
                                    <div className={cn("text-sm mt-2 p-2 rounded-md", isFull || isAlreadyRecovering ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>
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
                                    disabled={!selectedDate || isFull || !!personForRecovery}
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
                                        {eligiblePeople.length === 0 && !personForRecovery && (
                                            <div className="p-4 text-center text-sm text-muted-foreground">No hay personas con recuperos pendientes.</div>
                                        )}
                                    </SelectContent>
                                </Select>
                                {!selectedDate && <p className="text-xs text-muted-foreground">Debes seleccionar una fecha para habilitar esta lista.</p>}
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={!form.formState.isValid || isFull || !hasCredits || isAlreadyRecovering}>Añadir Persona</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
