'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { specialists, actividades } from '@/lib/data';
import type { Specialist } from '@/types';
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
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

const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().min(1, { message: 'El teléfono es obligatorio.' }),
  actividadIds: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'Tienes que seleccionar al menos una actividad.',
  }),
});

export default function SpecialistsPage() {
  const [specialistsList, setSpecialistsList] = useState<Specialist[]>(specialists);
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
      setSpecialistsList(prev => prev.filter(s => s.id !== specialistToDelete.id));
      setIsDeleteDialogOpen(false);
      setSpecialistToDelete(null);
    }
  }
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    if (selectedSpecialist) {
      // Update existing specialist
      setSpecialistsList(
        specialistsList.map((s) =>
          s.id === selectedSpecialist.id ? { ...s, ...values } : s
        )
      );
    } else {
      // Add new specialist
      const newSpecialist: Specialist = {
        id: `inst-${Date.now()}`,
        avatar: `https://placehold.co/100x100.png`,
        ...values,
      };
      setSpecialistsList([...specialistsList, newSpecialist]);
    }
    setIsDialogOpen(false);
    setSelectedSpecialist(undefined);
  }

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
      
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Actividades</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {specialistsList.map((specialist) => (
              <TableRow key={specialist.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={specialist.avatar} alt={specialist.name} data-ai-hint="person photo"/>
                      <AvatarFallback>{specialist.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                     <div className="flex flex-col">
                      <span>{specialist.name}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {getActividadNames(specialist.actividadIds).map(name => (
                      <Badge key={name} variant="secondary">{name}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{specialist.phone}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Alternar menú</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEdit(specialist)}>Editar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDeleteDialog(specialist)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
