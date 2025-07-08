
'use client';

import { useState } from 'react';
import { useStudio } from '@/context/StudioContext';
import type { Person } from '@/types';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function StudentsPage() {
    const { people, addPerson } = useStudio();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');

    const handleAddPerson = () => {
        if (newName && newPhone) {
            addPerson({
                name: newName,
                phone: newPhone,
                membershipType: 'Mensual', // Simplified for now
            });
            setNewName('');
            setNewPhone('');
            setIsDialogOpen(false);
        } else {
            alert("Por favor, completa nombre y teléfono.");
        }
    };

    return (
        <div>
            <PageHeader title="Personas">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Persona
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Añadir Nueva Persona</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Nombre</Label>
                                <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="phone" className="text-right">Teléfono</Label>
                                <Input id="phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddPerson}>Guardar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </PageHeader>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {people.map((person: Person) => (
                    <Card key={person.id} className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
                        <CardHeader>
                            <CardTitle className="text-slate-800 dark:text-slate-100">{person.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600 dark:text-slate-300">{person.phone}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
             {people.length === 0 && (
                <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
                    <CardHeader>
                        <CardTitle className="text-slate-800 dark:text-slate-100">No Hay Personas</CardTitle>
                        <CardContent>
                            <p className="text-slate-600 dark:text-slate-400 mt-2">No hay personas para mostrar. Añade una para empezar.</p>
                        </CardContent>
                    </CardHeader>
                </Card>
             )}
        </div>
    );
}
