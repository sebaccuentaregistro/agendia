'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { suggestSchedule, SuggestScheduleOutput } from '@/ai/flows/suggest-schedule';
import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  instructorAvailability: z.string().min(20, {
    message: "Por favor, describe la disponibilidad del instructor en al menos 20 caracteres.",
  }),
  studentPreferences: z.string().min(20, {
    message: "Por favor, describe las preferencias de los estudiantes en al menos 20 caracteres.",
  }),
  classCapacity: z.coerce.number().min(1, {
    message: "La capacidad de la clase debe ser de al menos 1.",
  }),
  currentSchedule: z.string().optional(),
});

export default function AssistantPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuggestScheduleOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      instructorAvailability: "",
      studentPreferences: "",
      classCapacity: 15,
      currentSchedule: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    try {
      const scheduleResult = await suggestSchedule(values);
      setResult(scheduleResult);
    } catch (error) {
      console.error("Error suggesting schedule:", error);
      toast({
        variant: "destructive",
        title: "Ocurrió un error",
        description: "No se pudo obtener una sugerencia de horario. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Asistente de Programación Inteligente"
        description="Deja que la IA te ayude a crear el horario de clases óptimo para tu estudio."
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Preferencias de Programación</CardTitle>
            <CardDescription>Proporciona los detalles a continuación para obtener una sugerencia de horario.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="instructorAvailability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponibilidad del Instructor</FormLabel>
                      <FormControl>
                        <Textarea placeholder="p.ej., Elena está disponible los lunes/miércoles/viernes por la mañana. Marcus prefiere las tardes..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="studentPreferences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferencias de los Estudiantes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="p.ej., Muchos estudiantes solicitaron más clases de Vinyasa por la tarde. Los principiantes prefieren las mañanas de fin de semana." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="classCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidad Máxima de la Clase</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="currentSchedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horario Actual (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enumera tus clases actuales, si las hay." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Sugerir Horario
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="space-y-8">
          {loading && (
            <Card className="flex min-h-[400px] flex-col items-center justify-center">
              <CardContent className="text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">La IA está creando el horario perfecto...</p>
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Horario Sugerido</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 font-sans text-sm text-muted-foreground">
                    {result.suggestedSchedule}
                  </pre>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Razonamiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{result.reasoning}</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
