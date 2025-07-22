
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudio } from '@/context/StudioContext';
import { Person, VacationPeriod } from '@/types';
import { cn } from '@/lib/utils';
import { X, CalendarIcon, Loader2 } from 'lucide-react';
import { findVacationConflicts } from '@/lib/firestore-actions';
import { ConflictResolutionDialog, type ConflictInfo } from './conflict-resolution-dialog';

const vacationFormSchema = z.object({
    startDate: z.date({ required_error: 'La fecha de inicio es obligatoria.' }),
    endDate: z.date({ required_error: 'La fecha de fin es obligatoria.' }),
}).refine(data => {
    if (!data.startDate || !data.endDate) return true;
    return isAfter(data.endDate, data.startDate) || data.endDate.toDateString() === data.startDate.toDateString();
}, {
    message: "La fecha de fin debe ser igual o posterior a la de inicio.",
    path: ['endDate'],
});

interface VacationDialogProps {
  person: Person | null;
  onClose: () => void;
}

export function VacationDialog({ person, onClose }: VacationDialogProps) {
    const { addVacationPeriod, removeVacationPeriod, sessions, attendance, people } = useStudio();
    const [isLoading, setIsLoading] = useState(false);
    const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);

    const form = useForm<z.infer<typeof vacationFormSchema>>({
        resolver: zodResolver(vacationFormSchema),
    });

    const checkForConflictsAndProceed = async (
      action: 'add' | 'remove',
      vacationIdToRemove?: string,
      newPeriodData?: { startDate: Date; endDate: Date }
    ) => {
        if (!person) return;
        setIsLoading(true);

        let finalVacationPeriods: VacationPeriod[] = person.vacationPeriods || [];
        if (action === 'remove' && vacationIdToRemove) {
            finalVacationPeriods = finalVacationPeriods.filter(v => v.id !== vacationIdToRemove);
        } else if (action === 'add' && newPeriodData) {
            const newVacation: VacationPeriod = { id: `vac-${Date.now()}`, ...newPeriodData };
            finalVacationPeriods = [...finalVacationPeriods, newVacation];
        }

        const conflicts = await findVacationConflicts(person, sessions, attendance, people, finalVacationPeriods);

        if (conflicts.length > 0) {
            setConflictInfo({
                person,
                conflicts,
                onResolve: (resolution) => {
                    // Logic to handle resolution will be added later
                    // For now, just close the dialogs
                    if (resolution === 'proceed') {
                         if (action === 'remove' && vacationIdToRemove) {
                            removeVacationPeriod(person.id, vacationIdToRemove, true);
                         } else if (action === 'add' && newPeriodData) {
                            addVacationPeriod(person.id, newPeriodData.startDate, newPeriodData.endDate);
                         }
                    }
                    setConflictInfo(null);
                }
            });
        } else {
            // No conflicts, proceed directly
             if (action === 'remove' && vacationIdToRemove) {
                removeVacationPeriod(person.id, vacationIdToRemove, false);
             } else if (action === 'add' && newPeriodData) {
                addVacationPeriod(person.id, newPeriodData.startDate, newPeriodData.endDate);
             }
            form.reset();
        }
        setIsLoading(false);
    };

    const onSubmit = (values: z.infer<typeof vacationFormSchema>) => {
        checkForConflictsAndProceed('add', undefined, values);
    };

    const handleRemovePeriod = (vacationId: string) => {
        checkForConflictsAndProceed('remove', vacationId);
    };
    
    if (!person) return null;

    return (
      <>
        <Dialog open={!!person && !conflictInfo} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Vacaciones de {person.name}</DialogTitle>
                    <DialogDescription>Gestiona los períodos de ausencia. Durante estos días, la persona no aparecerá en las listas de asistencia.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <h4 className="font-semibold text-sm">Períodos Cargados</h4>
                    <ScrollArea className="h-32 rounded-md border">
                        <div className="p-2 space-y-2">
                        {person.vacationPeriods && person.vacationPeriods.length > 0 ? (
                            person.vacationPeriods.map(vac => (
                                <div key={vac.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                                    <span>{vac.startDate ? format(vac.startDate, 'dd/MM/yy') : 'N/A'} - {vac.endDate ? format(vac.endDate, 'dd/MM/yy') : 'N/A'}</span>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemovePeriod(vac.id)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="p-4 text-center text-muted-foreground text-sm">No hay vacaciones programadas.</p>
                        )}
                        </div>
                    </ScrollArea>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border-t pt-4">
                             <h4 className="font-semibold text-sm">Añadir Nuevo Período</h4>
                            <div className="flex items-start gap-4">
                                <FormField control={form.control} name="startDate" render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Inicio</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, 'PPP', { locale: es }) : <span>Elegir fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                 <FormField control={form.control} name="endDate" render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Fin</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, 'PPP', { locale: es }) : <span>Elegir fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                               {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                               Añadir Vacaciones
                            </Button>
                        </form>
                    </Form>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        <ConflictResolutionDialog 
            conflictInfo={conflictInfo} 
            onClose={() => setConflictInfo(null)}
        />
      </>
    )
}
