
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useReducer, useMemo } from 'react';
import { collection, doc, onSnapshot, Unsubscribe, DocumentReference, CollectionReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Actividad, Specialist, Person, Session, Payment, Space, SessionAttendance, AppNotification, Tariff, Level, VacationPeriod } from '@/types';
import * as actions from '@/lib/firestore-actions';
import { useToast } from '@/hooks/use-toast';
import { addMonths, subDays } from 'date-fns';

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
  loading: boolean;
  error: Error | null;
};

type Action = { type: 'SET_DATA'; payload: { collection: keyof Omit<State, 'loading' | 'error'>, data: any[] } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error };

const initialState: State = {
  actividades: [],
  specialists: [],
  people: [],
  sessions: [],
  payments: [],
  spaces: [],
  attendance: [],
  notifications: [],
  tariffs: [],
  levels: [],
  loading: true,
  error: null,
};

function dataReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, [action.payload.collection]: action.payload.data };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

// Helper to convert Firestore timestamps to Dates
const processDoc = (doc: any) => {
    const data = doc.data();
    for (const key in data) {
        if (data[key] instanceof Object && 'seconds' in data[key] && 'nanoseconds' in data[key]) {
            data[key] = data[key].toDate();
        }
        if (key === 'vacationPeriods' && Array.isArray(data[key])) {
            data[key] = data[key].map((period: any) => ({
                ...period,
                startDate: period.startDate.toDate(),
                endDate: period.endDate.toDate()
            }));
        }
    }
    return { id: doc.id, ...data };
};


interface StudioContextType extends State {
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
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const { toast } = useToast();
  
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const openTutorial = useCallback(() => setIsTutorialOpen(true), []);
  const closeTutorial = useCallback(() => {
      setIsTutorialOpen(false);
      try {
        localStorage.setItem('agendia-tutorial-completed', 'true');
      } catch (e) {
        console.warn("Could not save tutorial state to localStorage.");
      }
  }, []);

  const collectionRefs = useMemo(() => ({
      actividades: collection(db, 'institutes', instituteId, 'actividades'),
      specialists: collection(db, 'institutes', instituteId, 'specialists'),
      people: collection(db, 'institutes', instituteId, 'people'),
      sessions: collection(db, 'institutes', instituteId, 'sessions'),
      payments: collection(db, 'institutes', instituteId, 'payments'),
      spaces: collection(db, 'institutes', instituteId, 'spaces'),
      attendance: collection(db, 'institutes', instituteId, 'attendance'),
      notifications: collection(db, 'institutes', instituteId, 'notifications'),
      tariffs: collection(db, 'institutes', instituteId, 'tariffs'),
      levels: collection(db, 'institutes', instituteId, 'levels'),
  }), [instituteId]);


  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const unsubscribes: Unsubscribe[] = [];

    (Object.keys(collectionRefs) as Array<keyof typeof collectionRefs>).forEach(key => {
      const unsubscribe = onSnapshot(collectionRefs[key], (snapshot) => {
        const data = snapshot.docs.map(processDoc);
        dispatch({ type: 'SET_DATA', payload: { collection: key, data } });
      }, (error) => {
        console.error(`Error fetching ${key}:`, error);
        dispatch({ type: 'SET_ERROR', payload: error });
      });
      unsubscribes.push(unsubscribe);
    });
    
    dispatch({ type: 'SET_LOADING', payload: false });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [collectionRefs]);
  
  const showSuccessToast = (description: string) => toast({ title: 'Éxito', description});
  const showErrorToast = (description: string) => toast({ variant: 'destructive', title: 'Error', description});
  
  const executeAction = async (action: Promise<any>, successMessage: string, errorMessagePrefix: string) => {
    try {
      await action;
      showSuccessToast(successMessage);
    } catch (error: any) {
      console.error(errorMessagePrefix, error);
      showErrorToast(`${errorMessagePrefix}: ${error.message}`);
    }
  };

  const executeDeleteWithUsageCheck = async (entityId: string, checks: any[], collectionName: keyof typeof collectionRefs, successMessage: string) => {
      try {
        await actions.deleteWithUsageCheckAction(entityId, checks, collectionRefs, {
            sessions: state.sessions, people: state.people, actividades: state.actividades, specialists: state.specialists, spaces: state.spaces, levels: state.levels
        });
        await actions.deleteEntity(doc(collectionRefs[collectionName], entityId));
        showSuccessToast(successMessage);
      } catch (error: any) {
        console.error(`Error deleting ${collectionName}:`, error);
        showErrorToast(error.message);
      }
  };


  const addActividad = (data: Omit<Actividad, 'id'>) => executeAction(actions.addEntity(collectionRefs.actividades, data), 'Actividad añadida.', 'Error al añadir actividad');
  const updateActividad = (data: Actividad) => executeAction(actions.updateEntity(doc(collectionRefs.actividades, data.id), data), 'Actividad actualizada.', 'Error al actualizar actividad');
  const deleteActividad = (id: string) => executeDeleteWithUsageCheck(id, [{ collection: 'sessions', field: 'actividadId', label: 'sesión' }, { collection: 'specialists', field: 'actividadIds', label: 'especialista', type: 'array' }], 'actividades', 'Actividad eliminada.');

  const addSpecialist = (data: Omit<Specialist, 'id' | 'avatar'>) => executeAction(actions.addEntity(collectionRefs.specialists, {...data, avatar: `https://placehold.co/100x100.png`}), 'Especialista añadido.', 'Error al añadir especialista');
  const updateSpecialist = (data: Specialist) => executeAction(actions.updateEntity(doc(collectionRefs.specialists, data.id), data), 'Especialista actualizado.', 'Error al actualizar especialista');
  const deleteSpecialist = (id: string) => executeDeleteWithUsageCheck(id, [{ collection: 'sessions', field: 'instructorId', label: 'sesión' }], 'specialists', 'Especialista eliminado.');

  const addPerson = (data: any) => executeAction(actions.addPersonAction(collectionRefs.people, data), 'Persona añadida.', 'Error al añadir persona');
  const updatePerson = (data: Person) => executeAction(actions.updateEntity(doc(collectionRefs.people, data.id), data), 'Persona actualizada.', 'Error al actualizar persona');
  const deletePerson = (id: string) => executeAction(actions.deletePersonAction(collectionRefs.sessions, collectionRefs.people, id), 'Persona eliminada.', 'Error al eliminar persona');

  const addSpace = (data: Omit<Space, 'id'>) => executeAction(actions.addEntity(collectionRefs.spaces, data), 'Espacio añadido.', 'Error al añadir espacio');
  const updateSpace = (data: Space) => executeAction(actions.updateEntity(doc(collectionRefs.spaces, data.id), data), 'Espacio actualizado.', 'Error al actualizar espacio');
  const deleteSpace = (id: string) => executeDeleteWithUsageCheck(id, [{ collection: 'sessions', field: 'spaceId', label: 'sesión' }], 'spaces', 'Espacio eliminado.');

  const addSession = (data: Omit<Session, 'id' | 'personIds' | 'waitlistPersonIds'>) => executeAction(actions.addEntity(collectionRefs.sessions, {...data, personIds: [], waitlistPersonIds: []}), 'Sesión añadida.', 'Error al añadir sesión');
  const updateSession = (data: Session) => executeAction(actions.updateEntity(doc(collectionRefs.sessions, data.id), data), 'Sesión actualizada.', 'Error al actualizar sesión');
  const deleteSession = (id: string) => {
    const session = state.sessions.find(s => s.id === id);
    if (session && session.personIds.length > 0) {
        showErrorToast("No se puede eliminar una sesión con personas inscriptas.");
        return;
    }
    executeAction(actions.deleteEntity(doc(collectionRefs.sessions, id)), 'Sesión eliminada.', 'Error al eliminar sesión');
  };
  
  const addTariff = (data: Omit<Tariff, 'id'>) => executeAction(actions.addEntity(collectionRefs.tariffs, data), 'Arancel añadido.', 'Error al añadir arancel');
  const updateTariff = (data: Tariff) => executeAction(actions.updateEntity(doc(collectionRefs.tariffs, data.id), data), 'Arancel actualizado.', 'Error al actualizar arancel');
  const deleteTariff = (id: string) => executeDeleteWithUsageCheck(id, [{ collection: 'people', field: 'tariffId', label: 'persona' }], 'tariffs', 'Arancel eliminado.');
  
  const addLevel = (data: Omit<Level, 'id'>) => executeAction(actions.addEntity(collectionRefs.levels, data), 'Nivel añadido.', 'Error al añadir nivel');
  const updateLevel = (data: Level) => executeAction(actions.updateEntity(doc(collectionRefs.levels, data.id), data), 'Nivel actualizado.', 'Error al actualizar nivel');
  const deleteLevel = (id: string) => executeDeleteWithUsageCheck(id, [{ collection: 'sessions', field: 'levelId', label: 'sesión' }, { collection: 'people', field: 'levelId', label: 'persona' }], 'levels', 'Nivel eliminado.');
  
  const recordPayment = (personId: string) => {
    const person = state.people.find(p => p.id === personId);
    if (!person) return showErrorToast("Persona no encontrada.");
    const newExpiryDate = addMonths(person.lastPaymentDate, 1);
    executeAction(actions.recordPaymentAction(collectionRefs.payments, collectionRefs.people, personId, newExpiryDate), 'Pago registrado.', 'Error al registrar pago');
  };

  const undoLastPayment = async (personId: string) => {
    const person = state.people.find(p => p.id === personId);
    if (!person) return showErrorToast("Persona no encontrada.");

    const personPayments = state.payments
      .filter(p => p.personId === personId)
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (personPayments.length === 0) {
      showErrorToast('No hay pagos para deshacer.');
      return;
    }
    const paymentToDelete = personPayments[0];
    const previousExpiryDate = addMonths(person.lastPaymentDate, -1);
    executeAction(actions.undoLastPaymentAction(collectionRefs.payments, collectionRefs.people, personId, paymentToDelete, previousExpiryDate), 'Último pago deshecho.', 'Error al deshacer pago');
  };

  const enrollPeopleInClass = (sessionId: string, personIds: string[]) => executeAction(actions.enrollPeopleInClassAction(doc(collectionRefs.sessions, sessionId), personIds), 'Inscripciones actualizadas.', 'Error al inscribir');
  const enrollPersonInSessions = (personId: string, sessionIds: string[]) => executeAction(actions.enrollPersonInSessionsAction(collectionRefs.sessions, personId, sessionIds, state.sessions), 'Inscripciones actualizadas.', 'Error al inscribir');
  const saveAttendance = (...args: Parameters<typeof actions.saveAttendanceAction>) => executeAction(actions.saveAttendanceAction(collectionRefs.attendance, ...args), 'Asistencia guardada.', 'Error al guardar asistencia');
  const addOneTimeAttendee = (...args: Parameters<typeof actions.addOneTimeAttendeeAction>) => executeAction(actions.addOneTimeAttendeeAction(collectionRefs.attendance, ...args), 'Asistente puntual añadido.', 'Error al añadir asistente');
  const addJustifiedAbsence = (...args: Parameters<typeof actions.addJustifiedAbsenceAction>) => executeAction(actions.addJustifiedAbsenceAction(collectionRefs.attendance, ...args), 'Ausencia justificada.', 'Error al justificar ausencia');

  const addVacationPeriod = (personId: string, startDate: Date, endDate: Date) => {
    const person = state.people.find(p => p.id === personId);
    if (!person) return;
    executeAction(actions.addVacationPeriodAction(doc(collectionRefs.people, personId), person, startDate, endDate), 'Período de vacaciones añadido.', 'Error al añadir vacaciones');
  }

  const removeVacationPeriod = (personId: string, vacationId: string) => {
    const person = state.people.find(p => p.id === personId);
    if (!person) return;
    executeAction(actions.removeVacationPeriodAction(doc(collectionRefs.people, personId), person, vacationId), 'Período de vacaciones eliminado.', 'Error al eliminar vacaciones');
  }

  const addToWaitlist = (sessionId: string, personId: string) => {
    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) return;
    executeAction(actions.addToWaitlistAction(doc(collectionRefs.sessions, sessionId), session, personId), 'Anotado en lista de espera.', 'Error en lista de espera');
  }

  const enrollFromWaitlist = (notificationId: string, sessionId: string, personId: string) => {
    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) return;
    executeAction(actions.enrollFromWaitlistAction(collectionRefs.sessions, collectionRefs.notifications, notificationId, sessionId, personId, session), 'Inscrito desde lista de espera.', 'Error al inscribir desde lista de espera');
  }

  const dismissNotification = (notificationId: string) => executeAction(actions.deleteEntity(doc(collectionRefs.notifications, notificationId)), 'Notificación descartada.', 'Error al descartar notificación');

  const isPersonOnVacation = useCallback((person: Person, date: Date): boolean => {
    if (!person.vacationPeriods) return false;
    const checkDate = new Date(date.setHours(0, 0, 0, 0));
    return person.vacationPeriods.some(period => {
        const startDate = new Date(new Date(period.startDate).setHours(0, 0, 0, 0));
        const endDate = new Date(new Date(period.endDate).setHours(23, 59, 59, 999));
        return checkDate >= startDate && checkDate <= endDate;
    });
  }, []);
  
  const contextValue: StudioContextType = useMemo(() => ({
    ...state,
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
    undoLastPayment,
    addSpace,
    updateSpace,
    deleteSpace,
    addSession,
    updateSession,
    deleteSession,
    enrollPersonInSessions,
    enrollPeopleInClass,
    saveAttendance,
    addOneTimeAttendee,
    addJustifiedAbsence,
    addVacationPeriod,
    removeVacationPeriod,
    isPersonOnVacation,
    addToWaitlist,
    enrollFromWaitlist,
    dismissNotification,
    addTariff,
    updateTariff,
    deleteTariff,
    addLevel,
    updateLevel,
    deleteLevel,
    isTutorialOpen,
    openTutorial,
    closeTutorial
  }), [state, isPersonOnVacation, isTutorialOpen, openTutorial, closeTutorial]);

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
