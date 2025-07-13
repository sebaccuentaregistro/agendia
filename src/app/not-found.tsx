
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-transparent">
      <Card className="w-full max-w-md text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">404 - Página no encontrada</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Lo sentimos, la página que buscas no existe o fue movida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
