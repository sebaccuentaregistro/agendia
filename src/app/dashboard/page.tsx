'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStudio } from '@/context/StudioContext';
import { getStudentPaymentStatus, cn } from '@/lib/utils';
import { Users, ClipboardList, Calendar, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AISuggestionCard } from '@/components/ai-suggestion-card';
import { format } from 'date-fns';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Dashboard() {
  const { people, specialists, yogaClasses } = useStudio();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const stats = useMemo(() => {
    if (!isMounted) {
      return {
        totalPeople: 0,
        totalSpecialists: 0,
        upcomingClasses: 0,
        overduePayments: 0,
      };
    }

    const now = new Date();
    const dayOfWeekMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const today = now;
    let upcomingClassesCount = 0;
    const currentTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
    
    for (let i = 0; i < 7; i++) {
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + i);
      const dayName = dayOfWeekMap[futureDate.getDay()];
      const classesForDay = yogaClasses.filter(c => c.dayOfWeek === dayName);
      if (i === 0) {
        upcomingClassesCount += classesForDay.filter(c => c.time > currentTime).length;
      } else {
        upcomingClassesCount += classesForDay.length;
      }
    }
    
    const overduePaymentsCount = people.filter(s => getStudentPaymentStatus(s, now) === 'Atrasado').length;

    return {
      totalPeople: people.length,
      totalSpecialists: specialists.length,
      upcomingClasses: upcomingClassesCount,
      overduePayments: overduePaymentsCount,
    };
  }, [isMounted, people, specialists, yogaClasses]);

  const recentPeople = useMemo(() => {
    if (!isMounted) return [];
    return [...people].sort((a, b) => b.joinDate.getTime() - a.joinDate.getTime()).slice(0, 5);
  }, [isMounted, people]);

  const statCards = [
    { label: "Total de Personas", value: stats.totalPeople, icon: Users, href: "/students" },
    { label: "Total de Especialistas", value: stats.totalSpecialists, icon: ClipboardList, href: "/instructors" },
    { label: "Próximas Clases", value: stats.upcomingClasses, icon: Calendar, href: "/schedule" },
    { label: "Pagos Atrasados", value: stats.overduePayments, icon: CreditCard, href: "/students?filter=overdue", isDestructive: stats.overduePayments > 0 },
  ];

  const formatWhatsAppLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

  return (
    <div className="space-y-8">
      <PageHeader title="Inicio" description="Vista general y rápida del estado del centro." />
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((item, index) => (
            <Link key={index} href={item.href} className="block">
              <Card className={cn(
                "transition-colors hover:bg-muted/50",
                { "bg-destructive/5 hover:bg-destructive/10 border-destructive/20": item.isDestructive }
              )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                  <item.icon className={cn("h-4 w-4 text-muted-foreground", { "text-destructive": item.isDestructive })} />
                </CardHeader>
                <CardContent>
                  {isMounted ? (
                    <div className={cn("text-2xl font-bold", { "text-destructive": item.isDestructive })}>{item.value}</div>
                  ) : (
                    <Skeleton className="h-8 w-1/3" />
                  )}
                </CardContent>
              </Card>
          </Link>
          ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Personas Recién Inscritas</h3>
            <Card>
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                      <TableHead className="hidden sm:table-cell">Fecha de Inscripción</TableHead>
                      <TableHead className="text-right">Contacto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isMounted ? (
                      recentPeople.length > 0 ? (
                        recentPeople.map((person) => (
                          <TableRow key={person.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={person.avatar} alt={person.name} data-ai-hint="person photo"/>
                                  <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {person.name}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">{person.phone}</TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">{format(person.joinDate, 'dd/MM/yyyy')}</TableCell>
                            <TableCell className="text-right">
                              <a href={formatWhatsAppLink(person.phone)} target="_blank" rel="noopener noreferrer">
                                <WhatsAppIcon className="text-green-600 hover:text-green-700 transition-colors" />
                                <span className="sr-only">Enviar WhatsApp a {person.name}</span>
                              </a>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            No hay personas inscritas recientemente.
                          </TableCell>
                        </TableRow>
                      )
                    ) : (
                      [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-5 w-5 rounded-full ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
            </Card>
        </div>
        <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Asistente IA</h3>
           {isMounted ? <AISuggestionCard /> : <Skeleton className="h-28 w-full" />}
        </div>
      </div>
    </div>
  );
}
