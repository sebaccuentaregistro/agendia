

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Calendar, Users, Settings, ArrowRight, UserX, CalendarClock, Plane } from 'lucide-react';
import { useStudio } from '@/context/StudioContext';
import { useMemo } from 'react';
import { getStudentPaymentStatus } from '@/lib/utils';


export function MainCards() {
    const { sessions, people, attendance, isPersonOnVacation } = useStudio();

    const counts = useMemo(() => {
        const now = new Date();
        const overdueCount = people.filter(p => getStudentPaymentStatus(p, now).status === 'Atrasado').length;
        const onVacationCount = people.filter(p => isPersonOnVacation(p, now)).length;
        const balances: Record<string, number> = {};
        people.forEach(p => (balances[p.id] = 0));
        attendance.forEach(record => {
          record.justifiedAbsenceIds?.forEach(personId => { if (balances[personId] !== undefined) balances[personId]++; });
          record.oneTimeAttendees?.forEach(personId => { if (balances[personId] !== undefined) balances[personId]--; });
        });
        const pendingRecoveryCount = Object.values(balances).filter(balance => balance > 0).length;

        return {
            sessionsCount: sessions.length,
            peopleCount: people.length,
            overdueCount,
            onVacationCount,
            pendingRecoveryCount,
        };
    }, [people, sessions.length, attendance, isPersonOnVacation]);

    const mainCards = [
        { href: "/schedule", label: "Horarios", icon: Calendar, dataKey: 'sessionsCount' },
        { href: "/students", label: "Personas", icon: Users, dataKey: 'peopleCount' },
        { href: "/students?filter=overdue", label: "Atrasados", icon: UserX, dataKey: 'overdueCount', color: 'red' },
        { href: "/students?filter=pending-recovery", label: "Recuperos", icon: CalendarClock, dataKey: 'pendingRecoveryCount', color: 'blue' },
        { href: "/students?filter=on-vacation", label: "Vacaciones", icon: Plane, dataKey: 'onVacationCount', color: 'blue' },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {mainCards.map((item) => (
            <Link key={item.href} href={item.href} className="transition-transform hover:-translate-y-1">
                <Card className={cn(
                    "group relative flex flex-col items-center justify-center p-2 text-center bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 aspect-square overflow-hidden border-2 border-transparent",
                    item.color === 'red' && "hover:border-red-500/50",
                    item.color === 'blue' && "hover:border-blue-500/50",
                    !item.color && "hover:border-primary/50"
                )}>
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-br to-transparent",
                    item.color === 'red' && "from-red-500/10",
                    item.color === 'blue' && "from-blue-500/10",
                    !item.color && "from-primary/10"
                )}></div>
                <div className={cn(
                    "absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent",
                     item.color === 'red' && "from-red-500/20",
                     item.color === 'blue' && "from-blue-500/20",
                     !item.color && "from-primary/20"
                )}></div>

                <div className={cn(
                    "flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full",
                     item.color === 'red' && "bg-red-500/10 text-red-500",
                     item.color === 'blue' && "bg-blue-500/10 text-blue-500",
                     !item.color && "bg-primary/10 text-primary"
                )}>
                    <item.icon className="h-4 w-4" />
                </div>
                <CardTitle className="text-lg font-semibold text-foreground">{item.label}</CardTitle>
                <p className="text-2xl font-bold text-foreground">{counts[item.dataKey as keyof typeof counts]}</p>
                </Card>
            </Link>
            ))}
            <Link href="/?view=management" className="transition-transform hover:-translate-y-1">
            <Card className="group relative flex flex-col items-center justify-center p-2 text-center bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 aspect-square overflow-hidden border-2 border-transparent hover:border-primary/50">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/20 to-transparent"></div>
                <div className="flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Settings className="h-4 w-4" />
                </div>
                <CardTitle className="text-lg font-semibold text-foreground">Gestión</CardTitle>
                <div className="text-sm text-primary mt-1 flex items-center gap-1">
                    Acceder <ArrowRight className="h-3 w-3" />
                </div>
            </Card>
            </Link>
        </div>
    )
}
