
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionAlert, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle as AlertDialogTitleAlert } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { useStudio } from '@/context/StudioContext';
import { getStudentPaymentStatus } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

import { Pencil, MoreVertical, AlertTriangle, FileDown, UserX, CalendarClock, Plane, Calendar as CalendarIcon, X, History, Undo2, Heart, FileText, ClipboardList, User, MapPin, Check, Circle, HelpCircle, AlertCircle, LayoutGrid, List, ArrowLeft, Signal, Send, DollarSign, Trash2 } from 'lucide-react';
import type { Person, Payment, NewPersonData, Session, Actividad, Specialist, Space, SessionAttendance, PaymentStatusInfo, RecoveryCredit, Level, Tariff } from '@/types';

interface PersonCardProps {
    person: Person;
    sessions: Session[];
    actividades: Actividad[];
    specialists: Specialist[];
    spaces: Space[];
    levels: Level[];
    tariffs: Tariff[];
    recoveryCredits: RecoveryCredit[];
    onManageVacations: (person: Person) => void;
    onEdit: (person: Person) => void;
    onViewHistory: (person: Person) => void;
    onViewAttendanceHistory: (person: Person) => void;
    onManageEnrollments: (person: Person) => void;
    onJustifyAbsence: (person: Person) => void;
    onRecordPayment: (person: Person) => void;
}

export function PersonCard({ person, sessions, actividades, specialists, spaces, levels, tariffs, recoveryCredits, onManageVacations, onEdit, onViewHistory, onViewAttendanceHistory, onManageEnrollments, onJustifyAbsence, onRecordPayment }: PersonCardProps) {
    const { deletePerson, revertLastPayment } = useStudio();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);
    
    const tariff = tariffs.find(t => t.id === person.tariffId);
    const paymentStatusInfo = getStudentPaymentStatus(person, new Date());
    const level = levels.find(l => l.id === person.levelId);
    
    const getStatusBadgeClass = () => {
        switch (paymentStatusInfo.status) {
            case 'Al día': return "bg-green-600 hover:bg-green-700 border-green-700 text-white";
            case 'Atrasado': return "bg-red-600 hover:bg-red-700 border-red-700 text-white";
            case 'Pendiente de Pago': return "bg-blue-600 hover:bg-blue-700 border-blue-700 text-white";
            default: return "bg-gray-500 hover:bg-gray-600 border-gray-600 text-white";
        }
    };
    
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
      }).format(price);
    };

    const handleRevertPayment = () => {
        revertLastPayment(person.id);
        setIsRevertDialogOpen(false);
    }

    const formatWhatsAppLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

    const personSessions = useMemo(() => {
        const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        return sessions
            .filter(s => s.personIds.includes(person.id))
            .map(s => {
                const actividad = actividades.find(a => a.id === s.actividadId);
                const specialist = specialists.find(sp => sp.id === s.instructorId);
                const space = spaces.find(sp => sp.id === s.spaceId);
                const level = levels.find(l => l.id === s.levelId);
                return { 
                    ...s, 
                    actividadName: actividad?.name || 'Clase',
                    specialistName: specialist?.name || 'N/A',
                    spaceName: space?.name || 'N/A',
                    levelName: level?.name
                };
            })
            .sort((a, b) => {
                const dayComparison = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
                if (dayComparison !== 0) return dayComparison;
                return a.time.localeCompare(b.time);
            });
    }, [sessions, actividades, specialists, spaces, levels, person.id]);
    
    const renderPaymentStatus = (statusInfo: PaymentStatusInfo) => {
      let statusText = statusInfo.status === 'Pendiente de Pago' ? 'Pago Pendiente' : statusInfo.status;
      if (statusInfo.status === 'Atrasado' && statusInfo.daysOverdue !== undefined) {
        statusText += ` (hace ${statusInfo.daysOverdue} ${statusInfo.daysOverdue === 1 ? 'día' : 'días'})`;
      }
      return statusText;
    };

    const totalDebt = (tariff?.price || 0) * (person.outstandingPayments || 0);
    
    return (
        <>
            <Card className="flex flex-col rounded-2xl shadow-lg border-border/20 bg-card overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <CardHeader className="p-4 text-white bg-gradient-to-br from-primary to-fuchsia-600">
                    <div className="flex items-start justify-between">
                         <div className="flex-1">
                            <div className="flex items-center gap-1 flex-wrap">
                                <CardTitle className="text-xl font-bold">{person.name}</CardTitle>
                                {person.healthInfo && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20">
                                                <Heart className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-60">
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">Info de Salud</h4>
                                                <p className="text-sm text-muted-foreground">{person.healthInfo}</p>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}
                                {person.notes && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                             <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20">
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-60">
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">Notas</h4>
                                                <p className="text-sm text-muted-foreground">{person.notes}</p>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}
                                {person.vacationPeriods && person.vacationPeriods.length > 0 && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20">
                                                <Plane className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80">
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="font-medium leading-none">Períodos de Vacaciones</h4>
                                                    <p className="text-sm text-muted-foreground">La persona no aparecerá en la asistencia durante estas fechas.</p>
                                                </div>
                                                <div className="space-y-2">
                                                    {person.vacationPeriods.map(vac => (
                                                        <div key={vac.id} className="text-sm">
                                                            <span className="font-semibold">{vac.startDate ? format(vac.startDate, 'dd/MM/yy') : 'N/A'}</span> al <span className="font-semibold">{vac.endDate ? format(vac.endDate, 'dd/MM/yy') : 'N/A'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <Button variant="outline" size="sm" className="w-full" onClick={() => onManageVacations(person)}>
                                                    Gestionar Vacaciones
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}
                                {recoveryCredits.length > 0 && (
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20">
                                                <CalendarClock className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80">
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">Recuperos Pendientes ({recoveryCredits.length})</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Clases con ausencia justificada para recuperar:
                                                </p>
                                                <ScrollArea className="h-40">
                                                    <ul className="space-y-2 pr-4">
                                                        {recoveryCredits.map((credit, index) => (
                                                          <li key={index} className="text-xs p-2 rounded-md bg-muted/50">
                                                            <p className="font-bold text-foreground">{credit.className}</p>
                                                            <p className="text-muted-foreground">{credit.date}</p>
                                                          </li>
                                                        ))}
                                                    </ul>
                                                </ScrollArea>
                                                {recoveryCredits.length > 0 && (
                                                    <Button asChild className="w-full">
                                                        <Link href={`/schedule?recoveryMode=true&personId=${person.id}`}>
                                                            <CalendarClock className="mr-2 h-4 w-4" />
                                                            Recuperar Sesión
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}
                                 {level && (
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20">
                                                <Signal className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto">
                                            <div className="space-y-2 text-center">
                                                <h4 className="font-medium leading-none">Nivel Asignado</h4>
                                                <Badge variant="outline">{level.name}</Badge>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                 )}
                            </div>
                            <Badge variant="secondary" className={cn("font-semibold mt-1.5 border-0 text-xs", getStatusBadgeClass())}>
                               {renderPaymentStatus(paymentStatusInfo)}
                            </Badge>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 -mr-2 flex-shrink-0"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => onEdit(person)}><Pencil className="mr-2 h-4 w-4" />Editar Persona</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onJustifyAbsence(person)}><UserX className="mr-2 h-4 w-4" />Notificar Ausencia</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onManageVacations(person)}><Plane className="mr-2 h-4 w-4" />Gestionar Vacaciones</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => onViewHistory(person)}><History className="mr-2 h-4 w-4" />Historial de Pagos</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onViewAttendanceHistory(person)}><CalendarIcon className="mr-2 h-4 w-4" />Historial de Asistencia</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setIsRevertDialogOpen(true)}><Undo2 className="mr-2 h-4 w-4" />Volver atrás último pago</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                     
                    <div className="mt-2">
                        <div className="flex justify-between items-baseline">
                            <p className="text-sm font-semibold opacity-90">{tariff?.name}</p>
                            {paymentStatusInfo.status === 'Atrasado' && totalDebt > 0 ? (
                                <div className="text-right">
                                    <p className="text-xs opacity-80">Deuda Total</p>
                                    <p className="text-lg font-bold">{formatPrice(totalDebt)}</p>
                                </div>
                            ) : (
                                tariff && <p className="text-lg font-bold">{formatPrice(tariff.price)}</p>
                            )}
                        </div>
                        {person.lastPaymentDate ? (
                            <p className="text-xs opacity-80 mt-1">Vence: {format(person.lastPaymentDate, 'dd/MM/yyyy')}</p>
                        ) : (
                            <p className="text-xs opacity-80 mt-1">Registra el primer pago para iniciar el ciclo.</p>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-4 flex-grow space-y-4">
                     <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{person.phone}</span>
                            <a href={formatWhatsAppLink(person.phone)} target="_blank" rel="noopener noreferrer">
                                <WhatsAppIcon className="text-green-600 hover:text-green-700 transition-colors" />
                                <span className="sr-only">Enviar WhatsApp a {person.name}</span>
                            </a>
                        </div>
                     </div>
                     <div className="space-y-3 pt-4 border-t border-border/50">
                        <h4 className="font-semibold text-sm text-foreground">Horarios</h4>
                        <ScrollArea className="h-28">
                           <div className="space-y-2 pr-4">
                            {personSessions.length > 0 ? (
                                personSessions.map(session => (
                                    <div key={session.id} className="text-xs p-2 rounded-md bg-muted/50">
                                        <div className="flex justify-between items-start">
                                          <p className="font-bold text-foreground">{session.actividadName}</p>
                                          {session.levelName && <Badge variant="outline" className="text-[9px] px-1 py-0">{session.levelName}</Badge>}
                                        </div>
                                        <p className="text-muted-foreground">{session.dayOfWeek}, {session.time}</p>
                                        <div className="flex items-center gap-4 mt-1 text-muted-foreground">
                                          <span className="flex items-center gap-1.5"><User className="h-3 w-3" />{session.specialistName}</span>
                                          <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{session.spaceName}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-4">Sin horarios fijos.</p>
                            )}
                            </div>
                        </ScrollArea>
                    </div>
                </CardContent>
                
                <CardFooter className="grid grid-cols-2 gap-2 p-2 border-t mt-auto">
                    <Button
                        onClick={() => onManageEnrollments(person)}
                        variant="outline"
                        className="w-full font-semibold"
                    >
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Horarios
                    </Button>
                    <Button onClick={() => onRecordPayment(person)} className="w-full font-bold">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Registrar Pago
                    </Button>
                </CardFooter>
            </Card>
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitleAlert>¿Estás seguro?</AlertDialogTitleAlert><AlertDialogDescriptionAlert>Esta acción no se puede deshacer. Se eliminará a la persona y todas sus inscripciones.</AlertDialogDescriptionAlert></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deletePerson(person.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

             <AlertDialog open={isRevertDialogOpen} onOpenChange={setIsRevertDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitleAlert>¿Revertir último pago?</AlertDialogTitleAlert><AlertDialogDescriptionAlert>Esta acción eliminará el pago más reciente del historial y sumará 1 al contador de pagos pendientes. Esta acción no se puede deshacer.</AlertDialogDescriptionAlert></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleRevertPayment} className="bg-destructive hover:bg-destructive/90">Sí, revertir pago</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
