
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { KeyRound, MoreVertical, Pencil, PlusCircle, Shield, Trash2, User } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Operator } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  pin: z.string().regex(/^\d{4}$/, { message: 'El PIN debe ser de 4 dígitos numéricos.' }),
  role: z.enum(['admin', 'staff'], { required_error: 'Debes seleccionar un rol.' }),
});

export default function OperatorsPage() {
  const { operators, addOperator, updateOperator, deleteOperator, loading } = useStudio();
  const { isPinVerified } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | undefined>(undefined);
  const [operatorToDelete, setOperatorToDelete] = useState<Operator | null>(null);

  const sortedOperators = useMemo(() => {
    return [...operators].sort((a, b) => a.name.localeCompare(b.name));
  }, [operators]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', pin: '', role: 'staff' },
  });

  function handleAdd() {
    if (!isPinVerified) return;
    setSelectedOperator(undefined);
    form.reset({ name: '', pin: '', role: 'staff' });
    setIsDialogOpen(true);
  }

  function handleEdit(operator: Operator) {
    if (!isPinVerified) return;
    setSelectedOperator(operator);
    form.reset({
        name: operator.name,
        pin: operator.pin,
        role: operator.role,
    });
    setIsDialogOpen(true);
  }

  function openDeleteDialog(operator: Operator) {
    if (!isPinVerified) return;
    setOperatorToDelete(operator);
    setIsDeleteDialogOpen(true);
  }
  
  function handleDelete() {
    if (operatorToDelete) {
      deleteOperator(operatorToDelete.id);
      setIsDeleteDialogOpen(false);
      setOperatorToDelete(null);
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (selectedOperator) {
      updateOperator({ ...selectedOperator, ...values });
    } else {
      addOperator(values);
    }
    setIsDialogOpen(false);
    setSelectedOperator(undefined);
  }

  return (
    <div>
      <PageHeader title="Operadores del Sistema">
        {isPinVerified && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Operador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                  <DialogTitle>{selectedOperator ? 'Editar Operador' : 'Nuevo Operador'}</DialogTitle>
                  <DialogDescription>
                      Gestiona los miembros del equipo que pueden usar la aplicación.
                  </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Ej: Juan Pérez" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <div className="grid grid-cols-2 gap-4">
                     <FormField control={form.control} name="pin" render={({ field }) => (
                        <FormItem><FormLabel>PIN de 4 dígitos</FormLabel><FormControl><Input type="password" maxLength={4} placeholder="••••" {...field} /></FormControl><FormMessage /></FormItem>
                     )}/>
                     <FormField control={form.control} name="role" render={({ field }) => (
                        <FormItem><FormLabel>Rol</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar rol" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="staff">Staff / Recepcionista</SelectItem>
                              <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                        <FormMessage /></FormItem>
                    )}/>
                  </div>
                  <DialogFooter>
                      <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                      <Button type="submit">Guardar Cambios</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>
      
       {!isPinVerified && (
          <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-slate-100">Acceso Restringido</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Esta sección solo puede ser gestionada por el propietario del estudio. Por favor, verifica tu PIN de propietario desde la pantalla de inicio para acceder.
              </CardDescription>
            </CardHeader>
          </Card>
      )}

      {isPinVerified && (
        loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl bg-white/30" />)}
          </div>
        ) : sortedOperators.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedOperators.map((operator) => (
              <Card key={operator.id} className="flex flex-col bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                      <User className="h-6 w-6 text-primary" />
                      <span>{operator.name}</span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 pt-2 capitalize">
                      {operator.role === 'admin' ? 
                        <Shield className="h-4 w-4 text-amber-600" /> : 
                        <KeyRound className="h-4 w-4 text-slate-500" />
                      }
                      {operator.role}
                    </CardDescription>
                  </div>
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleEdit(operator)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openDeleteDialog(operator)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="flex-grow">
                   <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                     <span className="font-semibold text-slate-700 dark:text-slate-200">PIN:</span>
                     ••••
                   </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-slate-100">No Hay Operadores</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Añade a los miembros de tu equipo para que puedan usar el sistema con su propio PIN.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Operador</Button>
            </CardContent>
          </Card>
        )
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente al operador y su acceso.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOperatorToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sí, eliminar operador</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
