
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Pencil, PlusCircle, Trash2, DollarSign, Calendar, RefreshCw, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import type { Tariff } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  price: z.coerce.number().min(0, { message: 'El precio no puede ser negativo.' }),
  description: z.string().optional(),
  frequency: z.coerce.number().int().positive().optional(),
  paymentCycle: z.enum(['weekly', 'biweekly', 'monthly', 'bimonthly']).optional(),
});

export default function TariffsPage() {
  const { tariffs, addTariff, updateTariff, deleteTariff } = useStudio();
  const { isPinVerified } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState<Tariff | undefined>(undefined);
  const [tariffToDelete, setTariffToDelete] = useState<Tariff | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', price: 0, description: '', frequency: undefined, paymentCycle: 'monthly' },
  });

  const sortedTariffs = useMemo(() => {
    return [...tariffs].sort((a, b) => a.price - b.price);
  }, [tariffs]);

  function handleAdd() {
    if (!isPinVerified) return;
    setSelectedTariff(undefined);
    form.reset({ name: '', price: 0, description: '', frequency: undefined, paymentCycle: 'monthly' });
    setIsDialogOpen(true);
  }

  function handleEdit(tariff: Tariff) {
    if (!isPinVerified) return;
    setSelectedTariff(tariff);
    form.reset({
        name: tariff.name,
        price: tariff.price,
        description: tariff.description,
        frequency: tariff.frequency,
        paymentCycle: tariff.paymentCycle || 'monthly',
    });
    setIsDialogOpen(true);
  }

  function openDeleteDialog(tariff: Tariff) {
    if (!isPinVerified) return;
    setTariffToDelete(tariff);
    setIsDeleteDialogOpen(true);
  }
  
  function handleDelete() {
    if (tariffToDelete) {
      deleteTariff(tariffToDelete.id);
      setIsDeleteDialogOpen(false);
      setTariffToDelete(null);
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    const finalValues = {
        ...values,
        frequency: values.frequency || undefined,
        paymentCycle: values.paymentCycle || 'monthly'
    };

    if (selectedTariff) {
      updateTariff({ ...selectedTariff, ...finalValues });
    } else {
      addTariff(finalValues);
    }
    setIsDialogOpen(false);
    setSelectedTariff(undefined);
  }
  
  const formatPrice = (price: number) => {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
      }).format(price);
  };
  
  const getCycleLabel = (cycle?: Tariff['paymentCycle']) => {
    switch (cycle) {
        case 'weekly': return 'Semanal';
        case 'biweekly': return 'Quincenal';
        case 'bimonthly': return 'Bimestral';
        default: return 'Mensual';
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-start">
          <Button variant="outline" asChild>
              <Link href="/?view=management">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a Gestión
              </Link>
          </Button>
      </div>
      <PageHeader title="Aranceles">
        {isPinVerified && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Arancel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                  <DialogTitle>{selectedTariff ? 'Editar Arancel' : 'Añadir Nuevo Arancel'}</DialogTitle>
                  <DialogDescription>
                      {selectedTariff ? 'Modifica los detalles de este plan.' : 'Crea un nuevo plan de precios para tu estudio.'}
                  </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Nombre del Plan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem><FormLabel>Precio ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Descripción (Opcional)</FormLabel><FormControl><Textarea placeholder="Ej: Valor mensual, acceso a todas las sesiones..." {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="paymentCycle" render={({ field }) => (
                            <FormItem><FormLabel>Ciclo de Pago</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || 'monthly'}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                <SelectItem value="monthly">Mensual</SelectItem>
                                <SelectItem value="weekly">Semanal</SelectItem>
                                <SelectItem value="biweekly">Quincenal</SelectItem>
                                <SelectItem value="bimonthly">Bimestral</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="frequency" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sesiones por Semana</FormLabel>
                            <FormControl><Input type="number" placeholder="Opcional" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10) || undefined)} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}/>
                    </div>
                    <FormDescription className="text-xs !-mt-2 text-muted-foreground">
                        El campo "Sesiones por Semana" es opcional. Sirve para mostrarte una advertencia si inscribes a un alumno a más sesiones de las que su plan incluye.
                    </FormDescription>
                  <DialogFooter>
                      <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                      <Button type="submit">Guardar Cambios</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>
      
       {!isPinVerified && (
          <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-slate-100">Acceso Restringido</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Esta sección solo puede ser gestionada por el propietario del estudio. Por favor, verifica tu PIN de propietario desde la pantalla de inicio para acceder.
              </CardDescription>
            </CardHeader>
          </Card>
      )}

      {isPinVerified && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedTariffs.map((tariff) => (
            <Card key={tariff.id} className="flex flex-col bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-primary/30">
              <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-100">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <span>{tariff.name}</span>
                    </CardTitle>
                    <Badge variant="outline" className="flex items-center gap-1.5"><RefreshCw className="h-3 w-3"/>{getCycleLabel(tariff.paymentCycle)}</Badge>
                  </div>
                  {tariff.description && (
                      <CardDescription className="pt-2 text-xs">{tariff.description}</CardDescription>
                  )}
              </CardHeader>
              <CardContent className="p-4 flex-grow flex flex-col items-center justify-center">
                  <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">{formatPrice(tariff.price)}</p>
                  {tariff.frequency && (
                      <span className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-4 w-4" /> {tariff.frequency} {tariff.frequency === 1 ? 'sesión' : 'sesiones'} por semana</span>
                  )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-white/20 p-2 min-h-[48px]">
                {isPinVerified && (
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-300 hover:bg-white/50" onClick={() => handleEdit(tariff)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => openDeleteDialog(tariff)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ))}
          {sortedTariffs.length === 0 && (
              <Card className="md:col-span-2 lg:col-span-3 xl:col-span-4 mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
                  <CardHeader>
                  <CardTitle className="text-slate-800 dark:text-slate-100">No Hay Aranceles Definidos</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                      Empieza a definir tus planes de precios para organizar tu estudio.
                  </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isPinVerified && (
                      <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Arancel</Button>
                    )}
                  </CardContent>
              </Card>
          )}
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer y eliminará permanentemente el arancel.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTariffToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sí, eliminar arancel</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
