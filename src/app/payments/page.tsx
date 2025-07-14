
'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { FileDown, Calendar as CalendarIcon, Wallet, TrendingUp, ArrowDownUp, Banknote, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useStudio } from '@/context/StudioContext';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, exportToCsv } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function PaymentsPageContent() {
    const { payments, people, tariffs, loading } = useStudio();
    const { institute, loading: authLoading } = useAuth();
    const router = useRouter();

    const [filters, setFilters] = useState<{ personId: string; dateRange: { from?: Date; to?: Date } }>({
        personId: 'all',
        dateRange: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
    });
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (!authLoading && !institute?.ownerPin) {
             router.push('/');
        }
    }, [institute, authLoading, router]);

    const financialData = useMemo(() => {
        if (!isMounted) return {
            currentMonthIncome: 0,
            previousMonthIncome: 0,
            incomeChange: 0,
            potentialIncome: 0,
            sortedPayments: [],
        };
        
        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);
        const endOfCurrentMonth = endOfMonth(now);
        const startOfPreviousMonth = startOfMonth(subMonths(now, 1));
        const endOfPreviousMonth = endOfMonth(subMonths(now, 1));

        const currentMonthIncome = payments
            .filter(p => p.date && isWithinInterval(p.date, { start: startOfCurrentMonth, end: endOfCurrentMonth }))
            .reduce((acc, p) => acc + (tariffs.find(t => t.id === p.tariffId)?.price || 0), 0);
            
        const previousMonthIncome = payments
            .filter(p => p.date && isWithinInterval(p.date, { start: startOfPreviousMonth, end: endOfPreviousMonth }))
            .reduce((acc, p) => acc + (tariffs.find(t => t.id === p.tariffId)?.price || 0), 0);

        let incomeChange = 0;
        if (previousMonthIncome > 0) {
            incomeChange = ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100;
        } else if (currentMonthIncome > 0) {
            incomeChange = 100;
        }

        const potentialIncome = people.reduce((acc, person) => {
            const tariff = tariffs.find(t => t.id === person.tariffId);
            return acc + (tariff?.price || 0);
        }, 0);
        
        const sortedPayments = [...payments].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

        return { currentMonthIncome, previousMonthIncome, incomeChange, potentialIncome, sortedPayments };
    }, [payments, tariffs, people, isMounted]);

    const filteredPayments = useMemo(() => {
        return financialData.sortedPayments.filter(payment => {
            const personMatch = filters.personId === 'all' || payment.personId === filters.personId;
            const dateMatch = payment.date && filters.dateRange.from && filters.dateRange.to ? isWithinInterval(payment.date, { start: filters.dateRange.from, end: filters.dateRange.to }) : true;
            return personMatch && dateMatch;
        });
    }, [financialData.sortedPayments, filters]);

    const formatPrice = (price: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);

    const handleExport = () => {
        const dataToExport = filteredPayments.map(p => {
            const person = people.find(person => person.id === p.personId);
            const tariff = tariffs.find(t => t.id === p.tariffId);
            return {
                fecha: p.date ? format(p.date, 'dd/MM/yyyy') : 'N/A',
                persona: person?.name || 'N/A',
                arancel: tariff?.name || 'N/A',
                monto: tariff?.price || p.amount,
            };
        });
        const headers = { fecha: "Fecha", persona: "Persona", arancel: "Arancel", monto: "Monto" };
        exportToCsv('historial_pagos.csv', dataToExport, headers);
    };
    
    if (loading || authLoading || !isMounted || !institute) {
        return (
            <div className="space-y-8">
                 <PageHeader title="Gestión de Pagos" />
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
                 </div>
                 <Card>
                    <CardHeader><Skeleton className="h-8 w-1/3 rounded-lg" /></CardHeader>
                    <CardContent><Skeleton className="h-64 w-full rounded-2xl" /></CardContent>
                 </Card>
            </div>
        )
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
            <PageHeader title="Gestión de Pagos" description="Analiza y gestiona los ingresos de tu estudio." />
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos (Mes Actual)</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(financialData.currentMonthIncome)}</div>
                        <p className="text-xs text-muted-foreground">
                            {financialData.incomeChange !== 0 && (
                                <span className={cn("font-semibold", financialData.incomeChange > 0 ? "text-green-600" : "text-red-600")}>
                                    {financialData.incomeChange > 0 ? '+' : ''}{financialData.incomeChange.toFixed(1)}%
                                </span>
                            )}
                             {financialData.incomeChange !== 0 ? ' vs mes anterior' : 'Sin datos del mes anterior'}
                        </p>
                    </CardContent>
                </Card>
                 <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos (Mes Anterior)</CardTitle>
                        <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(financialData.previousMonthIncome)}</div>
                        <p className="text-xs text-muted-foreground">Total recaudado el mes pasado.</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingreso Potencial Mensual</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(financialData.potentialIncome)}</div>
                        <p className="text-xs text-muted-foreground">Suma de aranceles de alumnos.</p>
                    </CardContent>
                </Card>
                 <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pagos Registrados</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{payments.length}</div>
                        <p className="text-xs text-muted-foreground">Historial completo de transacciones.</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle>Historial de Pagos</CardTitle>
                        <div className="flex gap-2 flex-wrap">
                             <Select value={filters.personId} onValueChange={(value) => setFilters(f => ({ ...f, personId: value }))}>
                                <SelectTrigger className="w-full sm:w-[200px] bg-background/70 border-border/50 shadow-sm rounded-xl"><SelectValue placeholder="Filtrar por persona..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las personas</SelectItem>
                                    {people.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn("w-full sm:w-[280px] justify-start text-left font-normal bg-background/70 border-border/50 shadow-sm rounded-xl", !filters.dateRange.from && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filters.dateRange.from ? (
                                            filters.dateRange.to ? (
                                                <>
                                                    {format(filters.dateRange.from, "LLL dd, y", { locale: es })} - {format(filters.dateRange.to, "LLL dd, y", { locale: es })}
                                                </>
                                            ) : (
                                                format(filters.dateRange.from, "LLL dd, y", { locale: es })
                                            )
                                        ) : (
                                            <span>Seleccionar rango de fechas</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={filters.dateRange.from}
                                        selected={{from: filters.dateRange.from, to: filters.dateRange.to}}
                                        onSelect={(range) => setFilters(f => ({ ...f, dateRange: range || {} }))}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                            <Button variant="outline" onClick={handleExport}><FileDown className="mr-2 h-4 w-4" />Exportar</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Persona</TableHead>
                                <TableHead>Arancel Pagado</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPayments.length > 0 ? (
                                filteredPayments.map(payment => {
                                    const person = people.find(p => p.id === payment.personId);
                                    const tariff = tariffs.find(t => t.id === payment.tariffId);
                                    return (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-medium">{payment.date ? format(payment.date, 'dd/MM/yyyy') : 'N/A'}</TableCell>
                                            <TableCell>{person?.name || 'Persona eliminada'}</TableCell>
                                            <TableCell>{tariff?.name || 'Arancel eliminado'}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatPrice(tariff?.price || payment.amount)}</TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No se encontraron pagos con los filtros seleccionados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

export default function PaymentsPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <PaymentsPageContent />
        </Suspense>
    );
}
