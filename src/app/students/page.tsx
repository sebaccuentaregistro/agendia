
'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Pencil, PlusCircle, Trash2, MoreVertical, Search, AlertTriangle, FileDown, UserX, CalendarClock, Plane, Calendar as CalendarIcon, X, HeartPulse, StickyNote, Star, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Person, Session } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { getStudentPaymentStatus, exportToCsv } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

const personFormSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().min(7, { message: 'Por favor, introduce un número de teléfono válido.' }),
  levelId: z.preprocess((val) => (val === 'none' || val === '' ? undefined : val), z.string().optional()),
  tariffId: z.string().min(1, { message: 'Debes seleccionar un arancel.' }),
  healthInfo: z.string().optional(),
  notes: z.string().optional(),
});

type PersonFormData = z.infer<typeof personFormSchema>;

const vacationFormSchema = z.object({
    startDate: z.date({ required_error: 'La fecha de inicio es obligatoria.' }),
    endDate: z.date({ required_error: 'La fecha de fin es obligatoria.' }),
}).refine(data => {
    if (!data.startDate || !data.endDate) return true;
    return isAfter(data.endDate, data.startDate) || data.endDate.toDateString() === data.startDate.toDateString();
}, {
    message: "La fecha de fin debe ser igual o posterior a la de inicio.",
    path: ['endDate'],
});

function VacationDialog({ person, onClose }: { person: Person | null; onClose: () => void; }) {
    const { addVacationPeriod, removeVacationPeriod } = useStudio();
    
    const form = useForm<z.infer<typeof vacationFormSchema>>({
        resolver: zodResolver(vacationFormSchema),
    });

    const onSubmit = (values: z.infer<typeof vacationFormSchema>) => {
        if (person) {
            addVacationPeriod(person.id, values.startDate, values.endDate);
            form.reset();
        }
    }
    
    if (!person) return null;

    return (
        <Dialog open={!!person} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Vacaciones de {person.name}</DialogTitle>
                    <DialogDescription>Gestiona los períodos de ausencia. Durante estos días, la persona no aparecerá en las listas de asistencia.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <h4 className="font-semibold text-sm">Períodos Cargados</h4>
                    <ScrollArea className="h-32 rounded-md border">
                        <div className="p-2 space-y-2">
                        {person.vacationPeriods && person.vacationPeriods.length > 0 ? (
                            person.vacationPeriods.map(vac => (
                                <div key={vac.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                                    <span>{vac.startDate ? format(vac.startDate, 'dd/MM/yy') : 'N/A'} - {vac.endDate ? format(vac.endDate, 'dd/MM/yy') : 'N/A'}</span>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeVacationPeriod(person.id, vac.id)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="p-4 text-center text-muted-foreground text-sm">No hay vacaciones programadas.</p>
                        )}
                        </div>
                    </ScrollArea>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border-t pt-4">
                             <h4 className="font-semibold text-sm">Añadir Nuevo Período</h4>
                            <div className="flex items-start gap-4">
                                <FormField control={form.control} name="startDate" render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Inicio</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, 'PPP', { locale: es }) : <span>Elegir fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                 <FormField control={form.control} name="endDate" render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Fin</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, 'PPP', { locale: es }) : <span>Elegir fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                            <Button type="submit" className="w-full">Añadir Vacaciones</Button>
                        </form>
                    </Form>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function PersonDialog({ person, onOpenChange, open, setActiveFilter, setSearchTerm }: { person?: Person; onOpenChange: (open: boolean) => void; open: boolean, setActiveFilter: (filter: string) => void; setSearchTerm: (term: string) => void; }) {
  const { addPerson, updatePerson, levels, tariffs } = useStudio();
  const form = useForm<PersonFormData>({
    resolver: zodResolver(personFormSchema),
  });

  useEffect(() => {
    if (open) {
        if (person) {
          form.reset({
            name: person.name,
            phone: person.phone,
            levelId: person.levelId || 'none',
            tariffId: person.tariffId,
            healthInfo: person.healthInfo,
            notes: person.notes,
          });
        } else {
          form.reset({ name: '', phone: '', levelId: 'none', tariffId: '', healthInfo: '', notes: '' });
        }
    }
  }, [person, open, form]);

  const onSubmit = (values: PersonFormData) => {
    if (person) {
      updatePerson({ ...person, ...values });
    } else {
      addPerson(values);
      // Reset filters to show the new person
      setActiveFilter('all');
      setSearchTerm('');
    }
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{person ? 'Editar Persona' : 'Añadir Nueva Persona'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nombre completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="tariffId" render={({ field }) => (
                <FormItem><FormLabel>Arancel</FormLabel><Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                    <SelectContent>{tariffs.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
              )}/>
               <FormField control={form.control} name="levelId" render={({ field }) => (
                <FormItem><FormLabel>Nivel</FormLabel><Select onValueChange={field.onChange} value={field.value || 'none'}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin nivel</SelectItem>
                      {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                </Select><FormMessage /></FormItem>
              )}/>
            </div>
            <FormField control={form.control} name="healthInfo" render={({ field }) => (
              <FormItem><FormLabel>Información de Salud (Opcional)</FormLabel><FormControl><Textarea placeholder="Alergias, lesiones, etc." {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notas Adicionales (Opcional)</FormLabel><FormControl><Textarea placeholder="Preferencias, objetivos, etc." {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function PersonCard({ person, onManageVacations, onEdit }: { person: Person, onManageVacations: (person: Person) => void, onEdit: (person: Person) => void }) {
    const { tariffs, deletePerson, recordPayment, undoLastPayment, sessions, actividades, specialists, spaces, isPersonOnVacation, levels } = useStudio();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    
    const tariff = tariffs.find(t => t.id === person.tariffId);
    const paymentStatus = getStudentPaymentStatus(person, new Date());
    
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
      }).format(price);
    };
    
    const enrolledSessions = useMemo(() => {
        return sessions
            .filter(s => s.personIds.includes(person.id))
            .map(s => {
                const actividad = actividades.find(a => a.id === s.actividadId);
                const specialist = specialists.find(sp => sp.id === s.instructorId);
                const space = spaces.find(sp => sp.id === s.spaceId);
                return { ...s, actividadName: actividad?.name, specialistName: specialist?.name, spaceName: space?.name };
            })
            .sort((a,b) => {
                const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                return dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek) || a.time.localeCompare(b.time)
            });
    }, [sessions, person.id, actividades, specialists, spaces]);

    return (
        <>
            <Card className="flex flex-col rounded-2xl shadow-lg border-border/20 bg-card overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <div className={cn(
                    "p-4 text-white",
                    "bg-gradient-to-br from-primary to-fuchsia-600"
                )}>
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h3 className="text-xl font-bold">{person.name}</h3>
                            <Badge variant="secondary" className={cn("font-semibold mt-1 border-0", paymentStatus === 'Al día' ? 'bg-green-400/80 text-green-900' : 'bg-destructive/80 text-destructive-foreground')}>
                                {paymentStatus}
                            </Badge>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 -mr-2 flex-shrink-0"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => onEdit(person)}><Pencil className="mr-2 h-4 w-4" />Editar Persona</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onManageVacations(person)}><Plane className="mr-2 h-4 w-4" />Gestionar Vacaciones</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => recordPayment(person.id)}>Registrar Pago</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => undoLastPayment(person.id)}>Deshacer Pago</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                     
                    <div className="mt-2">
                         <div className="flex justify-between items-baseline">
                           <p className="text-sm font-semibold opacity-90">
                               {tariff?.name || 'Sin arancel'}
                               {tariff?.frequency && (
                                 <span className="font-normal"> ({tariff.frequency} {tariff.frequency === 1 ? 'vez' : 'veces'} p/semana)</span>
                               )}
                            </p>
                            {tariff && <p className="text-lg font-bold">{formatPrice(tariff.price)}</p>}
                        </div>
                        <p className="text-xs opacity-80 mt-1">INSCRIPCIÓN: {person.joinDate ? format(person.joinDate, 'dd/MM/yyyy') : 'N/A'}</p>
                    </div>
                </div>

                <div className="p-4 flex-grow">
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-sm text-foreground">Horarios Inscriptos</h4>
                                <Badge variant="secondary" className="bg-primary/10 text-primary">{enrolledSessions.length}</Badge>
                            </div>
                            {enrolledSessions.length > 0 ? (
                                <div className="space-y-2">
                                    {enrolledSessions.map(session => (
                                        <div key={session.id} className="p-2 rounded-md bg-muted/50 text-xs">
                                            <p className="font-bold text-foreground">{session.actividadName}</p>
                                            <div className="flex items-center justify-between text-muted-foreground">
                                                <span>{session.dayOfWeek}, {session.time}</span>
                                                <div className="flex items-center gap-2">
                                                  <span>{session.specialistName}</span>
                                                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/>{session.spaceName}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-2">No está inscripto en ninguna clase.</p>
                            )}
                        </div>

                        <div>
                             <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-sm text-foreground">Períodos de Vacaciones</h4>
                                <Badge variant="secondary">{person.vacationPeriods?.length || 0}</Badge>
                            </div>
                             {(person.vacationPeriods && person.vacationPeriods.length > 0) ? (
                                <div className="space-y-2">
                                {person.vacationPeriods.map(vac => (
                                    <div key={vac.id} className="p-2 rounded-md bg-muted/50 text-xs text-center">
                                        <p className="font-semibold text-muted-foreground">{vac.startDate ? format(vac.startDate, 'dd MMM') : 'N/A'} - {vac.endDate ? format(vac.endDate, 'dd MMM') : 'N/A'}</p>
                                    </div>
                                ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-2">Sin vacaciones registradas.</p>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará a la persona y todas sus inscripciones.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deletePerson(person.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function StudentsPageContent() {
  const { people, tariffs, isPersonOnVacation, attendance, loading } = useStudio();
  const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [personForVacation, setPersonForVacation] = useState<Person | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { recoveryBalances, filteredPeople } = useMemo(() => {
    if (!isMounted) return { recoveryBalances: {}, filteredPeople: [] };
    
    const now = new Date();
    const term = searchTerm.toLowerCase();

    const balances: Record<string, number> = {};
    people.forEach(p => (balances[p.id] = 0));

    attendance.forEach(record => {
      record.justifiedAbsenceIds?.forEach(personId => {
        if (balances[personId] !== undefined) balances[personId]++;
      });
      record.oneTimeAttendees?.forEach(personId => {
        if (balances[personId] !== undefined) balances[personId]--;
      });
    });

    const finalFilteredPeople = people
      .filter(person => person.name.toLowerCase().includes(term) || person.phone.includes(term))
      .filter(person => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'overdue') return getStudentPaymentStatus(person, now) === 'Atrasado';
        if (activeFilter === 'on-vacation') return isPersonOnVacation(person, now);
        if (activeFilter === 'pending-recovery') return balances[person.id] > 0;
        return true;
      })
      .sort((a,b) => a.name.localeCompare(b.name));
      
    return { recoveryBalances: balances, filteredPeople: finalFilteredPeople };
  }, [people, searchTerm, activeFilter, isPersonOnVacation, attendance, isMounted]);

   const handleExport = () => {
    const dataToExport = filteredPeople.map(p => ({
        nombre: p.name,
        telefono: p.phone,
        arancel: tariffs.find(t => t.id === p.tariffId)?.name || 'N/A',
        estado_pago: getStudentPaymentStatus(p, new Date()),
        fecha_ingreso: p.joinDate ? format(p.joinDate, 'dd/MM/yyyy') : 'N/A',
        vencimiento_pago: p.lastPaymentDate ? format(p.lastPaymentDate, 'dd/MM/yyyy') : 'N/A',
    }));
    const headers = {
        nombre: "Nombre",
        telefono: "Teléfono",
        arancel: "Arancel",
        estado_pago: "Estado de Pago",
        fecha_ingreso: "Fecha de Ingreso",
        vencimiento_pago: "Vencimiento",
    }
    exportToCsv('personas.csv', dataToExport, headers);
  }

  const handleAddClick = () => {
    setSelectedPerson(undefined);
    setIsPersonDialogOpen(true);
  }

  const handleEditClick = (person: Person) => {
    setSelectedPerson(person);
    setIsPersonDialogOpen(true);
  }

  if (!isMounted) {
    return (
        <div className="space-y-8">
            <PageHeader title="Personas">
                <div className="flex items-center gap-2">
                    <Button variant="outline" disabled><FileDown className="mr-2 h-4 w-4" />Exportar</Button>
                    <Button disabled><PlusCircle className="mr-2 h-4 w-4" />Añadir Persona</Button>
                </div>
            </PageHeader>
            <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <Skeleton className="h-10 flex-grow rounded-xl" />
                    <Skeleton className="h-10 w-full sm:w-[380px] rounded-lg" />
                </div>
            </Card>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[218px] w-full rounded-2xl" />)}
            </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Personas">
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}><FileDown className="mr-2 h-4 w-4" />Exportar</Button>
            <Button onClick={handleAddClick}><PlusCircle className="mr-2 h-4 w-4" />Añadir Persona</Button>
        </div>
      </PageHeader>
      
      <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
           <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Buscar por nombre o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl"
                />
            </div>
            <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full sm:w-auto">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="overdue"><AlertTriangle className="mr-1.5 h-3.5 w-3.5" />Atrasados</TabsTrigger>
                    <TabsTrigger value="pending-recovery"><CalendarClock className="mr-1.5 h-3.5 w-3.5" />Recuperos</TabsTrigger>
                    <TabsTrigger value="on-vacation"><Plane className="mr-1.5 h-3.5 w-3.5" />Vacaciones</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[350px] w-full rounded-2xl" />)}
        </div>
      ) : filteredPeople.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPeople.map((person) => (
                <PersonCard 
                    key={person.id} 
                    person={person}
                    onManageVacations={setPersonForVacation}
                    onEdit={handleEditClick}
                />
            ))}
          </div>
        ) : (
          <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-slate-100">{searchTerm || activeFilter !== 'all' ? "No se encontraron personas" : "No Hay Personas"}</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {searchTerm || activeFilter !== 'all' ? "Prueba con otros filtros o limpia la búsqueda." : "Empieza a construir tu comunidad añadiendo tu primera persona."}
              </CardDescription>
            </CardHeader>
            <CardContent>
               {!(searchTerm || activeFilter !== 'all') && (
                 <Button onClick={handleAddClick}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Persona
                  </Button>
               )}
            </CardContent>
          </Card>
        )}

      <PersonDialog 
        person={selectedPerson} 
        onOpenChange={setIsPersonDialogOpen} 
        open={isPersonDialogOpen}
        setActiveFilter={setActiveFilter}
        setSearchTerm={setSearchTerm}
      />
      <VacationDialog person={personForVacation} onClose={() => setPersonForVacation(null)} />

    </div>
  );
}


export default function StudentsPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <StudentsPageContent />
    </Suspense>
  );
}
