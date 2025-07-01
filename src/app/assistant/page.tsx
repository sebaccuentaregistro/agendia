
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Bot, BarChart } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { generateSchedule, type ScheduleResponse } from '@/ai/flows/schedule-generator';
import { useToast } from '@/hooks/use-toast';

type AIResult = ScheduleResponse | null;

export default function AssistantPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIResult>(null);
  const [availability, setAvailability] = useState('');
  const [preferences, setPreferences] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!availability.trim() || !preferences.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campos requeridos',
        description: 'Por favor, completa la disponibilidad y las preferencias.',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const aiResult = await generateSchedule({ availability, preferences });
      setResult(aiResult);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error del Asistente de IA',
        description: 'No se pudo generar la sugerencia. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Asistente de IA para Horarios"
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-slate-100">Generar Horario</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="availability" className="text-slate-700 dark:text-slate-300">Disponibilidad de Especialistas</Label>
                <Textarea
                  id="availability"
                  placeholder="Ej: Elena Santos: L-V 9-12, David Miller: M,J 18-21..."
                  rows={4}
                  className="bg-white/50 dark:bg-zinc-800/50"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferences" className="text-slate-700 dark:text-slate-300">Preferencias de Personas</Label>
                <Textarea
                  id="preferences"
                  placeholder="Ej: Mayoría prefiere clases de Vinyasa por la mañana. Yin Yoga es popular por la noche..."
                  rows={4}
                  className="bg-white/50 dark:bg-zinc-800/50"
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                />
              </div>
            </CardContent>
            <CardContent>
               <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Generando...' : 'Generar Sugerencia'}
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </form>
        </Card>
        
        <div className="space-y-8">
           <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100"><Bot className="h-5 w-5" /> Horario Sugerido</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && <Skeleton className="h-32 w-full bg-white/30 rounded-xl" />}
              {!isLoading && result && (
                <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{result.schedule}</p>
              )}
              {!isLoading && !result && (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/30 p-10 text-center bg-white/20 backdrop-blur-sm">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    La sugerencia de horario aparecerá aquí.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
           <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100"><BarChart className="h-5 w-5" /> Razonamiento</CardTitle>
            </CardHeader>
            <CardContent>
               {isLoading && <Skeleton className="h-24 w-full bg-white/30 rounded-xl" />}
               {!isLoading && result && (
                <p className="text-sm text-slate-600 dark:text-slate-300">{result.reasoning}</p>
              )}
               {!isLoading && !result && (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/30 p-8 text-center bg-white/20 backdrop-blur-sm">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    La explicación de la IA aparecerá aquí.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
