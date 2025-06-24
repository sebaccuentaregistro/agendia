'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import type { Specialist } from '@/types';
import { Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useStudio } from '@/context/StudioContext';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().min(1, { message: 'El teléfono es obligatorio.' }),
  actividadIds: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'Tienes que seleccionar al menos una actividad.',
  }),
});

export default function SpecialistsPage() {
  const { specialists, actividades, addSpecialist, updateSpecialist, deleteSpecialist } = useStudio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | undefined>(undefined);
  const [specialistToDelete, setSpecialistToDelete] = useState<Specialist | null>(null);

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
      <PageHeader title="Especialistas" description="Mantén los perfiles de especialistas, actividades e información de contacto.">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Especialista
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
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
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} className="col-span-3" />
                        </FormControl>
                        <FormMessage className="col-span-4" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Teléfono</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} className="col-span-3" />
                        </FormControl>
                        <FormMessage className="col-span-4" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="actividadIds"
                    render={() => (
                      <FormItem className="grid grid-cols-4 items-start gap-4">
                        <FormLabel className="text-right pt-2">Actividades</FormLabel>
                        <div className="col-span-3 space-y-2">
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
      
      {specialists.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {specialists.map((specialist) => (
            <Card key={specialist.id} className="flex flex-col">
              <CardContent className="p-6 flex-grow">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 flex-shrink-0">
                    <AvatarImage src={specialist.avatar} alt={specialist.name} data-ai-hint="person photo"/>
                    <AvatarFallback>{specialist.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold">{specialist.name}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{specialist.phone}</span>
                        <a href={formatWhatsAppLink(specialist.phone)} target="_blank" rel="noopener noreferrer">
                            <WhatsAppIcon className="text-green-600 hover:text-green-700 transition-colors" />
                            <span className="sr-only">Enviar WhatsApp a {specialist.name}</span>
                        </a>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actividades</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {getActividadNames(specialist.actividadIds).length > 0 ? (
                      getActividadNames(specialist.actividadIds).map(name => (
                        <Badge key={name} variant="secondary">{name}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin actividades asignadas</p>
                    )}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end gap-2 p-3 border-t">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(specialist)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDeleteDialog(specialist)}>
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
              <CardTitle>No Hay Especialistas</CardTitle>
              <CardDescription>
                Empieza a organizar tu estudio añadiendo tu primer especialista.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <Button onClick={handleAdd}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Especialista
                </Button>
            </CardContent>
          </Card>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al especialista de nuestros servidores.
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
