'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Pencil, PlusCircle, Trash2, Warehouse, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useEffect, useMemo } from 'react';
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
});

export default function SpacesPage() {
  const { spaces, addSpace, updateSpace, deleteSpace, sessions } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | undefined>(undefined);
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSpaces = useMemo(() => {
    if (!searchTerm.trim()) {
      return spaces;
    }
    return spaces.filter(space =>
      space.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [spaces, searchTerm]);

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
    return sessions.filter(c => c.spaceId === spaceId).length;
  }

  return (
    <div>
      <PageHeader title="Espacios">
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <Input
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 bg-white/80 dark:bg-zinc-800/80 border-slate-300/50 rounded-xl"
          />
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
        </div>
      </PageHeader>

      {isMounted ? (
        filteredSpaces.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSpaces.map((space) => (
              <Card key={space.id} className="flex flex-col bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                    <Warehouse className="h-6 w-6 text-primary" />
                    <span>{space.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow space-y-3 text-sm">
                  <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Users className="h-4 w-4 text-slate-500" /> <span className="font-semibold text-slate-700 dark:text-slate-200">Capacidad:</span> {space.capacity} personas</p>
                  <Link href={`/schedule?spaceId=${space.id}`} className="transition-opacity hover:opacity-75">
                    <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Warehouse className="h-4 w-4 text-slate-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-200 underline-offset-4 hover:underline">Sesiones Programadas:</span>
                      {getUsageCount(space.id)}
                    </p>
                  </Link>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t border-white/20 p-3">
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
              <CardTitle className="text-slate-800 dark:text-slate-100">{searchTerm ? "No se encontraron espacios" : "No Hay Espacios"}</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {searchTerm ? "Intenta con otro nombre o limpia la búsqueda." : "Empieza a organizar tu estudio añadiendo tu primer espacio."}
              </CardDescription>
            </CardHeader>
            <CardContent>
               {!searchTerm && (
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Espacio</Button>
               )}
            </CardContent>
          </Card>
        )
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl bg-white/30" />)}
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Asegúrate de que no haya sesiones programadas en este espacio antes de eliminarlo.</AlertDialogDescription>
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
