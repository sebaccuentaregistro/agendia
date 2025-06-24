'use server';
/**
 * @fileOverview An AI flow to generate intelligent suggestions for managing the studio.
 *
 * - getSuggestion - A function that analyzes studio data and provides a suggestion.
 * - GetSuggestionInput - The input type for the getSuggestion function.
 * - GetSuggestionOutput - The return type for the getSuggestion function.
 */

import {z} from 'zod';

// Schemas mirroring the main types
const ActividadSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const SpecialistSchema = z.object({
  id: z.string(),
  name: z.string(),
  actividadIds: z.array(z.string()),
});

const SpaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  capacity: z.number(),
});

const YogaClassSchema = z.object({
  id: z.string(),
  instructorId: z.string(),
  actividadId: z.string(),
  spaceId: z.string(),
  dayOfWeek: z.enum(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']),
  time: z.string(),
  personIds: z.array(z.string()),
});

export const GetSuggestionInputSchema = z.object({
  yogaClasses: z.array(YogaClassSchema),
  specialists: z.array(SpecialistSchema),
  actividades: z.array(ActividadSchema),
  spaces: z.array(SpaceSchema),
});
export type GetSuggestionInput = z.infer<typeof GetSuggestionInputSchema>;

export const GetSuggestionOutputSchema = z.object({
  suggestion: z.string().describe('The actionable suggestion for the studio manager, in Spanish. If no suggestion is found, return a positive or encouraging message like "Todo parece estar en orden en el estudio." or "¡Buen trabajo! No se encontraron conflictos ni optimizaciones evidentes."'),
  suggestionType: z.enum(['conflict', 'optimization', 'info']).describe('The type of suggestion: "conflict" for scheduling issues, "optimization" for improvements, "info" for positive messages.'),
});
export type GetSuggestionOutput = z.infer<typeof GetSuggestionOutputSchema>;


export async function getSuggestion(input: GetSuggestionInput): Promise<GetSuggestionOutput> {
  // Temporarily returning a mock response to isolate the Genkit issue.
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    suggestion: "Función de IA en depuración. El sistema principal funciona correctamente.",
    suggestionType: "info"
  };
}
