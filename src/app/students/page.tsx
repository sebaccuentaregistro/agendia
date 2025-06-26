
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import type { Person, Session } from '@/types';
import { MoreHorizontal, PlusCircle, Trash2, CreditCard, Undo2, History, CalendarPlus, FileDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionAlert, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useStudio } from '@/context/StudioContext';
import * as Utils from '@/lib/utils';
import { format } from 'date-fns';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSearchParams } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { exportToCsv } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().regex(/^\d+$/, { message: 'El teléfono solo debe contener números (sin espacios ni guiones).' }).min(10, { message: 'El teléfono debe tener al menos 10 dígitos.' }),
  membershipType: z.enum(['Mensual', 'Diario'], { required_error: 'Debes seleccionar un tipo de membresía.' }),
});

function EnrollDialog({ person, onOpenChange }: { person: Person; onOpenChange: (open: boolean) => void }) {
  const { sessions, specialists, actividades, enrollPersonInSessions, spaces } = useStudio();
  const form = useForm<{ sessionIds: string[] }>({ defaultValues: { sessionIds: sessions.filter(session => session.personIds.includes(person.id)).map(session => session.id) } });
  const [actividadFilter, setActividadFilter] = useState('all');
  const [specialistFilter, setSpecialistFilter] = useState('all');

  const filteredSessions = sessions
      .filter(session => 
        (actividadFilter === 'all' || session.actividadId === actividadFilter) &&
        (specialistFilter === 'all' || session.instructorId === specialistFilter)
      )
      .map(session => ({
        ...session,
        specialist: specialists.find(i => i.id === session.instructorId),
        actividad: actividades.find(a => a.id === session.actividadId),
        space: spaces.find(s => s.id === session.spaceId),
      }))
      .sort((a, b) => a.dayOfWeek.localeCompare(b.dayOfWeek) || a.time.localeCompare(b.time));


  function onSubmit(data: { sessionIds: string[] }) {
    enrollPersonInSessions(person.id, data.sessionIds);
    onOpenChange(false);
  }

  const formatTime = (time: string) => {
    if (!time || !time.includes(':')) return 'N/A';
    return time;
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Asignar Sesiones a {person.name}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Filtrar por Actividad</Label>
                <Select onValueChange={setActividadFilter} value={actividadFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {actividades.slice().sort((a, b) => a.name.localeCompare(b.name)).map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Filtrar por Especialista</Label>
                <Select onValueChange={setSpecialistFilter} value={specialistFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {specialists.slice().sort((a, b) => a.name.localeCompare(b.name)).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <FormField control={form.control} name="sessionIds" render={() => (
              <FormItem>
                <FormLabel>Sesiones Disponibles</FormLabel>
                <ScrollArea className="h-72 rounded-md border p-4">
                  <div className="space-y-4">
                    {filteredSessions.map((item) => {
                      const { specialist, actividad, space } = item;
                      if (!actividad || !specialist || !space) return null;
                      const isEnrolledInForm = form.watch('sessionIds').includes(item.id);
                      const isIndividual = item.sessionType === 'Individual';
                      const capacity = isIndividual ? 1 : space.capacity;
                      const isFull = item.personIds.length >= capacity;

                      return (
                        <FormField key={item.id} control={form.control} name="sessionIds" render={({ field }) => (
                          <FormItem className={Utils.cn("flex flex-row items-start space-x-3 space-y-0 rounded-md p-3 transition-colors", isFull && !isEnrolledInForm ? "bg-muted/50 opacity-50" : "hover:bg-muted/50")}>
                            <FormControl>
                              <Checkbox checked={field.value?.includes(item.id)} disabled={isFull && !isEnrolledInForm} onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                return checked ? field.onChange([...currentValues, item.id]) : field.onChange(currentValues.filter((value) => value !== item.id));
                              }}/>
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className={Utils.cn("font-normal", isFull && !isEnrolledInForm && "cursor-not-allowed")}>{actividad.name}</FormLabel>
                              <div className="text-xs text-muted-foreground">
                                <p>{specialist?.name}</p>
                                <p>{item.dayOfWeek} {formatTime(item.time)}</p>
                                <p><span className="font-medium">Espacio:</span> {space?.name} ({item.personIds.length}/{capacity}) {isIndividual && `(Individual)`}</p>
                              </div>
                              {isFull && !isEnrolledInForm && <p className="text-xs text-destructive">{isIndividual ? 'Ocupado' : 'Sesión llena'}</p>}
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
  const { people, addPerson, updatePerson, deletePerson, recordPayment, undoLastPayment, payments, sessions, specialists, actividades, spaces } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | undefined>(undefined);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [personToEnroll, setPersonToEnroll] = useState<Person | null>(null);
  const [personForHistory, setPersonForHistory] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => { setIsMounted(true); }, []);

  const processedPeople = useMemo(() => {
    if (!isMounted) return [];
    const filter = searchParams.get('filter');
    const now = new Date();
    let peopleList = people.map(p => ({ 
        ...p, 
        paymentStatus: Utils.getStudentPaymentStatus(p, now),
        nextPaymentDate: Utils.getNextPaymentDate(p)
    }));
    if (filter === 'overdue') { peopleList = peopleList.filter(p => p.paymentStatus === 'Atrasado'); }
    if (searchTerm.trim() !== '') { peopleList = peopleList.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())); }
    return peopleList.sort((a,b) => a.name.localeCompare(b.name));
  }, [people, searchParams, searchTerm, isMounted]);

  const form = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema), defaultValues: { name: '', phone: '', membershipType: 'Mensual' }});

  const getPaymentStatusBadge = (status: 'Al día' | 'Atrasado') => {
    if (status === 'Al día') return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-700/50">Al día</Badge>;
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

  const formatTime = (time: string) => {
    if (!time || !time.includes(':')) return 'N/A';
    return time;
  };

  const handleExportPeople = () => {
    const headers = {
        name: 'Nombre',
        phone: 'Teléfono',
        membershipType: 'Membresía',
        paymentStatus: 'Estado de Pago',
        joinDate: 'Fecha de Inscripción',
        nextPaymentDate: 'Próximo Pago'
    };
    const dataToExport = processedPeople.map(p => ({
        ...p,
        nextPaymentDate: p.nextPaymentDate || ''
    }));
    exportToCsv('personas.csv', dataToExport, headers);
  };
  
  const handleExportHistory = () => {
      if (!personForHistory) return;
      const personPayments = payments
          .filter(p => p.personId === personForHistory.id)
          .sort((a,b) => b.date.getTime() - a.date.getTime())
          .map(p => ({ date: p.date }));

      if (personPayments.length === 0) return;

      const headers = {
          date: 'Fecha de Pago'
      };
      exportToCsv(`historial_pagos_${personForHistory.name.replace(/\s/g, '_')}.csv`, personPayments, headers);
  };

  return (
    <div>
      <PageHeader title="Personas">
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <Input placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-64 bg-white/80 dark:bg-zinc-800/80 border-slate-300/50 rounded-xl"/>
          <Button variant="outline" onClick={handleExportPeople}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar
          </Button>
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
      
      {!isMounted ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-[28rem] w-full bg-white/30 rounded-2xl" />)}
        </div>
      ) : processedPeople.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {processedPeople.map((person) => {
                const hasPayments = payments.some(p => p.personId === person.id);
                const enrolledSessions = sessions.filter(session => session.personIds.includes(person.id)).sort((a,b) => a.dayOfWeek.localeCompare(b.dayOfWeek) || a.time.localeCompare(b.time));
                return (
                    <Card key={person.id} className="flex flex-col bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5">
                        <CardHeader className="flex flex-row items-start gap-4 p-4">
                            <div className="flex-grow">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{person.name}</h3>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                                    <span>{person.phone}</span>
                                    <a href={formatWhatsAppLink(person.phone)} target="_blank" rel="noopener noreferrer">
                                        <WhatsAppIcon className="text-green-600 hover:text-green-700 transition-colors" />
                                    </a>
                                </div>
                            </div>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0 text-slate-600 dark:text-slate-300 hover:bg-white/50">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Alternar menú</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(person)}>Editar Detalles</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setPersonForHistory(person)}><History className="mr-2 h-4 w-4" />Ver Historial de Pagos</DropdownMenuItem>
                                    {person.membershipType === 'Mensual' && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => recordPayment(person.id)}><CreditCard className="mr-2 h-4 w-4" />Registrar Pago</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => undoLastPayment(person.id)} disabled={!hasPayments}><Undo2 className="mr-2 h-4 w-4" />Deshacer Último Pago</DropdownMenuItem>
                                    </>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDeleteDialog(person)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent className="flex flex-col flex-grow space-y-4 p-4 pt-0">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div className="text-slate-700 dark:text-slate-200">
                                    <div>{getPaymentStatusBadge(person.paymentStatus)}</div>
                                </div>
                                <div className="text-slate-700 dark:text-slate-200">
                                    <div>{person.membershipType}</div>
                                </div>
                                <div className="text-slate-700 dark:text-slate-200">
                                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Inscripción</div>
                                    <div>{format(person.joinDate, 'dd/MM/yyyy')}</div>
                                </div>
                                {person.nextPaymentDate && (
                                  <div className="text-slate-700 dark:text-slate-200">
                                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Próximo Pago</div>
                                    <div>{format(person.nextPaymentDate, 'dd/MM/yyyy')}</div>
                                  </div>
                                )}
                            </div>
                            <div className="space-y-2 flex-grow flex flex-col">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Horarios inscriptos ({enrolledSessions.length})
                                </h4>
                                {enrolledSessions.length > 0 ? (
                                    <div className="flex-grow space-y-3 rounded-lg border border-white/20 p-2 bg-white/10 backdrop-blur-sm">
                                        {enrolledSessions.map(session => {
                                            const actividad = actividades.find(a => a.id === session.actividadId);
                                            const specialist = specialists.find(s => s.id === session.instructorId);
                                            const space = spaces.find(s => s.id === session.spaceId);
                                            return (
                                                <div key={session.id} className="text-sm">
                                                    <p className="font-semibold text-slate-700 dark:text-slate-200">{actividad?.name || 'N/A'}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{session.dayOfWeek}, {formatTime(session.time)} &bull; {specialist?.name || 'Sin especialista'} &bull; {space?.name || 'Sin espacio'}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-grow items-center justify-center rounded-lg border border-dashed border-white/30">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Sin horarios.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="p-4 border-t border-white/20">
                            <Button className="w-full" variant="outline" onClick={() => setPersonToEnroll(person)}>
                                <CalendarPlus className="mr-2 h-4 w-4" />
                                Asignar Sesión
                            </Button>
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
      ) : (
          <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-slate-100">{searchTerm ? "No se encontraron personas" : "No Hay Personas"}</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {searchTerm ? "Intenta con otro nombre o limpia la búsqueda." : "Empieza añadiendo tu primera persona."}
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
      
      {personToEnroll && (<EnrollDialog person={personToEnroll} onOpenChange={(open) => !open && setPersonToEnroll(null)}/>)}

       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescriptionAlert>Esta acción no se puede deshacer. Esto eliminará permanentemente a la persona, sus datos de pago y la desinscribirá de todas las sesiones.</AlertDialogDescriptionAlert>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPersonToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sí, eliminar persona</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!personForHistory} onOpenChange={(open) => !open && setPersonForHistory(null)}>
        <SheetContent>
            <SheetHeader>
                <SheetTitle>Historial de Pagos: {personForHistory?.name}</SheetTitle>
                <div className="flex items-center justify-between pt-2">
                  <SheetDescription>
                    Registro de todas las fechas de pago.
                  </SheetDescription>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportHistory}
                    disabled={!personForHistory || payments.filter(p => p.personId === personForHistory.id).length === 0}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </div>
            </SheetHeader>
            <ScrollArea className="h-[calc(100%-6rem)] pr-4 mt-4">
              <div className="space-y-2">
                {personForHistory && payments.filter(p => p.personId === personForHistory.id).length > 0 ? (
                    payments
                    .filter(p => p.personId === personForHistory.id)
                    .sort((a,b) => b.date.getTime() - a.date.getTime())
                    .map(payment => (
                        <div key={payment.id} className="text-sm p-3 rounded-md bg-muted/50">
                            <span>{format(payment.date, 'dd MMMM yyyy', { weekStartsOn: 1 })}</span>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground pt-16">
                        <p>No hay pagos registrados.</p>
                    </div>
                )}
              </div>
            </ScrollArea>
        </SheetContent>
      </Sheet>

    </div>
  );
}
