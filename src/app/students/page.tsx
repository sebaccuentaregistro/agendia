

'use client';

import React, { useState, useMemo, useEffect, Suspense, Fragment } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileDown, Search, AlertCircle, Clock, CheckCircle, ChevronDown, UserX, CalendarClock } from 'lucide-react';
import type { Person, PaymentReminderInfo, Tariff, SessionAttendance } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getStudentPaymentStatus, exportToCsv } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { PersonDialog } from '@/components/students/person-dialog';
import { WelcomeDialog } from '@/components/welcome-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, isAfter, parse, startOfDay, isBefore } from 'date-fns';
import { PersonCard } from '@/components/students/person-card';
import { StudentFilters } from '@/components/students/student-filters';

type RecoveryStatus = 'none' | 'pending' | 'scheduled';

function StudentsPageContent() {
  const { people, inactivePeople, tariffs, attendance, loading, reactivatePerson, sessions } = useStudio();
  const { institute, isLimitReached, setPeopleCount } = useAuth();
  const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const statusFilterFromUrl = searchParams.get('filter') || 'all';
  const initialTab = statusFilterFromUrl === 'inactive' ? 'inactive' : 'active';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [actividadFilter, setActividadFilter] = useState('all');
  const [specialistFilter, setSpecialistFilter] = useState('all');
  const [spaceFilter, setSpaceFilter] = useState('all');

  const [personForWelcome, setPersonForWelcome] = useState<Person | null>(null);
  
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setPeopleCount(people.length);
  }, [people, setPeopleCount]);

  useEffect(() => {
    setIsMounted(true);
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
        setSearchTerm(searchQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    if(searchParams.get('filter') === 'inactive') {
        setActiveTab('inactive');
    }
  }, [searchParams]);

  const { groupedPeople, filteredInactivePeople, recoveryStatusMap } = useMemo(() => {
    if (!isMounted) return { groupedPeople: { overdue: [], upcoming: [], onTime: [] }, filteredInactivePeople: [], recoveryStatusMap: {} };
    
    const now = new Date();
    const today = startOfDay(now);
    const term = searchTerm.toLowerCase();

    // --- Start of Recovery Status Logic ---
    const tempRecoveryStatusMap: Record<string, RecoveryStatus> = {};
    const futureRecoveries = new Set<string>();

    // 1. Find all people with a scheduled recovery in the future
    attendance.forEach(record => {
        const recordDate = parse(record.date, 'yyyy-MM-dd', new Date());
        if (!isBefore(recordDate, today)) {
            record.oneTimeAttendees?.forEach(id => futureRecoveries.add(id));
        }
    });

    people.forEach(person => {
        const hasAvailableCredits = (person.recoveryCredits || []).some(c => c.status === 'available');
        const hasFutureRecovery = futureRecoveries.has(person.id);

        if (hasFutureRecovery) {
            tempRecoveryStatusMap[person.id] = 'scheduled';
        } else if (hasAvailableCredits) {
            tempRecoveryStatusMap[person.id] = 'pending';
        } else {
            tempRecoveryStatusMap[person.id] = 'none';
        }
    });
    // --- End of Recovery Status Logic ---

    let filteredActivePeople = people;

    // Apply URL-based filters first
    const filterParam = searchParams.get('filter');
    if (filterParam) {
        if (filterParam === 'overdue') {
            filteredActivePeople = people.filter(p => getStudentPaymentStatus(p, now).status === 'Atrasado');
        } else if (filterParam === 'pending-recovery') {
            filteredActivePeople = people.filter(p => {
                const status = tempRecoveryStatusMap[p.id];
                return status === 'pending' || status === 'scheduled';
            });
        }
    }


    // Apply search and dropdown filters
    filteredActivePeople = filteredActivePeople
      .filter(person => person.name.toLowerCase().includes(term) || person.phone.includes(term))
      .filter(person => {
        if (actividadFilter === 'all' && specialistFilter === 'all' && spaceFilter === 'all') {
            return true;
        }
        const personSessionIds = sessions.filter(s => s.personIds.includes(person.id)).map(s => s.id);
        if (personSessionIds.length === 0) return false;
        
        return sessions.some(session => 
            personSessionIds.includes(session.id) &&
            (actividadFilter === 'all' || session.actividadId === actividadFilter) &&
            (specialistFilter === 'all' || session.instructorId === specialistFilter) &&
            (spaceFilter === 'all' || session.spaceId === spaceFilter)
        );
      });

    const overdue: Person[] = [];
    const upcoming: Person[] = [];
    const onTime: Person[] = [];
    
    filteredActivePeople.forEach(person => {
        const status = getStudentPaymentStatus(person, now).status;
        if (status === 'Atrasado') {
          overdue.push(person);
        } else if (status === 'Próximo a Vencer') {
          upcoming.push(person);
        } else {
          onTime.push(person);
        }
      });

    const finalFilteredInactivePeople = inactivePeople
        .filter(person => person.name.toLowerCase().includes(term) || person.phone.includes(term))
        .sort((a,b) => (a.inactiveDate && b.inactiveDate) ? b.inactiveDate.getTime() - a.inactiveDate.getTime() : a.name.localeCompare(b.name));
      
    return { groupedPeople: { overdue, upcoming, onTime }, filteredInactivePeople: finalFilteredInactivePeople, recoveryStatusMap: tempRecoveryStatusMap };
  }, [people, inactivePeople, searchTerm, isMounted, attendance, sessions, actividadFilter, specialistFilter, spaceFilter, searchParams]);

   const handleExport = () => {
    const dataToExport = people.map(p => ({
        nombre: p.name,
        telefono: p.phone,
        arancel: tariffs.find(t => t.id === p.tariffId)?.name || 'N/A',
        estado_pago: getStudentPaymentStatus(p, new Date()).status,
        fecha_ingreso: p.joinDate ? format(p.joinDate, 'dd/MM/yyyy') : 'N/A',
        vencimiento_pago: p.lastPaymentDate ? format(p.lastPaymentDate, 'dd/MM/yyyy') : 'N/A',
    }));
    const headers = {
        nombre: "Nombre",
        telefono: "Teléfono",
        arancel: "Arancel",
        estado_pago: "Estado de Pago",
        fecha_ingreso: "Fecha de Ingreso",
        vencimiento_pago: "Vencimiento",
    }
    exportToCsv('personas.csv', dataToExport, headers);
  }

  const handleAddClick = () => {
    setIsPersonDialogOpen(true);
  }
  
  const renderGroup = (title: string, groupPeople: Person[], icon: React.ElementType) => {
      const Icon = icon;
      return (
        <div key={title}>
            <div className="flex items-center gap-2 mb-4 mt-8">
                <Icon className="h-5 w-5 text-muted-foreground"/>
                <h2 className="text-lg font-semibold">{title}: {groupPeople.length}</h2>
            </div>
          {groupPeople.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {groupPeople.map((person) => {
                const tariff = tariffs.find(t => t.id === person.tariffId);
                const recoveryStatus = recoveryStatusMap[person.id] || 'none';
                return (
                 <PersonCard
                    key={person.id}
                    person={person}
                    tariff={tariff}
                    recoveryStatus={recoveryStatus}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No hay personas en esta categoría.</p>
          )}
        </div>
      )
  }

  if (!isMounted) {
    return (
        <div className="space-y-8">
            <PageHeader title="Personas">
                <div className="flex items-center gap-2">
                    <Button variant="outline" disabled><FileDown className="mr-2 h-4 w-4" />Exportar</Button>
                    <Button disabled><PlusCircle className="mr-2 h-4 w-4" />Añadir Persona</Button>
                </div>
            </PageHeader>
            <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-4">
               <Skeleton className="h-10 w-full rounded-xl" />
            </Card>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
            </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Personas">
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}><FileDown className="mr-2 h-4 w-4" /></Button>
            <Button onClick={handleAddClick} disabled={isLimitReached}>
                <PlusCircle className="mr-2 h-4 w-4" />Añadir
            </Button>
        </div>
      </PageHeader>
      
      {isLimitReached && (
        <Alert variant="destructive" className="border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Límite de Alumnos Alcanzado</AlertTitle>
            <AlertDescription>
                Has alcanzado el límite de {institute?.studentLimit} alumnos para tu plan actual. Para añadir más, por favor contacta a soporte para ampliar tu plan.
            </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <TabsList className="grid w-full grid-cols-2 sm:w-auto">
                    <TabsTrigger value="active">Activos ({people.length})</TabsTrigger>
                    <TabsTrigger value="inactive">Inactivos ({inactivePeople.length})</TabsTrigger>
                </TabsList>
            </div>
            
            <StudentFilters 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                actividadFilter={actividadFilter}
                setActividadFilter={setActividadFilter}
                specialistFilter={specialistFilter}
                setSpecialistFilter={setSpecialistFilter}
                spaceFilter={spaceFilter}
                setSpaceFilter={setSpaceFilter}
            />

            <TabsContent value="active" className="mt-6">
                {loading ? (
                    <div className="space-y-8">
                       <Skeleton className="h-8 w-1/3 rounded-lg" />
                       <div className="space-y-3">
                         {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                       </div>
                    </div>
                ) : (
                    <>
                      {renderGroup('Atrasados', groupedPeople.overdue, UserX)}
                      {renderGroup('Próximos a Vencer', groupedPeople.upcoming, Clock)}
                      {renderGroup('Al Día', groupedPeople.onTime, CheckCircle)}
                    </>
                )}
            </TabsContent>
             <TabsContent value="inactive" className="mt-6">
                <div className="mt-8">
                    {loading ? (
                         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                         {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[200px] w-full rounded-2xl" />)}
                         </div>
                    ) : filteredInactivePeople.length > 0 ? (
                        <div className="space-y-3">
                             {filteredInactivePeople.map(person => (
                                <Card key={person.id} className="opacity-80 hover:opacity-100 transition-opacity">
                                    <CardContent className="p-3 flex items-center justify-between gap-4">
                                      <div>
                                        <p className="font-semibold">{person.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {person.inactiveDate ? `Desactivado/a el ${format(person.inactiveDate, 'dd/MM/yyyy')}` : 'Desactivado/a'}
                                        </p>
                                      </div>
                                      <Button size="sm" onClick={() => reactivatePerson(person.id, person.name)}>
                                          Reactivar
                                      </Button>
                                    </CardContent>
                                </Card>
                             ))}
                        </div>
                    ) : (
                         <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
                            <CardHeader>
                                <CardTitle>No hay personas inactivas</CardTitle>
                                <CardDescription>
                                    {searchTerm ? "No se encontraron personas inactivas con ese término de búsqueda." : "Aquí aparecerán las personas que desactives."}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    )}
                </div>
             </TabsContent>
        </Tabs>

      <PersonDialog 
        onOpenChange={setIsPersonDialogOpen} 
        open={isPersonDialogOpen}
        onPersonCreated={(person) => {
          if (person.tariffId) {
            setPersonForWelcome(person);
          }
        }}
        isLimitReached={isLimitReached}
      />
      <WelcomeDialog person={personForWelcome} onOpenChange={() => setPersonForWelcome(null)} />
    </div>
  );
}


export default function StudentsPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <StudentsPageContent />
    </Suspense>
  );
}

    