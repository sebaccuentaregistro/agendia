'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Trash2, Warehouse } from 'lucide-react';
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
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Space } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  capacity: z.coerce.number().min(1, { message: 'La capacidad debe ser de al menos 1.' }),
});

export default function SpacesPage() {
  const { spaces, addSpace, updateSpace, deleteSpace } = useStudio();
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
    defaultValues: {
      name: '',
      capacity: 10,
    },
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

  return (
    <div>
      <PageHeader title="Espacios">
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
                Añadir Espacio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedSpace ? 'Editar Espacio' : 'Añadir Nuevo Espacio'}</DialogTitle>
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
                   <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">Capacidad</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="col-span-3" />
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

      {filteredSpaces.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSpaces.map((space) => (
            <Card key={space.id} className="flex flex-col">
              <CardContent className="flex-grow p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                    <Warehouse className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-bold">{space.name}</h3>
                    <p className="text-sm text-muted-foreground">Capacidad: {space.capacity} personas</p>
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
                    <DropdownMenuItem onClick={() => handleEdit(space)}>Editar</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDeleteDialog(space)}>
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
            <CardTitle>{searchTerm ? "No se encontraron espacios" : "No Hay Espacios"}</CardTitle>
            <CardDescription>
              {searchTerm ? "Intenta con otro nombre o limpia la búsqueda." : "Empieza a organizar tu estudio añadiendo tu primer espacio."}
            </CardDescription>
          </CardHeader>
          <CardContent>
             {!searchTerm && (
              <Button onClick={handleAdd}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Espacio
              </Button>
             )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el espacio. Asegúrate de que no haya clases programadas en este espacio antes de eliminarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSpaceToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Sí, eliminar espacio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
