'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Actividad } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
});

export default function ActividadesPage() {
  const { actividades, addActividad, updateActividad, deleteActividad, yogaClasses, specialists } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<Actividad | undefined>(undefined);
  const [actividadToDelete, setActividadToDelete] = useState<Actividad | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '' },
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

  const getUsageCount = (actividadId: string) => {
    const classCount = yogaClasses.filter(c => c.actividadId === actividadId).length;
    const specialistCount = specialists.filter(s => s.actividadIds.includes(actividadId)).length;
    return { classCount, specialistCount };
  }

  return (
    <div>
      <PageHeader title="Actividades" description="Definir los tipos de clases que se ofrecen.">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Actividad</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{selectedActividad ? 'Editar Actividad' : 'Añadir Nueva Actividad'}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <DialogFooter><Button type="submit">Guardar Cambios</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </PageHeader>
      
      {isMounted ? (
        actividades.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre de Actividad</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead><span className="sr-only">Acciones</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actividades.map((actividad) => {
                  const usage = getUsageCount(actividad.id);
                  return (
                    <TableRow key={actividad.id}>
                      <TableCell className="font-medium">{actividad.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {usage.classCount} clases / {usage.specialistCount} especialistas
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Alternar menú</span></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(actividad)}>Editar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDeleteDialog(actividad)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center">
            <CardHeader>
              <CardTitle>No Hay Actividades</CardTitle>
              <CardDescription>Empieza a definir los servicios que ofreces añadiendo tu primera actividad.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Actividad</Button>
            </CardContent>
          </Card>
        )
      ) : (
        <Card><Skeleton className="h-64 w-full" /></Card>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la actividad.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActividadToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sí, eliminar actividad</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
