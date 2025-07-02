'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';

export default function AssistantPage() {
  return (
    <div>
      <PageHeader
        title="Asistente de IA para Horarios"
        description="Esta función se encuentra temporalmente en mantenimiento."
      />
      <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <Bot className="h-5 w-5" /> Mantenimiento
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-slate-600 dark:text-slate-300">
                Estamos realizando mejoras en nuestro asistente de IA. Vuelve a intentarlo más tarde.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
