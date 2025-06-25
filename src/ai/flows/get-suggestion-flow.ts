'use server';
/**
 * @fileOverview An AI flow to generate intelligent suggestions for managing the studio.
 */

import {z} from 'zod';
import type { Session, Specialist, Actividad, Space } from '@/types';

// Schemas mirroring the main types
const ActividadSchema = z.object({ id: z.string(), name: z.string() });
const SpecialistSchema = z.object({ id: z.string(), name: z.string(), phone: z.string(), actividadIds: z.array(z.string()), avatar: z.string() });
const SpaceSchema = z.object({ id: z.string(), name: z.string(), capacity: z.number() });
const SessionSchema = z.object({
  id: z.string(),
  instructorId: z.string(),
  actividadId: z.string(),
  spaceId: z.string(),
  dayOfWeek: z.enum(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']),
  time: z.string(),
  sessionType: z.enum(['Grupal', 'Individual']),
  personIds: z.array(z.string()),
});

export const GetSuggestionInputSchema = z.object({
  sessions: z.array(SessionSchema),
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

// This is a mocked version. Uncomment the Genkit implementation when ready.
export async function getSuggestion(input: GetSuggestionInput): Promise<GetSuggestionOutput> {
  // Simulate checking for conflicts
  const schedule: Record<string, Record<string, { specialist: string, space: string }>> = {};
  for (const session of input.sessions) {
      const key = `${session.dayOfWeek}-${session.time}`;
      if (!schedule[key]) {
          schedule[key] = { specialist: '', space: '' };
      }
      if (schedule[key].specialist === session.instructorId || schedule[key].space === session.spaceId) {
          return {
              suggestion: `Conflicto detectado: Múltiples sesiones para el especialista o el espacio el ${session.dayOfWeek} a las ${session.time}.`,
              suggestionType: "conflict",
          };
      }
      schedule[key] = { specialist: session.instructorId, space: session.spaceId };
  }
  
  // Simulate checking for optimization
  const sessionEnrollment = input.sessions
    .filter(s => s.sessionType === 'Grupal')
    .map(session => {
      const space = input.spaces.find(s => s.id === session.spaceId);
      if (!space) return { ...session, utilization: 0 };
      return { ...session, utilization: session.personIds.length / space.capacity };
  }).sort((a,b) => a.utilization - b.utilization);

  if (sessionEnrollment.length > 0 && sessionEnrollment[0].utilization < 0.2) {
      const leastPopularSession = sessionEnrollment[0];
      const actividad = input.actividades.find(a => a.id === leastPopularSession.actividadId);
      return {
          suggestion: `Oportunidad: La sesión de ${actividad?.name} del ${leastPopularSession.dayOfWeek} tiene muy baja asistencia. Considera cambiar el horario o promocionarla.`,
          suggestionType: "optimization",
      };
  }

  return {
    suggestion: "Todo parece estar en orden en el estudio. ¡Sigue así!",
    suggestionType: "info"
  };
}
