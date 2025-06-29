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
  const schedule: Record<string, { specialist: string[], space: string[] }> = {};

  for (const session of input.sessions) {
    const key = `${session.dayOfWeek}-${session.time}`;
    if (!schedule[key]) {
      schedule[key] = { specialist: [], space: [] };
    }
    schedule[key].specialist.push(session.instructorId);
    schedule[key].space.push(session.spaceId);
  }

  for (const key in schedule) {
    const specialists = schedule[key].specialist;
    const spaces = schedule[key].space;
    const specialistCounts = specialists.reduce((acc, id) => ({...acc, [id]: (acc[id] || 0) + 1}), {} as Record<string, number>);
    const spaceCounts = spaces.reduce((acc, id) => ({...acc, [id]: (acc[id] || 0) + 1}), {} as Record<string, number>);

    const specialistConflict = Object.entries(specialistCounts).find(([_, count]) => count > 1);
    if (specialistConflict) {
        const specialistName = input.specialists.find(s => s.id === specialistConflict[0])?.name || 'un especialista';
        const [day, time] = key.split('-');
        return {
            suggestion: `Conflicto detectado: ${specialistName} tiene múltiples sesiones programadas el ${day} a las ${time}.`,
            suggestionType: "conflict",
        };
    }
    
    const spaceConflict = Object.entries(spaceCounts).find(([_, count]) => count > 1);
    if (spaceConflict) {
        const spaceName = input.spaces.find(s => s.id === spaceConflict[0])?.name || 'un espacio';
        const [day, time] = key.split('-');
        return {
            suggestion: `Conflicto detectado: ${spaceName} está siendo usado para múltiples sesiones el ${day} a las ${time}.`,
            suggestionType: "conflict",
        };
    }
  }
  
  // Simulate checking for optimization
  const sessionEnrollment = input.sessions
    .filter(s => s.sessionType === 'Grupal')
    .map(session => {
      const space = input.spaces.find(s => s.id === session.spaceId);
      if (!space || space.capacity === 0) return { ...session, utilization: 0 };
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
    suggestion: "¡Todo en orden! No se encontraron conflictos ni optimizaciones evidentes.",
    suggestionType: "info"
  };
}
