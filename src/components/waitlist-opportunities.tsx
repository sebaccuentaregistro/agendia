
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ListPlus, Star, User, UserPlus } from 'lucide-react';
import { WhatsAppIcon } from './whatsapp-icon';
import type { Session, Person, WaitlistProspect, AppNotification, WaitlistEntry, NewPersonData } from '@/types';
import { useStudio } from '@/context/StudioContext';
import { useState } from 'react';
import { PersonDialog } from '@/components/students/person-dialog';
import { WelcomeDialog } from './welcome-dialog';
import { Badge } from './ui/badge';

type UnifiedWaitlistItem = (Person & { isProspect: false }) | (WaitlistProspect & { isProspect: true });

export type Opportunity = {
  session: Session;
  actividadName: string;
  waitlist: UnifiedWaitlistItem[];
  availableSlots: {
    fixed: number;
    temporary: number;
    total: number;
  }
};

type SummaryItem = {
  sessionId: string;
  className: string;
  count: number;
};

interface WaitlistOpportunitiesProps {
  opportunities: Opportunity[];
  summary: SummaryItem[];
  totalCount: number;
  onHeaderClick?: () => void;
}

export function WaitlistOpportunities({ opportunities, summary, totalCount, onHeaderClick }: WaitlistOpportunitiesProps) {
  const { enrollFromWaitlist, enrollProspectFromWaitlist, people, spaces } = useStudio();
  const [personToCreate, setPersonToCreate] = useState<{ prospect: WaitlistProspect; sessionId: string; } | null>(null);
  const [personForWelcome, setPersonForWelcome] = useState<Person | null>(null);

  const handleEnroll = async (e: React.MouseEvent, sessionId: string, personToEnroll: Person) => {
    e.stopPropagation();
    await enrollFromWaitlist(sessionId, personToEnroll);
  };
  
  const handleCreateAndEnroll = (e: React.MouseEvent, prospect: WaitlistProspect, sessionId: string) => {
    e.stopPropagation();
    setPersonToCreate({ prospect, sessionId });
  };

  const handlePersonCreated = async (newPerson: Person) => {
      if (personToCreate) {
        await enrollProspectFromWaitlist(personToCreate.sessionId, personToCreate.prospect, newPerson.id);
      }
      setPersonForWelcome(newPerson);
      setPersonToCreate(null);
  };
  
  const getWhatsAppLink = (phone: string, text: string) => `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;

  return (
    <>
    <Card className="bg-card/80 backdrop-blur-lg rounded-2xl shadow-lg border-cyan-500/20">
      <CardHeader 
        onClick={onHeaderClick}
        className={onHeaderClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
      >
        <CardTitle className="flex items-center gap-2 text-foreground">
          <ListPlus className="h-5 w-5 text-cyan-500" />
          Lista de Espera
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {opportunities.length > 0 && (
          <div className="space-y-3">
             <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200">
                <AlertTitle className="font-semibold flex items-center gap-2">
                    <Star className="h-4 w-4"/>
                    ¡Oportunidades Disponibles!
                </AlertTitle>
                <AlertDescription>
                    Se han liberado cupos en estas clases. Contacta a las personas en espera para inscribirlas.
                </AlertDescription>
            </Alert>
            {opportunities.map(({ session, actividadName, waitlist, availableSlots }) => {
                const space = spaces.find(s => s.id === session.spaceId);
                const capacity = space?.capacity || 0;
                
                // A fixed enrollment is only possible if there is at least one fixed slot available.
                const canEnrollFixed = availableSlots.fixed > 0;
                
                return (
                    <div key={session.id} className="p-3 rounded-lg bg-primary/10">
                        <h4 className="font-bold text-primary mb-2">Cupo en {actividadName} ({session.dayOfWeek} {session.time})</h4>
                        
                        <div className="mb-2 text-xs font-semibold text-primary-darker dark:text-primary-lighter space-y-1">
                           {availableSlots.fixed > 0 && <div>- {availableSlots.fixed} Cupo(s) Fijo(s) Disponible(s)</div>}
                           {availableSlots.temporary > 0 && <div>- {availableSlots.temporary} Cupo(s) Temporal(es) (por vacaciones)</div>}
                        </div>

                        <div className="space-y-2">
                            {waitlist.map((person, index) => {
                                 const isProspect = 'isProspect' in person && person.isProspect;
                                 return (
                                    <div key={index} className="flex justify-between items-center text-sm bg-background/50 p-2 rounded-md">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">{person.name}</p>
                                            <Badge variant={isProspect ? 'outline' : 'secondary'}>
                                              {isProspect ? 'Nuevo' : 'Alumno'}
                                            </Badge>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            variant="secondary" 
                                            onClick={(e) => {
                                                if (isProspect) {
                                                    handleCreateAndEnroll(e, person as WaitlistProspect, session.id);
                                                } else {
                                                    handleEnroll(e, session.id, person as Person);
                                                }
                                            }}
                                            disabled={!canEnrollFixed}
                                        >
                                            Inscribir
                                        </Button>
                                    </div>
                                 )
                            })}
                        </div>
                    </div>
                );
            })}
          </div>
        )}

        <div>
          <h4 className="font-medium text-sm mb-2 text-muted-foreground">Resumen de Todas las Listas</h4>
          <div className="p-4 rounded-lg bg-muted/50 text-sm space-y-2">
            {totalCount > 0 ? (
              <>
                <p className="text-center pb-2 border-b">
                  <span className="font-bold">{totalCount}</span> {totalCount === 1 ? 'persona está esperando' : 'personas están esperando'} un cupo en total.
                </p>
                <div className="space-y-1 text-xs">
                  {summary.map(item => (
                    <div key={item.sessionId} className="flex justify-between">
                      <span>{item.className}</span>
                      <span className="font-semibold">{item.count} en espera</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center">No hay nadie en ninguna lista de espera.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
     <PersonDialog
        open={!!personToCreate}
        onOpenChange={(isOpen) => !isOpen && setPersonToCreate(null)}
        initialData={personToCreate?.prospect}
        onPersonCreated={handlePersonCreated}
      />
      <WelcomeDialog person={personForWelcome} onOpenChange={() => setPersonForWelcome(null)} />
    </>
  );
}
