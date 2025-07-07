

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import type { Actividad, Specialist, Person, Session, Payment, Space, SessionAttendance, AppNotification, Tariff, Level } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { set, addMonths, differenceInDays, addDays, format as formatDate } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, query, where, getDocs, Timestamp, orderBy, CollectionReference, getDoc, setDoc } from 'firebase/firestore';
import * as Actions from '@/lib/firestore-actions';
import { getNextPaymentDate } from '@/lib/utils';

// Helper function to convert Firestore Timestamps to Dates in nested objects
const convertTimestamps = (data: any) => {
    if (!data) return data;
    const newData = { ...data };
    for (const key in newData) {
        if (newData[key] instanceof Timestamp) {
            newData[key] = newData[key].toDate();
        } else if (key === 'vacationPeriods' && Array.isArray(newData[key])) {
            newData[key] = newData[key].map(convertTimestamps);
        } else if (typeof newData[key] === 'object' && newData[key] !== null && !Array.isArray(newData[key])) {
            newData[key] = convertTimestamps(newData[key]);
        }
    }
    return newData;
};

interface StudioContextType {
  actividades: Actividad[];
  specialists: Specialist[];
  people: Person[];
  sessions: Session[];
  payments: Payment[];
  spaces: Space[];
  attendance: SessionAttendance[];
  notifications: AppNotification[];
  tariffs: Tariff[];
  levels: Level[];
  addActividad: (actividad: Omit<Actividad, 'id'>) => void;
  updateActividad: (actividad: Actividad) => void;
  deleteActividad: (actividadId: string) => void;
  addSpecialist: (specialist: Omit<Specialist, 'id' | 'avatar'>) => void;
  updateSpecialist: (specialist: Specialist) => void;
  deleteSpecialist: (specialistId: string) => void;
  addPerson: (person: Omit<Person, 'id' | 'avatar' | 'joinDate' | 'lastPaymentDate' | 'vacationPeriods'>) => void;
  updatePerson: (person: Person) => void;
  deletePerson: (personId: string) => void;
  recordPayment: (personId: string) => void;
  undoLastPayment: (personId: string) => void;
  addSpace: (space: Omit<Space, 'id'>) => void;
  updateSpace: (space: Space) => void;
  deleteSpace: (spaceId: string) => void;
  addSession: (session: Omit<Session, 'id' | 'personIds' | 'waitlistPersonIds'>) => void;
  updateSession: (session: Session) => void;
  deleteSession: (sessionId: string) => void;
  enrollPersonInSessions: (personId: string, sessionIds: string[]) => void;
  enrollPeopleInClass: (sessionId: string, personIds: string[]) => void;
  saveAttendance: (sessionId: string, presentIds: string[], absentIds: string[], justifiedAbsenceIds: string[]) => void;
  addOneTimeAttendee: (sessionId: string, personId: string, date: Date) => void;
  addJustifiedAbsence: (personId: string, sessionId: string, date: Date) => void;
  addVacationPeriod: (personId: string, startDate: Date, endDate: Date) => void;
  removeVacationPeriod: (personId: string, vacationId: string) => void;
  isPersonOnVacation: (person: Person, date: Date) => boolean;
  addToWaitlist: (sessionId: string, personId: string) => void;
  enrollFromWaitlist: (notificationId: string, sessionId: string, personId: string) => void;
  dismissNotification: (notificationId: string) => void;
  addTariff: (tariff: Omit<Tariff, 'id'>) => void;
  updateTariff: (tariff: Tariff) => void;
  deleteTariff: (tariffId: string) => void;
  addLevel: (level: Omit<Level, 'id'>) => void;
  updateLevel: (level: Level) => void;
  deleteLevel: (levelId: string) => void;
  isTutorialOpen: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({ children, instituteId }: { children: ReactNode, instituteId: string }) {
  const { toast } = useToast();
  
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [attendance, setAttendance] = useState<SessionAttendance[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const openTutorial = useCallback(() => setIsTutorialOpen(true), []);
  const closeTutorial = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('agendia-tutorial-completed', 'true');
    }
    setIsTutorialOpen(false);
  }, []);

  const collectionRefs = useMemo(() => {
      const instituteRef = doc(db, 'institutes', instituteId);
      return {
          actividades: collection(instituteRef, 'actividades'),
          specialists: collection(instituteRef, 'specialists'),
          people: collection(instituteRef, 'people'),
          sessions: collection(instituteRef, 'sessions'),
          payments: collection(instituteRef, 'payments'),
          spaces: collection(instituteRef, 'spaces'),
          attendance: collection(instituteRef, 'attendance'),
          notifications: collection(instituteRef, 'notifications'),
          tariffs: collection(instituteRef, 'tariffs'),
          levels: collection(instituteRef, 'levels'),
      };
  }, [instituteId]);

  useEffect(() => {
    if (!instituteId) return;

    const collectionsToFetch = [
        { name: 'actividades', setter: setActividades, ref: collectionRefs.actividades },
        { name: 'specialists', setter: setSpecialists, ref: collectionRefs.specialists },
        { name: 'people', setter: setPeople, ref: collectionRefs.people },
        { name: 'sessions', setter: setSessions, ref: collectionRefs.sessions },
        { name: 'payments', setter: setPayments, ref: collectionRefs.payments },
        { name: 'spaces', setter: setSpaces, ref: collectionRefs.spaces },
        { name: 'attendance', setter: setAttendance, ref: collectionRefs.attendance },
        { name: 'notifications', setter: setNotifications, ref: collectionRefs.notifications },
        { name: 'tariffs', setter: setTariffs, ref: collectionRefs.tariffs },
        { name: 'levels', setter: setLevels, ref: collectionRefs.levels },
    ];

    const unsubscribes = collectionsToFetch.map(({ name, setter, ref }) => {
        let q;
        if (name === 'payments') {
            q = query(ref, orderBy('date', 'desc'));
        } else if (['sessions', 'attendance', 'notifications'].includes(name)) {
            q = query(ref); // No specific ordering for these collections
        } else {
            // Default for collections with a 'name' field
            q = query(ref, orderBy('name', 'asc')); 
        }

        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) })) as any[];
            setter(data);
        }, (error) => {
            console.error(`Error fetching ${name}:`, error);
            toast({ variant: 'destructive', title: `Error al cargar ${name}`, description: 'No se pudieron cargar los datos. Intenta recargar la página.' });
        });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [instituteId, collectionRefs, toast]);
  
  const allData = useMemo(() => ({
    actividades, specialists, people, sessions, payments, spaces, attendance, notifications, tariffs, levels
  }), [actividades, specialists, people, sessions, payments, spaces, attendance, notifications, tariffs, levels]);

  const handleAction = useCallback(async (action: Promise<any>, successMessage: string) => {
      try {
          await action;
          toast({ title: 'Éxito', description: successMessage });
      } catch (error: any) {
          console.error("Firestore action error:", error);
          toast({ variant: "destructive", title: "Error de base de datos", description: error.message || "La operación no se pudo completar." });
      }
  }, [toast]);

  const isPersonOnVacation = useCallback((person: Person, date: Date): boolean => {
    if (!person.vacationPeriods) return false;
    const checkDate = set(date, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
    
    return person.vacationPeriods.some(period => {
        const startDate = set(period.startDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
        const endDate = set(period.endDate, { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 });
        return checkDate >= startDate && checkDate <= endDate;
    });
  }, []);

  const deleteWithUsageCheck = useCallback(async (
    entityId: string,
    entityName: string,
    checks: { collection: string; field: string; label: string, type?: 'array' }[]
  ) => {
    try {
        await Actions.deleteWithUsageCheckAction(entityId, checks, collectionRefs, allData);
    } catch (error: any) {
        console.error(`Error deleting entity:`, error);
        toast({
            variant: "destructive",
            title: `No se puede eliminar "${entityName}"`,
            description: <pre className="mt-2 w-full max-w-[340px] rounded-md bg-slate-950 p-4 text-white whitespace-pre-wrap">{error.message}</pre>,
            duration: 10000,
        });
        throw error; // Re-throw to prevent deletion
    }
  }, [collectionRefs, allData, toast]);
  
  return (
    <StudioContext.Provider value={{ 
        actividades, specialists, people, sessions, payments, spaces, attendance, notifications, tariffs, levels,
        isPersonOnVacation, isTutorialOpen, openTutorial, closeTutorial, 
        addActividad: (data) => handleAction(Actions.addEntity(collectionRefs.actividades, data), 'Actividad añadida.'),
        updateActividad: (data) => handleAction(Actions.updateEntity(doc(collectionRefs.actividades, data.id), data), 'Actividad actualizada.'),
        deleteActividad: async (id) => {
            const actividad = actividades.find(a => a.id === id);
            if (!actividad) return;
            try {
                await deleteWithUsageCheck(id, actividad.name, [
                    {collection: 'specialists', field: 'actividadIds', label: 'especialista', type: 'array'}, 
                    {collection: 'sessions', field: 'actividadId', label: 'sesión'}
                ]);
                await Actions.deleteEntity(doc(collectionRefs.actividades, id));
                toast({ title: 'Éxito', description: 'Actividad eliminada correctamente.' });
            } catch {} // Error is already handled by toast in deleteWithUsageCheck
        },
        addSpecialist: (data) => handleAction(Actions.addEntity(collectionRefs.specialists, {...data, avatar: `https://placehold.co/100x100.png`}), 'Especialista añadido.'),
        updateSpecialist: (data) => handleAction(Actions.updateEntity(doc(collectionRefs.specialists, data.id), data), 'Especialista actualizado.'),
        deleteSpecialist: async (id) => {
            const specialist = specialists.find(s => s.id === id);
            if (!specialist) return;
            try {
                await deleteWithUsageCheck(id, specialist.name, [{collection: 'sessions', field: 'instructorId', label: 'sesión'}]);
                await Actions.deleteEntity(doc(collectionRefs.specialists, id));
                toast({ title: 'Éxito', description: 'Especialista eliminado correctamente.' });
            } catch {}
        },
        addPerson: (data) => handleAction(Actions.addPersonAction(collectionRefs.people, data), 'Persona añadida.'),
        updatePerson: (data) => handleAction(Actions.updateEntity(doc(collectionRefs.people, data.id), data), 'Persona actualizada.'),
        deletePerson: (id) => handleAction(Actions.deletePersonAction(collectionRefs.sessions, collectionRefs.people, id), 'Persona eliminada.'),
        recordPayment: (personId) => {
            const person = people.find(p => p.id === personId);
            if (!person) {
                toast({ variant: 'destructive', title: 'Error', description: 'Persona no encontrada.' });
                return;
            }
        
            // The date up to which the person is currently paid.
            const currentExpiry = person.lastPaymentDate;
            
            // The next expiry date is one month from the current one.
            // We must respect the original join day.
            const joinDay = person.joinDate.getDate();
        
            // Set the day of the month on the current expiry date to the join day, then add a month.
            // This handles cases where the expiry date might have shifted due to vacations.
            const baseDateForNextMonth = set(currentExpiry, { date: joinDay });
            const newExpiryDate = addMonths(baseDateForNextMonth, 1);
        
            handleAction(Actions.recordPaymentAction(collectionRefs.payments, collectionRefs.people, personId, newExpiryDate), 'Pago registrado.');
        },
        undoLastPayment: (personId) => {
            const person = people.find(p => p.id === personId);
            if (!person) {
                toast({ variant: 'destructive', title: 'Error', description: 'Persona no encontrada.' });
                return;
            }
            const personPayments = payments.filter(p => p.personId === personId); // Already sorted by date desc
        
            if (personPayments.length > 0) {
                const paymentToDelete = personPayments[0];
                
                // To revert, we simply go back one month from the current expiry date,
                // while still respecting the original join day.
                const currentExpiry = person.lastPaymentDate;
                const joinDay = person.joinDate.getDate();
        
                const baseDateForPreviousMonth = set(currentExpiry, { date: joinDay });
                const previousExpiryDate = addMonths(baseDateForPreviousMonth, -1);
        
                handleAction(Actions.undoLastPaymentAction(collectionRefs.payments, collectionRefs.people, personId, paymentToDelete, previousExpiryDate), 'Último pago deshecho.');
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'No hay pagos para deshacer.' });
            }
        },
        addSpace: (data) => handleAction(Actions.addEntity(collectionRefs.spaces, data), 'Espacio añadido.'),
        updateSpace: (data) => handleAction(Actions.updateEntity(doc(collectionRefs.spaces, data.id), data), 'Espacio actualizado.'),
        deleteSpace: async (id) => {
            const space = spaces.find(s => s.id === id);
            if (!space) return;
            try {
                await deleteWithUsageCheck(id, space.name, [{collection: 'sessions', field: 'spaceId', label: 'sesión'}]);
                await Actions.deleteEntity(doc(collectionRefs.spaces, id));
                toast({ title: 'Éxito', description: 'Espacio eliminado correctamente.' });
            } catch {}
        },
        addSession: (data) => handleAction(Actions.addEntity(collectionRefs.sessions, {...data, personIds: [], waitlistPersonIds: []}), 'Sesión añadida.'),
        updateSession: (data) => handleAction(Actions.updateEntity(doc(collectionRefs.sessions, data.id), data), 'Sesión actualizada.'),
        deleteSession: async (id) => {
            const session = sessions.find(s => s.id === id);
            if (!session) return;
            const sessionName = `${actividades.find(a => a.id === session.actividadId)?.name || 'Sesión'} (${session.dayOfWeek} ${session.time})`;

            if (session.personIds && session.personIds.length > 0) {
                const peopleInSession = session.personIds
                    .map(pid => people.find(p => p.id === pid)?.name || null)
                    .filter(Boolean);
                
                const errorMessage = `Tiene ${peopleInSession.length} persona(s) inscripta(s):\n\n- ${peopleInSession.join('\n- ')}\n\nPor favor, quita a estas personas de la sesión antes de eliminarla.`;

                toast({
                    variant: "destructive",
                    title: `No se puede eliminar "${sessionName}"`,
                    description: <pre className="mt-2 w-full max-w-[340px] rounded-md bg-slate-950 p-4 text-white whitespace-pre-wrap">{errorMessage}</pre>,
                    duration: 10000,
                });
                return;
            }

            try {
                await deleteWithUsageCheck(id, sessionName, []);
                await Actions.deleteEntity(doc(collectionRefs.sessions, id));
                toast({ title: 'Éxito', description: 'Sesión eliminada correctamente.' });
            } catch {}
        },
        enrollPersonInSessions: (personId, sessionIds) => handleAction(Actions.enrollPersonInSessionsAction(collectionRefs.sessions, personId, sessionIds, sessions), 'Inscripciones actualizadas.'),
        enrollPeopleInClass: (sessionId, personIds) => handleAction(Actions.enrollPeopleInClassAction(doc(collectionRefs.sessions, sessionId), personIds), 'Inscripciones actualizadas.'),
        saveAttendance: (sessionId, presentIds, absentIds, justifiedIds) => handleAction(Actions.saveAttendanceAction(collectionRefs.attendance, sessionId, presentIds, absentIds, justifiedIds), 'Asistencia guardada.'),
        addOneTimeAttendee: (sessionId, personId, date) => handleAction(Actions.addOneTimeAttendeeAction(collectionRefs.attendance, sessionId, personId, date), 'Asistente puntual añadido.'),
        addJustifiedAbsence: (personId, sessionId, date) => handleAction(Actions.addJustifiedAbsenceAction(collectionRefs.attendance, personId, sessionId, date), 'Ausencia justificada.'),
        addVacationPeriod: (personId, startDate, endDate) => {
            const person = people.find(p => p.id === personId);
            if(person) handleAction(Actions.addVacationPeriodAction(doc(collectionRefs.people, personId), person, startDate, endDate), 'Período de vacaciones añadido.');
        },
        removeVacationPeriod: (personId, vacationId) => {
            const person = people.find(p => p.id === personId);
            if(person) handleAction(Actions.removeVacationPeriodAction(doc(collectionRefs.people, personId), person, vacationId), 'Período de vacaciones eliminado.');
        },
        addToWaitlist: (sessionId, personId) => {
            const session = sessions.find(s => s.id === sessionId);
            if(session) handleAction(Actions.addToWaitlistAction(doc(collectionRefs.sessions, sessionId), session, personId), 'Anotado en lista de espera.');
        },
        enrollFromWaitlist: (notificationId, sessionId, personId) => {
            const session = sessions.find(s => s.id === sessionId);
            if(session) handleAction(Actions.enrollFromWaitlistAction(collectionRefs.sessions, collectionRefs.notifications, notificationId, sessionId, personId, session), 'Persona inscripta desde lista de espera.');
        },
        dismissNotification: (id) => handleAction(Actions.deleteEntity(doc(collectionRefs.notifications, id)), 'Notificación descartada.'),
        addTariff: (data) => handleAction(Actions.addEntity(collectionRefs.tariffs, data), 'Arancel añadido.'),
        updateTariff: (data) => handleAction(Actions.updateEntity(doc(collectionRefs.tariffs, data.id), data), 'Arancel actualizado.'),
        deleteTariff: async (tariffId: string) => {
            const tariff = tariffs.find(t => t.id === tariffId);
            try {
                await deleteWithUsageCheck(tariffId, tariff?.name || 'Arancel', []);
                await Actions.deleteEntity(doc(collectionRefs.tariffs, tariffId));
                toast({ title: 'Éxito', description: 'Arancel eliminado correctamente.' });
            } catch {}
        },
        addLevel: (data) => handleAction(Actions.addEntity(collectionRefs.levels, data), 'Nivel añadido.'),
        updateLevel: (data) => handleAction(Actions.updateEntity(doc(collectionRefs.levels, data.id), data), 'Nivel actualizado.'),
        deleteLevel: async (id) => {
            const level = levels.find(l => l.id === id);
            if (!level) return;
            try {
                await deleteWithUsageCheck(id, level.name, [
                    {collection: 'people', field: 'levelId', label: 'persona'}, 
                    {collection: 'sessions', field: 'levelId', label: 'sesión'}
                ]);
                 await Actions.deleteEntity(doc(collectionRefs.levels, id));
                 toast({ title: 'Éxito', description: 'Nivel eliminado correctamente.' });
            } catch {}
        },
    }}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (context === undefined) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
}
