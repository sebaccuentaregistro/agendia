'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Student } from '@/types';
import { MoreHorizontal, PlusCircle, Trash2, DollarSign, Undo2, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudio } from '@/context/StudioContext';
import { getStudentPaymentStatus } from '@/lib/utils';
import { format } from 'date-fns';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  phone: z.string().min(1, { message: "El teléfono es obligatorio." }),
  membershipType: z.enum(['Mensual', 'Diario']),
});

export default function StudentsPage() {
  const { students, addStudent, updateStudent, deleteStudent, recordPayment, undoLastPayment, payments } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>(undefined);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const filter = searchParams.get('filter');

  const displayedStudents = useMemo(() => {
    if (filter === 'overdue') {
      return students.filter(student => getStudentPaymentStatus(student) === 'Atrasado');
    }
    return students;
  }, [students, filter]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      membershipType: 'Mensual',
    },
  });

  function handleAdd() {
    setSelectedStudent(undefined);
    form.reset({
      name: '',
      phone: '',
      membershipType: 'Mensual',
    });
    setIsDialogOpen(true);
  }

  function handleEdit(student: Student) {
    setSelectedStudent(student);
    form.reset({
      name: student.name,
      phone: student.phone,
      membershipType: student.membershipType,
    });
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
    if (selectedStudent) {
      updateStudent({ ...selectedStudent, ...values });
    } else {
      addStudent(values);
    }
    setIsDialogOpen(false);
    setSelectedStudent(undefined);
  }

  const getBadgeVariant = (status: 'Al día' | 'Atrasado') => {
    switch (status) {
      case 'Al día':
        return 'default';
      case 'Atrasado':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  return (
    <div>
      <PageHeader title="Asistentes" description="Gestiona los perfiles de los asistentes y el estado de los pagos.">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Asistente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedStudent ? 'Editar Asistente' : 'Añadir Nuevo Asistente'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del asistente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="555-123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="membershipType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Membresía</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un tipo de membresía" />
                            </Trigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Mensual">Mensual</SelectItem>
                            <SelectItem value="Diario">Diario</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                   <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                   <Button type="submit">Guardar Cambios</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </PageHeader>
      
      {filter === 'overdue' && (
        <div className="mb-4 flex items-center justify-between rounded-lg border bg-card p-4">
          <p className="text-sm text-card-foreground">
            Mostrando solo asistentes con pagos atrasados.
          </p>
          <Button variant="outline" onClick={() => router.push('/students')}>
            Mostrar Todos los Asistentes
          </Button>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Membresía</TableHead>
              <TableHead>Estado de Pago</TableHead>
              <TableHead>Último Pago</TableHead>
              <TableHead><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedStudents.map((student) => {
              const paymentStatus = getStudentPaymentStatus(student);
              const studentPaymentsCount = payments.filter(p => p.studentId === student.id).length;
              const whatsappUrl = `https://wa.me/${student.phone.replace(/\D/g, '')}`;

              return (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={student.avatar} alt={student.name} data-ai-hint="person photo" />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{student.phone}</TableCell>
                  <TableCell>{student.membershipType}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={getBadgeVariant(paymentStatus)}>
                        {paymentStatus}
                      </Badge>
                      <Link
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="sr-only">Enviar WhatsApp</span>
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>{format(student.lastPaymentDate, 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Alternar menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(student)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => recordPayment(student.id)}
                          disabled={student.membershipType === 'Diario'}
                        >
                          <DollarSign className="mr-2 h-4 w-4" />
                          Registrar Pago
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => undoLastPayment(student.id)}
                          disabled={studentPaymentsCount === 0}
                        >
                          <Undo2 className="mr-2 h-4 w-4" />
                          Anular último pago
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
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al asistente de nuestros servidores.
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
