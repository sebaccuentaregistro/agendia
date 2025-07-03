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
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">TÉRMINOS Y CONDICIONES DE USO - AGENDIA</h1>
            </header>
            <main className="prose-sm sm:prose-base dark:prose-invert max-w-none space-y-4 text-slate-700 dark:text-slate-300">
              <p className="font-semibold text-foreground">
                Al utilizar Agendia, aceptás estos términos:
              </p>
              
              <ul className="list-disc pl-6 space-y-2">
                <li>Uso bajo exclusiva responsabilidad del usuario.</li>
                <li>Agendia no garantiza disponibilidad continua o ininterrumpida del servicio.</li>
                <li>Agendia no se hace responsable por pérdida, eliminación o corrupción de datos cargados.</li>
                <li>El usuario es responsable de mantener copias de seguridad de su información.</li>
                <li>El usuario se compromete a usar la aplicación conforme a la ley y mantener la confidencialidad de sus credenciales.</li>
                <li>Agendia puede actualizar estos términos en cualquier momento.</li>
                <li>El uso de Agendia implica la aceptación total de estos términos.</li>
              </ul>
              
              <h2 className="text-2xl font-bold pt-6 text-slate-800 dark:text-slate-100 border-t border-white/20 mt-8">TÉRMINOS ADICIONALES</h2>

              <h3 className="text-xl font-bold pt-4 text-slate-800 dark:text-slate-100">1. Limitación de Garantía</h3>
              <p>Agendia se proporciona "tal cual", sin garantías de ningún tipo, expresas o implícitas.</p>
              
              <h3 className="text-xl font-bold pt-4 text-slate-800 dark:text-slate-100">2. Soporte Técnico</h3>
              <p>El soporte no es garantizado y está sujeto a disponibilidad del proveedor.</p>

              <h3 className="text-xl font-bold pt-4 text-slate-800 dark:text-slate-100">3. Cambios en el Servicio</h3>
              <p>Agendia se reserva el derecho de modificar, suspender o discontinuar partes o la totalidad del servicio en cualquier momento sin previo aviso.</p>
              
              <h3 className="text-xl font-bold pt-4 text-slate-800 dark:text-slate-100">4. Uso Permitido</h3>
              <p>El usuario se compromete a no usar Agendia para actividades ilegales, fraudulentas o no autorizadas.</p>
              
              <h3 className="text-xl font-bold pt-4 text-slate-800 dark:text-slate-100">5. Propiedad Intelectual</h3>
              <p>El contenido, diseño y código de Agendia son propiedad del proveedor. No se permite su reproducción o redistribución sin autorización.</p>

              <h3 className="text-xl font-bold pt-4 text-slate-800 dark:text-slate-100">6. Responsabilidad del Usuario</h3>
              <p>El usuario es responsable de la veracidad y legalidad de los datos cargados en la plataforma.</p>

              <h3 className="text-xl font-bold pt-4 text-slate-800 dark:text-slate-100">7. Exclusión de Daños Indirectos</h3>
              <p>Agendia no será responsable por daños indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso del servicio.</p>

              <h3 className="text-xl font-bold pt-4 text-slate-800 dark:text-slate-100">8. Rescisión de Acceso</h3>
              <p>El proveedor puede suspender o cancelar el acceso del usuario en caso de incumplimiento de estos términos.</p>

              <h3 className="text-xl font-bold pt-4 text-slate-800 dark:text-slate-100">9. Legislación Aplicable</h3>
              <p>Estos términos se rigen por las leyes vigentes en [tu país o jurisdicción], y cualquier disputa será resuelta en sus tribunales competentes.</p>

              <h3 className="text-xl font-bold pt-4 text-slate-800 dark:text-slate-100">10. Aceptación de Riesgos</h3>
              <p>El usuario acepta que existen riesgos inherentes al uso de servicios en línea y asume la responsabilidad de dichos riesgos.</p>

              <h3 className="text-xl font-bold pt-4 text-slate-800 dark:text-slate-100">11. Backup de Datos</h3>
              <p>Se recomienda al usuario realizar copias de seguridad periódicas de los datos cargados. Agendia no está diseñada como sistema de almacenamiento definitivo ni de respaldo permanente.</p>

              <h3 className="text-xl font-bold pt-4 text-slate-800 dark:text-slate-100">12. Notificaciones</h3>
              <p>Agendia puede enviar notificaciones o avisos sobre cambios en el servicio o en estos términos a través del sistema o por correo electrónico registrado.</p>

              <h3 className="text-xl font-bold pt-4 text-slate-800 dark:text-slate-100">13. Modificación de Términos</h3>
              <p>El proveedor se reserva el derecho de actualizar estos términos en cualquier momento. El uso continuado de la app implica aceptación de las modificaciones.</p>

              <h3 className="text-xl font-bold pt-4 text-slate-800 dark:text-slate-100">14. Confidencialidad</h3>
              <p>El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades realizadas desde su cuenta.</p>

              <h3 className="text-xl font-bold pt-4 text-slate-800 dark:text-slate-100">15. Protección de Datos</h3>
              <p>El proveedor no venderá ni compartirá datos personales con terceros sin consentimiento, salvo obligación legal. Los datos se usarán exclusivamente para el funcionamiento de la app.</p>

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
