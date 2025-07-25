

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { onSnapshot, collection, doc, Unsubscribe, query, orderBy, QuerySnapshot, getDoc, where, getDocs, writeBatch, deleteField } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Person, Session, SessionAttendance, Tariff, Actividad, Specialist, Space, Level, Payment, NewPersonData, AppNotification, AuditLog, Operator, WaitlistEntry, WaitlistProspect } from '@/types';
import { addPersonAction, deactivatePersonAction, reactivatePersonAction, recordPaymentAction, revertLastPaymentAction, enrollPeopleInClassAction, saveAttendanceAction, addJustifiedAbsenceAction, addOneTimeAttendeeAction, addVacationPeriodAction, removeVacationPeriodAction, deleteWithUsageCheckAction, enrollPersonInSessionsAction, addEntity, updateEntity, deleteEntity, updateOverdueStatusesAction, addToWaitlistAction, enrollFromWaitlistAction, removeFromWaitlistAction, enrollProspectFromWaitlistAction, removeOneTimeAttendeeAction, removePersonFromSessionAction, cancelSessionForDayAction, reactivateCancelledSessionAction } from '@/lib/firestore-actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';

interface StudioContextType {
    sessions: Session[];
    people: Person[];
    inactivePeople: Person[];
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
    deactivatePerson: (personId: string) => Promise<void>;
    reactivatePerson: (personId: string, personName: string) => void;
    addSession: (session: Omit<Session, 'id' | 'personIds' | 'waitlist'>) => void;
    updateSession: (session: Session) => void;
    deleteSession: (sessionId: string) => void;
    enrollPeopleInClass: (sessionId: string, personIds: string[]) => void;
    recordPayment: (personId: string) => Promise<void>;
    revertLastPayment: (personId: string) => void;
    saveAttendance: (sessionId: string, presentIds: string[], absentIds: string[], justifiedAbsenceIds: string[]) => void;
    cancelSessionForDay: (session: Session, date: Date, grantRecoveryCredits: boolean) => Promise<void>;
    reactivateCancelledSession: (sessionId: string, date: Date) => Promise<void>;
    isPersonOnVacation: (person: Person, date: Date) => boolean;
    addVacationPeriod: (personId: string, startDate: Date, endDate: Date) => void;
    removeVacationPeriod: (personId: string, vacationId: string, force?: boolean) => void;
    removeOneTimeAttendee: (sessionId: string, personId: string, date: string) => Promise<void>;
    addJustifiedAbsence: (personId: string, sessionId: string, date: Date) => void;
    addOneTimeAttendee: (sessionId: string, personId: string, date: Date) => Promise<void>;
    removePersonFromSession: (sessionId: string, personId: string) => void;
    addToWaitlist: (sessionId: string, entry: WaitlistEntry) => void;
    removeFromWaitlist: (sessionId: string, entry: WaitlistEntry) => void;
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
    enrollPersonInSessions: (personId: string, sessionIds: string[]) => Promise<string[] | undefined>;
    addOperator: (operator: Omit<Operator, 'id'>) => void;
    updateOperator: (operator: Operator) => void;
    deleteOperator: (operatorId: string) => void;
    updateOverdueStatuses: () => Promise<number>;
    triggerWaitlistCheck: (sessionId: string) => void;
    enrollFromWaitlist: (sessionId: string, personToEnroll: Person) => Promise<void>;
    enrollProspectFromWaitlist: (sessionId: string, prospect: WaitlistProspect, personId: string) => Promise<void>;
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
        try {
            return data[field].toDate();
        } catch (e) {
            console.error(`Error parsing date for field ${field}:`, e);
            return null;
        }
    }
    return data[field] || null; // Return existing value or null
};

export function StudioProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();
    const { activeOperator, institute } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Record<string, any[]>>({
        ...Object.fromEntries(Object.keys(collections).map(key => [key, []]))
    });
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const [isMigrationDone, setIsMigrationDone] = useState(false);
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
                q = query(ref, orderBy('timestamp', 'desc'));
            }

            const unsub = onSnapshot(q, (snapshot: QuerySnapshot) => {
                const items = snapshot.docs.map(doc => {
                    const docData = doc.data();
                    const id = doc.id;
                    
                    const itemWithId: {[key: string]: any} = { ...docData, id };
                    
                    // Universal date parsing for all collections
                    if (docData.date) itemWithId.date = safelyParseDate(docData, 'date');
                    if (docData.createdAt) itemWithId.createdAt = safelyParseDate(docData, 'createdAt');
                    if (docData.timestamp) itemWithId.timestamp = safelyParseDate(docData, 'timestamp');
                    if (docData.joinDate) itemWithId.joinDate = safelyParseDate(docData, 'joinDate');
                    if (docData.lastPaymentDate) itemWithId.lastPaymentDate = safelyParseDate(docData, 'lastPaymentDate');
                    if (docData.inactiveDate) itemWithId.inactiveDate = safelyParseDate(docData, 'inactiveDate');
                    if (docData.grantedAt) itemWithId.grantedAt = safelyParseDate(docData, 'grantedAt');
                    if (docData.expiresAt) itemWithId.expiresAt = safelyParseDate(docData, 'expiresAt');
                    
                    if (itemWithId.vacationPeriods && Array.isArray(itemWithId.vacationPeriods)) {
                        itemWithId.vacationPeriods = itemWithId.vacationPeriods.map((v: any) => ({
                            ...v,
                            startDate: safelyParseDate(v, 'startDate'),
                            endDate: safelyParseDate(v, 'endDate'),
                        }));
                    }
                     if (itemWithId.recoveryCredits && Array.isArray(itemWithId.recoveryCredits)) {
                        itemWithId.recoveryCredits = itemWithId.recoveryCredits.map((c: any) => ({
                            ...c,
                            grantedAt: safelyParseDate(c, 'grantedAt'),
                            expiresAt: safelyParseDate(c, 'expiresAt'),
                        }));
                    }
                    
                    return itemWithId;
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
    
     useEffect(() => {
        if (loading || !instituteId || isMigrationDone || data.sessions.length === 0) return;

        const migrateWaitlists = async () => {
            const sessionsWithOldWaitlist = (data.sessions as Session[]).filter(s => s.hasOwnProperty('waitlistPersonIds'));
            
            if (sessionsWithOldWaitlist.length > 0) {
                console.log(`Migrating ${sessionsWithOldWaitlist.length} sessions with old waitlist format...`);
                toast({ title: "Actualizando datos...", description: "Estamos mejorando la estructura de tus listas de espera." });

                const batch = writeBatch(db);

                sessionsWithOldWaitlist.forEach(session => {
                    const sessionRef = doc(db, 'institutes', instituteId, 'sessions', session.id);
                    // @ts-ignore
                    const oldWaitlistIds = (session.waitlistPersonIds as string[]) || [];
                    
                    const existingWaitlist = session.waitlist || [];
                    const mergedWaitlist = [...existingWaitlist, ...oldWaitlistIds];
                    const uniqueWaitlist = Array.from(new Set(mergedWaitlist));

                    batch.update(sessionRef, {
                        waitlist: uniqueWaitlist,
                        waitlistPersonIds: deleteField()
                    });
                });

                try {
                    await batch.commit();
                    console.log("Migration successful!");
                    toast({ title: "Actualización completada", description: "Tus datos ahora están en el formato más reciente." });
                } catch (error) {
                    console.error("Waitlist migration failed:", error);
                    toast({ variant: "destructive", title: "Error en actualización", description: "No se pudieron actualizar todos los datos." });
                }
            }
             setIsMigrationDone(true); // Mark as done even if there's nothing to migrate or if it fails, to avoid re-running.
        };

        migrateWaitlists();
    }, [loading, data.sessions, instituteId, isMigrationDone, toast]);

     // Update loading state only when all collections have been processed at least once
    useEffect(() => {
        if (!collectionRefs) return;
        const initialLoadComplete = Object.keys(collectionRefs).every(key => data[key] !== undefined);
        if(initialLoadComplete) {
            setLoading(false);
        }
    }, [data, collectionRefs]);

    const { people, inactivePeople } = useMemo(() => {
        const allPeople = data.people as Person[];
        const active = allPeople.filter(p => p.status !== 'inactive');
        const inactive = allPeople.filter(p => p.status === 'inactive');
        return { people: active, inactivePeople: inactive };
    }, [data.people]);

    const handleAction = async (action: Promise<any>, successMessage: string, errorMessage: string) => {
        try {
            const result = await action;
            toast({ title: "¡Éxito!", description: successMessage });
            return result;
        } catch (error: any) {
            console.error(errorMessage, error);
            toast({ variant: 'destructive', title: "Error", description: error.message || errorMessage });
            throw error; // Re-throw the error so the calling function knows it failed
        }
    };
    
    const withOperator = (action: (op: Operator) => Promise<any>, successMessage: string, errorMessage: string) => {
        if (!activeOperator) {
            const error = new Error("No se pudo identificar al operador. Por favor, reinicia sesión.");
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            return Promise.reject(error);
        }
        return handleAction(action(activeOperator), successMessage, errorMessage);
    };

    const addPerson = async (personData: NewPersonData) => {
        if (!collectionRefs || !activeOperator) return;
        return withOperator(
            (operator) => addPersonAction(
                collectionRefs.people, 
                personData, 
                data.tariffs as Tariff[], 
                collectionRefs.payments, 
                collectionRefs.audit_logs, 
                operator
            ),
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

    const deactivatePerson = async (personId: string): Promise<void> => {
        if (!collectionRefs || !activeOperator) return Promise.resolve();
        const personToDelete = (data.people as Person[]).find((p: Person) => p.id === personId);
        if (!personToDelete) return Promise.resolve();

        const affectedSessionIds = await withOperator(
            (operator) => deactivatePersonAction(collectionRefs.sessions, collectionRefs.people, personId, personToDelete.name, collectionRefs.audit_logs, operator),
            `${personToDelete.name} ha sido desactivado.`,
            `Error al desactivar a ${personToDelete.name}.`
        );
        
        if (affectedSessionIds && Array.isArray(affectedSessionIds)) {
            affectedSessionIds.forEach(sessionId => triggerWaitlistCheck(sessionId));
        }
    };
    
    const reactivatePerson = async (personId: string, personName: string) => {
        if (!collectionRefs || !activeOperator) return;
        
        await withOperator(
            (operator) => reactivatePersonAction(doc(collectionRefs.people, personId), personName, collectionRefs.audit_logs, operator),
            `${personName} ha sido reactivado.`,
            `Error al reactivar a ${personName}.`
        );
    };

    const recordPayment = async (personId: string) => {
        if (!collectionRefs || !activeOperator) {
            throw new Error("No se puede registrar el pago: faltan referencias de la base de datos o el operador no está activo.");
        }
    
        const person = (data.people as Person[]).find((p: Person) => p.id === personId);
        if (!person) {
            throw new Error('No se encontró a la persona para registrar el pago.');
        }
    
        const tariff = data.tariffs.find((t: Tariff) => t.id === person.tariffId);
        if (!tariff) {
            throw new Error('La persona no tiene un arancel asignado. Asigna un arancel antes de registrar un pago.');
        }
    
        try {
            await withOperator(
                (operator) => recordPaymentAction(
                    doc(collectionRefs.people, personId),
                    person,
                    tariff,
                    operator,
                    collectionRefs.payments,
                    collectionRefs.audit_logs
                ),
                `Pago registrado para ${person.name}.`,
                `Error al registrar el pago.`
            );
        } catch (error) {
            // The withOperator function already shows the toast
            console.error("Payment recording failed, re-throwing for component to handle.");
            throw error;
        }
    };


     const revertLastPayment = async (personId: string) => {
        if (!collectionRefs || !activeOperator) return;
        const person = (data.people as Person[]).find((p: Person) => p.id === personId);
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
                sessions: data.sessions, people: [...people, ...inactivePeople], actividades: data.actividades,
                specialists: data.specialists, spaces: data.spaces, levels: data.levels,
            };
            await deleteWithUsageCheckAction(collectionRefs, entityId, collectionKey, checks, allDataForMessages);
            await handleAction(deleteEntity(doc(collectionRefs[collectionKey], entityId)), successMessage, errorMessage);
        } catch (error: any) {
            toast({ variant: 'destructive', title: "No se puede eliminar", description: error.message, duration: 6000 });
        }
    };
    
    const addSession = (session: Omit<Session, 'id' | 'personIds' | 'waitlist'>) => addGenericEntity('sessions', { ...session, personIds: [], waitlist: [] }, "Sesión creada.", "Error al crear la sesión.");
    const updateSession = (session: Session) => updateGenericEntity('sessions', session, "Sesión actualizada.", "Error al actualizar la sesión.");
    const deleteSession = (id: string) => deleteGenericEntityWithUsageCheck('sessions', id, "Sesión eliminada.", "Error al eliminar la sesión.", [{ collection: 'people', field: 'personIds', type: 'array' }]);

    const addActividad = (actividad: Omit<Actividad, 'id'>) => addGenericEntity('actividades', actividad, "Actividad creada.", "Error al crear la actividad.");
    const updateActividad = (actividad: Actividad) => updateGenericEntity('actividades', actividad, "Actividad actualizada.", "Error al actualizar la actividad.");
    const deleteActividad = (id: string) => deleteGenericEntityWithUsageCheck('actividades', id, "Actividad eliminada.", "Error al eliminar la actividad.", [
        {collection: 'sessions', field: 'actividadId'}, {collection: 'specialists', field: 'actividadIds', type: 'array'}
    ]);

    const addSpecialist = (specialist: Omit<Specialist, 'id' | 'avatar'>) => addGenericEntity('specialists', { ...specialist, avatar: `https://placehold.co/100x100.png` }, "Especialista creado.", "Error al crear el especialista.");
    const updateSpecialist = (specialist: Specialist) => updateGenericEntity('specialists', specialist, "Especialista actualizado.", "Error al actualizar el especialista.");
    const deleteSpecialist = (id: string) => deleteGenericEntityWithUsageCheck('specialists', id, "Especialista eliminado.", "Error al eliminar el especialista.", [{collection: 'sessions', field: 'instructorId'}]);

    const addSpace = (space: Omit<Space, 'id'>) => addGenericEntity('spaces', space, "Espacio creado.", "Error al crear el espacio.");
    const updateSpace = (space: Space) => updateGenericEntity('spaces', space, "Espacio actualizado.", "Error al actualizar la espacio.");
    const deleteSpace = (id: string) => deleteGenericEntityWithUsageCheck('spaces', id, "Espacio eliminado.", "Error al eliminar el espacio.", [{collection: 'sessions', field: 'spaceId'}]);
    
    const addLevel = (level: Omit<Level, 'id'>) => addGenericEntity('levels', level, "Nivel creado.", "Error al crear el nivel.");
    const updateLevel = (level: Level) => updateGenericEntity('levels', level, "Nivel actualizado.", "Error al actualizar la nivel.");
    const deleteLevel = (id: string) => deleteGenericEntityWithUsageCheck('levels', id, "Nivel eliminado.", "Error al eliminar el nivel.", [
        {collection: 'sessions', field: 'levelId'}, {collection: 'people', field: 'levelId'}
    ]);
    
    const addTariff = (tariff: Omit<Tariff, 'id'>) => addGenericEntity('tariffs', tariff, "Arancel creado.", "Error al crear el arancel.");
    const updateTariff = (tariff: Tariff) => updateGenericEntity('tariffs', tariff, "Arancel actualizado.", "Error al actualizar el arancel.");
    const deleteTariff = (id: string) => deleteGenericEntityWithUsageCheck('tariffs', id, "Arancel eliminado.", "Error al eliminar el arancel.", [{collection: 'people', field: 'tariffId'}]);
    
    const addOperator = (operator: Omit<Operator, 'id'>) => addGenericEntity('operators', operator, "Operador creado.", "Error al crear operador.");
    const updateOperator = (operator: Operator) => updateGenericEntity('operators', operator, "Operador actualizado.", "Error al actualizar operador.");
    const deleteOperator = (id: string) => handleAction(deleteEntity(doc(collectionRefs!.operators, id)), "Operador eliminado.", "Error al eliminar operador.");

    const removePersonFromSession = (sessionId: string, personId: string) => {
      if (!collectionRefs) return;
      handleAction(
        removePersonFromSessionAction(doc(collectionRefs.sessions, sessionId), personId),
        'Persona eliminada de la sesión.',
        'Error al eliminar a la persona de la sesión.'
      ).then(() => {
        triggerWaitlistCheck(sessionId);
      });
    };

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
    
    const cancelSessionForDay = async (session: Session, date: Date, grantRecoveryCredits: boolean) => {
        if (!collectionRefs || !activeOperator) return;

        const enrolledPeopleIds = session.personIds.filter(pid => {
            const person = people.find(p => p.id === pid);
            return person && !isPersonOnVacation(person, date);
        });

        const activityName = data.actividades.find(a => a.id === session.actividadId)?.name || 'Clase';

        await withOperator(
            (operator) => cancelSessionForDayAction(
                collectionRefs.attendance,
                collectionRefs.people,
                session.id,
                date,
                enrolledPeopleIds,
                grantRecoveryCredits,
                collectionRefs.audit_logs,
                operator,
                activityName
            ),
            `La sesión de ${activityName} ha sido cancelada para hoy.`,
            'Error al cancelar la sesión.'
        );
    };

    const reactivateCancelledSession = async (sessionId: string, date: Date) => {
        if (!collectionRefs || !activeOperator) return;

        const activityName = data.actividades.find(a => a.id === sessionId)?.name || 'Clase';
        
        await withOperator(
            (operator) => reactivateCancelledSessionAction(
                collectionRefs.attendance,
                collectionRefs.people,
                sessionId,
                date,
                collectionRefs.audit_logs,
                operator,
                activityName
            ),
            `La sesión de ${activityName} ha sido reactivada.`,
            'Error al reactivar la sesión.'
        );
    };

    const isPersonOnVacation = useCallback((person: Person, date: Date) => {
        if (!person.vacationPeriods) return false;
        return person.vacationPeriods.some(period => {
            if (!period.startDate || !period.endDate) return false;
            return date >= period.startDate && date <= period.endDate;
        });
    }, []);
    
    const addVacationPeriod = (personId: string, startDate: Date, endDate: Date) => {
        const person = (data.people as Person[]).find((p: Person) => p.id === personId);
        if (!person) return;
        handleAction(
            addVacationPeriodAction(doc(collectionRefs!.people, personId), person, startDate, endDate),
            'Período de vacaciones añadido.',
            'Error al añadir vacaciones.'
        );
    };

    const removeVacationPeriod = (personId: string, vacationId: string, force = false) => {
        const person = (data.people as Person[]).find((p: Person) => p.id === personId);
        if (!person) return;
        if (force) {
            return handleAction(
                removeVacationPeriodAction(doc(collectionRefs!.people, personId), person, vacationId),
                'Período de vacaciones eliminado.',
                'Error al eliminar vacaciones.'
            );
        }
        // This is now handled by the VacationDialog, but left as a safe fallback
        return handleAction(
            removeVacationPeriodAction(doc(collectionRefs!.people, personId), person, vacationId),
            'Período de vacaciones eliminado.',
            'Error al eliminar vacaciones.'
        );
    };

    const removeOneTimeAttendee = (sessionId: string, personId: string, date: string) => {
        return handleAction(
            removeOneTimeAttendeeAction(collectionRefs!.attendance, sessionId, personId, date),
            'Asistente de recupero eliminado.',
            'Error al eliminar el recupero.'
        );
    };

    const addJustifiedAbsence = (personId: string, sessionId: string, date: Date) => {
        if (!collectionRefs) return;
        handleAction(
            addJustifiedAbsenceAction(collectionRefs.people, collectionRefs.attendance, personId, sessionId, date),
            'Ausencia justificada registrada y crédito otorgado.',
            'Error al justificar la ausencia.'
        );
    };
    
    const addOneTimeAttendee = (sessionId: string, personId: string, date: Date) => {
        if (!collectionRefs) return Promise.reject();
        return handleAction(
            addOneTimeAttendeeAction(collectionRefs.attendance, collectionRefs.people, sessionId, personId, date),
            'Asistente puntual añadido.',
            'Error al añadir asistente puntual.'
        );
    };
    
    const addToWaitlist = (sessionId: string, entry: WaitlistEntry) => {
        if (!collectionRefs) return;
        handleAction(
            addToWaitlistAction(doc(collectionRefs.sessions, sessionId), entry),
            'Añadido a la lista de espera.',
            'Error al añadir a la lista de espera.'
        );
    };

    const removeFromWaitlist = (sessionId: string, entry: WaitlistEntry) => {
        if (!collectionRefs) return;
        handleAction(
            removeFromWaitlistAction(doc(collectionRefs.sessions, sessionId), entry),
            'Eliminado de la lista de espera.',
            'Error al eliminar de la lista de espera.'
        );
    };

    const enrollPersonInSessions = async (personId: string, sessionIds: string[]) => {
        if (!collectionRefs) return;
        const result = await handleAction(
            enrollPersonInSessionsAction(collectionRefs.sessions, personId, sessionIds),
            "Horarios de la persona actualizados.",
            "Error al actualizar los horarios."
        );
        // The result of the action is the array of session IDs the person was removed from.
        if (result && Array.isArray(result)) {
            result.forEach((sessionId: string) => triggerWaitlistCheck(sessionId));
        }
        return result;
    };




    const enrollFromWaitlist = (sessionId: string, personToEnroll: Person) => {
        if (!collectionRefs) return Promise.resolve();
        const personIdToEnroll = personToEnroll.id;

        return handleAction(
            enrollFromWaitlistAction(doc(collectionRefs.sessions, sessionId), personIdToEnroll, collectionRefs.spaces),
            `${personToEnroll.name} ha sido inscrita desde la lista de espera.`,
            'Error al inscribir desde la lista de espera.'
        );
    };

    const enrollProspectFromWaitlist = (sessionId: string, prospect: WaitlistProspect, newPersonId: string) => {
        if (!collectionRefs) return Promise.resolve();
        return handleAction(
            enrollProspectFromWaitlistAction(doc(collectionRefs.sessions, sessionId), prospect, newPersonId, collectionRefs.spaces),
            `${prospect.name} ha sido creada e inscrita desde la lista de espera.`,
            'Error al inscribir al nuevo contacto.'
        );
    }

    const triggerWaitlistCheck = useCallback(async (sessionId: string) => {
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
                await addEntity(collectionRefs.notifications, newNotification);
            }
        }
    }, [collectionRefs]);

    const updateOverdueStatuses = useCallback(async (): Promise<number> => {
        if (!collectionRefs || !activeOperator) {
            toast({ variant: "destructive", title: "Error", description: "No se puede realizar la operación sin un operador activo." });
            return 0;
        }
        return await withOperator(
            (operator) => updateOverdueStatusesAction(collectionRefs.people, (data.people as Person[]), data.tariffs, operator, collectionRefs.audit_logs),
            "Actualización de Deudas Completa.",
            "Error al actualizar deudas."
        ) || 0;
    }, [collectionRefs, activeOperator, data.people, data.tariffs, toast, withOperator]);

    return (
        <StudioContext.Provider value={{
            ...(data as any),
            people,
            inactivePeople,
            loading,
            isTutorialOpen,
            openTutorial: () => setIsTutorialOpen(true),
            closeTutorial: () => {
                try { localStorage.setItem('agendia-tutorial-completed', 'true'); } catch (e) {}
                setIsTutorialOpen(false);
            },
            addPerson,
            updatePerson,
            deactivatePerson,
            reactivatePerson,
            recordPayment,
            revertLastPayment,
            addSession,
            updateSession,
            deleteSession,
            enrollPeopleInClass,
            saveAttendance,
            cancelSessionForDay,
            reactivateCancelledSession,
            isPersonOnVacation,
            addVacationPeriod,
            removeVacationPeriod,
            removeOneTimeAttendee,
            addJustifiedAbsence,
            addOneTimeAttendee,
            removePersonFromSession,
            addToWaitlist,
            removeFromWaitlist,
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
            enrollProspectFromWaitlist,
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
