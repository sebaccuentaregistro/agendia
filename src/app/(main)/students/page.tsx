'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import type { Person } from '@/types';
import { MoreHorizontal, PlusCircle, Trash2, CreditCard, Undo2, FileClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionAlert, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
import { Label } from '@/components/ui/label';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().min(1, { message: 'El teléfono es obligatorio.' }),
  membershipType: z.enum(['Mensual', 'Diario'], {
    required_error: 'Debes seleccionar un tipo de membresía.',
  }),
});

function EnrollDialog({ person, onOpenChange }: { person: Person; onOpenChange: (open: boolean) => void }) {
  const { yogaClasses, specialists, actividades, enrollPersonInClasses, spaces } = useStudio();

  const enrolledIn = useMemo(() =>
    yogaClasses
      .filter(cls => cls.personIds.includes(person.id))
      .map(cls => cls.id),
    [yogaClasses, person.id]
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
    if (actividadFilter !== 'all' && !filteredActividadesForDropdown.some(a => a.id === actividadFilter)) {
      setActividadFilter('all');
    }
  }, [specialistFilter, filteredActividadesForDropdown, actividadFilter]);

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
    enrollPersonInClasses(person.id, data.classIds);
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
          <DialogTitle>Asignar Clases a {person.name}</DialogTitle>
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
                                const isFull = item.personIds.length >= item.capacity;

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
                                      <div className="text-xs text-muted-foreground">
                                          <p>{specialist?.name}</p>
                                          <p>{item.dayOfWeek} {formatTime(item.time)}</p>
                                          <p>{space?.name} ({item.personIds.length}/{item.capacity})</p>
                                      </div>
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

function PaymentHistoryDialog({ person, onOpenChange }: { person: Person; onOpenChange: (open: boolean) => void }) {
    const { payments } = useStudio();
    
    const personPayments = useMemo(() => {
        return payments
            .filter(p => p.personId === person.id)
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [payments, person.id]);

    return (
        <Dialog open={true} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Historial de Pagos: {person.name}</DialogTitle>
                    <DialogDescription>
                        Aquí se listan todos los pagos registrados para esta persona.
                    </DialogDescription>
                </DialogHeader>
                {personPayments.length > 0 ? (
                    <ScrollArea className="h-72">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha de Pago</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {personPayments.map(payment => (
                                    <TableRow key={payment.id}>
                                        <TableCell>{format(payment.date, 'dd/MM/yyyy')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No hay pagos registrados para esta persona.</p>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function StudentsPage() {
  const { people, addPerson, updatePerson, deletePerson, recordPayment, undoLastPayment, payments } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | undefined>(undefined);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [personToEnroll, setPersonToEnroll] = useState<Person | null>(null);
  const [personForHistory, setPersonForHistory] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const searchParams = useSearchParams();

  const personForDialog = useMemo(() => {
    if (!selectedPerson) return undefined;
    return people.find(p => p.id === selectedPerson.id);
  }, [people, selectedPerson]);

  const filteredPeople = useMemo(() => {
    const filter = searchParams.get('filter');
    let peopleList = people;

    if (filter === 'overdue') {
      peopleList = people.filter(
        (person) => getStudentPaymentStatus(person) === 'Atrasado'
      );
    }
    
    if (searchTerm.trim() !== '') {
      peopleList = peopleList.filter(person => 
        person.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return peopleList;
  }, [people, searchParams, searchTerm]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      membershipType: 'Mensual',
    },
  });

  const getPaymentStatusBadge = (person: Person) => {
    const status = getStudentPaymentStatus(person);
    if (status === 'Al día') {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Al día</Badge>;
    }
    return <Badge variant="destructive">Atrasado</Badge>;
  };

  function handleEdit(person: Person) {
    setSelectedPerson(person);
    form.reset({
      name: person.name,
      phone: person.phone,
      membershipType: person.membershipType,
    });
    setIsDialogOpen(true);
  }

  function handleAdd() {
    setSelectedPerson(undefined);
    form.reset({ name: '', phone: '', membershipType: 'Mensual' });
    setIsDialogOpen(true);
  }

  function openDeleteDialog(person: Person) {
    setPersonToDelete(person);
    setIsDeleteDialogOpen(true);
  }

  function handleDelete() {
    if (personToDelete) {
      deletePerson(personToDelete.id);
      setIsDeleteDialogOpen(false);
      setPersonToDelete(null);
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (personForDialog) {
      updatePerson({ ...personForDialog, ...values });
    } else {
      addPerson(values);
    }
    setIsDialogOpen(false);
    setSelectedPerson(undefined);
  }
  
  const formatWhatsAppLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

  return (
    <div>
      <PageHeader title="Personas">
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
           <Input 
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64"
            />
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setSelectedPerson(undefined);
              }
          }}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Persona
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{personForDialog ? 'Editar Detalles de Persona' : 'Añadir Nueva Persona'}</DialogTitle>
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

                  <DialogFooter>
                    <Button type="submit">Guardar Cambios</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>
      
      {filteredPeople.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPeople.map((person) => {
            const hasPayments = payments.some(p => p.personId === person.id);
            return (
            <Card key={person.id} className="flex flex-col">
              <CardContent className="flex-grow p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 flex-shrink-0">
                    <AvatarImage src={person.avatar} alt={person.name} data-ai-hint="person photo"/>
                    <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold">{person.name}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{person.phone}</span>
                      <a href={formatWhatsAppLink(person.phone)} target="_blank" rel="noopener noreferrer">
                        <WhatsAppIcon className="text-green-600 hover:text-green-700 transition-colors" />
                        <span className="sr-only">Enviar WhatsApp a {person.name}</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estado de Pago</span>
                    {getPaymentStatusBadge(person)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Membresía</span>
                    <span className="font-medium">{person.membershipType}</span>
                  </div>
                   <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Inscrito Desde</span>
                    <span className="font-medium">{format(person.joinDate, 'dd/MM/yyyy')}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t p-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Alternar menú</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(person)}>
                      Editar Detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPersonToEnroll(person)}>
                      Asignar a Clases
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPersonForHistory(person)}>
                      <FileClock className="mr-2 h-4 w-4" />
                      Ver Historial de Pagos
                    </DropdownMenuItem>

                    {person.membershipType === 'Mensual' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => recordPayment(person.id)}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Registrar Pago
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => undoLastPayment(person.id)} disabled={!hasPayments}>
                          <Undo2 className="mr-2 h-4 w-4" />
                          Deshacer Último Pago
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDeleteDialog(person)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          )})}
        </div>
      ) : (
        <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center">
            <CardHeader>
              <CardTitle>{searchTerm ? "No se encontraron personas" : "No Hay Personas"}</CardTitle>
              <CardDescription>
                {searchTerm ? "Intenta con otro nombre o limpia la búsqueda." : "Empieza a construir tu comunidad añadiendo tu primera persona."}
              </CardDescription>
            </CardHeader>
            <CardContent>
               {!searchTerm && (
                <Button onClick={handleAdd}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Persona
                </Button>
               )}
            </CardContent>
          </Card>
      )}

      {personToEnroll && (
        <EnrollDialog
            person={personToEnroll}
            onOpenChange={(open) => !open && setPersonToEnroll(null)}
        />
      )}

      {personForHistory && (
        <PaymentHistoryDialog
            person={personForHistory}
            onOpenChange={(open) => !open && setPersonForHistory(null)}
        />
      )}

       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescriptionAlert>
              Esta acción no se puede deshacer. Esto eliminará permanentemente a la persona, sus datos de pago y la desinscribirá de todas las clases.
            </AlertDialogDescriptionAlert>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPersonToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Sí, eliminar persona
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
