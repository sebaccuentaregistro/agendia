
'use server';

import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
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
