'use server';
/**
 * @fileOverview An AI flow to generate optimized weekly schedules for a wellness center.
 *
 * - generateSchedule - A function that handles the schedule generation process.
 * - ScheduleRequest - The input type for the generateSchedule function.
 * - ScheduleResponse - The return type for the generateSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const ScheduleRequestSchema = z.object({
  availability: z
    .string()
    .describe(
      'A description of when each specialist is available and what they specialize in.'
    ),
  preferences: z
    .string()
    .describe(
      'Information about what types of classes are popular and at what times.'
    ),
});
export type ScheduleRequest = z.infer<typeof ScheduleRequestSchema>;

export const ScheduleResponseSchema = z.object({
  schedule: z
    .string()
    .describe(
      'The generated weekly schedule in a clear, day-by-day format.'
    ),
  reasoning: z
    .string()
    .describe(
      'An explanation of the decisions made to optimize the schedule.'
    ),
});
export type ScheduleResponse = z.infer<typeof ScheduleResponseSchema>;

export async function generateSchedule(
  input: ScheduleRequest
): Promise<ScheduleResponse> {
  return scheduleGeneratorFlow(input);
}

const schedulePrompt = ai.definePrompt({
  name: 'schedulePrompt',
  input: {schema: ScheduleRequestSchema},
  output: {schema: ScheduleResponseSchema},
  prompt: `Eres un experto planificador de horarios para un centro de bienestar como un estudio de yoga o un gimnasio. Tu tarea es crear un horario semanal optimizado basado en la información proporcionada.

Tu respuesta debe estar en un formato estructurado con un 'schedule' (horario) y un 'reasoning' (razonamiento).

**Entrada:**
- **Disponibilidad de Especialistas:** Una descripción de cuándo está disponible cada especialista y en qué se especializa.
- **Preferencias de los Miembros:** Información sobre qué tipos de clases son populares y en qué horarios.

**Tarea:**
1.  **Generar un Horario:** Crea un horario claro, día por día. Para cada clase, especifica el día, la hora, el nombre de la clase, la sala/espacio y el especialista.
2.  **Proporcionar Razonamiento:** Explica *por qué* tomaste estas decisiones de programación. Menciona cómo optimizaste el uso de las salas, las habilidades de los especialistas, las preferencias de los miembros y la variedad.

**Formato de Horario de Ejemplo:**
Lunes 09:00 - Vinyasa Flow (Sala Sol) - Elena Santos
Martes 18:00 - Hatha Yoga (Sala Luna) - David Miller
...

**Formato de Razonamiento de Ejemplo:**
El horario se optimizó para maximizar el uso de la Sala Sol durante las horas pico...

Ahora, utiliza la siguiente información:

**Disponibilidad de Especialistas:**
{{{availability}}}

**Preferencias de los Miembros:**
{{{preferences}}}
`,
});

const scheduleGeneratorFlow = ai.defineFlow(
  {
    name: 'scheduleGeneratorFlow',
    inputSchema: ScheduleRequestSchema,
    outputSchema: ScheduleResponseSchema,
  },
  async (input) => {
    const { output } = await schedulePrompt(input);
    return output!;
  }
);
