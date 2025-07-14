
'use server';

import { collection, getDocs, query, orderBy, Timestamp, limit } from 'firebase/firestore';
import { db } from './firebase';
import type { Institute } from '@/types';
import { startOfMonth, subMonths, format as formatDate, parseISO } from 'date-fns';


// This function is only for the superadmin panel
export async function getAllInstitutes(): Promise<Institute[]> {
  try {
    const institutesRef = collection(db, 'institutes');
    const q = query(institutesRef, orderBy('createdAt', 'desc'));
    const institutesSnapshot = await getDocs(q);
    
    if (institutesSnapshot.empty) {
      return [];
    }
    
    const institutesDataPromises = institutesSnapshot.docs.map(async (doc) => {
      const instituteData = doc.data();
      const instituteId = doc.id;

      // Fetch all counts and latest activity concurrently for this institute
      const [peopleSnapshot, sessionsSnapshot, actividadesSnapshot, latestLogSnapshot] = await Promise.all([
        getDocs(collection(db, 'institutes', instituteId, 'people')),
        getDocs(collection(db, 'institutes', instituteId, 'sessions')),
        getDocs(collection(db, 'institutes', instituteId, 'actividades')),
        getDocs(query(collection(db, 'institutes', instituteId, 'audit_logs'), orderBy('timestamp', 'desc'), limit(1)))
      ]);

      const lastActivity = !latestLogSnapshot.empty 
        ? (latestLogSnapshot.docs[0].data().timestamp as Timestamp).toDate().toISOString() 
        : null;

      return {
        id: instituteId,
        name: instituteData.name,
        ownerId: instituteData.ownerId,
        createdAt: instituteData.createdAt instanceof Timestamp ? instituteData.createdAt.toDate().toISOString() : null,
        peopleCount: peopleSnapshot.size,
        sessionsCount: sessionsSnapshot.size,
        actividadesCount: actividadesSnapshot.size,
        lastActivity: lastActivity,
      } as Institute;
    });

    const institutes = await Promise.all(institutesDataPromises);
    return institutes;

  } catch (error) {
    console.error("Error fetching institutes for superadmin:", error);
    return [];
  }
}

export async function getPeopleCountForInstitute(instituteId: string): Promise<number> {
    try {
        const peopleRef = collection(db, 'institutes', instituteId, 'people');
        const snapshot = await getDocs(peopleRef);
        return snapshot.size;
    } catch (error) {
        console.error(`Error fetching people count for institute ${instituteId}:`, error);
        return 0;
    }
}

export async function getSessionsCountForInstitute(instituteId: string): Promise<number> {
    try {
        const sessionsRef = collection(db, 'institutes', instituteId, 'sessions');
        const snapshot = await getDocs(sessionsRef);
        return snapshot.size;
    } catch (error) {
        console.error(`Error fetching sessions count for institute ${instituteId}:`, error);
        return 0;
    }
}

export async function getActividadesCountForInstitute(instituteId: string): Promise<number> {
    try {
        const actividadesRef = collection(db, 'institutes', instituteId, 'actividades');
        const snapshot = await getDocs(actividadesRef);
        return snapshot.size;
    } catch (error) {
        console.error(`Error fetching actividades count for institute ${instituteId}:`, error);
        return 0;
    }
}


export async function getLatestActivityForInstitute(instituteId: string): Promise<string | null> {
    try {
        const auditLogRef = collection(db, 'institutes', instituteId, 'audit_logs');
        const q = query(auditLogRef, orderBy('timestamp', 'desc'), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }
        
        const latestLog = snapshot.docs[0].data();
        const timestamp = latestLog.timestamp instanceof Timestamp ? latestLog.timestamp.toDate() : null;
        return timestamp ? timestamp.toISOString() : null;

    } catch (error) {
        console.error(`Error fetching latest activity for institute ${instituteId}:`, error);
        return null;
    }
}


export async function getMonthlyNewPeopleCount(): Promise<{ month: string, "Nuevos Alumnos": number }[]> {
  try {
    const now = new Date();
    const monthlyCounts: Record<string, number> = {};
    const monthLabels: string[] = [];

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
        const d = subMonths(now, i);
        const monthKey = formatDate(d, 'MMM yy');
        monthLabels.push(monthKey);
        monthlyCounts[monthKey] = 0;
    }

    const institutesRef = collection(db, 'institutes');
    const institutesSnap = await getDocs(institutesRef);

    for (const instituteDoc of institutesSnap.docs) {
      const peopleRef = collection(db, 'institutes', instituteDoc.id, 'people');
      const peopleSnap = await getDocs(peopleRef);
      
      peopleSnap.forEach(personDoc => {
        const personData = personDoc.data();
        if (personData.joinDate && personData.joinDate instanceof Timestamp) {
          const joinDate = personData.joinDate.toDate();
          const monthKey = formatDate(joinDate, 'MMM yy');
          if (monthlyCounts.hasOwnProperty(monthKey)) {
            monthlyCounts[monthKey]++;
          }
        }
      });
    }

    return monthLabels.map(month => ({
        month: month,
        "Nuevos Alumnos": monthlyCounts[month]
    }));

  } catch (error) {
    console.error("Error fetching monthly new people count:", error);
    return [];
  }
}
