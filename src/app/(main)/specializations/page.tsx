'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Trash2, Star } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Actividad } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
});

export default function ActividadesPage() {
  const { actividades, addActividad, updateActividad, deleteActividad } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<Actividad | undefined>(undefined);
  const [actividadToDelete, setActividadToDelete] = useState<Actividad | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredActividades = useMemo(() => {
    if (!searchTerm.trim()) {
      return actividades;
    }
    return actividades.filter(actividad =>
      actividad.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [actividades, searchTerm]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  function handleAdd() {
    setSelectedActividad(undefined);
    form.reset({ name: '' });
    setIsDialogOpen(true);
  }

  function handleEdit(actividad: Actividad) {
    setSelectedActividad(actividad);
    form.reset({ name: actividad.name });
    setIsDialogOpen(true);
  }

  function openDeleteDialog(actividad: Actividad) {
    setActividadToDelete(actividad);
    setIsDeleteDialogOpen(true);
  }
  
  function handleDelete() {
    if (actividadToDelete) {
      deleteActividad(actividadToDelete.id);
      setIsDeleteDialogOpen(false);
      setActividadToDelete(null);
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (selectedActividad) {
      updateActividad({ ...selectedActividad, ...values });
    } else {
      addActividad(values);
    }
    setIsDialogOpen(false);
    setSelectedActividad(undefined);
  }

  return (
    <div>
      <PageHeader title="Actividades">
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
           <Input 
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Actividad
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedActividad ? 'Editar Actividad' : 'Añadir Nueva Actividad'}</DialogTitle>
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

      {isMounted ? (
        filteredActividades.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredActividades.map((actividad) => (
              <Card key={actividad.id} className="flex flex-col">
                <CardContent className="flex-grow p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <Star className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-lg font-bold">{actividad.name}</h3>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t p-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Alternar menú</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(actividad)}>Editar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDeleteDialog(actividad)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center">
            <CardHeader>
              <CardTitle>{searchTerm ? "No se encontraron actividades" : "No Hay Actividades"}</CardTitle>
              <CardDescription>
                {searchTerm ? "Intenta con otro nombre o limpia la búsqueda." : "Empieza a definir los servicios que ofreces añadiendo tu primera actividad."}
              </CardDescription>
            </CardHeader>
            <CardContent>
               {!searchTerm && (
                <Button onClick={handleAdd}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Actividad
                </Button>
               )}
            </CardContent>
          </Card>
        )
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="flex flex-col">
              <CardContent className="flex-grow p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-grow space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t p-3">
                 <Skeleton className="h-8 w-8" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}


      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la actividad y la quitará de cualquier especialista que la tenga asignada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActividadToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Sí, eliminar actividad
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
