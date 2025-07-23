

'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Pencil, PlusCircle, Trash2, MoreVertical, Search, AlertTriangle, FileDown, UserX, CalendarClock, Plane, Calendar as CalendarIcon, X, History, Undo2, Heart, FileText, ClipboardList, User, MapPin, Check, Circle, HelpCircle, AlertCircle, LayoutGrid, List, ArrowLeft, Signal, Send, DollarSign, Bell } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionAlert, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle as AlertDialogTitleAlert } from '@/components/ui/alert-dialog';
import type { Person, Payment, NewPersonData, Session, Actividad, Specialist, Space, SessionAttendance, PaymentStatusInfo, RecoveryCredit, Level, Tariff } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getStudentPaymentStatus, exportToCsv, calculateNextPaymentDate } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { PersonDialog } from '@/components/students/person-dialog';
import { WelcomeDialog } from '@/components/welcome-dialog';
import { PaymentReceiptDialog, type ReceiptInfo } from '@/components/payment-receipt-dialog';
import { PersonCard } from './person-card';
import { EnrollmentsDialog } from '@/components/enrollments-dialog';
import { VacationDialog } from './vacation-dialog';
import { PaymentHistoryDialog } from './payment-history-dialog';
import { AttendanceHistoryDialog } from './attendance-history-dialog';
import { JustifiedAbsenceDialog } from './justified-absence-dialog';
import { StudentFilters } from '@/components/students/student-filters';
import { PaymentRemindersSheet } from '@/components/students/payment-reminders-sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


function StudentsPageContent() {
  const { people, inactivePeople, tariffs, isPersonOnVacation, attendance, payments, loading, sessions, actividades, specialists, spaces, levels, triggerWaitlistCheck, reactivatePerson, recordPayment } = useStudio();
  const { institute } = useAuth();
  const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | undefined>(undefined);
  const [personForEnrollment, setPersonForEnrollment] = useState<Person | null>(null);
  const [personForAbsence, setPersonForAbsence] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const statusFilterFromUrl = searchParams.get('filter') || 'all';
  const initialTab = statusFilterFromUrl === 'inactive' ? 'inactive' : 'active';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [actividadFilter, setActividadFilter] = useState('all');
  const [specialistFilter, setSpecialistFilter] = useState('all');
  const [spaceFilter, setSpaceFilter] = useState('all');

  const [personForVacation, setPersonForVacation] = useState<Person | null>(null);
  const [personForHistory, setPersonForHistory] = useState<Person | null>(null);
  const [personForAttendanceHistory, setPersonForAttendanceHistory] = useState<Person | null>(null);
  const [personForPayment, setPersonForPayment] = useState<Person | null>(null);
  const [personForWelcome, setPersonForWelcome] = useState<Person | null>(null);
  const [receiptInfo, setReceiptInfo] = useState<ReceiptInfo | null>(null);
  const [isPaymentAlertOpen, setIsPaymentAlertOpen] = useState(false);
  const [isRemindersSheetOpen, setIsRemindersSheetOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
        setSearchTerm(searchQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    // If URL filter changes, switch tab
    if(searchParams.get('filter') === 'inactive') {
        setActiveTab('inactive');
    }
  }, [searchParams]);

  const { recoveryDetails, filteredPeople, filteredInactivePeople, isLimitReached } = useMemo(() => {
    if (!isMounted) return { recoveryDetails: {}, filteredPeople: [], filteredInactivePeople: [], isLimitReached: false };
    
    const limit = institute?.studentLimit;
    const isLimitReached = (limit !== null && limit !== undefined) ? people.length >= limit : false;

    const now = new Date();
    const term = searchTerm.toLowerCase();

    const allRecoveryCredits: Record<string, RecoveryCredit[]> = {};
    people.forEach(p => (allRecoveryCredits[p.id] = []));
    
    let usedRecoveryCounts: Record<string, number> = {};
    people.forEach(p => (usedRecoveryCounts[p.id] = 0));

    attendance.forEach(record => {
        record.oneTimeAttendees?.forEach(personId => {
            usedRecoveryCounts[personId] = (usedRecoveryCounts[personId] || 0) + 1;
        });
        
        record.justifiedAbsenceIds?.forEach(personId => {
            if (allRecoveryCredits[personId]) {
                const session = sessions.find(s => s.id === record.sessionId);
                const actividad = session ? actividades.find(a => a.id === session.actividadId) : null;
                allRecoveryCredits[personId].push({
                    className: actividad?.name || 'Clase',
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

    if (actividadFilter !== 'all' || specialistFilter !== 'all' || spaceFilter !== 'all') {
        const filteredSessions = sessions.filter(s => 
            (actividadFilter === 'all' || s.actividadId === actividadFilter) &&
            (specialistFilter === 'all' || s.instructorId === specialistFilter) &&
            (spaceFilter === 'all' || s.spaceId === spaceFilter)
        );
        const peopleIdsInFilteredSessions = new Set<string>();
        filteredSessions.forEach(s => {
            s.personIds.forEach(pid => peopleIdsInFilteredSessions.add(pid));
        });
        peopleToFilter = peopleToFilter.filter(p => peopleIdsInFilteredSessions.has(p.id));
    }
    
    const finalFilteredPeople = peopleToFilter
        .filter(person => person.name.toLowerCase().includes(term) || person.phone.includes(term))
        .sort((a,b) => a.name.localeCompare(b.name));

    const finalFilteredInactivePeople = inactivePeople
        .filter(person => person.name.toLowerCase().includes(term) || person.phone.includes(term))
        .sort((a,b) => (a.inactiveDate && b.inactiveDate) ? b.inactiveDate.getTime() - a.inactiveDate.getTime() : a.name.localeCompare(b.name));
      
    return { recoveryDetails: allRecoveryCredits, filteredPeople: finalFilteredPeople, filteredInactivePeople: finalFilteredInactivePeople, isLimitReached };
  }, [people, inactivePeople, searchTerm, statusFilterFromUrl, actividadFilter, specialistFilter, spaceFilter, attendance, sessions, actividades, isMounted, isPersonOnVacation, institute]);

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
    setSelectedPerson(undefined);
    setIsPersonDialogOpen(true);
  }

  const handleEditClick = (person: Person) => {
    setSelectedPerson(person);
    setIsPersonDialogOpen(true);
  }
  
  const handleEnrollmentClick = (person: Person) => {
    setPersonForEnrollment(person);
  };
  
  const handleJustifyAbsenceClick = (person: Person) => {
    setPersonForAbsence(person);
  };

  const handleSuccessfulPayment = (person: Person) => {
    const tariff = tariffs.find(t => t.id === person.tariffId);
    if (!tariff || !institute) return;

    // Calculate the new due date to show in the receipt
    const newDueDate = calculateNextPaymentDate(
      person.lastPaymentDate || new Date(), 
      person.joinDate,
      tariff
    );

    setReceiptInfo({
      personName: person.name,
      personPhone: person.phone,
      tariffName: tariff.name,
      tariffPrice: tariff.price,
      nextDueDate: newDueDate,
      instituteName: institute.name,
    });
  };

  const handleRecordPaymentClick = async (person: Person) => {
    const status = getStudentPaymentStatus(person, new Date()).status;
    if (status === 'Al día' && (person.outstandingPayments || 0) === 0) {
        setPersonForPayment(person);
        setIsPaymentAlertOpen(true);
    } else {
        await recordPayment(person.id);
        handleSuccessfulPayment(person);
    }
  };

  const confirmRecordPayment = async () => {
    if (personForPayment) {
        await recordPayment(personForPayment.id);
        handleSuccessfulPayment(personForPayment);
    }
    setIsPaymentAlertOpen(false);
    setPersonForPayment(null);
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
                <div className="flex flex-col sm:flex-row gap-4">
                    <Skeleton className="h-10 flex-grow rounded-xl" />
                    <div className="flex gap-2 flex-col sm:flex-row">
                      <Skeleton className="h-10 w-full sm:w-32 rounded-xl" />
                      <Skeleton className="h-10 w-full sm:w-32 rounded-xl" />
                      <Skeleton className="h-10 w-full sm:w-32 rounded-xl" />
                    </div>
                </div>
            </Card>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[218px] w-full rounded-2xl" />)}
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
            <Button variant="outline" onClick={() => setIsRemindersSheetOpen(true)}><Bell className="mr-2 h-4 w-4" />Recordatorios</Button>
            <Button variant="outline" onClick={handleExport}><FileDown className="mr-2 h-4 w-4" />Exportar</Button>
            <Button onClick={handleAddClick} disabled={isLimitReached}>
                <PlusCircle className="mr-2 h-4 w-4" />Añadir Persona
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
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">Activos ({people.length})</TabsTrigger>
                <TabsTrigger value="inactive">Inactivos ({inactivePeople.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-6">
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
                <div className="mt-8">
                    {loading ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[350px] w-full rounded-2xl" />)}
                        </div>
                    ) : filteredPeople.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                            {filteredPeople.map((person) => (
                                <PersonCard 
                                    key={person.id} 
                                    person={person}
                                    sessions={sessions}
                                    actividades={actividades}
                                    specialists={specialists}
                                    spaces={spaces}
                                    levels={levels}
                                    tariffs={tariffs}
                                    allPayments={payments}
                                    recoveryCredits={recoveryDetails[person.id] || []}
                                    onDeactivated={() => {}}
                                    onManageVacations={setPersonForVacation}
                                    onEdit={handleEditClick}
                                    onViewHistory={setPersonForHistory}
                                    onViewAttendanceHistory={setPersonForAttendanceHistory}
                                    onManageEnrollments={handleEnrollmentClick}
                                    onJustifyAbsence={handleJustifyAbsenceClick}
                                    onRecordPayment={handleRecordPaymentClick}
                                />
                            ))}
                        </div>
                        ) : (
                        <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
                            <CardHeader>
                            <CardTitle>{searchTerm || actividadFilter !== 'all' || statusFilterFromUrl !== 'all' || specialistFilter !== 'all' || spaceFilter !== 'all' ? "No se encontraron personas" : "No Hay Personas"}</CardTitle>
                            <CardDescription>
                                {searchTerm || actividadFilter !== 'all' || statusFilterFromUrl !== 'all' || specialistFilter !== 'all' || spaceFilter !== 'all' ? "Prueba con otros filtros o limpia la búsqueda." : "Empieza a construir tu comunidad añadiendo tu primera persona."}
                            </CardDescription>
                            </CardHeader>
                            <CardContent>
                            {!(searchTerm || actividadFilter !== 'all' || statusFilterFromUrl !== 'all' || specialistFilter !== 'all' || spaceFilter !== 'all') && (
                                <Button onClick={handleAddClick} disabled={isLimitReached}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Añadir Persona
                                </Button>
                            )}
                            </CardContent>
                        </Card>
                        )}
                </div>
            </TabsContent>
             <TabsContent value="inactive" className="mt-6">
                <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar inactivos por nombre o teléfono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl"
                        />
                    </div>
                </Card>
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
        person={selectedPerson} 
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
      <VacationDialog person={personForVacation} onClose={() => setPersonForVacation(null)} />
      <EnrollmentsDialog person={personForEnrollment} onClose={() => setPersonForEnrollment(null)} />
      <JustifiedAbsenceDialog person={personForAbsence} onClose={() => setPersonForAbsence(null)} />
      <PaymentHistoryDialog 
        person={personForHistory} 
        payments={payments}
        tariffs={tariffs}
        onClose={() => setPersonForHistory(null)}
      />
      <AttendanceHistoryDialog
        person={personForAttendanceHistory}
        sessions={sessions}
        actividades={actividades}
        attendance={attendance}
        onClose={() => setPersonForAttendanceHistory(null)}
      />
       <PaymentReceiptDialog
        receiptInfo={receiptInfo}
        onOpenChange={() => setReceiptInfo(null)}
      />

       <AlertDialog open={isPaymentAlertOpen} onOpenChange={setIsPaymentAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitleAlert>¿Registrar Pago Adicional?</AlertDialogTitleAlert>
                  <AlertDialogDescriptionAlert>
                      Este alumno ya tiene su cuota al día. Si continúas, se registrará un pago por adelantado y su próxima fecha de vencimiento se extenderá otro mes. ¿Estás seguro?
                  </AlertDialogDescriptionAlert>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setIsPaymentAlertOpen(false)}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmRecordPayment}>
                      Sí, registrar pago
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      
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
