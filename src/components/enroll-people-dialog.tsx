

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
import { Session, Person } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface EnrollPeopleDialogProps {
  session: Session | null;
  onClose: () => void;
}

export function EnrollPeopleDialog({ session, onClose }: EnrollPeopleDialogProps) {
  const { people, spaces, enrollPeopleInClass, actividades, tariffs, sessions: allSessions, triggerWaitlistCheck } = useStudio();
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<{ personIds: string[] }>();
  
  useEffect(() => {
    form.reset({ personIds: session?.personIds || [] });
  }, [session, form]);

  const watchedPersonIds = form.watch('personIds') || [];

  const space = useMemo(() => session ? spaces.find(s => s.id === session.spaceId) : undefined, [spaces, session]);
  const capacity = space?.capacity ?? 0;
  const isOverCapacity = watchedPersonIds.length > capacity;
  const actividad = useMemo(() => session ? actividades.find(a => a.id === session.actividadId) : undefined, [actividades, session]);

  // Memoize the list of people with their enrollment data
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

  // This list now includes all people, so we can see the "ghosts"
  const allPeopleInList = useMemo(() => {
    if (!session) return [];
    const sessionPersonIds = new Set(session.personIds || []);
    return peopleWithEnrollmentData.filter(p => sessionPersonIds.has(p.id));
  }, [session, peopleWithEnrollmentData]);


  // Filtered list for display, based on search term and existing selections
  const filteredPeopleForDisplay = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    
    // Always include people already in the session, regardless of search term
    const enrolledPeople = allPeopleInList;
    const enrolledIds = new Set(enrolledPeople.map(p => p.id));
    
    const searchedPeople = peopleWithEnrollmentData.filter(person => {
        // Exclude if already in the enrolled list to avoid duplication
        if (enrolledIds.has(person.id)) return false; 
        
        // Match by search term
        return person.name.toLowerCase().includes(lowercasedFilter);
    });

    return [...enrolledPeople, ...searchedPeople];
  }, [searchTerm, peopleWithEnrollmentData, allPeopleInList]);


  async function onSubmit(data: { personIds: string[] }) {
    if (isOverCapacity || !session) return;
    
    await enrollPeopleInClass(session.id, data.personIds);

    onClose();
  }
  
  if (!session) return null;

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inscripción Fija: {actividad?.name}</DialogTitle>
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
                    {filteredPeopleForDisplay.length > 0 ? filteredPeopleForDisplay.map(person => {
                      const isCurrentlyEnrolled = form.getValues('personIds').includes(person.id);
                      
                      const effectiveClassCount = isCurrentlyEnrolled
                        ? person.currentWeeklyClasses
                        : person.currentWeeklyClasses + 1;
                      
                      const hasReachedLimit = person.weeklyClassLimit !== undefined && effectiveClassCount > person.weeklyClassLimit;

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
                                    (hasReachedLimit && !field.value?.includes(person.id))
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
                                        {isCurrentlyEnrolled ? person.currentWeeklyClasses : person.currentWeeklyClasses + 1}/{person.weeklyClassLimit} clases
                                    </Badge>
                                  )}
                                </FormLabel>
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
