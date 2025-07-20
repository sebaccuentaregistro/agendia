
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudio } from '@/context/StudioContext';
import { Session, WaitlistEntry } from '@/types';

const prospectSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().regex(/^\d+$/, { message: 'El teléfono solo debe contener números.' }).min(8, { message: 'El teléfono parece muy corto.' }),
});

export function WaitlistDialog({ session, onClose }: { session: Session; onClose: () => void; }) {
  const { people, addToWaitlist } = useStudio();
  const [activeTab, setActiveTab] = useState('existing');
  const [selectedPersonId, setSelectedPersonId] = useState('');

  const prospectForm = useForm<z.infer<typeof prospectSchema>>({
    resolver: zodResolver(prospectSchema),
    defaultValues: { name: '', phone: '' },
  });

  const eligiblePeople = useMemo(() => {
    const enrolledIds = new Set(session.personIds);
    const waitlistPersonIds = new Set((session.waitlist || []).filter(e => typeof e === 'string'));
    return people.filter(p => !enrolledIds.has(p.id) && !waitlistPersonIds.has(p.id))
      .sort((a,b) => a.name.localeCompare(b.name));
  }, [people, session]);

  const handleExistingSubmit = () => {
    if (selectedPersonId) {
      addToWaitlist(session.id, selectedPersonId);
      onClose();
    }
  };

  const handleProspectSubmit = (values: z.infer<typeof prospectSchema>) => {
    const prospect: WaitlistEntry = { ...values, isProspect: true };
    addToWaitlist(session.id, prospect);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anotar en Lista de Espera</DialogTitle>
          <DialogDescription>
            Añade un alumno existente o un nuevo contacto a la lista de espera de esta clase.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Alumno Existente</TabsTrigger>
                <TabsTrigger value="prospect">Nuevo Contacto</TabsTrigger>
            </TabsList>
            <TabsContent value="existing" className="py-4">
                 <div className="space-y-4">
                    <Select onValueChange={setSelectedPersonId} value={selectedPersonId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona una persona..." />
                        </SelectTrigger>
                        <SelectContent>
                            <ScrollArea className="h-60">
                                {eligiblePeople.length > 0 ? (
                                    eligiblePeople.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">No hay personas elegibles.</div>
                                )}
                            </ScrollArea>
                        </SelectContent>
                    </Select>
                     <Button onClick={handleExistingSubmit} disabled={!selectedPersonId} className="w-full">Añadir Alumno a la Lista</Button>
                </div>
            </TabsContent>
            <TabsContent value="prospect" className="py-4">
                <Form {...prospectForm}>
                    <form onSubmit={prospectForm.handleSubmit(handleProspectSubmit)} className="space-y-4">
                         <FormField
                            control={prospectForm.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Contacto</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={prospectForm.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teléfono</FormLabel>
                                    <FormControl><Input type="tel" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full">Añadir Nuevo Contacto a la Lista</Button>
                    </form>
                </Form>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
