'use server';
/**
 * @fileOverview An AI flow to generate optimized weekly schedules for a wellness center.
 *
 * - generateSchedule - A function that handles the schedule generation process.
 * - ScheduleRequest - The input type for the generateSchedule function.
 * - ScheduleResponse - The return type for the generateSchedule function.
 */

import {z} from 'zod';

// NOTE: This flow is temporarily disabled for deployment debugging.

export const ScheduleRequestSchema = z.object({
  availability: z.string().describe(
    'A description of when each specialist is available and what they specialize in.'
  ),
  preferences: z.string().describe(
    'Information about what types of classes are popular and at what times.'
  ),
});
export type ScheduleRequest = z.infer<typeof ScheduleRequestSchema>;

export const ScheduleResponseSchema = z.object({
  schedule: z.string().describe(
    'The generated weekly schedule in a clear, day-by-day format.'
  ),
  reasoning: z.string().describe(
    'An explanation of the decisions made to optimize the schedule.'
  ),
});
export type ScheduleResponse = z.infer<typeof ScheduleResponseSchema>;

export async function generateSchedule(
  input: ScheduleRequest
): Promise<ScheduleResponse> {
  console.log('AI schedule generation is temporarily disabled for debugging.');
  // Return a dummy response to avoid application errors.
  return {
    schedule:
      'El asistente de IA está temporalmente desactivado para mantenimiento. Por favor, intente más tarde.',
    reasoning:
      'El sistema está siendo actualizado para mejorar la estabilidad.',
  };
}
