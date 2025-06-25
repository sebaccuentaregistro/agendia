
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Pencil, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useMemo, useEffect } from 'react';
import { Person, YogaClass } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  instructorId: z.string({ required_error: 'Debes seleccionar un especialista.' }).min(1, { message: 'Debes seleccionar un especialista.' }),
  actividadId: z.string({ required_error: 'Debes seleccionar una actividad.' }).min(1, { message: 'Debes seleccionar una actividad.' }),
  spaceId: z.string({ required_error: 'Debes seleccionar un espacio.' }).min(1, { message: 'Debes seleccionar un espacio.' }),
  dayOfWeek: z.enum(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:MM).' }),
});

export default function SchedulePage() {
  const { specialists, actividades, yogaClasses, spaces, addYogaClass, updateYogaClass, deleteYogaClass, people } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<YogaClass | undefined>(undefined);
  const [classToDelete, setClassToDelete] = useState<YogaClass | null>(null);
  const [viewingRoster, setViewingRoster] = useState<YogaClass | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      instructorId: '',
      actividadId: '',
      spaceId: '',
      dayOfWeek: 'Lunes',
      time: '09:00',
    },
  });
  
  const watchedActividadId = form.watch('actividadId');
  const watchedInstructorId = form.watch('instructorId');

  const availableSpecialists = useMemo(() => {
    if (!watchedActividadId) return specialists;
    return specialists.filter(s => s.actividadIds.includes(watchedActividadId));
  }, [watchedActividadId, specialists]);

  const availableActividades = useMemo(() => {
    if (!watchedInstructorId) return actividades;
    const specialist = specialists.find(s => s.id === watchedInstructorId);
    if (!specialist) return [];
    const specialistActividadIds = new Set(specialist.actividadIds);
    return actividades.filter(a => specialistActividadIds.has(a.id));
  }, [watchedInstructorId, specialists, actividades]);

  useEffect(() => {
    if (watchedActividadId && watchedInstructorId) {
      const isValid = availableSpecialists.some(s => s.id === watchedInstructorId);
      if (!isValid) {
        form.setValue('instructorId', '', { shouldValidate: true });
      }
    }
  }, [watchedActividadId, watchedInstructorId, availableSpecialists, form]);

  useEffect(() => {
    if (watchedInstructorId && watchedActividadId) {
      const isValid = availableActividades.some(a => a.id === watchedActividadId);
      if (!isValid) {
        form.setValue('actividadId', '', { shouldValidate: true });
      }
    }
  }, [watchedInstructorId, watchedActividadId, availableActividades, form]);

  const getClassDetails = (cls: YogaClass) => {
    const specialist = specialists.find((i) => i.id === cls.instructorId);
    const actividad = actividades.find((s) => s.id === cls.actividadId);
    const space = spaces.find((s) => s.id === cls.spaceId);
    return { specialist, actividad, space };
  };

  const getRoster = (cls: YogaClass): Person[] => {
    return people.filter(p => cls.personIds.includes(p.id));
  };

  const handleAdd = () => {
    setSelectedClass(undefined);
    form.reset({ instructorId: '', actividadId: '', spaceId: '', dayOfWeek: 'Lunes', time: '09:00' });
    setIsDialogOpen(true);
  };

  const handleEdit = (cls: YogaClass) => {
    setSelectedClass(cls);
    form.reset({ instructorId: cls.instructorId, actividadId: cls.actividadId, spaceId: cls.spaceId, dayOfWeek: cls.dayOfWeek, time: cls.time });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (cls: YogaClass) => {
    setClassToDelete(cls);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (classToDelete) {
      deleteYogaClass(classToDelete.id);
      setIsDeleteDialogOpen(false);
      setClassToDelete(null);
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (selectedClass) {
      updateYogaClass({ ...selectedClass, ...values });
    } else {
      addYogaClass(values);
    }
    setIsDialogOpen(false);
    setSelectedClass(undefined);
  }

  const formatTime = (time: string) => {
    if (!time || !time.includes(':')) return 'N/A';
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const formattedHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
    return `${formattedHour}:${minute} ${ampm}`;
  };
  
  const getTimeOfDay = (time: string): string => {
    if (!time) return '';
    const hour = parseInt(time.split(':')[0], 10);
    if (hour < 12) return 'Mañana';
    if (hour < 18) return 'Tarde';
    return 'Noche';
  };

  const sortedClasses = useMemo(() => {
    const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return [...yogaClasses].sort((a, b) => {
        const dayComparison = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
        if (dayComparison !== 0) return dayComparison;
        return a.time.localeCompare(b.time);
    });
  }, [yogaClasses]);


  return (
    <div>
      <PageHeader title="Gestión de Horarios">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Horario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedClass ? 'Editar Clase' : 'Programar Nueva Clase'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="actividadId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actividad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una actividad" /></SelectTrigger></FormControl>
                      <SelectContent>{availableActividades.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="instructorId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialista</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un especialista" /></SelectTrigger></FormControl>
                      <SelectContent>{availableSpecialists.map((i) => (<SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>))}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="spaceId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Espacio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un espacio" /></SelectTrigger></FormControl>
                      <SelectContent>{spaces.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name} ({s.capacity} pers.)</SelectItem>))}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )}/>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="dayOfWeek" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Día</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (<SelectItem key={day} value={day}>{day}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="time" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
                <DialogFooter><Button type="submit">Guardar Cambios</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {isMounted ? (
          sortedClasses.length > 0 ? (
            sortedClasses.map((cls) => {
              const { specialist, actividad, space } = getClassDetails(cls);
              const capacity = space?.capacity || 0;
              const enrolledCount = cls.personIds?.length || 0;
              const availableSpots = capacity - enrolledCount;
              const classTitle = `${actividad?.name || 'Clase'} ${getTimeOfDay(cls.time)}`;
              const isFull = availableSpots <= 0;

              return (
                <Card key={cls.id} className="flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                    <CardTitle className="text-lg font-bold">{classTitle}</CardTitle>
                    <div className={cn('text-sm font-semibold px-2 py-1 rounded-full', isFull ? 'bg-pink-100 text-pink-800' : 'bg-green-100 text-green-800' )}>
                      {isFull ? 'Clase Llena' : `${availableSpots} Lugares`}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow p-4 space-y-2">
                    <p className="text-sm text-muted-foreground"><span className="font-semibold text-card-foreground">Día y Hora:</span> {cls.dayOfWeek}, {formatTime(cls.time)}</p>
                    <p className="text-sm text-muted-foreground"><span className="font-semibold text-card-foreground">Especialista:</span> {specialist?.name}</p>
                    <p className="text-sm text-muted-foreground"><span className="font-semibold text-card-foreground">Espacio:</span> {space?.name}</p>
                    <p className="text-sm text-muted-foreground"><span className="font-semibold text-card-foreground">Inscritos:</span> {enrolledCount}/{capacity}</p>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between bg-muted/50 p-3">
                    <Button variant="link" className="h-auto p-0 text-sm" onClick={() => setViewingRoster(cls)}>
                      <Users className="mr-2 h-4 w-4" />
                      Ver Personas
                    </Button>
                    <div className="flex items-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(cls)}><Pencil className="h-4 w-4" /><span className="sr-only">Editar</span></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDeleteDialog(cls)}><Trash2 className="h-4 w-4" /><span className="sr-only">Eliminar</span></Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <div className="col-span-1 md:col-span-2 xl:col-span-3">
               <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center">
                  <CardHeader>
                    <CardTitle>No Hay Clases Programadas</CardTitle>
                    <CardDescription>Empieza a organizar tu estudio añadiendo tu primera clase.</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Horario</Button>
                  </CardContent>
                </Card>
            </div>
          )
        ) : (
          [...Array(6)].map((_, i) => <Skeleton key={i} className="h-60 w-full" />)
        )}
      </div>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la clase. Si hay personas inscritas, la eliminación será bloqueada para proteger tus datos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClassToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sí, eliminar clase</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!viewingRoster} onOpenChange={(open) => !open && setViewingRoster(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Lista de Personas</SheetTitle>
            {viewingRoster && (<SheetDescription>{actividades.find(a => a.id === viewingRoster.actividadId)?.name} - {viewingRoster.dayOfWeek}, {formatTime(viewingRoster.time)}</SheetDescription>)}
          </SheetHeader>
          <div className="py-4">
            <ul className="space-y-3">
                {viewingRoster && getRoster(viewingRoster).length > 0 ? (
                    getRoster(viewingRoster).map(person => (
                        <li key={person.id} className="flex items-center gap-3">
                            <Avatar><AvatarImage src={person.avatar} alt={person.name} data-ai-hint="person photo"/><AvatarFallback>{person.name.charAt(0)}</AvatarFallback></Avatar>
                            <span>{person.name}</span>
                        </li>
                    ))
                ) : (<p className="text-sm text-muted-foreground">No hay personas inscritas en esta clase.</p>)}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
