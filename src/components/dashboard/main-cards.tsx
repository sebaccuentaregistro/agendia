

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserX, CalendarClock } from 'lucide-react';
import Link from 'next/link';

interface MainCardsProps {
    activePeopleCount: number;
    overdueCount: number;
    recoveryCount: number;
}

export function MainCards({ activePeopleCount, overdueCount, recoveryCount }: MainCardsProps) {
    
    const cardData = [
        {
            href: '/students',
            label: 'Alumnos Activos',
            value: activePeopleCount,
            icon: Users,
            color: 'text-blue-500'
        },
        {
            href: '/students?filter=overdue',
            label: 'Pagos Vencidos',
            value: overdueCount,
            icon: UserX,
            color: 'text-destructive'
        },
        {
            href: '/students?filter=pending-recovery',
            label: 'Recuperos Pend.',
            value: recoveryCount,
            icon: CalendarClock,
            color: 'text-amber-500'
        }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-3">
            {cardData.map(card => (
                <Link href={card.href} key={card.label}>
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                            <card.icon className={`h-4 w-4 text-muted-foreground ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{card.value}</div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
