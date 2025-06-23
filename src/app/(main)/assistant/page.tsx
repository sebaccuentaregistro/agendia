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
    message: "Please describe instructor availability in at least 20 characters.",
  }),
  studentPreferences: z.string().min(20, {
    message: "Please describe student preferences in at least 20 characters.",
  }),
  classCapacity: z.coerce.number().min(1, {
    message: "Class capacity must be at least 1.",
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
        title: "An error occurred",
        description: "Failed to get a schedule suggestion. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Smart Scheduling Assistant"
        description="Let AI help you create the optimal class schedule for your studio."
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Scheduling Preferences</CardTitle>
            <CardDescription>Provide the details below to get a schedule suggestion.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="instructorAvailability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructor Availability</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Elena is available M/W/F mornings. Marcus prefers evenings..." {...field} />
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
                      <FormLabel>Student Preferences</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Many students requested more evening Vinyasa classes. Beginners prefer weekend mornings." {...field} />
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
                      <FormLabel>Maximum Class Capacity</FormLabel>
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
                      <FormLabel>Current Schedule (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="List your current classes, if any." {...field} />
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
                  Suggest Schedule
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
                <p className="mt-4 text-muted-foreground">AI is crafting the perfect schedule...</p>
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Suggested Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 font-sans text-sm text-muted-foreground">
                    {result.suggestedSchedule}
                  </pre>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Reasoning</CardTitle>
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
