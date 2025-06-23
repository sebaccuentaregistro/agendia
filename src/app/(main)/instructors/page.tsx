'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { instructors, actividades } from '@/lib/data';
import type { Instructor } from '@/types';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  email: z.string().email({ message: 'Por favor, introduce un correo electrónico válido.' }),
  phone: z.string().min(1, { message: 'El teléfono es obligatorio.' }),
  actividadIds: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'Tienes que seleccionar al menos una actividad.',
  }),
});

export default function InstructorsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | undefined>(undefined);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      actividadIds: [],
    },
  });

  const getActividadNames = (ids: string[]) => {
    return ids.map(id => actividades.find(a => a.id === id)?.name).filter(Boolean);
  };

  function handleEdit(instructor: Instructor) {
    setSelectedInstructor(instructor);
    form.reset({
      name: instructor.name,
      email: instructor.email,
      phone: instructor.phone,
      actividadIds: instructor.actividadIds,
    });
    setIsDialogOpen(true);
  }

  function handleAdd() {
    setSelectedInstructor(undefined);
    form.reset({ name: '', email: '', phone: '', actividadIds: [] });
    setIsDialogOpen(true);
  }
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Aquí iría la lógica para guardar el instructor (crear o actualizar)
    console.log('Valores del formulario:', values);
    setIsDialogOpen(false);
  }

  return (
    <div>
      <PageHeader title="Instructores" description="Mantén los perfiles de instructores, actividades e información de contacto.">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Instructor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{selectedInstructor ? 'Editar Instructor' : 'Añadir Nuevo Instructor'}</DialogTitle>
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
                    name="email"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Correo</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} className="col-span-3" />
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
            {instructors.map((instructor) => (
              <TableRow key={instructor.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={instructor.avatar} alt={instructor.name} data-ai-hint="person photo"/>
                      <AvatarFallback>{instructor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                     <div className="flex flex-col">
                      <span>{instructor.name}</span>
                      <span className="text-xs text-muted-foreground">{instructor.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {getActividadNames(instructor.actividadIds).map(name => (
                      <Badge key={name} variant="secondary">{name}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{instructor.phone}</TableCell>
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
                      <DropdownMenuItem onClick={() => handleEdit(instructor)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Ver Horario</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
