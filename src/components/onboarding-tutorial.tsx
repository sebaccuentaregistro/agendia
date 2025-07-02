'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, Calendar, Users, Heart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const tutorialSteps = [
  {
    icon: Heart,
    title: '¡Bienvenido/a a YogaFlow!',
    description: 'Hemos preparado un breve recorrido para que conozcas las secciones clave de la aplicación y puedas empezar a gestionar tu estudio de bienestar de forma sencilla. ¡Vamos allá!',
  },
  {
    icon: Settings,
    title: '1. Configura tu Estudio (Gestión)',
    description: 'En las secciones de Especialistas, Actividades y Espacios podrás dar de alta todo lo necesario para empezar a operar. Es el primer paso para organizar tu centro.',
  },
  {
    icon: Calendar,
    title: '2. Organiza tus Horarios',
    description: 'La sección de Horarios es el corazón de YogaFlow. Aquí podrás crear nuevas clases, asignarlas a especialistas y espacios, y ver toda tu semana de un vistazo.',
  },
  {
    icon: Users,
    title: '3. Gestiona tus Personas',
    description: 'En la sección Personas podrás llevar un registro completo de tus alumnos: sus datos de contacto, inscripciones a clases, historial de pagos y asistencias.',
  },
];

export function OnboardingTutorial({ isOpen, onClose }: OnboardingTutorialProps) {
  const [step, setStep] = useState(0);

  const currentStep = tutorialSteps[step];
  const totalSteps = tutorialSteps.length;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset step for next time it opens
    setTimeout(() => setStep(0), 300);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <currentStep.icon className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">{currentStep.title}</DialogTitle>
          <DialogDescription className="text-center pt-2">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
           <Progress value={(step + 1) / totalSteps * 100} className="w-full" />
        </div>

        <DialogFooter className="flex-row justify-between w-full sm:justify-between">
          {step > 0 ? (
            <Button variant="outline" onClick={handlePrev}>
              Anterior
            </Button>
          ) : (
            <div/> 
          )}
          
          <Button onClick={handleNext}>
            {step === totalSteps - 1 ? '¡Empezar a usar!' : 'Siguiente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
