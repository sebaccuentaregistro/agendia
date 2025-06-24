'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Bot, BarChart } from 'lucide-react';
import { Label } from '@/components/ui/label';

// This is a placeholder for the real Genkit flow output
type AIResult = {
  schedule: string;
  reasoning: string;
} | null;

export default function AssistantPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIResult>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);

    // Simulate AI call
    setTimeout(() => {
      // In a real implementation, you would get this from a Genkit flow
      setResult({
        schedule: `Lunes 09:00 - Vinyasa Flow (Sala Sol) - Elena Santos\nMartes 18:00 - Hatha Yoga (Sala Luna) - David Miller\nMiércoles 09:00 - Ashtanga Yoga (Sala Sol) - Marcus Chen\nJueves 19:30 - Yin Yoga (Sala Luna) - Aisha Khan\nViernes 07:00 - Vinyasa Flow (Sala Sol) - Elena Santos`,
        reasoning: "El horario se optimizó para maximizar el uso de la Sala Sol en las horas de mayor demanda (mañana y tarde) y para ofrecer una variedad de estilos a lo largo de la semana, asignando especialistas a sus actividades principales. Se agruparon las clases de Vinyasa en días no consecutivos para permitir la recuperación."
      });
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div>
      <PageHeader
        title="Asistente de IA para Horarios"
        description="Crea horarios óptimos basados en la disponibilidad y preferencias."
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generar Horario</CardTitle>
            <CardDescription>
              Proporciona los detalles para que la IA genere una sugerencia de horario.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="availability">Disponibilidad de Especialistas</Label>
                <Textarea
                  id="availability"
                  placeholder="Ej: Elena Santos: L-V 9-12, David Miller: M,J 18-21..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferences">Preferencias de Personas</Label>
                <Textarea
                  id="preferences"
                  placeholder="Ej: Mayoría prefiere clases de Vinyasa por la mañana. Yin Yoga es popular por la noche..."
                  rows={4}
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
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> Horario Sugerido</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && <Skeleton className="h-32 w-full" />}
              {!isLoading && result && (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{result.schedule}</p>
              )}
              {!isLoading && !result && (
                <p className="text-center text-sm text-muted-foreground py-10">
                  La sugerencia de horario aparecerá aquí.
                </p>
              )}
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5" /> Razonamiento</CardTitle>
            </CardHeader>
            <CardContent>
               {isLoading && <Skeleton className="h-24 w-full" />}
               {!isLoading && result && (
                <p className="text-sm text-muted-foreground">{result.reasoning}</p>
              )}
               {!isLoading && !result && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  La explicación de la IA aparecerá aquí.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
