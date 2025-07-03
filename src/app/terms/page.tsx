import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-100 via-purple-200 to-violet-200 dark:from-slate-900 dark:via-purple-950 dark:to-blue-950 p-4 sm:p-6 md:p-8">
      <div className="container mx-auto max-w-4xl py-8">
        <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
          <CardContent className="p-6 md:p-8">
            <header className="mb-8 text-center border-b border-white/20 pb-6">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Términos y Condiciones de Uso</h1>
                <p className="text-muted-foreground mt-2">Última actualización: 3 de Julio de 2024</p>
            </header>
            <main className="prose-sm sm:prose-base dark:prose-invert max-w-none space-y-4 text-slate-700 dark:text-slate-300">
              <p className="text-muted-foreground">
                Por favor, lee estos términos y condiciones cuidadosamente antes de usar Nuestro Servicio.
              </p>
              
              <h2 className="text-xl font-bold pt-4 text-slate-800 dark:text-slate-100">1. Aceptación de los Términos</h2>
              <p>
                Al registrarte y utilizar el servicio de YogaFlow ("el Servicio"), aceptas estar sujeto a estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de los términos, no puedes acceder al Servicio.
              </p>

              <h2 className="text-xl font-bold pt-4 text-slate-800 dark:text-slate-100">2. Descripción del Servicio</h2>
              <p>
                YogaFlow proporciona una plataforma de software como servicio (SaaS) para la gestión de centros de bienestar. El Servicio se proporciona "tal cual" y "según disponibilidad".
              </p>

              <h2 className="text-xl font-bold pt-4 text-slate-800 dark:text-slate-100">3. Limitación de Responsabilidad</h2>
              <p>
                Entiendes y aceptas expresamente que el propietario y los desarrolladores del Servicio no serán responsables de ninguna pérdida o daño directo, indirecto, incidental, especial, consecuente o ejemplar, incluyendo, pero no limitado a, daños por pérdida de beneficios, clientela, uso, datos u otras pérdidas intangibles, resultante de:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>El uso o la imposibilidad de usar el servicio.</li>
                <li>La pérdida, corrupción o alteración de tus datos.</li>
                <li>Cualquier otra cuestión relacionada con el servicio.</li>
              </ul>

              <h2 className="text-xl font-bold pt-4 text-slate-800 dark:text-slate-100">4. Cese del Proyecto</h2>
              <p>
                El propietario se reserva el derecho de modificar, suspender o discontinuar, temporal o permanentemente, el Servicio o cualquier parte del mismo con o sin previo aviso. Aceptas que el propietario no será responsable ante ti ni ante terceros por ninguna modificación, suspensión o discontinuación del Servicio. En caso de que el proyecto sea abandonado, no se podrá realizar ningún tipo de reclamo por la pérdida de datos o la interrupción del servicio.
              </p>

              <h2 className="text-xl font-bold pt-4 text-slate-800 dark:text-slate-100">5. Cambios en los Términos</h2>
              <p>
                Nos reservamos el derecho, a nuestra entera discreción, de modificar o reemplazar estos Términos en cualquier momento. Te notificaremos de cualquier cambio publicando los nuevos Términos en esta página.
              </p>
            </main>
            <footer className="mt-8 text-center pt-6 border-t border-white/20">
              <Button asChild>
                <Link href="/signup">Volver</Link>
              </Button>
            </footer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
