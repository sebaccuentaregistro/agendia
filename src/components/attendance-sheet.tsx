'use client';

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudio } from '@/context/StudioContext';
import type { Session } from '@/types';
import { useMemo } from 'react';

const FormSchema = z.object({
  presentIds: z.array(z.string()),
});

export function AttendanceSheet({ session, onClose }: { session: Session; onClose: () => void }) {
  const { people, actividades, saveAttendance } = useStudio();

  const enrolledPeople = useMemo(() => {
    return people
      .filter(p => session.personIds.includes(p.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [people, session.personIds]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      presentIds: session.personIds,
    },
  });
  
  const watchedPresentIds = form.watch('presentIds');

  function onSubmit(data: z.infer<typeof FormSchema>) {
    const absentIds = session.personIds.filter(id => !data.presentIds.includes(id));
    saveAttendance(session.id, data.presentIds, absentIds);
    onClose();
  }
  
  const handleSelectAll = (select: boolean) => {
    if (select) {
        form.setValue('presentIds', session.personIds);
    } else {
        form.setValue('presentIds', []);
    }
  };

  const actividad = actividades.find(a => a.id === session.actividadId);

  return (
    <Sheet open onOpenChange={open => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Pasar Lista: {actividad?.name}</SheetTitle>
          <SheetDescription>
            Desmarca las personas ausentes. Por defecto, todas están marcadas como presentes.
            <br/>
            Asistencia: {watchedPresentIds.length} / {session.personIds.length}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 flex flex-col h-[calc(100%-8rem)]">
            <div className="flex justify-between items-center pr-6">
                <FormLabel>Personas Inscriptas</FormLabel>
                <div className="space-x-2">
                    <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={() => handleSelectAll(true)}>Todos</Button>
                    <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={() => handleSelectAll(false)}>Ninguno</Button>
                </div>
            </div>
            <ScrollArea className="flex-grow rounded-md border">
              <div className="p-4">
                {enrolledPeople.length > 0 ? (
                  enrolledPeople.map(person => (
                    <FormField
                      key={person.id}
                      control={form.control}
                      name="presentIds"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(person.id)}
                              onCheckedChange={checked => {
                                const currentValues = field.value || [];
                                return checked
                                  ? field.onChange([...currentValues, person.id])
                                  : field.onChange(
                                      currentValues.filter(value => value !== person.id)
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{person.name}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-10">
                    No hay personas inscriptas en esta sesión.
                  </p>
                )}
              </div>
            </ScrollArea>
            <SheetFooter>
                <SheetClose asChild>
                    <Button type="button" variant="outline">
                        Cancelar
                    </Button>
                </SheetClose>
                <Button type="submit">Guardar Asistencia</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
