'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useStudio } from '@/context/StudioContext';
import { getSuggestion, GetSuggestionInput, GetSuggestionOutput } from '@/ai/flows/get-suggestion-flow';
import { cn } from '@/lib/utils';

export function AISuggestionCard() {
  const { sessions, specialists, actividades, spaces } = useStudio();
  const [suggestion, setSuggestion] = useState<GetSuggestionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestion = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const input: GetSuggestionInput = { sessions, specialists, actividades, spaces };
      const result = await getSuggestion(input);
      setSuggestion(result);
    } catch (e) {
      console.error("Error fetching AI suggestion:", e);
      setError("No se pudo obtener una sugerencia. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, [sessions, specialists, actividades, spaces]);

  useEffect(() => {
    if (sessions.length > 0) {
      fetchSuggestion();
    } else {
      setIsLoading(false);
      setSuggestion({ suggestion: "Añade sesiones para recibir sugerencias.", suggestionType: "info" });
    }
  }, [sessions.length, fetchSuggestion]);

  const { Icon, iconColor, title } = useMemo(() => {
    if (isLoading) return { Icon: Lightbulb, iconColor: 'text-primary', title: 'Analizando Estudio...' };
    if (!suggestion) return { Icon: Lightbulb, iconColor: 'text-primary', title: 'Sugerencia IA' };
    
    switch (suggestion.suggestionType) {
      case 'conflict': return { Icon: AlertTriangle, iconColor: 'text-destructive', title: 'Conflicto Detectado' };
      case 'optimization': return { Icon: Lightbulb, iconColor: 'text-blue-500', title: 'Oportunidad de Mejora' };
      default: return { Icon: CheckCircle2, iconColor: 'text-green-600', title: 'Todo en Orden' };
    }
  }, [suggestion, isLoading]);

  const cardContent = () => {
    if (isLoading) return <Skeleton className="h-10 w-full rounded-md bg-muted/80" />;
    if (error) return <p className="text-sm text-destructive">{error}</p>;
    if (suggestion) return <p className="text-sm text-foreground/80">{suggestion.suggestion}</p>;
    return null;
  };

  return (
    <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={cn("text-base font-semibold text-slate-800 dark:text-slate-100", iconColor)}>{title}</CardTitle>
            <div className="flex items-center gap-2">
                 <Icon className={cn("h-5 w-5", iconColor)} />
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-300 hover:bg-white/50" onClick={fetchSuggestion} disabled={isLoading}>
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    <span className="sr-only">Refrescar sugerencia</span>
                 </Button>
            </div>
        </CardHeader>
        <CardContent className="flex-grow flex items-center min-h-[50px] pt-2">
            {cardContent()}
        </CardContent>
    </Card>
  );
}
