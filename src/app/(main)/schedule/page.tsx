'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { instructors, specializations, yogaClasses } from '@/lib/data';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { YogaClass } from '@/types';

function ClassForm({ yogaClass }: { yogaClass?: YogaClass }) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">Nombre de la Clase</Label>
        <Input id="name" defaultValue={yogaClass?.name} className="col-span-3" />
      </div>
      {/* Add more fields for instructor, time, etc. */}
    </div>
  );
}

export default function SchedulePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getClassDetails = (cls: YogaClass) => {
    const instructor = instructors.find(i => i.id === cls.instructorId);
    const specialization = specializations.find(s => s.id === cls.specializationId);
    return { instructor, specialization };
  };

  return (
    <div>
      <PageHeader title="Horario de Clases" description="Programa clases, gestiona las asignaciones de instructores y haz un seguimiento de la capacidad.">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Programar Clase
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Programar Nueva Clase</DialogTitle>
            </DialogHeader>
            <ClassForm />
          </DialogContent>
        </Dialog>
      </PageHeader>
      
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clase</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Día y Hora</TableHead>
              <TableHead>Capacidad</TableHead>
              <TableHead><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {yogaClasses.map((cls) => {
              const { instructor, specialization } = getClassDetails(cls);
              const capacityPercentage = (cls.studentsEnrolled / cls.capacity) * 100;

              return (
                <TableRow key={cls.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{cls.name}</span>
                      <span className="text-xs text-muted-foreground">{specialization?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{instructor?.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{cls.dayOfWeek}</span>
                      <span className="text-xs text-muted-foreground">{cls.time}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={capacityPercentage} className="w-24" />
                      <span className="text-sm text-muted-foreground">{cls.studentsEnrolled}/{cls.capacity}</span>
                    </div>
                  </TableCell>
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
                        <DropdownMenuItem>Editar Clase</DropdownMenuItem>
                        <DropdownMenuItem>Ver Lista</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
