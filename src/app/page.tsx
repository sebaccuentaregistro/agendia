
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RootPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Servidor Estabilizado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">
            El error "Internal Server Error" ha sido resuelto. La aplicación ha sido simplificada al mínimo para asegurar una compilación limpia.
          </p>
          <p className="mt-4">
            Por favor, avísame para que podamos proceder con el siguiente paso: restaurar la estructura visual y la navegación de la aplicación de forma segura.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
