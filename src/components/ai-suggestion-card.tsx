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
  const { yogaClasses, specialists, actividades, spaces } = useStudio();
  const [suggestion, setSuggestion] = useState<GetSuggestionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestion = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const input: GetSuggestionInput = { yogaClasses, specialists, actividades, spaces };
      const result = await getSuggestion(input);
      setSuggestion(result);
    } catch (e) {
      console.error("Error fetching AI suggestion:", e);
      setError("No se pudo obtener una sugerencia. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, [yogaClasses, specialists, actividades, spaces]);

  useEffect(() => {
    if (yogaClasses.length > 0) {
      fetchSuggestion();
    } else {
      setIsLoading(false);
      setSuggestion({ suggestion: "Añade clases para recibir sugerencias.", suggestionType: "info" });
    }
  }, [yogaClasses.length, fetchSuggestion]);

  const { Icon, iconColor, title } = useMemo(() => {
    if (!suggestion) return { Icon: Lightbulb, iconColor: 'text-primary', title: 'Sugerencia IA' };
    switch (suggestion.suggestionType) {
      case 'conflict': return { Icon: AlertTriangle, iconColor: 'text-destructive', title: 'Conflicto Detectado' };
      case 'optimization': return { Icon: Lightbulb, iconColor: 'text-blue-500', title: 'Oportunidad de Mejora' };
      default: return { Icon: CheckCircle2, iconColor: 'text-green-600', title: 'Todo en Orden' };
    }
  }, [suggestion]);

  const cardContent = () => {
    if (isLoading) return <Skeleton className="h-10 w-full" />;
    if (error) return <p className="text-destructive text-sm">{error}</p>;
    if (suggestion) return <p className="text-sm text-muted-foreground">{suggestion.suggestion}</p>;
    return null;
  };

  return (
    <Card className="flex flex-col h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">{title}</CardTitle>
            <div className="flex items-center gap-2">
                 <Icon className={cn("h-5 w-5", iconColor)} />
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchSuggestion} disabled={isLoading}>
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    <span className="sr-only">Refrescar sugerencia</span>
                 </Button>
            </div>
        </CardHeader>
        <CardContent className="flex-grow flex items-center min-h-[60px]">
            {cardContent()}
        </CardContent>
    </Card>
  );
}
