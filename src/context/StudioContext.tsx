

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { onSnapshot, collection, doc, Unsubscribe, query, orderBy, QuerySnapshot, getDoc, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Person, Session, SessionAttendance, Tariff, Actividad, Specialist, Space, Level, Payment, NewPersonData, AppNotification, AuditLog, Operator, WaitlistEntry, WaitlistProspect } from '@/types';
import { addPersonAction, deletePersonAction, recordPaymentAction, revertLastPaymentAction, enrollPeopleInClassAction, saveAttendanceAction, addJustifiedAbsenceAction, addOneTimeAttendeeAction, addVacationPeriodAction, removeVacationPeriodAction, deleteWithUsageCheckAction, enrollPersonInSessionsAction, addEntity, updateEntity, deleteEntity, updateOverdueStatusesAction, addToWaitlistAction, enrollFromWaitlistAction } from '@/lib/firestore-actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';

interface StudioContextType {
    sessions: Session[];
    people: Person[];
    actividades: Actividad[];
    specialists: Specialist[];
    spaces: Space[];
    levels: Level[];
    tariffs: Tariff[];
    payments: Payment[];
    attendance: SessionAttendance[];
    audit_logs: AuditLog[];
    operators: Operator[];
    notifications: AppNotification[];
    loading: boolean;
    isTutorialOpen: boolean;
    openTutorial: () => void;
    closeTutorial: () => void;
    addPerson: (person: NewPersonData) => Promise<string | undefined>;
    updatePerson: (person: Person) => void;
    deletePerson: (personId: string) => void;
    addSession: (session: Omit<Session, 'id' | 'personIds' | 'waitlist'>) => void;
    updateSession: (session: Session) => void;
    deleteSession: (sessionId: string) => void;
    enrollPeopleInClass: (sessionId: string, personIds: string[]) => void;
    recordPayment: (personId: string) => void;
    revertLastPayment: (personId: string) => void;
    saveAttendance: (sessionId: string, presentIds: string[], absentIds: string[], justifiedAbsenceIds: string[]) => void;
    isPersonOnVacation: (person: Person, date: Date) => boolean;
    addVacationPeriod: (personId: string, startDate: Date, endDate: Date) => void;
    removeVacationPeriod: (personId: string, vacationId: string) => void;
    addJustifiedAbsence: (personId: string, sessionId: string, date: Date) => void;
    addOneTimeAttendee: (sessionId: string, personId: string, date: Date) => void;
    addToWaitlist: (sessionId: string, entry: WaitlistEntry) => void;
    addActividad: (actividad: Omit<Actividad, 'id'>) => void;
    updateActividad: (actividad: Actividad) => void;
    deleteActividad: (actividadId: string) => void;
    addSpecialist: (specialist: Omit<Specialist, 'id' | 'avatar'>) => void;
    updateSpecialist: (specialist: Specialist) => void;
    deleteSpecialist: (specialistId: string) => void;
    addSpace: (space: Omit<Space, 'id'>) => void;
    updateSpace: (space: Space) => void;
    deleteSpace: (spaceId: string) => void;
    addLevel: (level: Omit<Level, 'id'>) => void;
    updateLevel: (level: Level) => void;
    deleteLevel: (levelId: string) => void;
    addTariff: (tariff: Omit<Tariff, 'id'>) => void;
    updateTariff: (tariff: Tariff) => void;
    deleteTariff: (tariffId: string) => void;
    enrollPersonInSessions: (personId: string, sessionIds: string[]) => Promise<string[] | void>;
    addOperator: (operator: Omit<Operator, 'id'>) => void;
    updateOperator: (operator: Operator) => void;
    deleteOperator: (operatorId: string) => void;
    updateOverdueStatuses: () => Promise<number>;
    triggerWaitlistCheck: (sessionId: string) => void;
    enrollFromWaitlist: (notificationId: string, sessionId: string, personOrProspect: Person | WaitlistProspect) => Promise<void>;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

const collections = {
    actividades: 'actividades',
    specialists: 'specialists',
    people: 'people',
    sessions: 'sessions',
    spaces: 'spaces',
    payments: 'payments',
    attendance: 'attendance',
    notifications: 'notifications',
    tariffs: 'tariffs',
    levels: 'levels',
    audit_logs: 'audit_logs',
    operators: 'operators',
};

const safelyParseDate = (data: any, field: string) => {
    if (data && data[field] && typeof data[field].toDate === 'function') {
        return data[field].toDate();
    }
    return null;
};

export function StudioProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();
    const { activeOperator, institute } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Record<string, any[]>>({
        ...Object.fromEntries(Object.keys(collections).map(key => [key, []]))
    });
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const instituteId = institute?.id;

    const collectionRefs = useMemo(() => {
        if (!instituteId) return null;
        return Object.entries(collections).reduce((acc, [key, name]) => {
            acc[key] = collection(db, 'institutes', instituteId, name);
            return acc;
        }, {} as Record<string, any>);
    }, [instituteId]);


    useEffect(() => {
        if (!collectionRefs) {
            setLoading(false);
            // Clear all data if there's no institute ID
            setData({ ...Object.fromEntries(Object.keys(collections).map(key => [key, []])) });
            return;
        }

        setLoading(true);
        const unsubscribers: Unsubscribe[] = [];

        Object.entries(collectionRefs).forEach(([key, ref]) => {
            let q = ref;
            if (['audit_logs', 'payments', 'notifications'].includes(key)) {
                q = query(ref, orderBy('createdAt', 'desc'));
            }

            const unsub = onSnapshot(q, (snapshot: QuerySnapshot) => {
                const items = snapshot.docs.map(doc => {
                    const docData = doc.data();
                    
                    if (['payments', 'people', 'notifications', 'audit_logs'].includes(key)) {
                         docData.joinDate = safelyParseDate(docData, 'joinDate');
                         docData.lastPaymentDate = safelyParseDate(docData, 'lastPaymentDate');
                         docData.date = safelyParseDate(docData, 'date');
                         docData.createdAt = safelyParseDate(docData, 'createdAt');
                         docData.timestamp = safelyParseDate(docData, 'timestamp');

                        if (docData.vacationPeriods) {
                            docData.vacationPeriods = docData.vacationPeriods.map((v: any) => ({
                                ...v,
                                startDate: safelyParseDate(v, 'startDate'),
                                endDate: safelyParseDate(v, 'endDate'),
                            }));
                        }
                    }
                    return { id: doc.id, ...docData };
                });
                
                setData(prevData => ({ ...prevData, [key]: items }));

            }, (error) => {
                console.error(`Error fetching ${key}:`, error);
                toast({ variant: 'destructive', title: 'Error de Sincronización', description: `No se pudo cargar la colección ${key}.` });
            });
            unsubscribers.push(unsub);
        });
        
        // This is a failsafe to ensure loading state becomes false even if some collections are empty
        const timer = setTimeout(() => setLoading(false), 3000);

        return () => {
            unsubscribers.forEach(unsub => unsub());
            clearTimeout(timer);
        };
    }, [collectionRefs, toast]);

     // Update loading state only when all collections have been processed at least once
    useEffect(() => {
        if (!collectionRefs) return;
        const initialLoadComplete = Object.keys(collectionRefs).every(key => data[key] !== undefined);
        if(initialLoadComplete) {
            setLoading(false);
        }
    }, [data, collectionRefs]);

    const handleAction = async (action: Promise<any>, successMessage: string, errorMessage: string) => {
        try {
            const result = await action;
            toast({ title: "¡Éxito!", description: successMessage });
            return result;
        } catch (error: any) {
            console.error(errorMessage, error);
            toast({ variant: 'destructive', title: "Error", description: error.message || errorMessage });
        }
    };
    
    const withOperator = (action: (op: Operator) => Promise<any>, successMessage: string, errorMessage: string) => {
        if (!activeOperator) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo identificar al operador. Por favor, reinicia sesión.' });
            return Promise.reject(new Error("No active operator"));
        }
        return handleAction(action(activeOperator), successMessage, errorMessage);
    };

    const addPerson = async (personData: NewPersonData) => {
        if (!collectionRefs) return;
        return withOperator(
            (operator) => addPersonAction(collectionRefs.people, personData, collectionRefs.audit_logs, operator),
            `${personData.name} ha sido añadido con éxito.`,
            `Error al añadir a ${personData.name}.`
        );
    };

    const updatePerson = (person: Person) => {
        if (!collectionRefs) return;
        handleAction(
            updateEntity(doc(collectionRefs.people, person.id), person),
            `${person.name} ha sido actualizado.`,
            `Error al actualizar a ${person.name}.`
        );
    };

    const deletePerson = (personId: string) => {
        if (!collectionRefs) return;
        const personToDelete = data.people.find((p: Person) => p.id === personId);
        if (!personToDelete) return;

        withOperator(
            (operator) => deletePersonAction(collectionRefs.sessions, collectionRefs.people, personId, personToDelete.name, collectionRefs.audit_logs, operator),
            `${personToDelete.name} ha sido eliminado.`,
            `Error al eliminar a ${personToDelete.name}.`
        );
    };
    
    const recordPayment = async (personId: string) => {
        if (!collectionRefs || !activeOperator) return;
        const person = data.people.find((p: Person) => p.id === personId);
        if (!person) return;
        const tariff = data.tariffs.find((t: Tariff) => t.id === person.tariffId);
        if (!tariff) {
            toast({ variant: 'destructive', title: 'Error', description: 'La persona no tiene un arancel asignado.' });
            return;
        }
        await withOperator(
            (operator) => recordPaymentAction(collectionRefs.payments, doc(collectionRefs.people, personId), person, tariff, collectionRefs.audit_logs, operator),
            `Pago registrado para ${person.name}.`,
            `Error al registrar el pago.`
        );
    };

     const revertLastPayment = async (personId: string) => {
        if (!collectionRefs) return;
        const person = data.people.find((p: Person) => p.id === personId);
        if (!person) return;
        await withOperator(
            (operator) => revertLastPaymentAction(collectionRefs.payments, doc(collectionRefs.people, personId), personId, person, collectionRefs.audit_logs, operator),
            `Último pago de ${person.name} revertido.`,
            `Error al revertir el pago.`
        );
    };

    const addGenericEntity = (collectionKey: keyof typeof collections, entityData: any, successMessage: string, errorMessage: string) => {
        if (!collectionRefs) return Promise.resolve(undefined);
        return handleAction(addEntity(collectionRefs[collectionKey], entityData), successMessage, errorMessage);
    };

    const updateGenericEntity = (collectionKey: keyof typeof collections, entity: { id: string }, successMessage: string, errorMessage: string) => {
        if (!collectionRefs) return;
        handleAction(updateEntity(doc(collectionRefs[collectionKey], entity.id), entity), successMessage, errorMessage);
    };
    
    const deleteGenericEntityWithUsageCheck = async (collectionKey: keyof typeof collections, entityId: string, successMessage: string, errorMessage: string, checks: any[]) => {
        if (!collectionRefs) return;
        try {
            const allDataForMessages = {
                sessions: data.sessions, people: data.people, actividades: data.actividades,
                specialists: data.specialists, spaces: data.spaces, levels: data.levels,
            };
            await deleteWithUsageCheckAction(entityId, checks, collectionRefs, allDataForMessages);
            await handleAction(deleteEntity(doc(collectionRefs[collectionKey], entityId)), successMessage, errorMessage);
        } catch (error: any) {
            toast({ variant: 'destructive', title: "No se puede eliminar", description: error.message });
        }
    };
    
    const addSession = (session: Omit<Session, 'id' | 'personIds' | 'waitlist'>) => addGenericEntity('sessions', { ...session, personIds: [], waitlist: [] }, "Sesión creada.", "Error al crear la sesión.");
    const updateSession = (session: Session) => updateGenericEntity('sessions', session, "Sesión actualizada.", "Error al actualizar la sesión.");
    const deleteSession = (id: string) => deleteGenericEntityWithUsageCheck('sessions', id, "Sesión eliminada.", "Error al eliminar la sesión.", [{collection: 'attendance', field: 'sessionId', label: 'asistencias'}]);

    const addActividad = (actividad: Omit<Actividad, 'id'>) => addGenericEntity('actividades', actividad, "Actividad creada.", "Error al crear la actividad.");
    const updateActividad = (actividad: Actividad) => updateGenericEntity('actividades', actividad, "Actividad actualizada.", "Error al actualizar la actividad.");
    const deleteActividad = (id: string) => deleteGenericEntityWithUsageCheck('actividades', id, "Actividad eliminada.", "Error al eliminar la actividad.", [
        {collection: 'sessions', field: 'actividadId', label: 'sesiones'}, {collection: 'specialists', field: 'actividadIds', label: 'especialistas', type: 'array'}
    ]);

    const addSpecialist = (specialist: Omit<Specialist, 'id' | 'avatar'>) => addGenericEntity('specialists', { ...specialist, avatar: `https://placehold.co/100x100.png` }, "Especialista creado.", "Error al crear el especialista.");
    const updateSpecialist = (specialist: Specialist) => updateGenericEntity('specialists', specialist, "Especialista actualizado.", "Error al actualizar el especialista.");
    const deleteSpecialist = (id: string) => deleteGenericEntityWithUsageCheck('specialists', id, "Especialista eliminado.", "Error al eliminar el especialista.", [{collection: 'sessions', field: 'instructorId', label: 'sesiones'}]);

    const addSpace = (space: Omit<Space, 'id'>) => addGenericEntity('spaces', space, "Espacio creado.", "Error al crear el espacio.");
    const updateSpace = (space: Space) => updateGenericEntity('spaces', space, "Espacio actualizado.", "Error al actualizar el espacio.");
    const deleteSpace = (id: string) => deleteGenericEntityWithUsageCheck('spaces', id, "Espacio eliminado.", "Error al eliminar el espacio.", [{collection: 'sessions', field: 'spaceId', label: 'sesiones'}]);
    
    const addLevel = (level: Omit<Level, 'id'>) => addGenericEntity('levels', level, "Nivel creado.", "Error al crear el nivel.");
    const updateLevel = (level: Level) => updateGenericEntity('levels', level, "Nivel actualizado.", "Error al actualizar el nivel.");
    const deleteLevel = (id: string) => deleteGenericEntityWithUsageCheck('levels', id, "Nivel eliminado.", "Error al eliminar el nivel.", [
        {collection: 'sessions', field: 'levelId', label: 'sesiones'}, {collection: 'people', field: 'levelId', label: 'personas'}
    ]);
    
    const addTariff = (tariff: Omit<Tariff, 'id'>) => addGenericEntity('tariffs', tariff, "Arancel creado.", "Error al crear el arancel.");
    const updateTariff = (tariff: Tariff) => updateGenericEntity('tariffs', tariff, "Arancel actualizado.", "Error al actualizar el arancel.");
    const deleteTariff = (id: string) => deleteGenericEntityWithUsageCheck('tariffs', id, "Arancel eliminado.", "Error al eliminar el arancel.", [{collection: 'people', field: 'tariffId', label: 'personas'}]);
    
    const addOperator = (operator: Omit<Operator, 'id'>) => addGenericEntity('operators', operator, "Operador creado.", "Error al crear operador.");
    const updateOperator = (operator: Operator) => updateGenericEntity('operators', operator, "Operador actualizado.", "Error al actualizar operador.");
    const deleteOperator = (id: string) => handleAction(deleteEntity(doc(collectionRefs!.operators, id)), "Operador eliminado.", "Error al eliminar operador.");


    const enrollPeopleInClass = (sessionId: string, personIds: string[]) => handleAction(
        enrollPeopleInClassAction(doc(collectionRefs!.sessions, sessionId), personIds),
        'Inscripciones actualizadas.',
        'Error al actualizar inscripciones.'
    );

    const saveAttendance = (sessionId: string, presentIds: string[], absentIds: string[], justifiedAbsenceIds: string[]) => {
      const allPersonSessions = data.sessions.filter((s: Session) => s.personIds.some(pid => absentIds.includes(pid)));
      handleAction(
        saveAttendanceAction(collectionRefs!.attendance, sessionId, presentIds, absentIds, justifiedAbsenceIds, allPersonSessions, data.attendance, collectionRefs!.notifications),
        'Asistencia guardada.',
        'Error al guardar asistencia.'
      );
    }
    
    const isPersonOnVacation = useCallback((person: Person, date: Date) => {
        if (!person.vacationPeriods) return false;
        return person.vacationPeriods.some(period => {
            if (!period.startDate || !period.endDate) return false;
            return date >= period.startDate && date <= period.endDate;
        });
    }, []);
    
    const addVacationPeriod = (personId: string, startDate: Date, endDate: Date) => {
        const person = data.people.find((p: Person) => p.id === personId);
        if (!person) return;
        handleAction(
            addVacationPeriodAction(doc(collectionRefs!.people, personId), person, startDate, endDate),
            'Período de vacaciones añadido.',
            'Error al añadir vacaciones.'
        );
    };

    const removeVacationPeriod = (personId: string, vacationId: string) => {
        const person = data.people.find((p: Person) => p.id === personId);
        if (!person) return;
        handleAction(
            removeVacationPeriodAction(doc(collectionRefs!.people, personId), person, vacationId),
            'Período de vacaciones eliminado.',
            'Error al eliminar vacaciones.'
        );
    };

    const addJustifiedAbsence = (personId: string, sessionId: string, date: Date) => handleAction(
        addJustifiedAbsenceAction(collectionRefs!.attendance, personId, sessionId, date),
        'Ausencia justificada registrada.',
        'Error al justificar la ausencia.'
    );
    
    const addOneTimeAttendee = (sessionId: string, personId: string, date: Date) => handleAction(
        addOneTimeAttendeeAction(collectionRefs!.attendance, personId, sessionId, date),
        'Asistente puntual añadido.',
        'Error al añadir asistente puntual.'
    );
    
    const addToWaitlist = (sessionId: string, entry: WaitlistEntry) => {
        if (!collectionRefs) return;
        handleAction(
            addToWaitlistAction(doc(collectionRefs.sessions, sessionId), entry),
            'Añadido a la lista de espera.',
            'Error al añadir a la lista de espera.'
        );
    };

    const enrollPersonInSessions = async (personId: string, sessionIds: string[]) => {
        if (!collectionRefs) return;
        const removedFromSessionIds = await handleAction(
            enrollPersonInSessionsAction(collectionRefs.sessions, personId, sessionIds),
            "Horarios de la persona actualizados.",
            "Error al actualizar los horarios."
        );
         if (removedFromSessionIds && Array.isArray(removedFromSessionIds)) {
            removedFromSessionIds.forEach(sessionId => triggerWaitlistCheck(sessionId));
        }
    };

    const enrollFromWaitlist = (notificationId: string, sessionId: string, personOrProspect: Person | WaitlistProspect) => {
        if (!collectionRefs) return Promise.resolve();
        return handleAction(
            enrollFromWaitlistAction(collectionRefs.sessions, collectionRefs.notifications, collectionRefs.people, notificationId, sessionId, personOrProspect),
            `${'name' in personOrProspect ? personOrProspect.name : 'La persona'} ha sido inscrita desde la lista de espera.`,
            'Error al inscribir desde la lista de espera.'
        );
    };

    const triggerWaitlistCheck = async (sessionId: string) => {
        if (!collectionRefs) return;
        const sessionRef = doc(collectionRefs.sessions, sessionId);
        const sessionSnap = await getDoc(sessionRef);
        if (!sessionSnap.exists()) return;

        const session = sessionSnap.data() as Session;
        const spaceRef = doc(collectionRefs.spaces, session.spaceId);
        const spaceSnap = await getDoc(spaceRef);
        if (!spaceSnap.exists()) return;

        const space = spaceSnap.data() as Space;
        
        const hasSpot = session.personIds.length < space.capacity;
        const hasWaitlist = session.waitlist && session.waitlist.length > 0;

        if (hasSpot && hasWaitlist) {
            // Check if a notification for this session already exists
            const q = query(collectionRefs.notifications, where('sessionId', '==', sessionId), where('type', '==', 'waitlist'));
            const existingNotifs = await getDocs(q);
            if (existingNotifs.empty) {
                const newNotification: Omit<AppNotification, 'id'> = {
                    type: 'waitlist',
                    sessionId: sessionId,
                    createdAt: new Date(),
                };
                await addEntity(collectionRefs.notifications, newNotification, 'Notificación de cupo creada', 'Error al crear notificación');
            }
        }
    };

    const updateOverdueStatuses = useCallback(async (): Promise<number> => {
        if (!collectionRefs || !activeOperator) {
            toast({ variant: "destructive", title: "Error", description: "No se puede realizar la operación sin un operador activo." });
            return 0;
        }
        try {
            return await updateOverdueStatusesAction(collectionRefs.people, data.people, data.tariffs, activeOperator, collectionRefs.audit_logs);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error al actualizar deudas", description: error.message });
            return 0;
        }
    }, [collectionRefs, activeOperator, data.people, data.tariffs, toast]);

    return (
        <StudioContext.Provider value={{
            ...(data as any),
            loading,
            isTutorialOpen,
            openTutorial: () => setIsTutorialOpen(true),
            closeTutorial: () => {
                setIsTutorialOpen(false);
                try { localStorage.setItem('agendia-tutorial-completed', 'true'); } catch (e) {}
            },
            addPerson,
            updatePerson,
            deletePerson,
            recordPayment,
            revertLastPayment,
            addSession,
            updateSession,
            deleteSession,
            enrollPeopleInClass,
            saveAttendance,
            isPersonOnVacation,
            addVacationPeriod,
            removeVacationPeriod,
            addJustifiedAbsence,
            addOneTimeAttendee,
            addToWaitlist,
            addActividad,
            updateActividad,
            deleteActividad,
            addSpecialist,
            updateSpecialist,
            deleteSpecialist,
            addSpace,
            updateSpace,
            deleteSpace,
            addLevel,
            updateLevel,
            deleteLevel,
            addTariff,
            updateTariff,
            deleteTariff,
            enrollPersonInSessions,
            addOperator,
            updateOperator,
            deleteOperator,
            updateOverdueStatuses,
            triggerWaitlistCheck,
            enrollFromWaitlist,
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
