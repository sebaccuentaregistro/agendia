

'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileDown, Search, ArrowLeft, Bell, LayoutGrid, List } from 'lucide-react';
import type { Person, RecoveryCredit, PaymentStatusInfo } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { getStudentPaymentStatus, exportToCsv } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { PersonDialog } from '@/components/students/person-dialog';
import { WelcomeDialog } from '@/components/welcome-dialog';
import { PersonCard } from './person-card';
import { PaymentRemindersSheet } from '@/components/students/payment-reminders-sheet';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, parse } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


function StudentsPageContent() {
  const { people, inactivePeople, tariffs, isPersonOnVacation, attendance, loading, reactivatePerson } = useStudio();
  const { institute, isLimitReached, setPeopleCount } = useAuth();
  const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const statusFilterFromUrl = searchParams.get('filter') || 'all';
  const initialTab = statusFilterFromUrl === 'inactive' ? 'inactive' : 'active';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [view, setView] = useState('cards');

  const [personForWelcome, setPersonForWelcome] = useState<Person | null>(null);
  const [isRemindersSheetOpen, setIsRemindersSheetOpen] = useState(false);
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

  const { recoveryDetails, filteredPeople, filteredInactivePeople } = useMemo(() => {
    if (!isMounted) return { recoveryDetails: {}, filteredPeople: [], filteredInactivePeople: [] };
    
    const now = new Date();
    const term = searchTerm.toLowerCase();

    const allRecoveryCredits: Record<string, RecoveryCredit[]> = {};
    people.forEach(p => (allRecoveryCredits[p.id] = []));
    
    let usedRecoveryCounts: Record<string, number> = {};
    people.forEach(p => (usedRecoveryCounts[p.id] = 0));

    attendance.forEach(record => {
        (record.oneTimeAttendees || []).forEach(personId => {
            if (usedRecoveryCounts[personId] !== undefined) {
                usedRecoveryCounts[personId]++;
            }
        });
        
        (record.justifiedAbsenceIds || []).forEach(personId => {
            if (allRecoveryCredits[personId]) {
                 allRecoveryCredits[personId].push({
                    className: 'Clase', // Simplified for performance on this page
                    date: format(parse(record.date, 'yyyy-MM-dd', new Date()), 'dd/MM/yy'),
                });
            }
        });
    });
    
    Object.keys(allRecoveryCredits).forEach(personId => {
        const usedCount = usedRecoveryCounts[personId] || 0;
        if (usedCount > 0) {
            allRecoveryCredits[personId] = allRecoveryCredits[personId].slice(usedCount);
        }
    });

    let peopleToFilter = [...people];

    if (statusFilterFromUrl !== 'all' && statusFilterFromUrl !== 'inactive') {
        peopleToFilter = peopleToFilter.filter(p => {
            if (statusFilterFromUrl === 'overdue') return getStudentPaymentStatus(p, now).status === 'Atrasado';
            if (statusFilterFromUrl === 'on-vacation') return isPersonOnVacation(p, now);
            if (statusFilterFromUrl === 'pending-recovery') return (allRecoveryCredits[p.id]?.length || 0) > 0;
            return true;
        });
    }
    
    const finalFilteredPeople = peopleToFilter
        .filter(person => person.name.toLowerCase().includes(term) || person.phone.includes(term))
        .sort((a,b) => a.name.localeCompare(b.name));

    const finalFilteredInactivePeople = inactivePeople
        .filter(person => person.name.toLowerCase().includes(term) || person.phone.includes(term))
        .sort((a,b) => (a.inactiveDate && b.inactiveDate) ? b.inactiveDate.getTime() - a.inactiveDate.getTime() : a.name.localeCompare(b.name));
      
    return { recoveryDetails: allRecoveryCredits, filteredPeople: finalFilteredPeople, filteredInactivePeople: finalFilteredInactivePeople };
  }, [people, inactivePeople, searchTerm, statusFilterFromUrl, attendance, isMounted, isPersonOnVacation]);

   const handleExport = () => {
    const dataToExport = filteredPeople.map(p => ({
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
  
  const getStatusBadgeClass = (status: PaymentStatusInfo['status']) => {
    switch (status) {
        case 'Al día': return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700";
        case 'Atrasado': return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700";
        case 'Próximo a Vencer': return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700";
        case 'Pendiente de Pago': return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700";
        default: return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
    }
  };

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
      {statusFilterFromUrl === 'overdue' && (
        <div className="flex justify-start">
            <Button variant="outline" asChild>
                <Link href="/?view=advanced">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Gestión Avanzada
                </Link>
            </Button>
        </div>
      )}
      <PageHeader title="Personas">
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsRemindersSheetOpen(true)}><Bell className="mr-2 h-4 w-4" /></Button>
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
                 <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full bg-background border-border shadow-sm rounded-xl"
                        />
                    </div>
                    <Tabs value={view} onValueChange={setView} className="hidden sm:block">
                        <TabsList className="grid grid-cols-2">
                          <TabsTrigger value="cards"><LayoutGrid className="h-4 w-4"/></TabsTrigger>
                          <TabsTrigger value="list"><List className="h-4 w-4"/></TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>
            <TabsContent value="active" className="mt-6">
                {view === 'cards' && (
                    loading ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
                        </div>
                    ) : filteredPeople.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredPeople.map((person) => (
                                <PersonCard 
                                    key={person.id} 
                                    person={person}
                                    tariff={tariffs.find(t => t.id === person.tariffId)}
                                    recoveryCreditsCount={(recoveryDetails[person.id] || []).length}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
                            <CardHeader>
                                <CardTitle>{searchTerm || statusFilterFromUrl !== 'all' ? "No se encontraron personas" : "No Hay Personas"}</CardTitle>
                                <CardDescription>
                                    {searchTerm || statusFilterFromUrl !== 'all' ? "Prueba con otros filtros o limpia la búsqueda." : "Empieza a construir tu comunidad añadiendo tu primera persona."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!(searchTerm || statusFilterFromUrl !== 'all') && (
                                    <Button onClick={handleAddClick} disabled={isLimitReached}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Añadir Persona
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )
                )}
                {view === 'list' && (
                    <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Teléfono</TableHead>
                                    <TableHead>Arancel</TableHead>
                                    <TableHead>Estado de Pago</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {filteredPeople.length > 0 ? (
                               filteredPeople.map(person => {
                                   const tariff = tariffs.find(t => t.id === person.tariffId);
                                   const paymentStatus = getStudentPaymentStatus(person, new Date());
                                   return (
                                    <TableRow key={person.id} onClick={() => router.push(`/students/${person.id}`)} className="cursor-pointer">
                                        <TableCell className="font-medium">{person.name}</TableCell>
                                        <TableCell>{person.phone}</TableCell>
                                        <TableCell>{tariff?.name || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(getStatusBadgeClass(paymentStatus.status))}>
                                                {paymentStatus.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                   )
                               })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No se encontraron personas con los filtros actuales.
                                    </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                    </Card>
                )}
            </TabsContent>
             <TabsContent value="inactive" className="mt-6">
                <div className="mt-8">
                    {loading ? (
                         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                         {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[200px] w-full rounded-2xl" />)}
                         </div>
                    ) : filteredInactivePeople.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                             {filteredInactivePeople.map(person => (
                                <Card key={person.id} className="opacity-80 hover:opacity-100 transition-opacity">
                                    <CardHeader>
                                        <CardTitle>{person.name}</CardTitle>
                                        <CardDescription>
                                            {person.inactiveDate ? `Desactivado/a el ${format(person.inactiveDate, 'dd/MM/yyyy')}` : 'Desactivado/a'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{person.phone}</p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button className="w-full" onClick={() => reactivatePerson(person.id, person.name)}>
                                            Reactivar Persona
                                        </Button>
                                    </CardFooter>
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
      <PaymentRemindersSheet isOpen={isRemindersSheetOpen} onOpenChange={setIsRemindersSheetOpen} />

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
