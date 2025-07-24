

'use client';

import React, { useState, useMemo, useEffect, Suspense, Fragment } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileDown, Search, Bell, UserX, AlertCircle, Clock, CheckCircle, ChevronDown } from 'lucide-react';
import type { Person, PaymentReminderInfo } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getStudentPaymentStatus, exportToCsv } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { PersonDialog } from '@/components/students/person-dialog';
import { WelcomeDialog } from '@/components/welcome-dialog';
import { PaymentReminderDialog } from '@/components/payment-reminder-dialog';
import { PaymentReceiptDialog, type ReceiptInfo } from '@/components/payment-receipt-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { Separator } from '@/components/ui/separator';

function StudentsPageContent() {
  const { people, inactivePeople, tariffs, attendance, loading, reactivatePerson, recordPayment } = useStudio();
  const { institute, isLimitReached, setPeopleCount } = useAuth();
  const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const statusFilterFromUrl = searchParams.get('filter') || 'all';
  const initialTab = statusFilterFromUrl === 'inactive' ? 'inactive' : 'active';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [personForWelcome, setPersonForWelcome] = useState<Person | null>(null);
  const [personForReminder, setPersonForReminder] = useState<PaymentReminderInfo | null>(null);
  const [personForPayment, setPersonForPayment] = useState<Person | null>(null);
  const [isPaymentAlertOpen, setIsPaymentAlertOpen] = useState(false);
  const [receiptInfo, setReceiptInfo] = useState<ReceiptInfo | null>(null);
  
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

  const { groupedPeople, filteredInactivePeople } = useMemo(() => {
    if (!isMounted) return { groupedPeople: { overdue: [], upcoming: [], onTime: [] }, filteredInactivePeople: [] };
    
    const now = new Date();
    const term = searchTerm.toLowerCase();

    const overdue: Person[] = [];
    const upcoming: Person[] = [];
    const onTime: Person[] = [];

    people
      .filter(person => person.name.toLowerCase().includes(term) || person.phone.includes(term))
      .forEach(person => {
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
      
    return { groupedPeople: { overdue, upcoming, onTime }, filteredInactivePeople: finalFilteredInactivePeople };
  }, [people, inactivePeople, searchTerm, isMounted]);

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
  
   const getStatusInfo = (person: Person, now: Date) => {
    const statusInfo = getStudentPaymentStatus(person, now);
    const tariff = tariffs.find(t => t.id === person.tariffId);
    const totalDebt = (tariff?.price || 0) * (person.outstandingPayments || 0);
    let text = statusInfo.status;
    let color: "destructive" | "warning" | "success" = "success";
    
    if (statusInfo.status === 'Atrasado') {
        text = `Atrasado (${statusInfo.daysOverdue}d)`;
        color = 'destructive';
    } else if (statusInfo.status === 'Próximo a Vencer') {
        text = statusInfo.daysUntilDue === 0 ? 'Vence Hoy' : `Vence en ${statusInfo.daysUntilDue}d`;
        color = 'warning';
    }
    
    return { text, color, price: tariff?.price, debt: totalDebt, status: statusInfo.status };
  };
  
  const formatPrice = (price: number) => {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
      }).format(price);
  };
  
  const handleRecordPaymentClick = (person: Person) => {
    const status = getStudentPaymentStatus(person, new Date()).status;
    if (status === 'Al día' && (person.outstandingPayments || 0) === 0) {
        setPersonForPayment(person);
        setIsPaymentAlertOpen(true);
    } else {
        recordPayment(person.id).then(() => handleSuccessfulPayment(person));
    }
  };

  const confirmRecordPayment = () => {
    if (personForPayment) {
        recordPayment(personForPayment.id).then(() => handleSuccessfulPayment(personForPayment));
    }
    setIsPaymentAlertOpen(false);
    setPersonForPayment(null);
  };

  const handleSuccessfulPayment = (person: Person) => {
    if (!person || !institute) return;
    const tariff = tariffs.find(t => t.id === person.tariffId);
    if (!tariff) return;
    
    const newDueDate = person.lastPaymentDate ? calculateNextPaymentDate(person.lastPaymentDate, person.joinDate, tariff) : null;
    setReceiptInfo({
      personName: person.name, personPhone: person.phone, tariffName: tariff.name,
      tariffPrice: tariff.price, nextDueDate: newDueDate, instituteName: institute.name,
    });
  };
  
  const handleRemindClick = (person: Person) => {
    const statusInfo = getStudentPaymentStatus(person, new Date());
    if (statusInfo.status === 'Próximo a Vencer' && person.lastPaymentDate) {
        setPersonForReminder({
            person: person,
            dueDate: person.lastPaymentDate,
            daysUntilDue: statusInfo.daysUntilDue || 0
        });
    }
  };

  const renderGroup = (title: string, groupPeople: Person[], icon: React.ElementType) => {
      const Icon = icon;
      return (
        <div key={title}>
            <div className="flex items-center gap-2 mb-4 mt-8">
                <Icon className="h-5 w-5 text-muted-foreground"/>
                <h2 className="text-lg font-semibold">{title} ({groupPeople.length})</h2>
            </div>
          {groupPeople.length > 0 ? (
            <div className="space-y-3">
              {groupPeople.map((person) => {
                const { status, color, price, debt } = getStatusInfo(person, new Date());
                return (
                 <Card key={person.id} className="hover:bg-muted/50 transition-colors">
                    <Link href={`/students/${person.id}`}>
                      <div className="p-3 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{person.name}</p>
                          <p className="text-sm text-muted-foreground">{person.phone}</p>
                        </div>
                        <div className="text-right">
                           <Badge variant="outline" className={cn({
                              'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700': color === 'destructive',
                              'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700': color === 'warning',
                              'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700': color === 'success'
                           })}>{status}</Badge>
                           <p className="font-bold text-lg mt-1">{formatPrice(status === 'Atrasado' ? debt : price || 0)}</p>
                        </div>
                      </div>
                    </Link>
                </Card>
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
                 <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full bg-background border-border shadow-sm rounded-xl"
                    />
                </div>
            </div>
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
      <PaymentReminderDialog reminderInfo={personForReminder} onOpenChange={() => setPersonForReminder(null)} />
      <PaymentReceiptDialog receiptInfo={receiptInfo} onOpenChange={() => setReceiptInfo(null)} />

       <AlertDialog open={isPaymentAlertOpen} onOpenChange={setIsPaymentAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>¿Registrar Pago Adicional?</AlertDialogTitle><AlertDialogDescription>Este alumno ya tiene su cuota al día. Si continúas, se registrará un pago por adelantado y su próxima fecha de vencimiento se extenderá. ¿Estás seguro?</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel onClick={() => { setIsPaymentAlertOpen(false); setPersonForPayment(null); }}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmRecordPayment}>Sí, registrar pago</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

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
