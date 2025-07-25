
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useStudio } from '@/context/StudioContext';
import type { Person, NewPersonData } from '@/types';

const personFormSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().min(7, { message: 'Por favor, introduce un número de teléfono válido.' }),
  levelId: z.preprocess((val) => (val === 'none' || val === '' ? undefined : val), z.string().optional()),
  tariffId: z.string().min(1, { message: 'Debes seleccionar un arancel.' }),
  healthInfo: z.string().optional(),
  notes: z.string().optional(),
  joinDate: z.date().optional(),
  lastPaymentDate: z.date().nullable().optional(),
});

type PersonFormData = z.infer<typeof personFormSchema>;

interface PersonDialogProps {
  person?: Person;
  initialData?: Partial<NewPersonData>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  onPersonCreated?: (person: Person) => void;
  isLimitReached?: boolean;
}

export function PersonDialog({ person, initialData, onOpenChange, open, onPersonCreated, isLimitReached }: PersonDialogProps) {
  const { addPerson, updatePerson, levels, tariffs } = useStudio();
  
  const form = useForm<PersonFormData>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
        name: '',
        phone: '',
        levelId: 'none',
        tariffId: '',
        healthInfo: '',
        notes: '',
        joinDate: new Date(),
        lastPaymentDate: null,
    }
  });
  
  useEffect(() => {
    if (open) {
        if (person) {
          form.reset({
            name: person.name,
            phone: person.phone,
            levelId: person.levelId || 'none',
            tariffId: person.tariffId,
            healthInfo: person.healthInfo,
            notes: person.notes,
            joinDate: person.joinDate || new Date(),
            lastPaymentDate: person.lastPaymentDate,
          });
        } else {
          form.reset({
            name: initialData?.name || '',
            phone: initialData?.phone || '',
            levelId: 'none',
            tariffId: '',
            healthInfo: '',
            notes: '',
            joinDate: new Date(),
            lastPaymentDate: null,
          });
        }
    }
  }, [person, initialData, open, form]);
  
  const onSubmit = async (values: PersonFormData) => {
    if (!person && isLimitReached) {
        return;
    }
    
    if (person) {
      // Logic for updating an existing person
      await updatePerson({ 
          ...person, 
          name: values.name,
          phone: values.phone,
          tariffId: values.tariffId,
          levelId: values.levelId === 'none' ? undefined : values.levelId,
          healthInfo: values.healthInfo,
          notes: values.notes,
          joinDate: values.joinDate || person.joinDate,
          lastPaymentDate: values.lastPaymentDate || null,
      });
    } else {
      // Logic for creating a new person
      const finalValues: NewPersonData = {
          name: values.name,
          phone: values.phone,
          tariffId: values.tariffId,
          levelId: values.levelId === 'none' ? undefined : values.levelId,
          healthInfo: values.healthInfo,
          notes: values.notes,
          joinDate: values.joinDate,
          lastPaymentDate: values.lastPaymentDate || null,
          paymentOption: 'recordNow', // This is now simplified
      };
      
      const newPersonId = await addPerson(finalValues);
      if (onPersonCreated && newPersonId) {
        onPersonCreated({
          id: newPersonId,
          name: finalValues.name,
          phone: finalValues.phone,
          tariffId: finalValues.tariffId,
          levelId: finalValues.levelId,
          healthInfo: finalValues.healthInfo,
          notes: finalValues.notes,
          joinDate: finalValues.joinDate || null,
          lastPaymentDate: finalValues.lastPaymentDate || null,
          outstandingPayments: 0,
          avatar: '',
          vacationPeriods: [],
        });
      }
    }
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{person ? 'Editar Persona' : 'Añadir Nueva Personita'}</DialogTitle>
           <DialogDescription>
            {person ? 'Actualiza los datos de la persona.' : 'Añade un nuevo alumno a tu estudio.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nombre completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={form.control} name="tariffId" render={({ field }) => (
                <FormItem><FormLabel>Arancel</FormLabel><Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                    <SelectContent>{tariffs.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
              )}/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="levelId" render={({ field }) => (
                    <FormItem><FormLabel>Nivel (Opcional)</FormLabel><Select onValueChange={field.onChange} value={field.value || 'none'}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin nivel</SelectItem>
                          {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                        </SelectContent>
                    </Select><FormMessage /></FormItem>
                )}/>
                <FormField
                  control={form.control}
                  name="joinDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Ingreso</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                            >
                              {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Sin fecha</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
             <FormField
                control={form.control}
                name="lastPaymentDate"
                render={({ field }) => (
                <FormItem className="flex flex-col animate-in fade-in-0 zoom-in-95">
                    <FormLabel>Fecha del Próximo Vencimiento</FormLabel>
                    <Popover>
                    <PopoverTrigger asChild>
                        <FormControl>
                        <Button
                            variant="outline"
                            className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                        >
                            {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Sin vencimiento (Pago Pendiente)</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} />
                    </PopoverContent>
                    </Popover>
                    <FormDescription className="text-xs">
                        Si no se registra un pago hoy, establece cuándo debería ser el próximo vencimiento.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField control={form.control} name="healthInfo" render={({ field }) => (
              <FormItem><FormLabel>Información de Salud (Opcional)</FormLabel><FormControl><Textarea placeholder="Alergias, lesiones, etc." {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notas Adicionales (Opcional)</FormLabel><FormControl><Textarea placeholder="Preferencias, objetivos, etc." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
            )}/>
            <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
