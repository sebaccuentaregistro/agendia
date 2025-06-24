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
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().min(1, { message: 'El teléfono es obligatorio.' }),
  membershipType: z.enum(['Mensual', 'Diario'], { required_error: 'Debes seleccionar un tipo de membresía.' }),
});

function EnrollDialog({ person, onOpenChange }: { person: Person; onOpenChange: (open: boolean) => void }) {
  const { yogaClasses, specialists, actividades, enrollPersonInClasses, spaces } = useStudio();
  const enrolledIn = useMemo(() => yogaClasses.filter(cls => cls.personIds.includes(person.id)).map(cls => cls.id), [yogaClasses, person.id]);
  const form = useForm<{ classIds: string[] }>({ defaultValues: { classIds: enrolledIn } });
  const [actividadFilter, setActividadFilter] = useState('all');
  const [specialistFilter, setSpecialistFilter] = useState('all');

  const filteredClasses = useMemo(() => {
    return yogaClasses.filter(cls => 
      (actividadFilter === 'all' || cls.actividadId === actividadFilter) &&
      (specialistFilter === 'all' || cls.instructorId === specialistFilter)
    ).sort((a, b) => a.dayOfWeek.localeCompare(b.dayOfWeek) || a.time.localeCompare(b.time));
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
        <DialogHeader><DialogTitle>Asignar Clases a {person.name}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Filtrar por Actividad</Label>
                <Select onValueChange={setActividadFilter} value={actividadFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todas</SelectItem>{actividades.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Filtrar por Especialista</Label>
                <Select onValueChange={setSpecialistFilter} value={specialistFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todos</SelectItem>{specialists.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <FormField control={form.control} name="classIds" render={() => (
              <FormItem>
                <FormLabel>Clases Disponibles</FormLabel>
                <ScrollArea className="h-72 rounded-md border p-4">
                  <div className="space-y-4">
                    {filteredClasses.map((item) => {
                      const specialist = specialists.find(i => i.id === item.instructorId);
                      constividad = actividades.find(a => a.id === item.actividadId);
                      const space = spaces.find(s => s.id === item.spaceId);
                      if (!actividad || !specialist || !space) return null;
                      const isEnrolledInForm = form.watch('classIds').includes(item.id);
                      const isFull = item.personIds.length >= space.capacity;

                      return (
                        <FormField key={item.id} control={form.control} name="classIds" render={({ field }) => (
                          <FormItem className={cn("flex flex-row items-start space-x-3 space-y-0 rounded-md p-3 transition-colors", isFull && !isEnrolledInForm ? "bg-muted/50 opacity-50" : "hover:bg-muted/50")}>
                            <FormControl>
                              <Checkbox checked={field.value?.includes(item.id)} disabled={isFull && !isEnrolledInForm} onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                return checked ? field.onChange([...currentValues, item.id]) : field.onChange(currentValues.filter((value) => value !== item.id));
                              }}/>
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className={cn("font-normal", isFull && !isEnrolledInForm && "cursor-not-allowed")}>{actividad.name}</FormLabel>
                              <div className="text-xs text-muted-foreground"><p>{specialist?.name}</p><p>{item.dayOfWeek} {formatTime(item.time)}</p><p>{space?.name} ({item.personIds.length}/{space.capacity})</p></div>
                              {isFull && !isEnrolledInForm && <p className="text-xs text-destructive">Clase llena</p>}
                            </div>
                          </FormItem>
                        )}/>
                      );
                    })}
                  </div>
                </ScrollArea><FormMessage />
              </FormItem>
            )}/>
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
  const { people, addPerson, updatePerson, deletePerson, recordPayment, undoLastPayment, payments } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | undefined>(undefined);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [personToEnroll, setPersonToEnroll] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => { setIsMounted(true); }, []);

  const processedPeople = useMemo(() => {
    if (!isMounted) return [];
    const filter = searchParams.get('filter');
    const now = new Date();
    let peopleList = people.map(p => ({ ...p, paymentStatus: getStudentPaymentStatus(p, now) }));
    if (filter === 'overdue') { peopleList = peopleList.filter(p => p.paymentStatus === 'Atrasado'); }
    if (searchTerm.trim() !== '') { peopleList = peopleList.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())); }
    return peopleList.sort((a,b) => a.name.localeCompare(b.name));
  }, [people, searchParams, searchTerm, isMounted]);

  const form = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema), defaultValues: { name: '', phone: '', membershipType: 'Mensual' }});

  const getPaymentStatusBadge = (status: 'Al día' | 'Atrasado') => {
    if (status === 'Al día') return <Badge variant="secondary" className="bg-green-100 text-green-800">Al día</Badge>;
    return <Badge variant="destructive">Atrasado</Badge>;
  };

  function handleEdit(person: Person) {
    setSelectedPerson(person);
    form.reset({ name: person.name, phone: person.phone, membershipType: person.membershipType });
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
    if (selectedPerson) {
      updatePerson({ ...selectedPerson, ...values });
    } else {
      addPerson(values);
    }
    setIsDialogOpen(false);
    setSelectedPerson(undefined);
  }
  
  const formatWhatsAppLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

  return (
    <div>
      <PageHeader title="Personas" description="Administrar los perfiles de todas las personas/clientes.">
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <Input placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-64"/>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setSelectedPerson(undefined); }}>
            <DialogTrigger asChild><Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Persona</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader><DialogTitle>{selectedPerson ? 'Editar Persona' : 'Añadir Nueva Persona'}</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="membershipType" render={({ field }) => (
                    <FormItem><FormLabel>Membresía</FormLabel><FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Mensual" /></FormControl><FormLabel className="font-normal">Mensual</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Diario" /></FormControl><FormLabel className="font-normal">Diario</FormLabel></FormItem>
                      </RadioGroup>
                    </FormControl><FormMessage /></FormItem>
                  )}/>
                  <DialogFooter><Button type="submit">Guardar Cambios</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>
      
      <Card>
        {!isMounted ? <Skeleton className="w-full h-96" /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden lg:table-cell">Teléfono</TableHead>
                <TableHead>Membresía</TableHead>
                <TableHead>Estado Pago</TableHead>
                <TableHead className="hidden md:table-cell">Inscripción</TableHead>
                <TableHead><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedPeople.length > 0 ? processedPeople.map((person) => {
                const hasPayments = payments.some(p => p.personId === person.id);
                return (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9"><AvatarImage src={person.avatar} alt={person.name} data-ai-hint="person photo"/><AvatarFallback>{person.name.charAt(0)}</AvatarFallback></Avatar>
                        <span className="truncate">{person.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{person.phone}</span>
                            <a href={formatWhatsAppLink(person.phone)} target="_blank" rel="noopener noreferrer">
                                <WhatsAppIcon className="text-green-600 hover:text-green-700 transition-colors" />
                            </a>
                        </div>
                    </TableCell>
                    <TableCell>{person.membershipType}</TableCell>
                    <TableCell>{getPaymentStatusBadge(person.paymentStatus)}</TableCell>
                    <TableCell className="hidden md:table-cell">{format(person.joinDate, 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Alternar menú</span></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(person)}>Editar Detalles</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPersonToEnroll(person)}>Asignar a Clases</DropdownMenuItem>
                          {person.membershipType === 'Mensual' && (<>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => recordPayment(person.id)}><CreditCard className="mr-2 h-4 w-4" />Registrar Pago</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => undoLastPayment(person.id)} disabled={!hasPayments}><Undo2 className="mr-2 h-4 w-4" />Deshacer Último Pago</DropdownMenuItem>
                          </>)}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDeleteDialog(person)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">No se encontraron personas.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
      
      {personToEnroll && (<EnrollDialog person={personToEnroll} onOpenChange={(open) => !open && setPersonToEnroll(null)}/>)}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescriptionAlert>Esta acción no se puede deshacer. Esto eliminará permanentemente a la persona, sus datos de pago y la desinscribirá de todas las clases.</AlertDialogDescriptionAlert>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPersonToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sí, eliminar persona</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
