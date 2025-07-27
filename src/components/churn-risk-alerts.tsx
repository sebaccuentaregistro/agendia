

'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserX } from 'lucide-react';
import { WhatsAppIcon } from './whatsapp-icon';
import type { Person, Session, SessionAttendance } from '@/types';
import Link from 'next/link';

interface ChurnRiskAlertsProps {
  people: Person[];
}

export function ChurnRiskAlerts({ people }: ChurnRiskAlertsProps) {
  if (people.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card/80 backdrop-blur-lg rounded-2xl shadow-lg border-yellow-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <UserX className="h-5 w-5 text-yellow-500" />
          Riesgo de Abandono
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {people.map(person => (
          <div key={person.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-yellow-500/10 text-sm">
            <p className="flex-grow text-yellow-800 dark:text-yellow-200">
              <Link href={`/students/${person.id}`} className="font-semibold hover:underline">
                {person.name}
              </Link>
              {' '}ha estado ausente en sus últimas clases. Considera contactarlo.
            </p>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Button asChild size="sm" variant="ghost" className="text-green-600 hover:text-green-700 h-8 px-2">
                <a href={`https://wa.me/${person.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="mr-2" /> Contactar
                </a>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
