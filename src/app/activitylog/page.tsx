
'use client';

import { Suspense, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { useStudio } from '@/context/StudioContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, KeyRound, ShieldAlert } from 'lucide-react';
import { PinDialog } from '@/components/pin-dialog';
import { useState } from 'react';


function ActivityLogContent() {
    const { audit_logs, loading: studioLoading } = useStudio();
    const { activeOperator, isPinVerified, loading: authLoading, setPinVerified } = useAuth();
    const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);

    useEffect(() => {
        if (!authLoading && !isPinVerified) {
            setIsPinDialogOpen(true);
        }
    }, [isPinVerified, authLoading]);

    const sortedLogs = useMemo(() => {
        return [...audit_logs].sort((a, b) => {
            const dateA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
            const dateB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
            return dateB - dateA;
        });
    }, [audit_logs]);

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ').toLowerCase();
    };
    
    const getActionBadgeVariant = (action: string): 'default' | 'destructive' | 'secondary' | 'outline' => {
        if (action.includes('ELIMINAR')) return 'destructive';
        if (action.includes('PAGO')) return 'default';
        return 'secondary';
    }

    if (studioLoading || authLoading) {
        return (
             <div className="space-y-8">
                <PageHeader title="Registro de Actividad" />
                <Card>
                    <CardHeader><Skeleton className="h-8 w-1/3 rounded-lg" /></CardHeader>
                    <CardContent><Skeleton className="h-64 w-full rounded-2xl" /></CardContent>
                </Card>
            </div>
        )
    }
    
    if (!isPinVerified) {
        return (
            <>
                <PinDialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen} onPinVerified={() => setPinVerified(true)} />
                <div className="flex justify-start">
                    <Button variant="outline" asChild>
                        <Link href="/?view=advanced">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver a Gestión Avanzada
                        </Link>
                    </Button>
                </div>
                <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
                    <CardHeader>
                        <CardTitle className="text-slate-800 dark:text-slate-100">Acceso Restringido</CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">
                            Necesitas verificar tu PIN de propietario para gestionar esta sección.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => setIsPinDialogOpen(true)}>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Verificar PIN
                        </Button>
                    </CardContent>
                </Card>
            </>
        );
    }


    // After loading, check if the active operator is an admin.
    if (activeOperator?.role !== 'admin') {
        return (
            <div className="space-y-8">
                <div className="flex justify-start">
                    <Button variant="outline" asChild>
                        <Link href="/?view=advanced">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver a Gestión Avanzada
                        </Link>
                    </Button>
                </div>
                <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
                    <CardHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
                           <ShieldAlert className="h-6 w-6 text-destructive" />
                        </div>
                        <CardTitle className="text-slate-800 dark:text-slate-100">Acceso Restringido</CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                           Solo los operadores con el rol de "Administrador" pueden ver el registro de actividad del sistema.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <div className="flex justify-start">
                <Button variant="outline" asChild>
                    <Link href="/?view=advanced">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Gestión Avanzada
                    </Link>
                </Button>
            </div>
            <PageHeader title="Registro de Actividad" description="Historial de acciones importantes realizadas en el sistema." />
            <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha y Hora</TableHead>
                                <TableHead>Operador</TableHead>
                                <TableHead>Acción</TableHead>
                                <TableHead>Detalles</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedLogs.length > 0 ? (
                                sortedLogs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">
                                            {log.timestamp ? format(log.timestamp, 'dd/MM/yy, HH:mm:ss', { locale: es }) : 'N/A'}
                                        </TableCell>
                                        <TableCell>{log.operatorName}</TableCell>
                                        <TableCell>
                                            <Badge variant={getActionBadgeVariant(log.action)} className="capitalize">
                                                {formatAction(log.action)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-semibold">{log.entityName}</p>
                                            {log.details?.amount && (
                                                <p className="text-xs text-muted-foreground">Monto: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(log.details.amount)}</p>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No hay registros de actividad todavía.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

export default function ActivityLogPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ActivityLogContent />
        </Suspense>
    )
}
