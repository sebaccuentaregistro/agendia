'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Person, YogaClass } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const formSchema = z.object({
  instructorId: z.string({
    required_error: 'Debes seleccionar un especialista.',
  }).min(1, { message: 'Debes seleccionar un especialista.' }),
  actividadId: z.string({ required_error: 'Debes seleccionar una actividad.' }).min(1, { message: 'Debes seleccionar una actividad.' }),
  spaceId: z.string({ required_error: 'Debes seleccionar un espacio.' }),
  dayOfWeek: z.enum([
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo',
  ]),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: 'Formato de hora inválido (HH:MM).',
    }),
  capacity: z.coerce
    .number()
    .min(1, { message: 'La capacidad debe ser de al menos 1.' }),
});

export default function SchedulePage() {
  const {
    specialists,
    actividades,
    yogaClasses,
    spaces,
    addYogaClass,
    updateYogaClass,
    deleteYogaClass,
    people,
  } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<YogaClass | undefined>(
    undefined
  );
  const [classToDelete, setClassToDelete] = useState<YogaClass | null>(null);
  const [viewingRoster, setViewingRoster] = useState<YogaClass | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      instructorId: '',
      actividadId: '',
      spaceId: undefined,
      dayOfWeek: 'Lunes',
      time: '09:00',
      capacity: 15,
    },
  });

  const watchedActividadId = form.watch('actividadId');
  const watchedInstructorId = form.watch('instructorId');

  const filteredSpecialists = useMemo(() => {
    if (!watchedActividadId) return specialists;
    return specialists.filter(s => s.actividadIds.includes(watchedActividadId));
  }, [watchedActividadId, specialists]);

  const filteredActividades = useMemo(() => {
    if (!watchedInstructorId) return actividades;
    const specialist = specialists.find(s => s.id === watchedInstructorId);
    if (!specialist) return actividades;
    return actividades.filter(a => specialist.actividadIds.includes(a.id));
  }, [watchedInstructorId, actividades, specialists]);

  useEffect(() => {
    const instructorId = form.getValues('instructorId');
    if (instructorId && filteredSpecialists.length > 0 && !filteredSpecialists.find(s => s.id === instructorId)) {
      form.setValue('instructorId', '', { shouldValidate: true });
    }
  }, [watchedActividadId, filteredSpecialists, form]);
  
  useEffect(() => {
    const actividadId = form.getValues('actividadId');
    if (actividadId && filteredActividades.length > 0 && !filteredActividades.find(a => a.id === actividadId)) {
      form.setValue('actividadId', '', { shouldValidate: true });
    }
  }, [watchedInstructorId, filteredActividades, form]);

  const getClassDetails = (cls: YogaClass) => {
    const specialist = specialists.find((i) => i.id === cls.instructorId);
    const actividad = actividades.find((s) => s.id === cls.actividadId);
    const space = spaces.find((s) => s.id === cls.spaceId);
    return { specialist, actividad, space };
  };

  const getRoster = (cls: YogaClass): Person[] => {
    return people.filter(p => cls.personIds.includes(p.id));
  }

  const handleAdd = () => {
    setSelectedClass(undefined);
    form.reset({
      instructorId: '',
      actividadId: '',
      spaceId: undefined,
      dayOfWeek: 'Lunes',
      time: '09:00',
      capacity: 15,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (cls: YogaClass) => {
    setSelectedClass(cls);
    form.reset({
      instructorId: cls.instructorId,
      actividadId: cls.actividadId,
      spaceId: cls.spaceId,
      dayOfWeek: cls.dayOfWeek,
      time: cls.time,
      capacity: cls.capacity,
    });
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

  return (
    <div>
      <PageHeader
        title="Horario de Clases"
        description="Programa clases, gestiona las asignaciones de especialistas y haz un seguimiento de la capacidad."
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Programar Clase
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedClass ? 'Editar Clase' : 'Programar Nueva Clase'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="actividadId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actividad</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una actividad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredActividades.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instructorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especialista</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un especialista" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredSpecialists.map((i) => (
                            <SelectItem key={i.id} value={i.id}>
                              {i.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="spaceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Espacio</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un espacio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {spaces.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dayOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Día</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[
                              'Lunes',
                              'Martes',
                              'Miércoles',
                              'Jueves',
                              'Viernes',
                              'Sábado',
                              'Domingo',
                            ].map((day) => (
                              <SelectItem key={day} value={day}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidad</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Guardar Cambios</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Actividad</TableHead>
              <TableHead className="hidden sm:table-cell">Especialista</TableHead>
              <TableHead>Día y Hora</TableHead>
              <TableHead className="hidden md:table-cell">Espacio</TableHead>
              <TableHead className="hidden lg:table-cell">Capacidad</TableHead>
              <TableHead>
                <span className="sr-only">Menú</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {yogaClasses.map((cls) => {
              const { specialist, actividad, space } = getClassDetails(cls);
              const enrolledCount = cls.personIds?.length || 0;
              const capacityPercentage =
                (enrolledCount / cls.capacity) * 100;

              return (
                <TableRow key={cls.id}>
                  <TableCell className="font-medium">
                    {actividad?.name}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{specialist?.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{cls.dayOfWeek}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(cls.time)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{space?.name}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <Progress value={capacityPercentage} className="w-24" />
                      <span className="text-sm text-muted-foreground">
                        {enrolledCount}/{cls.capacity}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Alternar menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(cls)}>
                          Editar Clase
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setViewingRoster(cls)}>Ver Lista</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => openDeleteDialog(cls)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar Clase
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              la clase y desinscribirá a todas las personas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClassToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sí, eliminar clase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!viewingRoster} onOpenChange={(open) => !open && setViewingRoster(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Lista de Personas</SheetTitle>
            {viewingRoster && (
                <SheetDescription>
                    {actividades.find(a => a.id === viewingRoster.actividadId)?.name} - {viewingRoster.dayOfWeek}, {formatTime(viewingRoster.time)}
                </SheetDescription>
            )}
          </SheetHeader>
          <div className="py-4">
            <ul className="space-y-3">
                {viewingRoster && getRoster(viewingRoster).length > 0 ? (
                    getRoster(viewingRoster).map(person => (
                        <li key={person.id} className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={person.avatar} alt={person.name} data-ai-hint="person photo"/>
                                <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{person.name}</span>
                        </li>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">No hay personas inscritas en esta clase.</p>
                )}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
