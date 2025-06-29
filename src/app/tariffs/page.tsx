
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Pencil, PlusCircle, Trash2, DollarSign, Calendar, CheckSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Tariff } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  price: z.coerce.number().min(0, { message: 'El precio no puede ser negativo.' }),
  description: z.string().optional(),
  frequency: z.coerce.number().optional(),
  isIndividual: z.boolean().optional(),
}).refine(data => {
  return !(data.frequency && data.isIndividual);
}, {
  message: "Un arancel no puede ser individual y tener frecuencia a la vez.",
  path: ["isIndividual"],
});

export default function TariffsPage() {
  const { tariffs, addTariff, updateTariff, deleteTariff } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState<Tariff | undefined>(undefined);
  const [tariffToDelete, setTariffToDelete] = useState<Tariff | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', price: 0, description: '', frequency: undefined, isIndividual: false },
  });

  function handleAdd() {
    setSelectedTariff(undefined);
    form.reset({ name: '', price: 0, description: '', frequency: undefined, isIndividual: false });
    setIsDialogOpen(true);
  }

  function handleEdit(tariff: Tariff) {
    setSelectedTariff(tariff);
    form.reset({
        name: tariff.name,
        price: tariff.price,
        description: tariff.description,
        frequency: tariff.frequency,
        isIndividual: tariff.isIndividual,
    });
    setIsDialogOpen(true);
  }

  function openDeleteDialog(tariff: Tariff) {
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
        isIndividual: values.isIndividual || false,
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

  return (
    <div>
      <PageHeader title="Aranceles y Planes">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} size="icon">
              <PlusCircle className="h-5 w-5" />
              <span className="sr-only">Añadir Arancel</span>
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
                  <FormItem><FormLabel>Descripción (Opcional)</FormLabel><FormControl><Textarea placeholder="Ej: Valor mensual, acceso a todas las clases..." {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="frequency" render={({ field }) => (
                  <FormItem><FormLabel>Frecuencia Semanal Asociada (Opcional)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.value)} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField
                    control={form.control}
                    name="isIndividual"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                            <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>
                            Es arancel para clase individual
                            </FormLabel>
                            <FormMessage />
                        </div>
                        </FormItem>
                    )}
                    />
                <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit">Guardar Cambios</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </PageHeader>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tariffs.sort((a,b) => a.price - b.price).map((tariff) => (
          <Card key={tariff.id} className="flex flex-col bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-primary/30">
            <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-100">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span>{tariff.name}</span>
                </CardTitle>
                {tariff.description && (
                    <CardDescription>{tariff.description}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="p-4 flex-grow flex flex-col items-center justify-center">
                <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">{formatPrice(tariff.price)}</p>
                {tariff.frequency && (
                    <span className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-4 w-4" /> {tariff.frequency} {tariff.frequency === 1 ? 'vez' : 'veces'} por semana</span>
                )}
                {tariff.isIndividual && (
                    <span className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><CheckSquare className="h-4 w-4" /> Clase individual</span>
                )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t border-white/20 p-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-300 hover:bg-white/50" onClick={() => handleEdit(tariff)}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Editar</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => openDeleteDialog(tariff)}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Eliminar</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
        {tariffs.length === 0 && (
            <Card className="md:col-span-2 lg:col-span-3 xl:col-span-4 mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
                <CardHeader>
                <CardTitle className="text-slate-800 dark:text-slate-100">No Hay Aranceles Definidos</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                    Empieza a definir tus planes de precios para organizar tu estudio.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Arancel</Button>
                </CardContent>
            </Card>
        )}
      </div>

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
