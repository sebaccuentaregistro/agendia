

'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudio } from '@/context/StudioContext';
import { Search } from 'lucide-react';

interface StudentFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  actividadFilter: string;
  setActividadFilter: (value: string) => void;
  specialistFilter: string;
  setSpecialistFilter: (value: string) => void;
  spaceFilter: string;
  setSpaceFilter: (value: string) => void;
}

export function StudentFilters({
  searchTerm,
  setSearchTerm,
  actividadFilter,
  setActividadFilter,
  specialistFilter,
  setSpecialistFilter,
  spaceFilter,
  setSpaceFilter,
}: StudentFiltersProps) {
  const { actividades, specialists, spaces } = useStudio();

  return (
    <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl"
          />
        </div>
        <div className="flex gap-2 flex-col sm:flex-row">
          <Select value={actividadFilter} onValueChange={setActividadFilter}>
            <SelectTrigger className="w-full sm:w-[160px] bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl">
              <SelectValue placeholder="Actividades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Actividades</SelectItem>
              {actividades.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={specialistFilter} onValueChange={setSpecialistFilter}>
            <SelectTrigger className="w-full sm:w-[160px] bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl">
              <SelectValue placeholder="Especialistas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Especialistas</SelectItem>
              {specialists.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={spaceFilter} onValueChange={setSpaceFilter}>
            <SelectTrigger className="w-full sm:w-[160px] bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl">
              <SelectValue placeholder="Espacios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Espacios</SelectItem>
              {spaces.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
