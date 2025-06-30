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
  return generateScheduleFlow(input);
}

const generateSchedulePrompt = ai.definePrompt({
  name: 'generateSchedulePrompt',
  input: {schema: ScheduleRequestSchema},
  output: {schema: ScheduleResponseSchema},
  prompt: `You are an expert AI scheduler for a wellness center. Your task is to create an optimized weekly schedule based on the availability of specialists and the preferences of the members.

  **Instructions:**
  1.  Analyze the specialist availability carefully.
  2.  Consider the member preferences for class types and times.
  3.  Create a balanced and logical schedule in Spanish, presented day by day (Lunes, Martes, etc.).
  4.  Provide a clear reasoning for your scheduling decisions, explaining how you optimized for popularity and specialist availability.
  5.  The output must be in valid JSON format matching the provided schema.

  **Input Data:**
  - Specialist Availability: {{{availability}}}
  - Member Preferences: {{{preferences}}}`,
});

const generateScheduleFlow = ai.defineFlow(
  {
    name: 'generateScheduleFlow',
    inputSchema: ScheduleRequestSchema,
    outputSchema: ScheduleResponseSchema,
  },
  async (input) => {
    const {output} = await generateSchedulePrompt(input);
    return output!;
  }
);
