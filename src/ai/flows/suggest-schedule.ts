/**
 * @fileOverview Asistente de programación con IA para sugerir horarios óptimos de clases de yoga.
 *
 * - suggestSchedule - Una función que sugiere un horario basado en la disponibilidad de los especialistas, las preferencias de los estudiantes y la capacidad de las clases.
 * - SuggestScheduleInput - El tipo de entrada para la función suggestSchedule.
 * - SuggestScheduleOutput - El tipo de retorno para la función suggestSchedule.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestScheduleInputSchema = z.object({
  specialistAvailability: z
    .string()
    .describe(
      'Una descripción de la disponibilidad de los especialistas, incluyendo días, horarios y cualquier restricción.'
    ),
  studentPreferences: z
    .string()
    .describe(
      'Una descripción de las preferencias de los estudiantes, incluyendo días, horarios, tipos de clase y especialistas preferidos.'
    ),
  classCapacity: z
    .number()
    .describe('La capacidad máxima de cada clase de yoga.'),
  currentSchedule: z
    .string()
    .optional()
    .describe('El horario actual a tener en cuenta para las sugerencias.'),
});
export type SuggestScheduleInput = z.infer<typeof SuggestScheduleInputSchema>;

const SuggestScheduleOutputSchema = z.object({
  suggestedSchedule: z
    .string()
    .describe('El horario de clases de yoga sugerido basado en los parámetros de entrada.'),
  reasoning: z
    .string()
    .describe('El razonamiento de la IA para sugerir este horario.'),
});
export type SuggestScheduleOutput = z.infer<typeof SuggestScheduleOutputSchema>;

export async function suggestSchedule(input: SuggestScheduleInput): Promise<SuggestScheduleOutput> {
  return suggestScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSchedulePrompt',
  input: {schema: SuggestScheduleInputSchema},
  output: {schema: SuggestScheduleOutputSchema},
  prompt: `Eres un asistente de IA diseñado para crear horarios de clases de yoga óptimos para estudios de yoga. Utiliza la información proporcionada para sugerir un horario que maximice la participación de los estudiantes, se adapte a la disponibilidad y preferencias de los especialistas y respete la capacidad de las clases.

Disponibilidad de los especialistas: {{{specialistAvailability}}}
Preferencias de los estudiantes: {{{studentPreferences}}}
Capacidad de la clase: {{{classCapacity}}}
Horario actual: {{{currentSchedule}}}

Basándote en esta información, sugiere el horario de clases óptimo:

{{#if currentSchedule}}
Considera el horario actual existente:
{{currentSchedule}}
{{/if}}

Por favor, proporciona el horario sugerido y el razonamiento para el horario.`,
});

const suggestScheduleFlow = ai.defineFlow(
  {
    name: 'suggestScheduleFlow',
    inputSchema: SuggestScheduleInputSchema,
    outputSchema: SuggestScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
