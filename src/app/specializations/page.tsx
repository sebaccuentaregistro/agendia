
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Pencil, PlusCircle, Trash2, Star, ClipboardList, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useEffect, useMemo } from 'react';
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
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
});

export default function ActividadesPage() {
  const { actividades, addActividad, updateActividad, deleteActividad, sessions, specialists } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<Actividad | undefined>(undefined);
  const [actividadToDelete, setActividadToDelete] = useState<Actividad | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredActividades = useMemo(() => {
    if (!searchTerm.trim()) {
      return actividades;
    }
    return actividades.filter(actividad =>
      actividad.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [actividades, searchTerm]);

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
    const sessionCount = sessions.filter(c => c.actividadId === actividadId).length;
    const specialistCount = specialists.filter(s => s.actividadIds.includes(actividadId)).length;
    return { sessionCount, specialistCount };
  }

  return (
    <div>
      <PageHeader title="Actividades">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} size="icon">
              <PlusCircle className="h-5 w-5" />
              <span className="sr-only">Añadir Actividad</span>
            </Button>
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
      
      <div className="-mt-6 mb-8">
        <Input
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl"
        />
      </div>
      
      {isMounted ? (
        filteredActividades.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredActividades.map((actividad) => {
              const usage = getUsageCount(actividad.id);
              return (
                <Card key={actividad.id} className="flex flex-col bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                      <Star className="h-6 w-6 text-primary" />
                      <span>{actividad.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-3 text-sm">
                    <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><ClipboardList className="h-4 w-4 text-slate-500" /><span className="font-semibold text-slate-700 dark:text-slate-200">Sesiones:</span> {usage.sessionCount}</p>
                    <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Users className="h-4 w-4 text-slate-500" /><span className="font-semibold text-slate-700 dark:text-slate-200">Especialistas:</span> {usage.specialistCount}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 border-t border-white/20 p-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-300 hover:bg-white/50" onClick={() => handleEdit(actividad)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => openDeleteDialog(actividad)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-slate-100">{searchTerm ? "No se encontraron actividades" : "No Hay Actividades"}</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {searchTerm ? "Intenta con otro nombre o limpia la búsqueda." : "Empieza a definir los servicios que ofreces añadiendo tu primera actividad."}
              </CardDescription>
            </CardHeader>
            <CardContent>
               {!searchTerm && (
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Actividad</Button>
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
            <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la actividad. Si está en uso por sesiones o especialistas, la eliminación será bloqueada.</AlertDialogDescription>
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
