

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useStudio } from '@/context/StudioContext';
import { Person, Session } from '@/types';
import { AlertCircle, User, MapPin, Signal } from 'lucide-react';

interface EnrollmentsDialogProps {
  person: Person | null;
  onClose: () => void;
}

export function EnrollmentsDialog({ person, onClose }: EnrollmentsDialogProps) {
    const { sessions, specialists, actividades, enrollPersonInSessions, tariffs, spaces, levels, triggerWaitlistCheck } = useStudio();
    
    const [filters, setFilters] = useState({ day: 'all', actividadId: 'all', specialistId: 'all' });
    const [searchTerm, setSearchTerm] = useState('');
    
    const form = useForm<{ sessionIds: string[] }>();
    const watchedSessionIds = form.watch('sessionIds') || [];

    const { enrolledSessionIds, filteredAndSortedSessions } = useMemo(() => {
        const enrolledIds = person ? sessions.filter(s => s.personIds.includes(person.id)).map(s => s.id) : [];
        const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

        const filtered = sessions.filter(session => {
            return (filters.day === 'all' || session.dayOfWeek === filters.day) &&
                   (filters.actividadId === 'all' || session.actividadId === filters.actividadId) &&
                   (filters.specialistId === 'all' || session.instructorId === filters.specialistId);
        });

        const sorted = [...filtered].sort((a, b) => {
            const dayComparison = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
            if (dayComparison !== 0) return dayComparison;
            return a.time.localeCompare(b.time);
        });

        return { enrolledSessionIds: enrolledIds, filteredAndSortedSessions: sorted };
    }, [sessions, person, filters]);
    
    const personTariff = useMemo(() => {
        return person ? tariffs.find(t => t.id === person.tariffId) : undefined;
    }, [tariffs, person]);

    const sessionsByDay = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        
        const sessionsMatchingSearch = searchTerm 
            ? filteredAndSortedSessions.filter(session => {
                const actividad = actividades.find(a => a.id === session.actividadId);
                const specialist = specialists.find(s => s.id === session.instructorId);
                return (
                    actividad?.name.toLowerCase().includes(lowercasedFilter) ||
                    specialist?.name.toLowerCase().includes(lowercasedFilter)
                );
            })
            : filteredAndSortedSessions;

        return sessionsMatchingSearch.reduce((acc, session) => {
            (acc[session.dayOfWeek] = acc[session.dayOfWeek] || []).push(session);
            return acc;
        }, {} as Record<string, Session[]>);

    }, [filteredAndSortedSessions, searchTerm, actividades, specialists]);
    
    useEffect(() => {
        form.reset({ sessionIds: enrolledSessionIds });
    }, [person, enrolledSessionIds, form]);
    
    if (!person) {
        return null;
    }

    const tariffFrequency = personTariff?.frequency;
    const isOverLimit = tariffFrequency !== undefined && watchedSessionIds.length >= tariffFrequency;
    
    const onSubmit = async (data: { sessionIds: string[] }) => {
        if (!person) return;
        const removedFromSessionIds = await enrollPersonInSessions(person.id, data.sessionIds);

        if (removedFromSessionIds && Array.isArray(removedFromSessionIds)) {
            removedFromSessionIds.forEach(sessionId => {
                triggerWaitlistCheck(sessionId);
            });
        }
        
        onClose();
    };

    const daysOfWeekWithSessions = Object.keys(sessionsByDay);

    return (
        <Dialog open={!!person} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Gestionar Horarios: {person.name}</DialogTitle>
                    <DialogDescription>
                        Selecciona las clases a las que asistirá {person.name} de forma regular.
                        {personTariff && (
                          <span className="block mt-1 font-medium">
                            Plan actual: {personTariff.name} ({tariffFrequency !== undefined ? `${watchedSessionIds.length}/${tariffFrequency}` : watchedSessionIds.length} clase(s) semanales)
                          </span>
                        )}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    <Input
                        placeholder="Buscar por actividad o especialista..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-4 border rounded-lg bg-muted/50">
                        <Select value={filters.day} onValueChange={(value) => setFilters(f => ({ ...f, day: value }))}>
                            <SelectTrigger><SelectValue placeholder="Día" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Día</SelectItem>
                                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filters.actividadId} onValueChange={(value) => setFilters(f => ({ ...f, actividadId: value }))}>
                            <SelectTrigger><SelectValue placeholder="Actividad" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Actividad</SelectItem>
                                {actividades.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filters.specialistId} onValueChange={(value) => setFilters(f => ({ ...f, specialistId: value }))}>
                            <SelectTrigger><SelectValue placeholder="Especialista" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Especialista</SelectItem>
                                {specialists.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {isOverLimit && (
                    <Alert variant="destructive" className="border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Límite del Plan Excedido</AlertTitle>
                        <AlertDescription>
                           Con {watchedSessionIds.length} clases, {person.name} ha alcanzado el límite de {tariffFrequency} de su plan. No podrás seleccionar más clases.
                        </AlertDescription>
                    </Alert>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <ScrollArea className="h-[40vh] my-4">
                            <div className="space-y-6 pr-4">
                                {daysOfWeekWithSessions.length > 0 ? daysOfWeekWithSessions.map(day => (
                                    <div key={day}>
                                        <h3 className="font-semibold mb-2 sticky top-0 bg-background py-1">{day}</h3>
                                        <div className="space-y-2">
                                            {sessionsByDay[day].map(session => (
                                                <FormField
                                                    key={session.id}
                                                    control={form.control}
                                                    name="sessionIds"
                                                    render={({ field }) => {
                                                        const actividad = actividades.find(a => a.id === session.actividadId);
                                                        const specialist = specialists.find(s => s.id === session.instructorId);
                                                        const space = spaces.find(s => s.id === session.spaceId);
                                                        const level = levels.find(l => l.id === session.levelId);
                                                        const capacity = space?.capacity ?? 0;
                                                        const enrolledCount = session.personIds.length;
                                                        const isAlreadyEnrolledInThisClass = field.value?.includes(session.id);
                                                        const isFull = enrolledCount >= capacity && !isAlreadyEnrolledInThisClass;

                                                        return (
                                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 hover:bg-accent/50 transition-colors data-[disabled]:opacity-50" data-disabled={isFull || (isOverLimit && !isAlreadyEnrolledInThisClass)}>
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={isAlreadyEnrolledInThisClass}
                                                                        disabled={isFull || (isOverLimit && !isAlreadyEnrolledInThisClass)}
                                                                        onCheckedChange={(checked) => {
                                                                            return checked
                                                                                ? field.onChange([...(field.value || []), session.id])
                                                                                : field.onChange(field.value?.filter((value) => value !== session.id));
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal flex-grow cursor-pointer flex justify-between items-center">
                                                                    <div className="space-y-1">
                                                                        <p className="font-semibold">{actividad?.name || 'Clase'}</p>
                                                                        <div className="flex items-center gap-4 flex-wrap">
                                                                            <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><User className="h-3 w-3" /> {specialist?.name || 'N/A'}</span>
                                                                            <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {space?.name || 'N/A'}</span>
                                                                        </div>
                                                                        {level && <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium mt-1 flex items-center gap-1.5"><Signal className="h-3 w-3"/>{level.name}</Badge>}
                                                                    </div>
                                                                    <div className="text-right flex-shrink-0 ml-4">
                                                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{session.time}</p>
                                                                        <Badge variant={isFull ? 'destructive' : 'secondary'} className="text-xs">{enrolledCount}/{capacity}</Badge>
                                                                    </div>
                                                                </FormLabel>
                                                            </FormItem>
                                                        );
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="flex items-center justify-center h-full text-center">
                                        <p className="text-sm text-muted-foreground">No se encontraron clases con los filtros seleccionados.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
                            <Button type="submit">Guardar Horarios</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
