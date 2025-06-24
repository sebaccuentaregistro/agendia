'use server';
/**
 * @fileOverview An AI flow to generate intelligent suggestions for managing the studio.
 *
 * - getSuggestion - A function that analyzes studio data and provides a suggestion.
 * - GetSuggestionInput - The input type for the getSuggestion function.
 * - GetSuggestionOutput - The return type for the getSuggestion function.
 */

import {ai} from '@/ai/genkit';
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
  return getSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getSuggestionPrompt',
  input: {schema: GetSuggestionInputSchema},
  output: {schema: GetSuggestionOutputSchema},
  prompt: `
    You are an expert AI assistant for a yoga studio manager. Your task is to analyze the studio's data and provide one single, actionable suggestion to improve operations. The suggestions must be in Spanish.

    Analyze the provided data which includes classes, specialists, activities, and spaces.

    First, prioritize finding critical issues. Check for scheduling CONFLICTS:
    1.  A specialist assigned to two different classes at the exact same day and time.
    2.  A space being used by two different classes at the exact same day and time.
    If you find a conflict, this is the most important suggestion to return. Clearly state the conflict (e.g., "Conflicto de Horario: Elena Santos está programada para dos clases el Lunes a las 07:00."). Set suggestionType to 'conflict'.

    If there are no conflicts, look for OPTIMIZATION opportunities:
    1.  Find a class with low attendance (e.g., less than 50% of the space capacity) that could be moved to a smaller, available room at the same time to free up a larger space. Suggest the move (e.g., "Optimización: La clase de Yin Yoga en Sala Sol tiene solo 4/15 asistentes. Podrías moverla a Sala Luna (capacidad 10) que está libre a esa hora.").
    2.  Find a class with consistently low attendance and suggest moving it to a more popular time slot if one is available. A popular time slot is one where other classes are near full capacity. (e.g., "Sugerencia: La clase de Vinyasa los miércoles a las 9:00 tiene pocos asistentes. Podrías probar moverla al jueves a las 18:00, un horario más popular.").
    If you find an optimization, return it as the suggestion and set suggestionType to 'optimization'.

    If you find no conflicts and no clear optimization opportunities, return a positive, encouraging message. For example: "Todo parece estar en orden en el estudio." or "¡Buen trabajo! No se encontraron conflictos ni optimizaciones evidentes.". In this case, set suggestionType to 'info'.

    Provide ONLY ONE suggestion per analysis. Prioritize conflicts over optimizations.

    Here is the studio data in JSON format. Use it to formulate your suggestion.

    Actividades: {{{json actividades}}}
    Especialistas: {{{json specialists}}}
    Espacios: {{{json spaces}}}
    Clases y Horarios: {{{json yogaClasses}}}
  `,
});

const getSuggestionFlow = ai.defineFlow(
  {
    name: 'getSuggestionFlow',
    inputSchema: GetSuggestionInputSchema,
    outputSchema: GetSuggestionOutputSchema,
  },
  async (input) => {
    // The Gemini 1.5 Flash model can sometimes return an empty response if the prompt is too complex.
    // Simplifying the input by removing non-essential fields for this specific task.
    const simplifiedInput = {
      actividades: input.actividades.map(({ id, name }) => ({ id, name })),
      specialists: input.specialists.map(({ id, name }) => ({ id, name })),
      spaces: input.spaces.map(({ id, name, capacity }) => ({ id, name, capacity })),
      yogaClasses: input.yogaClasses,
    };

    const {output} = await prompt(simplifiedInput);
    
    // Fallback in case the model returns nothing
    if (!output) {
      return {
        suggestion: "No se pudo obtener una sugerencia en este momento. Inténtalo de nuevo.",
        suggestionType: "info",
      }
    }
    
    return output;
  }
);
