
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserX } from 'lucide-react';
import { WhatsAppIcon } from './whatsapp-icon';
import type { Person, Session, SessionAttendance } from '@/types';

interface ChurnRiskAlertsProps {
  people: Person[];
  attendance: SessionAttendance[];
  sessions: Session[];
}

export function ChurnRiskAlerts({ people, attendance, sessions }: ChurnRiskAlertsProps) {
  const churnRiskPeople = useMemo(() => {
    const atRisk: Person[] = [];

    for (const person of people) {
      const personSessionIds = new Set(sessions.filter(s => s.personIds.includes(person.id)).map(s => s.id));
      if (personSessionIds.size === 0) continue;

      const relevantAttendance = attendance
        .filter(a => personSessionIds.has(a.sessionId))
        .sort((a, b) => b.date.localeCompare(a.date));

      let consecutiveAbsences = 0;

      for (let i = 0; i < Math.min(relevantAttendance.length, 5); i++) {
        const record = relevantAttendance[i];
        if (record.absentIds?.includes(person.id)) {
          consecutiveAbsences++;
        } else if (record.presentIds?.includes(person.id) || record.justifiedAbsenceIds?.includes(person.id)) {
          break;
        }
      }

      if (consecutiveAbsences >= 3) {
        atRisk.push(person);
      }
    }
    return atRisk;
  }, [people, attendance, sessions]);

  return (
    <Card className="bg-card/80 backdrop-blur-lg rounded-2xl shadow-lg border-yellow-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <UserX className="h-5 w-5 text-yellow-500" />
          Riesgo de Abandono
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {churnRiskPeople.length > 0 ? (
          churnRiskPeople.map(person => (
            <div key={person.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-yellow-500/10 text-sm">
              <p className="flex-grow text-yellow-800 dark:text-yellow-200">
                <span className="font-semibold">{person.name}</span> ha estado ausente en sus últimas clases. Considera contactarlo.
              </p>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Button asChild size="sm" variant="ghost" className="text-green-600 hover:text-green-700 h-8 px-2">
                  <a href={`https://wa.me/${person.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon className="mr-2" /> Contactar
                  </a>
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">¡Muy bien! No hay alumnos en riesgo de abandono por ausencias consecutivas.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
