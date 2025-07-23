

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, CalendarClock, Plane, Calendar, Users, Settings, Lock, ArrowRight } from 'lucide-react';
import type { Session, Person } from '@/types';

interface MainCardsProps {
    overdueCount: number;
    sessionsCount: number;
    peopleCount: number;
}

const mainCards = [
  { href: "/schedule", label: "Horarios", icon: Calendar, data: 'sessionsCount' },
  { href: "/students", label: "Personas", icon: Users, data: 'peopleCount' },
];

export function MainCards({
    overdueCount,
    sessionsCount,
    peopleCount,
}: MainCardsProps) {
    const router = useRouter();

    const counts = {
        sessionsCount,
        peopleCount
    };

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            <Link href="/students?filter=overdue" className="transition-transform hover:-translate-y-1">
                <Card className={cn(
                    "group relative flex flex-col items-center justify-center p-2 text-center bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 aspect-square overflow-hidden border-2 border-transparent",
                    overdueCount > 0 ? "hover:border-red-500/50" : "hover:border-green-500/50"
                )}>
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-br to-transparent",
                    overdueCount > 0 ? "from-red-500/10" : "from-green-500/10"
                )}></div>
                <div className={cn(
                    "absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent",
                    overdueCount > 0 ? "from-red-500/20" : "from-green-500/20"
                )}></div>
                <div className={cn(
                    "flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full",
                    overdueCount > 0 ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                )}>
                    {overdueCount > 0 ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                </div>
                <CardTitle className="text-lg font-semibold text-foreground">
                    Atrasados
                </CardTitle>
                <p className="text-2xl font-bold text-foreground">{overdueCount}</p>
                </Card>
            </Link>
            
            {mainCards.map((item) => (
            <Link key={item.href} href={item.href} className="transition-transform hover:-translate-y-1">
                <Card className="group relative flex flex-col items-center justify-center p-2 text-center bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 aspect-square overflow-hidden border-2 border-transparent hover:border-primary/50">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/20 to-transparent"></div>
                <div className="flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <item.icon className="h-4 w-4" />
                </div>
                <CardTitle className="text-lg font-semibold text-foreground">{item.label}</CardTitle>
                <p className="text-2xl font-bold text-foreground">{counts[item.data as keyof typeof counts]}</p>
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
