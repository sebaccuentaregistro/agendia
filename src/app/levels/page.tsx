
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Pencil, PlusCircle, Trash2, Signal, Users, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Level } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
});

export default function LevelsPage() {
  const { levels, addLevel, updateLevel, deleteLevel, sessions, people, loading } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<Level | undefined>(undefined);
  const [levelToDelete, setLevelToDelete] = useState<Level | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLevels = useMemo(() => {
    if (!searchTerm.trim()) {
      return levels;
    }
    return levels.filter(level =>
      level.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [levels, searchTerm]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '' },
  });

  function handleAdd() {
    setSelectedLevel(undefined);
    form.reset({ name: '' });
    setIsDialogOpen(true);
  }

  function handleEdit(level: Level) {
    setSelectedLevel(level);
    form.reset({ name: level.name });
    setIsDialogOpen(true);
  }

  function openDeleteDialog(level: Level) {
    setLevelToDelete(level);
    setIsDeleteDialogOpen(true);
  }
  
  function handleDelete() {
    if (levelToDelete) {
      deleteLevel(levelToDelete.id);
      setIsDeleteDialogOpen(false);
      setLevelToDelete(null);
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (selectedLevel) {
      updateLevel({ ...selectedLevel, ...values });
    } else {
      addLevel(values);
    }
    setIsDialogOpen(false);
    setSelectedLevel(undefined);
  }

  const getUsageCount = (levelId: string) => {
    const sessionCount = sessions.filter(s => s.levelId === levelId).length;
    const personCount = people.filter(p => p.levelId === levelId).length;
    return { sessionCount, personCount };
  }

  return (
    <div>
      <PageHeader title="Niveles de Práctica" description="Crea y gestiona los niveles de tus clases y alumnos.">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Nivel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{selectedLevel ? 'Editar Nivel' : 'Añadir Nuevo Nivel'}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nombre del Nivel</FormLabel><FormControl><Input placeholder="Ej: Principiante, Avanzado..." {...field} /></FormControl><FormMessage /></FormItem>
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
      
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl bg-white/30" />)}
        </div>
      ) : filteredLevels.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredLevels.map((level) => {
              const usage = getUsageCount(level.id);
              return (
                <Card key={level.id} className="flex flex-col bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                      <Signal className="h-6 w-6 text-primary" />
                      <span>{level.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-3 text-sm">
                    <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Calendar className="h-4 w-4 text-slate-500" /><span className="font-semibold text-slate-700 dark:text-slate-200">Sesiones:</span> {usage.sessionCount}</p>
                    <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Users className="h-4 w-4 text-slate-500" /><span className="font-semibold text-slate-700 dark:text-slate-200">Personas:</span> {usage.personCount}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 border-t border-white/20 p-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-300 hover:bg-white/50" onClick={() => handleEdit(level)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => openDeleteDialog(level)}>
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
              <CardTitle className="text-slate-800 dark:text-slate-100">{searchTerm ? "No se encontraron niveles" : "No Hay Niveles Definidos"}</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {searchTerm ? "Intenta con otro nombre o limpia la búsqueda." : "Crea tu primer nivel para organizar mejor tus clases y alumnos."}
              </CardDescription>
            </CardHeader>
            <CardContent>
               {!searchTerm && (
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Nivel</Button>
               )}
            </CardContent>
          </Card>
        )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Si el nivel está asignado a alguna persona o sesión, la eliminación será bloqueada.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLevelToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sí, eliminar nivel</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
