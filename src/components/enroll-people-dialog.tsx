

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useStudio } from '@/context/StudioContext';
import { Session } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface EnrollPeopleDialogProps {
  session: Session;
  onClose: () => void;
}

export function EnrollPeopleDialog({ session, onClose }: EnrollPeopleDialogProps) {
  const { people, spaces, enrollPeopleInClass, actividades, tariffs, sessions: allSessions } = useStudio();
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<{ personIds: string[] }>({
    defaultValues: { personIds: session.personIds || [] },
  });
  const watchedPersonIds = form.watch('personIds');

  const space = spaces.find(s => s.id === session.spaceId);
  const capacity = space?.capacity ?? 0;
  const isOverCapacity = watchedPersonIds.length > capacity;
  const actividad = actividades.find(a => a.id === session.actividadId);

  const peopleWithEnrollmentData = useMemo(() => {
    return people.map(person => {
      const personTariff = tariffs.find(t => t.id === person.tariffId);
      const weeklyClassLimit = personTariff?.frequency;
      
      const currentWeeklyClasses = allSessions.filter(s => s.personIds.includes(person.id)).length;

      return {
        ...person,
        weeklyClassLimit,
        currentWeeklyClasses
      };
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [people, tariffs, allSessions]);

  const filteredPeople = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    return peopleWithEnrollmentData.filter(person => {
      const isSelected = watchedPersonIds.includes(person.id);
      const nameMatches = person.name.toLowerCase().includes(lowercasedFilter);
      return isSelected || nameMatches;
    });
  }, [searchTerm, peopleWithEnrollmentData, watchedPersonIds]);


  function onSubmit(data: { personIds: string[] }) {
    if (isOverCapacity) return;
    enrollPeopleInClass(session.id, data.personIds);
    onClose();
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inscribir: {actividad?.name}</DialogTitle>
          <DialogDescription>
            Selecciona las personas para la sesión. Ocupación: {watchedPersonIds.length}/{capacity}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="my-2">
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <FormField
              control={form.control}
              name="personIds"
              render={() => (
                <FormItem>
                  <ScrollArea className="h-72 rounded-md border p-4">
                    {filteredPeople.length > 0 ? filteredPeople.map(person => {
                      const isAlreadyEnrolledInThisClass = session.personIds.includes(person.id);
                      
                      const effectiveClassCount = isAlreadyEnrolledInThisClass
                        ? person.currentWeeklyClasses - 1
                        : person.currentWeeklyClasses;
                      
                      const hasReachedLimit = person.weeklyClassLimit !== undefined && effectiveClassCount >= person.weeklyClassLimit;

                      return (
                        <FormField
                          key={person.id}
                          control={form.control}
                          name="personIds"
                          render={({ field }) => (
                            <FormItem
                              key={person.id}
                              className="flex flex-row items-center space-x-3 space-y-0 py-2"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(person.id)}
                                  disabled={
                                    (!field.value?.includes(person.id) && watchedPersonIds.length >= capacity) ||
                                    (hasReachedLimit && !isAlreadyEnrolledInThisClass)
                                  }
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
                              <div className="flex flex-col">
                                <FormLabel className="font-normal flex items-center gap-2">
                                  {person.name}
                                  {person.weeklyClassLimit !== undefined && (
                                    <Badge variant={hasReachedLimit ? "destructive" : "secondary"}>
                                        {person.currentWeeklyClasses}/{person.weeklyClassLimit} clases
                                    </Badge>
                                  )}
                                </FormLabel>
                                {hasReachedLimit && !isAlreadyEnrolledInThisClass && (
                                    <p className="text-xs text-destructive">Límite del plan alcanzado.</p>
                                )}
                              </div>
                            </FormItem>
                          )}
                        />
                      );
                    }) : <p className="text-center text-sm text-muted-foreground">No se encontraron personas.</p>}
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
             {isOverCapacity && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Límite de Capacidad Excedido</AlertTitle>
                <AlertDescription>
                  Has seleccionado {watchedPersonIds.length} personas, pero la capacidad máxima es {capacity}.
                </AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isOverCapacity}>Guardar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
