'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Trash2, Pencil, Users, FileDown } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionAlert, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useMemo, useEffect } from 'react';
import { Person, YogaClass } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, exportToCsv } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  instructorId: z.string({ required_error: 'Debes seleccionar un especialista.' }).min(1, { message: 'Debes seleccionar un especialista.' }),
  actividadId: z.string({ required_error: 'Debes seleccionar una actividad.' }).min(1, { message: 'Debes seleccionar una actividad.' }),
  spaceId: z.string({ required_error: 'Debes seleccionar un espacio.' }).min(1, { message: 'Debes seleccionar un espacio.' }),
  dayOfWeek: z.enum(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:MM).' }),
});

function EnrollPeopleDialog({ yogaClass, onClose }: { yogaClass: YogaClass; onClose: () => void; }) {
  const { people, spaces, enrollPeopleInClass, actividades } = useStudio();
  
  const form = useForm<{ personIds: string[] }>({
    defaultValues: { personIds: yogaClass.personIds || [] },
  });
  const watchedPersonIds = form.watch('personIds');

  const space = spaces.find(s => s.id === yogaClass.spaceId);
  const capacity = space?.capacity ?? 0;
  const actividad = actividades.find(a => a.id === yogaClass.actividadId);

  function onSubmit(data: { personIds: string[] }) {
    enrollPeopleInClass(yogaClass.id, data.personIds);
    onClose();
  }

  const sortedPeople = [...people].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inscribir: {actividad?.name}</DialogTitle>
          <DialogDescription>
            Selecciona las personas para la clase. Ocupación: {watchedPersonIds.length}/{capacity}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="personIds"
              render={() => (
                <FormItem>
                  <ScrollArea className="h-72 rounded-md border p-4">
                    {sortedPeople.length > 0 ? sortedPeople.map(person => (
                      <FormField
                        key={person.id}
                        control={form.control}
                        name="personIds"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(person.id)}
                                disabled={
                                  !field.value?.includes(person.id) &&
                                  watchedPersonIds.length >= capacity
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
                            <FormLabel className="font-normal">{person.name}</FormLabel>
                          </FormItem>
                        )}
                      />
                    )) : <p className="text-center text-sm text-muted-foreground">No hay personas para inscribir.</p>}
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function SchedulePage() {
  const { specialists, actividades, yogaClasses, spaces, addYogaClass, updateYogaClass, deleteYogaClass } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<YogaClass | undefined>(undefined);
  const [classToDelete, setClassToDelete] = useState<YogaClass | null>(null);
  const [classToManage, setClassToManage] = useState<YogaClass | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [filters, setFilters] = useState({
    specialistId: 'all',
    actividadId: 'all',
    spaceId: 'all',
    dayOfWeek: 'all',
    timeOfDay: 'all',
  });

  useEffect(() => { setIsMounted(true); }, []);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

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
  
  const getTimeOfDay = (time: string): 'Mañana' | 'Tarde' | 'Noche' => {
    if (!time) return 'Tarde';
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
  
  const filteredClasses = useMemo(() => {
    return sortedClasses.filter(cls => {
        const timeOfDay = getTimeOfDay(cls.time);
        return (
            (filters.actividadId === 'all' || cls.actividadId === filters.actividadId) &&
            (filters.spaceId === 'all' || cls.spaceId === filters.spaceId) &&
            (filters.specialistId === 'all' || cls.instructorId === filters.specialistId) &&
            (filters.dayOfWeek === 'all' || cls.dayOfWeek === filters.dayOfWeek) &&
            (filters.timeOfDay === 'all' || timeOfDay === filters.timeOfDay)
        );
    });
  }, [sortedClasses, filters]);


  const handleExportSchedule = () => {
    const headers = {
        actividad: 'Actividad',
        especialista: 'Especialista',
        espacio: 'Espacio',
        dia: 'Día',
        hora: 'Hora',
        inscritos: 'Inscritos',
        capacidad: 'Capacidad'
    };
    const dataToExport = filteredClasses.map(cls => {
        const { specialist, actividad, space } = getClassDetails(cls);
        return {
            actividad: actividad?.name || 'N/A',
            especialista: specialist?.name || 'N/A',
            espacio: space?.name || 'N/A',
            dia: cls.dayOfWeek,
            hora: cls.time,
            inscritos: cls.personIds.length,
            capacidad: space?.capacity || 0
        }
    });

    exportToCsv('horarios.csv', dataToExport, headers);
  };


  return (
    <div>
      <PageHeader title="Gestión de Horarios">
        <div className="flex items-center gap-2">
           <Button onClick={handleExportSchedule} variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Exportar
          </Button>
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
        </div>
      </PageHeader>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base font-medium">Filtrar Horarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Select value={filters.dayOfWeek} onValueChange={(value) => handleFilterChange('dayOfWeek', value)}>
              <SelectTrigger><SelectValue placeholder="Día de la semana" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los días</SelectItem>
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.timeOfDay} onValueChange={(value) => handleFilterChange('timeOfDay', value)}>
              <SelectTrigger><SelectValue placeholder="Momento del día" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el día</SelectItem>
                <SelectItem value="Mañana">Mañana</SelectItem>
                <SelectItem value="Tarde">Tarde</SelectItem>
                <SelectItem value="Noche">Noche</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.specialistId} onValueChange={(value) => handleFilterChange('specialistId', value)}>
              <SelectTrigger><SelectValue placeholder="Especialista" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los especialistas</SelectItem>
                {specialists.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.actividadId} onValueChange={(value) => handleFilterChange('actividadId', value)}>
              <SelectTrigger><SelectValue placeholder="Actividad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las actividades</SelectItem>
                {actividades.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.spaceId} onValueChange={(value) => handleFilterChange('spaceId', value)}>
              <SelectTrigger><SelectValue placeholder="Espacio" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los espacios</SelectItem>
                {spaces.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {isMounted ? (
          sortedClasses.length > 0 ? (
            filteredClasses.length > 0 ? (
                filteredClasses.map((cls) => {
                const { specialist, actividad, space } = getClassDetails(cls);
                const capacity = space?.capacity || 0;
                const enrolledCount = cls.personIds?.length || 0;
                const availableSpots = capacity - enrolledCount;
                const classTitle = `${actividad?.name || 'Clase'}`;
                const isFull = availableSpots <= 0;

                return (
                  <Card key={cls.id} className={cn("flex flex-col transition-colors", isFull && "bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-800")}>
                    <CardHeader className={cn("flex flex-row items-center justify-between p-4 border-b", isFull && "border-pink-200 dark:border-pink-800")}>
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
                    <CardFooter className={cn("flex items-center justify-between bg-muted/50 p-3 border-t", isFull && "border-pink-200 dark:border-pink-800")}>
                      <Button variant="outline" className="h-auto px-3 py-1 text-sm" onClick={() => setClassToManage(cls)}>
                        <Users className="mr-2 h-4 w-4" />
                        Inscribir Personas
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
                        <CardTitle>No se encontraron clases</CardTitle>
                        <CardDescription>Prueba a cambiar o limpiar los filtros.</CardDescription>
                    </CardHeader>
                    </Card>
              </div>
            )
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
            <AlertDialogDescriptionAlert>Esta acción no se puede deshacer. Esto eliminará permanentemente la clase. Si hay personas inscritas, la eliminación será bloqueada para proteger tus datos.</AlertDialogDescriptionAlert>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClassToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sí, eliminar clase</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {classToManage && <EnrollPeopleDialog yogaClass={classToManage} onClose={() => setClassToManage(null)} />}
    </div>
  );
}
