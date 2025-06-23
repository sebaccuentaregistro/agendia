'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Student } from '@/types';
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useStudio } from '@/context/StudioContext';
import { getStudentPaymentStatus, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSearchParams } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().min(1, { message: 'El teléfono es obligatorio.' }),
  membershipType: z.enum(['Mensual', 'Diario'], {
    required_error: 'Debes seleccionar un tipo de membresía.',
  }),
});

function EnrollDialog({ student, onOpenChange }: { student: Student; onOpenChange: (open: boolean) => void }) {
  const { yogaClasses, specialists, actividades, enrollStudentInClasses, spaces } = useStudio();

  const enrolledIn = useMemo(() =>
    yogaClasses
      .filter(cls => cls.studentIds.includes(student.id))
      .map(cls => cls.id),
    [yogaClasses, student.id]
  );
  
  const form = useForm<{ classIds: string[] }>({
    defaultValues: {
      classIds: enrolledIn,
    },
  });

  const [actividadFilter, setActividadFilter] = useState('all');
  const [specialistFilter, setSpecialistFilter] = useState('all');

  const filteredSpecialistsForDropdown = useMemo(() => {
    if (actividadFilter === 'all') {
      return specialists;
    }
    return specialists.filter(s => s.actividadIds.includes(actividadFilter));
  }, [actividadFilter, specialists]);

  const filteredActividadesForDropdown = useMemo(() => {
    if (specialistFilter === 'all') {
      return actividades;
    }
    const specialist = specialists.find(s => s.id === specialistFilter);
    if (!specialist) {
      return [];
    }
    return actividades.filter(a => specialist.actividadIds.includes(a.id));
  }, [specialistFilter, actividades, specialists]);
  
  useEffect(() => {
    const specialist = specialists.find(s => s.id === specialistFilter);
    if (specialist && actividadFilter !== 'all' && !specialist.actividadIds.includes(actividadFilter)) {
        setActividadFilter('all');
    }
  }, [specialistFilter, specialists, actividadFilter]);

  useEffect(() => {
      if (specialistFilter !== 'all' && !filteredSpecialistsForDropdown.some(s => s.id === specialistFilter)) {
          setSpecialistFilter('all');
      }
  }, [actividadFilter, specialistFilter, filteredSpecialistsForDropdown]);

  const filteredClasses = useMemo(() => {
    return yogaClasses.filter(cls => {
        const matchesActividad = actividadFilter === 'all' || cls.actividadId === actividadFilter;
        const matchesSpecialist = specialistFilter === 'all' || cls.instructorId === specialistFilter;
        return matchesActividad && matchesSpecialist;
    }).sort((a, b) => a.dayOfWeek.localeCompare(b.dayOfWeek) || a.time.localeCompare(b.time));
  }, [yogaClasses, actividadFilter, specialistFilter]);


  function onSubmit(data: { classIds: string[] }) {
    enrollStudentInClasses(student.id, data.classIds);
    onOpenChange(false);
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
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Clases a {student.name}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Actividad</Label>
                <Select onValueChange={setActividadFilter} value={actividadFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por actividad..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {filteredActividadesForDropdown.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Especialista</Label>
                <Select onValueChange={setSpecialistFilter} value={specialistFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por especialista..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {filteredSpecialistsForDropdown.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <FormField
              control={form.control}
              name="classIds"
              render={() => (
                <FormItem>
                  <FormLabel>Clases Disponibles</FormLabel>
                  <ScrollArea className="h-72 rounded-md border p-4">
                    <div className="space-y-4">
                      {filteredClasses.length > 0 ? (
                        filteredClasses.map((item) => {
                          const specialist = specialists.find(i => i.id === item.instructorId);
                          const actividad = actividades.find(a => a.id === item.actividadId);
                          const space = spaces.find(s => s.id === item.spaceId);

                          if (!actividad || !specialist) {
                            return null;
                          }

                          return (
                            <FormField
                              key={item.id}
                              control={form.control}
                              name="classIds"
                              render={({ field }) => {
                                const isEnrolledInForm = field.value?.includes(item.id);
                                const isFull = item.studentIds.length >= item.capacity;

                                return (
                                <FormItem
                                  className={cn("flex flex-row items-start space-x-3 space-y-0 rounded-md p-3 transition-colors", 
                                      isFull && !isEnrolledInForm ? "bg-muted/50 opacity-50" : "hover:bg-muted/50",
                                  )}
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={isEnrolledInForm}
                                      disabled={isFull && !isEnrolledInForm}
                                      onCheckedChange={(checked) => {
                                        const currentValues = field.value || [];
                                        return checked
                                          ? field.onChange([...currentValues, item.id])
                                          : field.onChange(
                                              currentValues.filter(
                                                (value) => value !== item.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                      <FormLabel className={cn("font-normal", isFull && !isEnrolledInForm && "cursor-not-allowed")}>
                                        {actividad.name}
                                      </FormLabel>
                                      <p className="text-xs text-muted-foreground">
                                          {specialist?.name} | {item.dayOfWeek} {formatTime(item.time)} | {space?.name} | ({item.studentIds.length}/{item.capacity})
                                      </p>
                                      {isFull && !isEnrolledInForm && <p className="text-xs text-destructive">Clase llena</p>}
                                  </div>
                                </FormItem>
                                );
                              }}
                            />
                          );
                        })
                      ) : (
                         <p className="text-center text-sm text-muted-foreground py-4">
                           No hay clases que coincidan con los filtros seleccionados.
                         </p>
                      )}
                    </div>
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentsPage() {
  const { students, addStudent, updateStudent, deleteStudent, recordPayment, undoLastPayment } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>(undefined);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [studentToEnroll, setStudentToEnroll] = useState<Student | null>(null);
  
  const searchParams = useSearchParams();

  const studentForDialog = useMemo(() => {
    if (!selectedStudent) return undefined;
    return students.find(s => s.id === selectedStudent.id);
  }, [students, selectedStudent]);

  const filteredStudents = useMemo(() => {
    const filter = searchParams.get('filter');
    if (filter === 'overdue') {
      return students.filter(
        (student) => getStudentPaymentStatus(student) === 'Atrasado'
      );
    }
    return students;
  }, [students, searchParams]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      membershipType: 'Mensual',
    },
  });

  const getPaymentStatusBadge = (student: Student) => {
    const status = getStudentPaymentStatus(student);
    if (status === 'Al día') {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Al día</Badge>;
    }
    return <Badge variant="destructive">Atrasado</Badge>;
  };

  function handleEdit(student: Student) {
    setSelectedStudent(student);
    form.reset({
      name: student.name,
      phone: student.phone,
      membershipType: student.membershipType,
    });
    setIsDialogOpen(true);
  }

  function handleAdd() {
    setSelectedStudent(undefined);
    form.reset({ name: '', phone: '', membershipType: 'Mensual' });
    setIsDialogOpen(true);
  }

  function openDeleteDialog(student: Student) {
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  }

  function handleDelete() {
    if (studentToDelete) {
      deleteStudent(studentToDelete.id);
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (studentForDialog) {
      updateStudent({ ...studentForDialog, ...values });
    } else {
      addStudent(values);
    }
    setIsDialogOpen(false);
    setSelectedStudent(undefined);
  }

  return (
    <div>
      <PageHeader title="Asistentes" description="Gestiona los perfiles de los asistentes y el estado de los pagos.">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setSelectedStudent(undefined);
            }
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Asistente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{studentForDialog ? 'Editar Asistente' : 'Añadir Nuevo Asistente'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} className="col-span-3" />
                        </FormControl>
                        <FormMessage className="col-span-3 col-start-2" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Teléfono</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} className="col-span-3" />
                        </FormControl>
                        <FormMessage className="col-span-3 col-start-2" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="membershipType"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-start gap-4">
                        <FormLabel className="text-right pt-2">Membresía</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="col-span-3 flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Mensual" />
                              </FormControl>
                              <FormLabel className="font-normal">Mensual</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Diario" />
                              </FormControl>
                              <FormLabel className="font-normal">Diario</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage className="col-span-3 col-start-2" />
                      </FormItem>
                    )}
                  />
                </div>
                
                {studentForDialog && studentForDialog.membershipType === 'Mensual' && (
                  <div className="space-y-4 pt-4">
                    <Separator />
                    <div className="space-y-2">
                       <Label>Gestión de Pagos</Label>
                       <p className="text-sm text-muted-foreground">
                         Cambia manualmente el estado de pago del asistente.
                       </p>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex flex-col">
                         <span className="text-sm font-medium">Estado Actual</span>
                         <span className={cn(
                          "text-sm font-bold",
                          getStudentPaymentStatus(studentForDialog) === 'Al día' ? 'text-green-700' : 'text-destructive'
                         )}>
                          {getStudentPaymentStatus(studentForDialog)}
                         </span>
                      </div>
                       {getStudentPaymentStatus(studentForDialog) === 'Al día' ? (
                          <Button type="button" variant="outline" size="sm" onClick={() => undoLastPayment(studentForDialog.id)}>
                            Deshacer Pago
                          </Button>
                       ) : (
                          <Button type="button" variant="outline" size="sm" onClick={() => recordPayment(studentForDialog.id)}>
                            Registrar Pago
                          </Button>
                       )}
                    </div>
                  </div>
                )}

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
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Membresía</TableHead>
              <TableHead>Estado del Pago</TableHead>
              <TableHead>Inscrito Desde</TableHead>
              <TableHead><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={student.avatar} alt={student.name} data-ai-hint="person photo"/>
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{student.name}</span>
                  </div>
                </TableCell>
                <TableCell>{student.phone}</TableCell>
                <TableCell>{student.membershipType}</TableCell>
                <TableCell>{getPaymentStatusBadge(student)}</TableCell>
                <TableCell>{format(student.joinDate, 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Alternar menú</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(student)}>Editar</DropdownMenuItem>
                       <DropdownMenuItem onClick={() => setStudentToEnroll(student)}>
                        Asignar a Clases
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDeleteDialog(student)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {studentToEnroll && (
        <EnrollDialog
            student={studentToEnroll}
            onOpenChange={(open) => !open && setStudentToEnroll(null)}
        />
      )}

       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al asistente, sus datos de pago y lo desinscribirá de todas las clases.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStudentToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Sí, eliminar asistente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
