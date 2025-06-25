'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardTitle, CardDescription, CardContent, CardHeader } from '@/components/ui/card';
import { Calendar, Users, ClipboardList, Star, Warehouse, Bot, User as UserIcon, DoorOpen } from 'lucide-react';
import Link from 'next/link';
import { useStudio } from '@/context/StudioContext';
import { useMemo, useState } from 'react';
import type { YogaClass } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const navItems = [
  { href: "/schedule", label: "Horario", icon: Calendar, description: "Gestiona y visualiza las clases programadas." },
  { href: "/students", label: "Personas", icon: Users, description: "Administra los perfiles de todos tus clientes." },
  { href: "/instructors", label: "Especialistas", icon: ClipboardList, description: "Gestiona los perfiles de los instructores." },
  { href: "/specializations", label: "Actividades", icon: Star, description: "Define los tipos de clases que ofreces." },
  { href: "/spaces", label: "Espacios", icon: Warehouse, description: "Administra los salones y áreas físicas." },
  { href: "/assistant", label: "Asistente IA", icon: Bot, description: "Crea horarios óptimos con inteligencia artificial." },
];

export default function Dashboard() {
  const { yogaClasses, specialists, actividades, spaces } = useStudio();
  const [filters, setFilters] = useState({
    actividadId: 'all',
    spaceId: 'all',
    specialistId: 'all',
    timeOfDay: 'all', // Mañana, Tarde, Noche
  });

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const { todaysClasses, filteredClasses, todayName } = useMemo(() => {
    const dayMap: { [key: number]: YogaClass['dayOfWeek'] } = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
    const today = new Date();
    const todayName = dayMap[today.getDay()];

    const getTimeOfDay = (time: string): 'Mañana' | 'Tarde' | 'Noche' => {
        if (!time) return 'Tarde';
        const hour = parseInt(time.split(':')[0], 10);
        if (hour < 12) return 'Mañana';
        if (hour < 18) return 'Tarde';
        return 'Noche';
    };

    const todaysClasses = yogaClasses
      .filter(cls => cls.dayOfWeek === todayName)
      .sort((a, b) => a.time.localeCompare(b.time));

    const filtered = todaysClasses.filter(cls => {
        const timeOfDay = getTimeOfDay(cls.time);
        return (
            (filters.actividadId === 'all' || cls.actividadId === filters.actividadId) &&
            (filters.spaceId === 'all' || cls.spaceId === filters.spaceId) &&
            (filters.specialistId === 'all' || cls.instructorId === filters.specialistId) &&
            (filters.timeOfDay === 'all' || timeOfDay === filters.timeOfDay)
        );
    });

    return { todaysClasses, filteredClasses: filtered, todayName };
  }, [yogaClasses, filters]);

  const getClassDetails = (cls: YogaClass) => {
    const specialist = specialists.find((i) => i.id === cls.instructorId);
    const actividad = actividades.find((s) => s.id === cls.actividadId);
    const space = spaces.find((s) => s.id === cls.spaceId);
    return { specialist, actividad, space };
  };

  const formatTime = (time: string) => {
    if (!time || !time.includes(':')) return 'N/A';
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const formattedHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
    return `${formattedHour}:${minute} ${ampm}`;
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Panel de Control" description="Un resumen de la actividad de tu estudio." />
      
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Navegación Rápida</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="block transition-transform hover:-translate-y-1">
                <Card className="group flex h-full flex-col justify-between p-6 transition-colors hover:border-primary hover:shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <item.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                          <CardTitle className="text-lg font-bold">{item.label}</CardTitle>
                          <CardDescription className="mt-1">{item.description}</CardDescription>
                      </div>
                    </div>
                </Card>
            </Link>
            ))}
        </div>
      </div>

      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Clases de Hoy - {todayName}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filters.specialistId} onValueChange={(value) => handleFilterChange('specialistId', value)}>
                <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial">
                  {filters.specialistId === 'all' ? 'Especialista' : <SelectValue />}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {specialists.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.actividadId} onValueChange={(value) => handleFilterChange('actividadId', value)}>
                <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial">
                  {filters.actividadId === 'all' ? 'Actividad' : <SelectValue />}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {actividades.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.spaceId} onValueChange={(value) => handleFilterChange('spaceId', value)}>
                <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial">
                  {filters.spaceId === 'all' ? 'Espacio' : <SelectValue />}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {spaces.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.timeOfDay} onValueChange={(value) => handleFilterChange('timeOfDay', value)}>
                <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial">
                  {filters.timeOfDay === 'all' ? 'Horario' : <SelectValue />}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo el Día</SelectItem>
                  <SelectItem value="Mañana">Mañana</SelectItem>
                  <SelectItem value="Tarde">Tarde</SelectItem>
                  <SelectItem value="Noche">Noche</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          {todaysClasses.length > 0 ? (
            filteredClasses.length > 0 ? (
              <ul className="space-y-4">
                {filteredClasses.map(cls => {
                  const { specialist, actividad, space } = getClassDetails(cls);
                  return (
                    <li key={cls.id} className="flex items-center gap-4 rounded-lg border p-3">
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold">{actividad?.name || 'Clase'}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5"><UserIcon className="h-3 w-3" />{specialist?.name || 'N/A'}</span>
                          <span className="flex items-center gap-1.5"><DoorOpen className="h-3 w-3" />{space?.name || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{formatTime(cls.time)}</p>
                        <p className="text-sm text-muted-foreground">{cls.personIds.length} inscritos</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-md border-2 border-dashed p-10 text-center">
                <h3 className="text-lg font-semibold">No se encontraron clases</h3>
                <p className="text-sm text-muted-foreground">Prueba a cambiar o limpiar los filtros.</p>
              </div>
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-md border-2 border-dashed p-10 text-center">
                <h3 className="text-lg font-semibold">No hay clases hoy</h3>
                <p className="text-sm text-muted-foreground">¡Día libre! Disfruta del descanso.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
