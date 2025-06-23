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
        <Label htmlFor="name" className="text-right">Class Name</Label>
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
      <PageHeader title="Class Schedule" description="Schedule classes, manage instructor assignments, and track capacity.">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Schedule Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Class</DialogTitle>
            </DialogHeader>
            <ClassForm />
          </DialogContent>
        </Dialog>
      </PageHeader>
      
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Day & Time</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
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
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit Class</DropdownMenuItem>
                        <DropdownMenuItem>View Roster</DropdownMenuItem>
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
