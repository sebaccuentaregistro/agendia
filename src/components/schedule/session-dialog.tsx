

'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStudio } from '@/context/StudioContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { Session } from '@/types';

const sessionFormSchema = z.object({
  instructorId: z.string().min(1, { message: 'Debes seleccionar un especialista.' }),
  actividadId: z.string().min(1, { message: 'Debes seleccionar una actividad.' }),
  spaceId: z.string().min(1, { message: 'Debes seleccionar un espacio.' }),
  dayOfWeek: z.enum(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']),
  time: z.string().min(1, { message: 'La hora es obligatoria.' }).regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:MM).' }),
});

interface SessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
}

export function SessionDialog({ isOpen, onClose, session: selectedSessionForEdit }: SessionDialogProps) {
  const { specialists, actividades, spaces, addSession, updateSession } = useStudio();
  
  const form = useForm<z.infer<typeof sessionFormSchema>>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: { dayOfWeek: 'Lunes', time: '' },
  });

  useEffect(() => {
    if (isOpen) {
      if (selectedSessionForEdit) {
        form.reset({
          instructorId: selectedSessionForEdit.instructorId,
          actividadId: selectedSessionForEdit.actividadId,
          spaceId: selectedSessionForEdit.spaceId,
          dayOfWeek: selectedSessionForEdit.dayOfWeek,
          time: selectedSessionForEdit.time,
        });
      } else {
        form.reset({
          instructorId: '',
          actividadId: '',
          spaceId: '',
          dayOfWeek: 'Lunes',
          time: '',
        });
      }
    }
  }, [isOpen, selectedSessionForEdit, form]);

  const onSessionSubmit = (values: z.infer<typeof sessionFormSchema>) => {
    const sessionData = {
        ...values,
    };
    if (selectedSessionForEdit) {
      updateSession({ ...selectedSessionForEdit, ...sessionData });
    } else {
      addSession(sessionData);
    }
    onClose();
  };

  const availableSpecialists = useMemo(() => {
    const actividadId = form.watch('actividadId');
    if (!actividadId) return specialists;
    return specialists.filter(s => s.actividadIds.includes(actividadId));
  }, [specialists, form.watch('actividadId')]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader><DialogTitle>{selectedSessionForEdit ? 'Editar Horario' : 'Nuevo Horario'}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSessionSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="actividadId" render={({ field }) => (
                    <FormItem><FormLabel>Actividad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                          <SelectContent>{actividades.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="instructorId" render={({ field }) => (
                    <FormItem><FormLabel>Especialista</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                          <SelectContent>{availableSpecialists.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )}/>
                </div>
                <FormField control={form.control} name="spaceId" render={({ field }) => (
                    <FormItem><FormLabel>Espacio</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                          <SelectContent>{spaces.map(s => <SelectItem key={s.id} value={s.id}>{s.name} (Cap: {s.capacity})</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )}/>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="dayOfWeek" render={({ field }) => (
                    <FormItem><FormLabel>Día de la semana</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                          <SelectContent>{['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="time" render={({ field }) => (
                      <FormItem><FormLabel>Hora</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                </div>
                <DialogFooter>
                    <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar Cambios</Button>
                </DialogFooter>
              </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
