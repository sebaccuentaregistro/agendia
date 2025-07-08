
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Pencil, PlusCircle, Trash2, User, MoreVertical, Search, AlertTriangle, FileDown, UserX, CalendarClock, Plane } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Person } from '@/types';
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

const personFormSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().min(7, { message: 'Por favor, introduce un número de teléfono válido.' }),
  levelId: z.string().optional(),
  tariffId: z.string().min(1, { message: 'Debes seleccionar un arancel.' }),
  healthInfo: z.string().optional(),
  notes: z.string().optional(),
});

type PersonFormData = z.infer<typeof personFormSchema>;

const vacationFormSchema = z.object({
    startDate: z.date({ required_error: 'La fecha de inicio es obligatoria.' }),
    endDate: z.date({ required_error: 'La fecha de fin es obligatoria.' }),
}).refine(data => isAfter(data.endDate, data.startDate), {
    message: "La fecha de fin debe ser posterior a la de inicio.",
    path: ['endDate'],
});


function PersonDialog({ person, onOpenChange, open }: { person?: Person; onOpenChange: (open: boolean) => void; open: boolean }) {
  const { addPerson, updatePerson, levels, tariffs } = useStudio();
  const form = useForm<PersonFormData>({
    resolver: zodResolver(personFormSchema),
  });

  useEffect(() => {
    if (person) {
      form.reset({
        name: person.name,
        phone: person.phone,
        levelId: person.levelId,
        tariffId: person.tariffId,
        healthInfo: person.healthInfo,
        notes: person.notes,
      });
    } else {
      form.reset({ name: '', phone: '', levelId: '', tariffId: '', healthInfo: '', notes: '' });
    }
  }, [person, open, form]);

  const onSubmit = (values: PersonFormData) => {
    if (person) {
      updatePerson({ ...person, ...values });
    } else {
      addPerson(values);
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
                <FormItem><FormLabel>Nivel</FormLabel><Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="">Sin nivel</SelectItem>{levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
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

function PersonCard({ person }: { person: Person }) {
    const { tariffs, levels, deletePerson, recordPayment, undoLastPayment } = useStudio();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false);
    
    const tariff = tariffs.find(t => t.id === person.tariffId);
    const level = levels.find(l => l.id === person.levelId);
    const paymentStatus = getStudentPaymentStatus(person, new Date());
    const formatWhatsAppLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

    return (
        <>
            <Card className="flex flex-col bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5">
                <CardHeader className="flex-row items-start justify-between gap-4 p-4">
                    <div className="space-y-1">
                        <CardTitle className="text-slate-800 dark:text-slate-100">{person.name}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <span>{person.phone}</span>
                          <a href={formatWhatsAppLink(person.phone)} target="_blank" rel="noopener noreferrer">
                              <WhatsAppIcon className="text-green-600 hover:text-green-700 transition-colors" />
                              <span className="sr-only">Enviar WhatsApp</span>
                          </a>
                        </div>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-300 -mr-2 -mt-2"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setIsPersonDialogOpen(true)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => recordPayment(person.id)}>Registrar Pago</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => undoLastPayment(person.id)}>Deshacer Pago</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-grow text-sm space-y-3">
                    {tariff && <p><Badge variant="secondary">{tariff.name}</Badge></p>}
                    {level && <p><Badge variant="outline">{level.name}</Badge></p>}
                </CardContent>
                <CardFooter className="p-4 pt-0">
                     <Badge variant={paymentStatus === 'Al día' ? 'default' : 'destructive'} className={cn(paymentStatus === 'Al día' && 'bg-green-600 hover:bg-green-700')}>
                        <span className="mr-1.5 h-2 w-2 rounded-full bg-white" />
                        {paymentStatus}
                    </Badge>
                </CardFooter>
            </Card>

            <PersonDialog person={person} onOpenChange={setIsPersonDialogOpen} open={isPersonDialogOpen} />

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
  const { people, tariffs, isPersonOnVacation, addVacationPeriod, removeVacationPeriod, attendance } = useStudio();
  const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';
  const [activeFilter, setActiveFilter] = useState(initialFilter);

  const [isVacationDialogOpen, setIsVacationDialogOpen] = useState(false);
  const [selectedPersonForVacation, setSelectedPersonForVacation] = useState<Person | null>(null);

  const formVacation = useForm<z.infer<typeof vacationFormSchema>>({
    resolver: zodResolver(vacationFormSchema),
  });

  const onVacationSubmit = (values: z.infer<typeof vacationFormSchema>) => {
    if (selectedPersonForVacation) {
        addVacationPeriod(selectedPersonForVacation.id, values.startDate, values.endDate);
        setIsVacationDialogOpen(false);
    }
  }

  const filteredPeople = useMemo(() => {
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

    return people
      .filter(person => person.name.toLowerCase().includes(term) || person.phone.includes(term))
      .filter(person => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'overdue') return getStudentPaymentStatus(person, now) === 'Atrasado';
        if (activeFilter === 'on-vacation') return isPersonOnVacation(person, now);
        if (activeFilter === 'pending-recovery') return balances[person.id] > 0;
        return true;
      })
      .sort((a,b) => a.name.localeCompare(b.name));
  }, [people, searchTerm, activeFilter, isPersonOnVacation, attendance]);

   const handleExport = () => {
    const dataToExport = filteredPeople.map(p => ({
        nombre: p.name,
        telefono: p.phone,
        arancel: tariffs.find(t => t.id === p.tariffId)?.name || 'N/A',
        estado_pago: getStudentPaymentStatus(p, new Date()),
        fecha_ingreso: format(p.joinDate, 'dd/MM/yyyy'),
        vencimiento_pago: format(p.lastPaymentDate, 'dd/MM/yyyy'),
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

  return (
    <div className="space-y-8">
      <PageHeader title="Personas">
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}><FileDown className="mr-2 h-4 w-4" />Exportar</Button>
            <Button onClick={() => setIsPersonDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Añadir Persona</Button>
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

      {filteredPeople.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPeople.map((person) => <PersonCard key={person.id} person={person} />)}
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
                 <Button onClick={() => setIsPersonDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Persona
                  </Button>
               )}
            </CardContent>
          </Card>
      )}

      <PersonDialog onOpenChange={setIsPersonDialogOpen} open={isPersonDialogOpen} />
    </div>
  );
}


export default function StudentsPage() {
  return (
    <React.Suspense fallback={<div>Cargando...</div>}>
      <StudentsPageContent />
    </React.Suspense>
  );
}

    