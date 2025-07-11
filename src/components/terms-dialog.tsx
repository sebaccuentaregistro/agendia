
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TermsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsDialog({ isOpen, onOpenChange }: TermsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Términos y Condiciones de Uso</DialogTitle>
          <DialogDescription>
            Por favor, lee atentamente los siguientes términos antes de utilizar la aplicación.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] my-4 rounded-md border p-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ol className="space-y-4">
              <li>
                <strong>Aceptación de los Términos</strong>
                <p>Al descargar, instalar o usar esta aplicación (en adelante “la App”), usted acepta cumplir y quedar legalmente vinculado por estos Términos y Condiciones. Si no está de acuerdo, no utilice la App.</p>
              </li>
              <li>
                <strong>Uso de la App</strong>
                <p>Usted puede usar la App únicamente para fines legales y conforme a estos Términos. Está prohibido cualquier uso indebido, fraudulento o contrario a la ley.</p>
              </li>
              <li>
                <strong>Disponibilidad y funcionamiento</strong>
                <p>La App se ofrece “tal cual está”, sin garantía de disponibilidad continua ni de funcionamiento libre de errores. El desarrollador no garantiza que la App funcione de forma ininterrumpida, oportuna, segura o libre de errores.</p>
              </li>
              <li>
                <strong>Limitación de responsabilidad</strong>
                <p>El desarrollador no será responsable por daños directos o indirectos, incidentales, especiales o consecuentes, incluyendo (sin limitación):</p>
                <ul className="list-disc pl-6">
                  <li>pérdida de datos,</li>
                  <li>pérdida de beneficios,</li>
                  <li>daños por interrupción de servicio,</li>
                  <li>imposibilidad de acceder o usar la App,</li>
                  <li>errores o fallos en la App,</li>
                  <li>cierre definitivo o temporal de la App.</li>
                </ul>
              </li>
              <li>
                <strong>Almacenamiento y pérdida de datos</strong>
                <p>La App puede almacenar datos de usuario, pero el desarrollador no garantiza la conservación ni la recuperación de dichos datos en caso de falla técnica, cierre de la App, eliminación, ataque informático o cualquier otro motivo. El usuario es responsable de conservar copias de respaldo si lo considera necesario.</p>
              </li>
              <li>
                <strong>Modificaciones o suspensión del servicio</strong>
                <p>El desarrollador se reserva el derecho de modificar, suspender o interrumpir la App o cualquier funcionalidad en cualquier momento, con o sin previo aviso y sin asumir responsabilidad alguna frente al usuario.</p>
              </li>
              <li>
                <strong>Actualizaciones</strong>
                <p>La App puede actualizarse periódicamente. Es responsabilidad del usuario mantenerla actualizada. El desarrollador no se hace responsable de fallos derivados de versiones desactualizadas.</p>
              </li>
              <li>
                <strong>Derechos de propiedad intelectual</strong>
                <p>Todos los derechos sobre la App, su contenido, código, diseño y funcionalidades son propiedad del desarrollador o de sus respectivos titulares. Está prohibida su reproducción o distribución sin autorización expresa.</p>
              </li>
              <li>
                <strong>Modificación de los Términos y Condiciones</strong>
                <p>El desarrollador podrá modificar estos Términos en cualquier momento. El uso continuado de la App después de tales cambios constituye aceptación de los nuevos Términos.</p>
              </li>
              <li>
                <strong>Legislación aplicable y jurisdicción</strong>
                <p>Estos Términos se regirán e interpretarán conforme a las leyes vigentes en la República Argentina. Cualquier disputa será sometida a la jurisdicción de los tribunales competentes de la República Argentina.</p>
              </li>
            </ol>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
