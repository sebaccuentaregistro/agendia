
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Pencil, PlusCircle, Trash2, Warehouse } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Space } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  capacity: z.coerce.number().min(1, { message: 'La capacidad debe ser de al menos 1.' }),
});

export default function SpacesPage() {
  const { spaces, addSpace, updateSpace, deleteSpace, yogaClasses } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | undefined>(undefined);
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', capacity: 10 },
  });

  function handleAdd() {
    setSelectedSpace(undefined);
    form.reset({ name: '', capacity: 10 });
    setIsDialogOpen(true);
  }

  function handleEdit(space: Space) {
    setSelectedSpace(space);
    form.reset({ name: space.name, capacity: space.capacity });
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
    return yogaClasses.filter(c => c.spaceId === spaceId).length;
  }

  return (
    <div>
      <PageHeader title="Espacios">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Espacio</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{selectedSpace ? 'Editar Espacio' : 'Añadir Nuevo Espacio'}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="capacity" render={({ field }) => (
                  <FormItem><FormLabel>Capacidad</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <DialogFooter><Button type="submit">Guardar Cambios</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {isMounted ? (
        spaces.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {spaces.map((space) => (
              <Card key={space.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Warehouse className="h-6 w-6 text-primary" />
                    <span>{space.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                  <p><span className="font-semibold text-card-foreground">Capacidad:</span> {space.capacity} personas</p>
                  <p><span className="font-semibold text-card-foreground">Clases Programadas:</span> {getUsageCount(space.id)}</p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t bg-muted/50 p-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(space)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDeleteDialog(space)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Eliminar</span>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center">
            <CardHeader>
              <CardTitle>No Hay Espacios</CardTitle>
              <CardDescription>Empieza a organizar tu estudio añadiendo tu primer espacio.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Espacio</Button>
            </CardContent>
          </Card>
        )
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Asegúrate de que no haya clases programadas en este espacio antes de eliminarlo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSpaceToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sí, eliminar espacio</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
