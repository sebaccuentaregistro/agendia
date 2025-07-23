

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Calendar, Users, Settings, UserX, CalendarClock, ListPlus } from 'lucide-react';
import { useStudio } from '@/context/StudioContext';
import { useMemo } from 'react';
import { getStudentPaymentStatus } from '@/lib/utils';

export function MainCards() {
    const { sessions, people, attendance, spaces, actividades } = useStudio();
    const router = useRouter();

    const stats = useMemo(() => {
        const now = new Date();
        const overdueCount = people.filter(p => getStudentPaymentStatus(p, now).status === 'Atrasado').length;

        const balances: Record<string, number> = {};
        people.forEach(p => (balances[p.id] = 0));
        attendance.forEach(record => {
          record.justifiedAbsenceIds?.forEach(personId => { if (balances[personId] !== undefined) balances[personId]++; });
          record.oneTimeAttendees?.forEach(personId => { if (balances[personId] !== undefined) balances[personId]--; });
        });
        const pendingRecoveryCount = Object.values(balances).filter(balance => balance > 0).length;

        const waitlistOpportunitiesCount = sessions.filter(session => {
            const space = spaces.find(s => s.id === session.spaceId);
            const capacity = space?.capacity || 0;
            const fixedEnrolledCount = session.personIds.length;
            const fixedSlotsAvailable = capacity - fixedEnrolledCount;
            const hasWaitlist = session.waitlist && session.waitlist.length > 0;
            return fixedSlotsAvailable > 0 && hasWaitlist;
        }).length;

        return {
            overdueCount,
            pendingRecoveryCount,
            waitlistOpportunitiesCount,
        };
    }, [people, attendance, sessions, spaces]);

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/schedule" className="transition-transform hover:-translate-y-1">
                <Card className="group relative flex flex-col justify-between p-4 text-left bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 aspect-square overflow-hidden border-2 border-transparent hover:border-primary/50">
                     <div>
                        <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                             <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Calendar className="h-4 w-4" />
                            </div>
                            Horarios
                        </CardTitle>
                        <CardDescription className="mt-2 text-sm text-muted-foreground">Gestiona tus clases, especialistas y espacios.</CardDescription>
                    </div>
                    <CardContent className="p-0 mt-4">
                         {stats.waitlistOpportunitiesCount > 0 && (
                            <Badge variant="destructive">{stats.waitlistOpportunitiesCount} Oportunidad(es)</Badge>
                         )}
                    </CardContent>
                </Card>
            </Link>

             <Link href="/students" className="transition-transform hover:-translate-y-1">
                <Card className="group relative flex flex-col justify-between p-4 text-left bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 aspect-square overflow-hidden border-2 border-transparent hover:border-primary/50">
                    <div>
                        <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Users className="h-4 w-4" />
                            </div>
                            Personas
                        </CardTitle>
                         <CardDescription className="mt-2 text-sm text-muted-foreground">Administra alumnos, pagos e inscripciones.</CardDescription>
                    </div>
                    <CardContent className="p-0 mt-4 flex flex-wrap gap-2">
                        {stats.overdueCount > 0 && (
                             <Link href="/students?filter=overdue" onClick={(e) => e.stopPropagation()}>
                                <Badge variant="destructive">{stats.overdueCount} Deudor(es)</Badge>
                             </Link>
                        )}
                        {stats.pendingRecoveryCount > 0 && (
                            <Link href="/students?filter=pending-recovery" onClick={(e) => e.stopPropagation()}>
                                <Badge variant="secondary">{stats.pendingRecoveryCount} Recupero(s)</Badge>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            </Link>

            <Link href="/?view=management" className="transition-transform hover:-translate-y-1">
            <Card className="group relative flex flex-col justify-between p-4 text-left bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 aspect-square overflow-hidden border-2 border-transparent hover:border-primary/50">
                 <div>
                    <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Settings className="h-4 w-4" />
                        </div>
                        Gestión
                    </CardTitle>
                     <CardDescription className="mt-2 text-sm text-muted-foreground">Aranceles, Actividades y funciones avanzadas.</CardDescription>
                 </div>
                 <CardContent className="p-0 mt-4" />
            </Card>
            </Link>
        </div>
    )
}
