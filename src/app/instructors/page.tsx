
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import type { Specialist } from '@/types';
import { Pencil, PlusCircle, Trash2, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useStudio } from '@/context/StudioContext';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().regex(/^\d+$/, { message: 'El teléfono solo debe contener números (sin espacios ni guiones).' }).min(10, { message: 'El teléfono debe tener al menos 10 dígitos.' }),
  actividadIds: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'Tienes que seleccionar al menos una actividad.',
  }),
});

export default function SpecialistsPage() {
  const { specialists, actividades, addSpecialist, updateSpecialist, deleteSpecialist, loading } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | undefined>(undefined);
  const [specialistToDelete, setSpecialistToDelete] = useState<Specialist | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSpecialists = useMemo(() => {
    if (!searchTerm.trim()) {
      return specialists;
    }
    return specialists.filter(specialist =>
      specialist.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [specialists, searchTerm]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      actividadIds: [],
    },
  });

  const getActividadNames = (ids: string[]) => {
    return ids.map(id => actividades.find(a => a.id === id)?.name).filter(Boolean);
  };

  function handleEdit(specialist: Specialist) {
    setSelectedSpecialist(specialist);
    form.reset({
      name: specialist.name,
      phone: specialist.phone,
      actividadIds: specialist.actividadIds,
    });
    setIsDialogOpen(true);
  }

  function handleAdd() {
    setSelectedSpecialist(undefined);
    form.reset({ name: '', phone: '', actividadIds: [] });
    setIsDialogOpen(true);
  }

  function openDeleteDialog(specialist: Specialist) {
    setSpecialistToDelete(specialist);
    setIsDeleteDialogOpen(true);
  }

  function handleDelete() {
    if (specialistToDelete) {
      deleteSpecialist(specialistToDelete.id);
      setIsDeleteDialogOpen(false);
      setSpecialistToDelete(null);
    }
  }
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    if (selectedSpecialist) {
      updateSpecialist({ ...selectedSpecialist, ...values });
    } else {
      addSpecialist(values);
    }
    setIsDialogOpen(false);
    setSelectedSpecialist(undefined);
  }

  const formatWhatsAppLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

  return (
    <div>
      <PageHeader title="Especialistas">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Especialista
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedSpecialist ? 'Editar Especialista' : 'Añadir Nuevo Especialista'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="actividadIds"
                    render={() => (
                      <FormItem>
                        <FormLabel>Actividades</FormLabel>
                        <div className="space-y-2">
                          {actividades.map((item) => (
                            <FormField
                              key={item.id}
                              control={form.control}
                              name="actividadIds"
                              render={({ field }) => (
                                <FormItem key={item.id} className="flex flex-row items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), item.id])
                                          : field.onChange(field.value?.filter((value) => value !== item.id));
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{item.name}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                          <FormMessage />
                        </div>
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-[210px] w-full rounded-2xl bg-white/30" />)}
        </div>
      ) : filteredSpecialists.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSpecialists.map((specialist) => (
            <Card key={specialist.id} className="flex flex-col bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5">
              <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">{specialist.name}</CardTitle>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-300 -mr-2 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => handleEdit(specialist)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => openDeleteDialog(specialist)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Eliminar</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              
              <CardContent className="p-4 pt-2 flex-grow">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 mb-4">
                    <span>{specialist.phone}</span>
                    <a href={formatWhatsAppLink(specialist.phone)} target="_blank" rel="noopener noreferrer">
                        <WhatsAppIcon className="text-green-600 hover:text-green-700 transition-colors" />
                        <span className="sr-only">Enviar WhatsApp a {specialist.name}</span>
                    </a>
                </div>
                
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actividades</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {getActividadNames(specialist.actividadIds).length > 0 ? (
                      getActividadNames(specialist.actividadIds).map(name => (
                        <Badge key={name} variant="secondary">{name}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-slate-600 dark:text-slate-400">Sin actividades asignadas</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        ) : (
          <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-slate-100">{searchTerm ? "No se encontraron especialistas" : "No Hay Especialistas"}</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {searchTerm ? "Intenta con otro nombre o limpia la búsqueda." : "Empieza a organizar tu estudio añadiendo tu primer especialista."}
              </CardDescription>
            </CardHeader>
            <CardContent>
               {!searchTerm && (
                 <Button onClick={handleAdd}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Especialista
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente al especialista. Si está asignado a alguna sesión, la eliminación será bloqueada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSpecialistToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Sí, eliminar especialista
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
