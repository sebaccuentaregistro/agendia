
'use server';

import { collection, getDocs, query, orderBy, Timestamp, limit } from 'firebase/firestore';
import { db } from './firebase';
import type { Institute } from '@/types';

// This function is only for the superadmin panel
export async function getAllInstitutes(): Promise<Institute[]> {
  try {
    const institutesRef = collection(db, 'institutes');
    const q = query(institutesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return [];
    }
    
    const institutes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        ownerId: data.ownerId,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
      } as Institute;
    });

    return institutes;

  } catch (error) {
    console.error("Error fetching institutes for superadmin:", error);
    // In a real app, you might want to handle this more gracefully
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

