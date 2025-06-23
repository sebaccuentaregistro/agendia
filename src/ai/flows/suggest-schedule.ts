// use server'

/**
 * @fileOverview AI-powered scheduling assistant for suggesting optimal yoga class schedules.
 *
 * - suggestSchedule - A function that suggests a schedule based on instructor availability, student preferences, and class capacity.
 * - SuggestScheduleInput - The input type for the suggestSchedule function.
 * - SuggestScheduleOutput - The return type for the suggestSchedule function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestScheduleInputSchema = z.object({
  instructorAvailability: z
    .string()
    .describe(
      'A description of instructor availability, including days, times, and any constraints.'
    ),
  studentPreferences: z
    .string()
    .describe(
      'A description of student preferences, including preferred days, times, class types, and instructors.'
    ),
  classCapacity: z
    .number()
    .describe('The maximum capacity of each yoga class.'),
  currentSchedule: z
    .string()
    .optional()
    .describe('The current schedule to take into account for suggestions.'),
});
export type SuggestScheduleInput = z.infer<typeof SuggestScheduleInputSchema>;

const SuggestScheduleOutputSchema = z.object({
  suggestedSchedule: z
    .string()
    .describe('The suggested yoga class schedule based on the input parameters.'),
  reasoning: z
    .string()
    .describe('The AI reasoning for suggesting this schedule.'),
});
export type SuggestScheduleOutput = z.infer<typeof SuggestScheduleOutputSchema>;

export async function suggestSchedule(input: SuggestScheduleInput): Promise<SuggestScheduleOutput> {
  return suggestScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSchedulePrompt',
  input: {schema: SuggestScheduleInputSchema},
  output: {schema: SuggestScheduleOutputSchema},
  prompt: `You are an AI assistant designed to create optimal yoga class schedules for yoga studios. Use the information provided to suggest a schedule that maximizes student engagement, accommodates instructor availability and preferences, and respects class capacity.

Instructor Availability: {{{instructorAvailability}}}
Student Preferences: {{{studentPreferences}}}
Class Capacity: {{{classCapacity}}}
Current Schedule: {{{currentSchedule}}}

Based on this information, suggest the optimal class schedule:

{{#if currentSchedule}}
Consider the existing current schedule:
{{currentSchedule}}
{{/if}}

Please provide the suggested schedule and the reasoning for the schedule.`,
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
