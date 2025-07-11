
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Pencil, PlusCircle, Trash2, Warehouse, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Space } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  capacity: z.coerce.number().min(1, { message: 'La capacidad debe ser de al menos 1.' }),
  operatingHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:MM).' }).optional().or(z.literal('')),
  operatingHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:MM).' }).optional().or(z.literal('')),
}).refine(data => {
    if (data.operatingHoursStart && data.operatingHoursEnd) {
        return data.operatingHoursStart < data.operatingHoursEnd;
    }
    return true;
}, {
    message: "La hora de cierre debe ser posterior a la de apertura.",
    path: ["operatingHoursEnd"],
});

export default function SpacesPage() {
  const { spaces, addSpace, updateSpace, deleteSpace, sessions, loading } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | undefined>(undefined);
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSpaces = useMemo(() => {
    if (!searchTerm.trim()) {
      return spaces;
    }
    return spaces.filter(space =>
      space.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [spaces, searchTerm]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', capacity: 10, operatingHoursStart: '', operatingHoursEnd: '' },
  });

  function handleAdd() {
    setSelectedSpace(undefined);
    form.reset({ name: '', capacity: 10, operatingHoursStart: '08:00', operatingHoursEnd: '22:00' });
    setIsDialogOpen(true);
  }

  function handleEdit(space: Space) {
    setSelectedSpace(space);
    form.reset({
      name: space.name,
      capacity: space.capacity,
      operatingHoursStart: space.operatingHoursStart || '',
      operatingHoursEnd: space.operatingHoursEnd || ''
    });
    setIsDialogOpen(true);
  }

  function openDeleteDialog(space: Space) {
    setSpaceToDelete(space);
    setIsDeleteDialogOpen(true);
  }
  
  function handleDelete() {
    if (spaceToDelete) {
      deleteSpace(spaceToDelete.id);
      setIsDeleteDialogOpen(false);
      setSpaceToDelete(null);
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (selectedSpace) {
      updateSpace({ ...selectedSpace, ...values });
    } else {
      addSpace(values);
    }
    setIsDialogOpen(false);
    setSelectedSpace(undefined);
  }

  const getUsageCount = (spaceId: string) => {
    return sessions.filter(c => c.spaceId === spaceId).length;
  }

  return (
    <div>
      <PageHeader title="Gestionar Salas">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Sala
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedSpace ? 'Editar Sala' : 'Añadir Nueva Sala'}</DialogTitle>
              <DialogDescription>
                  Define los detalles de tus salas o áreas de trabajo.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="capacity" render={({ field }) => (
                  <FormItem><FormLabel>Capacidad</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="operatingHoursStart" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apertura</FormLabel>
                      <FormControl><Input type="time" {...field} value={field.value || ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="operatingHoursEnd" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cierre</FormLabel>
                      <FormControl><Input type="time" {...field} value={field.value || ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
                <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit">Guardar Cambios</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="-mt-6 mb-8">
        <Input
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl bg-white/30" />)}
        </div>
      ) : filteredSpaces.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSpaces.map((space) => (
              <Card key={space.id} className="flex flex-col bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                    <Warehouse className="h-6 w-6 text-primary" />
                    <span>{space.name}</span>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 pt-2"><Users className="h-4 w-4" /> Capacidad: {space.capacity} personas</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                   <Link href={`/schedule?spaceId=${space.id}`} className="transition-opacity hover:opacity-75">
                    <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Warehouse className="h-4 w-4 text-slate-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-200 underline-offset-4 hover:underline">Sesiones Programadas:</span>
                      {getUsageCount(space.id)}
                    </p>
                  </Link>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t border-white/20 p-2 mt-auto">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-300 hover:bg-white/50" onClick={() => handleEdit(space)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => openDeleteDialog(space)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                    </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-slate-100">{searchTerm ? "No se encontraron salas" : "No Hay Salas"}</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {searchTerm ? "Intenta con otro nombre o limpia la búsqueda." : "Empieza a organizar tu estudio añadiendo tu primera sala."}
              </CardDescription>
            </CardHeader>
            <CardContent>
               {!searchTerm && (
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Sala</Button>
               )}
            </CardContent>
          </Card>
        )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Asegúrate de que no haya sesiones programadas en esta sala antes de eliminarla.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSpaceToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sí, eliminar sala</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
