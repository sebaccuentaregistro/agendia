
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, onSnapshot, doc, Timestamp, getDocs, query, where, writeBatch } from 'firebase/firestore';
import type { Actividad, Specialist, Person, Session, Payment, Space, SessionAttendance, AppNotification, Tariff, Level, VacationPeriod, NewPersonData } from '@/types';
import * as firestoreActions from '@/lib/firestore-actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { addMonths, parse } from 'date-fns';

type State = {
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
};

interface StudioContextType extends State {
    loading: boolean;
    addActividad: (data: Omit<Actividad, 'id'>) => Promise<void>;
    updateActividad: (data: Actividad) => Promise<void>;
    deleteActividad: (id: string) => Promise<void>;
    addSpecialist: (data: Omit<Specialist, 'id' | 'avatar'>) => Promise<void>;
    updateSpecialist: (data: Specialist) => Promise<void>;
    deleteSpecialist: (id: string) => Promise<void>;
    addPerson: (data: NewPersonData) => Promise<void>;
    updatePerson: (data: Person) => Promise<void>;
    deletePerson: (id: string) => Promise<void>;
    recordPayment: (personId: string) => Promise<void>;
    revertLastPayment: (personId: string) => Promise<void>;
    addSpace: (data: Omit<Space, 'id'>) => Promise<void>;
    updateSpace: (data: Space) => Promise<void>;
    deleteSpace: (id: string) => Promise<void>;
    addSession: (data: Omit<Session, 'id'| 'personIds' | 'waitlistPersonIds'>) => Promise<void>;
    updateSession: (data: Session) => Promise<void>;
    deleteSession: (id: string) => Promise<void>;
    enrollPersonInSessions: (personId: string, sessionIds: string[]) => Promise<void>;
    enrollPeopleInClass: (sessionId: string, personIds: string[]) => Promise<void>;
    saveAttendance: (sessionId: string, presentIds: string[], absentIds: string[], justifiedAbsenceIds: string[]) => Promise<void>;
    addJustifiedAbsence: (personId: string, sessionId: string, date: Date) => Promise<void>;
    addOneTimeAttendee: (sessionId: string, personId: string, date: Date) => Promise<void>;
    addVacationPeriod: (personId: string, startDate: Date, endDate: Date) => Promise<void>;
    removeVacationPeriod: (personId: string, vacationId: string) => Promise<void>;
    isPersonOnVacation: (person: Person, date: Date) => boolean;
    enrollFromWaitlist: (notificationId: string, sessionId: string, personId: string) => Promise<void>;
    dismissNotification: (id: string) => Promise<void>;
    addTariff: (data: Omit<Tariff, 'id'>) => Promise<void>;
    updateTariff: (data: Tariff) => Promise<void>;
    deleteTariff: (id: string) => Promise<void>;
    addLevel: (data: Omit<Level, 'id'>) => Promise<void>;
    updateLevel: (data: Level) => Promise<void>;
    deleteLevel: (id: string) => Promise<void>;
    isTutorialOpen: boolean;
    openTutorial: () => void;
    closeTutorial: () => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

// Helper to convert Firestore Timestamps to JS Dates in nested objects
const convertTimestamps = (data: any) => {
    const newData = { ...data };
    for (const key in newData) {
        if (newData[key] instanceof Timestamp) {
            newData[key] = newData[key].toDate();
        } else if (Array.isArray(newData[key])) {
            newData[key] = newData[key].map(item =>
                (typeof item === 'object' && item !== null) ? convertTimestamps(item) : item
            );
        }
    }
    return newData;
};

export function StudioProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { userProfile, loading: authLoading } = useAuth();
  
  const [state, setState] = useState<State>({
    actividades: [], specialists: [], people: [], sessions: [],
    payments: [], spaces: [], attendance: [], notifications: [], tariffs: [], levels: [],
  });
  const [loading, setLoading] = useState(true);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  
  const instituteId = userProfile?.instituteId;

  useEffect(() => {
    if (!instituteId) {
      if (!authLoading) {
        setLoading(false);
      }
      return;
    }
    
    setLoading(true);
    const instituteRef = doc(db, 'institutes', instituteId);
    
    const collectionsToListen: (keyof State)[] = [
      'actividades', 'specialists', 'people', 'sessions', 'payments', 
      'spaces', 'attendance', 'notifications', 'tariffs', 'levels'
    ];

    const unsubscribes = collectionsToListen.map((collectionName) => {
      const collectionRef = collection(instituteRef, collectionName);
      return onSnapshot(collectionRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamps(doc.data()),
        }));
        setState(prev => ({ ...prev, [collectionName]: data }));
      }, (error) => {
        console.error(`Error fetching ${collectionName}:`, error);
        toast({ title: `Error al cargar ${collectionName}`, description: error.message, variant: 'destructive' });
      });
    });

    setLoading(false);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [instituteId, authLoading, toast]);

   useEffect(() => {
    if (authLoading || loading || !instituteId) return;

    const checkChurnRisk = async () => {
        const CHURN_THRESHOLD = 3;
        const notificationType = 'churnRisk';

        for (const person of state.people) {
            // Check if there's already an active churn notification for this person
            const existingNotification = state.notifications.find(
                n => n.type === notificationType && n.personId === person.id
            );
            if (existingNotification) {
                continue; // Skip if notification already exists
            }

            // Find sessions this person is enrolled in
            const personSessions = state.sessions.filter(s => s.personIds.includes(person.id));
            if (personSessions.length === 0) continue;
            
            const personSessionIds = new Set(personSessions.map(s => s.id));

            // Get all attendance records relevant to this person, sorted by most recent
            const personAttendance = state.attendance
                .filter(a => personSessionIds.has(a.sessionId))
                .sort((a, b) => b.date.localeCompare(a.date));

            let consecutiveAbsences = 0;

            for (const record of personAttendance) {
                // Ignore records for dates the person was on vacation
                const recordDate = parse(record.date, 'yyyy-MM-dd', new Date());
                if (isPersonOnVacation(person, recordDate)) {
                    continue;
                }
                
                // Only consider this record if the person was supposed to be there
                // (i.e., not a justified absence or already present)
                const wasSupposedToBeThere = !record.justifiedAbsenceIds?.includes(person.id) && !record.presentIds?.includes(person.id);

                if (wasSupposedToBeThere && record.absentIds?.includes(person.id)) {
                    consecutiveAbsences++;
                } else if (record.presentIds?.includes(person.id)) {
                    // If they were present, the streak is broken
                    break;
                }

                if (consecutiveAbsences >= CHURN_THRESHOLD) {
                    // Create notification
                    const newNotification = {
                        type: notificationType,
                        personId: person.id,
                        createdAt: new Date(),
                    };
                    try {
                        await addEntity(getCollectionRef('notifications'), newNotification);
                    } catch (error) {
                        console.error("Error creating churn risk notification:", error);
                    }
                    break; // Stop checking for this person once a notification is created
                }
            }
        }
    };
    
    // Run the check once, a few seconds after data is loaded.
    const timer = setTimeout(() => {
        checkChurnRisk();
    }, 3000);
    
    return () => clearTimeout(timer);

  }, [state.people, state.sessions, state.attendance, state.notifications, authLoading, loading, instituteId]);


  const openTutorial = useCallback(() => setIsTutorialOpen(true), []);
  const closeTutorial = useCallback(() => {
    setIsTutorialOpen(false);
    try {
      localStorage.setItem('agendia-tutorial-completed', 'true');
    } catch (e) { console.warn("Could not save tutorial state."); }
  }, []);


  const isPersonOnVacation = useCallback((person: Person, date: Date): boolean => {
    if (!person.vacationPeriods) return false;
    const checkDate = new Date(date.setHours(0, 0, 0, 0));
    return person.vacationPeriods.some(period => {
        if (!period.startDate || !period.endDate) return false;
        return checkDate >= new Date(new Date(period.startDate).setHours(0,0,0,0)) && checkDate <= new Date(new Date(period.endDate).setHours(23,59,59,999));
    });
  }, []);

  const getCollectionRef = (name: string) => {
    if (!instituteId) throw new Error("No hay un ID de instituto disponible.");
    return collection(db, 'institutes', instituteId, name);
  };
  
  const getDocRef = (collectionName: string, id: string) => {
     if (!instituteId) throw new Error("No hay un ID de instituto disponible.");
     return doc(db, 'institutes', instituteId, collectionName, id);
  }

  const performFirestoreAction = async (actionName: string, actionFn: () => Promise<any>) => {
    try {
      await actionFn();
      toast({ title: `${actionName} con éxito`, description: 'La operación se completó correctamente.' });
    } catch (error: any) {
      console.error(`Error in ${actionName}:`, error);
      toast({ title: `Error en ${actionName}`, description: error.message, variant: 'destructive' });
    }
  };
  
  const allDataForMessages = {
      sessions: state.sessions,
      people: state.people,
      actividades: state.actividades,
      specialists: state.specialists,
      spaces: state.spaces,
      levels: state.levels,
  };
  
  const deleteWithUsageCheck = async (entityId: string, checks: any[], collectionName: string) => {
     if (!instituteId) throw new Error("Institute ID not found");
     const collectionRefs = {
        sessions: getCollectionRef('sessions'),
        people: getCollectionRef('people'),
        specialists: getCollectionRef('specialists'),
     };
     await firestoreActions.deleteWithUsageCheckAction(entityId, checks, collectionRefs, allDataForMessages);
     await firestoreActions.deleteEntity(getDocRef(collectionName, entityId));
  };

  const addActividad = async (data: Omit<Actividad, 'id'>) => {
    await performFirestoreAction('Añadir actividad', () => firestoreActions.addEntity(getCollectionRef('actividades'), data));
  };
  const updateActividad = async (data: Actividad) => {
    await performFirestoreAction('Actualizar actividad', () => firestoreActions.updateEntity(getDocRef('actividades', data.id), data));
  };
  const deleteActividad = async (id: string) => {
    await performFirestoreAction('Eliminar actividad', () => deleteWithUsageCheck(id,
        [
            { collection: 'sessions', field: 'actividadId', label: 'sesión' },
            { collection: 'specialists', field: 'actividadIds', label: 'especialista', type: 'array' }
        ],
        'actividades'
    ));
  };
  
  const addLevel = async (data: Omit<Level, 'id'>) => {
     await performFirestoreAction('Añadir nivel', () => firestoreActions.addEntity(getCollectionRef('levels'), data));
  };
  const updateLevel = async (data: Level) => {
     await performFirestoreAction('Actualizar nivel', () => firestoreActions.updateEntity(getDocRef('levels', data.id), data));
  };
  const deleteLevel = async (id: string) => {
    await performFirestoreAction('Eliminar nivel', () => deleteWithUsageCheck(id,
        [
            { collection: 'sessions', field: 'levelId', label: 'sesión' },
            { collection: 'people', field: 'levelId', label: 'persona' }
        ],
        'levels'
    ));
  };

  const addSpace = async (data: Omit<Space, 'id'>) => {
    await performFirestoreAction('Añadir espacio', () => firestoreActions.addEntity(getCollectionRef('spaces'), data));
  };
  const updateSpace = async (data: Space) => {
    await performFirestoreAction('Actualizar espacio', () => firestoreActions.updateEntity(getDocRef('spaces', data.id), data));
  };
  const deleteSpace = async (id: string) => {
    await performFirestoreAction('Eliminar espacio', () => deleteWithUsageCheck(id,
        [{ collection: 'sessions', field: 'spaceId', label: 'sesión' }],
        'spaces'
    ));
  };
  
  const addTariff = async (data: Omit<Tariff, 'id'>) => {
     await performFirestoreAction('Añadir arancel', () => firestoreActions.addEntity(getCollectionRef('tariffs'), data));
  };
  const updateTariff = async (data: Tariff) => {
    await performFirestoreAction('Actualizar arancel', () => firestoreActions.updateEntity(getDocRef('tariffs', data.id), data));
  };
  const deleteTariff = async (id: string) => {
     await performFirestoreAction('Eliminar arancel', () => deleteWithUsageCheck(id,
        [{ collection: 'people', field: 'tariffId', label: 'persona' }],
        'tariffs'
     ));
  };

  const addSpecialist = async (data: Omit<Specialist, 'id' | 'avatar'>) => {
    const newSpecialist = { ...data, avatar: `https://placehold.co/100x100.png` };
    await performFirestoreAction('Añadir especialista', () => firestoreActions.addEntity(getCollectionRef('specialists'), newSpecialist));
  };
  const updateSpecialist = async (data: Specialist) => {
     await performFirestoreAction('Actualizar especialista', () => firestoreActions.updateEntity(getDocRef('specialists', data.id), data));
  };
  const deleteSpecialist = async (id: string) => {
     await performFirestoreAction('Eliminar especialista', () => deleteWithUsageCheck(id,
        [{ collection: 'sessions', field: 'instructorId', label: 'sesión' }],
        'specialists'
    ));
  };
  
  const addPerson = async (data: NewPersonData) => {
    await performFirestoreAction('Añadir persona', () => firestoreActions.addPersonAction(getCollectionRef('people'), data));
  };
  const updatePerson = async (data: Person) => {
    await performFirestoreAction('Actualizar persona', () => firestoreActions.updateEntity(getDocRef('people', data.id), data));
  };
  const deletePerson = async (id: string) => {
    await performFirestoreAction('Eliminar persona', () => firestoreActions.deletePersonAction(getCollectionRef('sessions'), getCollectionRef('people'), id));
  };
  
  const recordPayment = async (personId: string) => {
      const person = state.people.find(p => p.id === personId);
      if (!person) {
        toast({ title: 'Error', description: 'No se encontró a la persona.', variant: 'destructive' });
        return;
      }
       if (!person.tariffId) {
        toast({ title: 'Error', description: 'La persona no tiene un arancel asignado.', variant: 'destructive' });
        return;
      }
      const tariff = state.tariffs.find(t => t.id === person.tariffId);
       if (!tariff) {
        toast({ title: 'Error', description: 'No se encontró el arancel de la persona.', variant: 'destructive' });
        return;
      }
      await performFirestoreAction('Registrar pago', () => firestoreActions.recordPaymentAction(getCollectionRef('payments'), getDocRef('people', person.id), person, tariff));
  };

  const revertLastPayment = async (personId: string) => {
      const person = state.people.find(p => p.id === personId);
      if (!person) {
        toast({ title: 'Error', description: 'No se encontró a la persona.', variant: 'destructive' });
        return;
      }
      await performFirestoreAction('Revertir pago', () => firestoreActions.revertLastPaymentAction(
          getCollectionRef('payments'),
          getDocRef('people', person.id),
          personId,
          person
      ));
  }
  
  const addSession = async (data: Omit<Session, 'id'| 'personIds' | 'waitlistPersonIds'>) => {
    const newSession = { ...data, personIds: [], waitlistPersonIds: [] };
    await performFirestoreAction('Añadir sesión', () => firestoreActions.addEntity(getCollectionRef('sessions'), newSession));
  };
  const updateSession = async (data: Session) => {
    await performFirestoreAction('Actualizar sesión', () => firestoreActions.updateEntity(getDocRef('sessions', data.id), data));
  };
  const deleteSession = async (id: string) => {
    await performFirestoreAction('Eliminar sesión', () => {
        const sessionToDelete = state.sessions.find(s => s.id === id);
        if (sessionToDelete && sessionToDelete.personIds.length > 0) {
            throw new Error(`No se puede eliminar. Hay ${sessionToDelete.personIds.length} persona(s) inscripta(s).`);
        }
        return firestoreActions.deleteEntity(getDocRef('sessions', id));
    });
  };
  
  const enrollPeopleInClass = async (sessionId: string, personIds: string[]) => {
    await performFirestoreAction('Inscribir personas', () => firestoreActions.enrollPeopleInClassAction(getDocRef('sessions', sessionId), personIds));
  };

  const enrollPersonInSessions = async (personId: string, sessionIds: string[]) => {
    await performFirestoreAction('Actualizar inscripciones', () => firestoreActions.enrollPersonInSessionsAction(getCollectionRef('sessions'), personId, sessionIds));
  };
  
  const saveAttendance = async (sessionId: string, presentIds: string[], absentIds:string[], justifiedAbsenceIds:string[]) => {
    await performFirestoreAction('Guardar asistencia', () => firestoreActions.saveAttendanceAction(getCollectionRef('attendance'), sessionId, presentIds, absentIds, justifiedAbsenceIds));
  };
  
  const addJustifiedAbsence = async (personId: string, sessionId: string, date: Date) => {
    await performFirestoreAction('Justificar ausencia', () => firestoreActions.addJustifiedAbsenceAction(getCollectionRef('attendance'), personId, sessionId, date));
  };

  const addOneTimeAttendee = async (sessionId: string, personId: string, date: Date) => {
    await performFirestoreAction('Añadir asistente puntual', () => firestoreActions.addOneTimeAttendeeAction(getCollectionRef('attendance'), sessionId, personId, date));
  };

  const addVacationPeriod = async (personId: string, startDate: Date, endDate: Date) => {
     const person = state.people.find(p => p.id === personId);
     if (!person) return;
     await performFirestoreAction('Añadir vacaciones', () => firestoreActions.addVacationPeriodAction(getDocRef('people', personId), person, startDate, endDate));
  };
  
  const removeVacationPeriod = async (personId: string, vacationId: string) => {
    const person = state.people.find(p => p.id === personId);
    if (!person) return;
    await performFirestoreAction('Eliminar vacaciones', () => firestoreActions.removeVacationPeriodAction(getDocRef('people', personId), person, vacationId));
  };

  const enrollFromWaitlist = async (notificationId: string, sessionId: string, personId: string) => {
    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) return;
    await performFirestoreAction('Inscribir desde lista de espera', () => firestoreActions.enrollFromWaitlistAction(getCollectionRef('sessions'), getCollectionRef('notifications'), notificationId, sessionId, personId, session));
  };
  
  const dismissNotification = async (id: string) => {
    await performFirestoreAction('Descartar notificación', () => firestoreActions.deleteEntity(getDocRef('notifications', id)));
  };

  if (authLoading || loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="space-y-8 w-full max-w-5xl p-8">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-auto w-full rounded-xl aspect-square" />)}
                </div>
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
      </div>
    );
  }

  const contextValue: StudioContextType = {
    ...state,
    loading,
    addActividad,
    updateActividad,
    deleteActividad,
    addSpecialist,
    updateSpecialist,
    deleteSpecialist,
    addPerson,
    updatePerson,
    deletePerson,
    recordPayment,
    revertLastPayment,
    addSpace,
    updateSpace,
    deleteSpace,
    addSession,
    updateSession,
    deleteSession,
    enrollPeopleInClass,
    enrollPersonInSessions,
    saveAttendance,
    addJustifiedAbsence,
    addOneTimeAttendee,
    addVacationPeriod,
    removeVacationPeriod,
    enrollFromWaitlist,
    dismissNotification,
    addTariff,
    updateTariff,
    deleteTariff,
    addLevel,
    updateLevel,
    deleteLevel,
    isPersonOnVacation,
    isTutorialOpen,
    openTutorial,
    closeTutorial,
  };

  return (
    <StudioContext.Provider value={contextValue}>
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
