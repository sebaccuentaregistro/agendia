
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import type { Institute } from '@/types';
import { updateInstituteDetails } from '@/lib/superadmin-actions';
import { cn } from '@/lib/utils';
import { format, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

interface UpdatePaymentStatusDialogProps {
  isOpen: boolean;
  onClose: (updated: boolean) => void;
  institute: Institute;
}

const formSchema = z.object({
  paymentStatus: z.enum(['pagado', 'pendiente', 'vencido']),
  nextDueDate: z.date().nullable(),
  planType: z.enum(['esencial', 'plus', 'premium']).optional(),
  studentLimit: z.coerce.number().int().min(0, "El límite no puede ser negativo.").optional(),
});

export function UpdatePaymentStatusDialog({ isOpen, onClose, institute }: UpdatePaymentStatusDialogProps) {
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentStatus: institute.paymentStatus || 'pendiente',
      nextDueDate: institute.nextDueDate || null,
      planType: institute.planType || 'esencial',
      studentLimit: institute.studentLimit || 0
    },
  });

  useEffect(() => {
    form.reset({
      paymentStatus: institute.paymentStatus || 'pendiente',
      nextDueDate: institute.nextDueDate || null,
      planType: institute.planType || 'esencial',
      studentLimit: institute.studentLimit || 0
    });
  }, [institute, isOpen, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      await updateInstituteDetails(institute.id, {
        paymentStatus: values.paymentStatus,
        nextDueDate: values.nextDueDate,
        planType: values.planType,
        studentLimit: values.studentLimit
      });
      onClose(true); // Signal that an update occurred
    } catch (error) {
      console.error("Error updating institute details:", error);
      // You might want to show a toast message here
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gestionar: {institute.name}</DialogTitle>
          <DialogDescription>
            Actualiza los detalles de pago y plan para este instituto.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado de Pago</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pagado">Pagado</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nextDueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Próximo Vencimiento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>Elegir fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
             <Button 
                type="button" 
                variant="link" 
                className="p-0 h-auto text-sm"
                onClick={() => form.setValue('nextDueDate', addMonths(new Date(), 1))}
            >
                Establecer en 1 mes
            </Button>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
               <FormField
                control={form.control}
                name="planType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Plan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="esencial">Esencial</SelectItem>
                        <SelectItem value="plus">Plus</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="studentLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Límite de Alumnos</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onClose(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
