// src/ai/flows/recover-pin-flow.ts
'use server';
/**
 * @fileOverview A flow for recovering the owner's PIN.
 *
 * - recoverPin - A function that handles the PIN recovery process.
 * - RecoverPinOutput - The return type for the recoverPin function.
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ai, z } from '@/ai/genkit';
import { Institute } from '@/types';

const RecoverPinOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  recoveryEmail: z.string().optional(),
});

export type RecoverPinOutput = z.infer<typeof RecoverPinOutputSchema>;

const recoverPinFlow = ai.defineFlow(
  {
    name: 'recoverPinFlow',
    inputSchema: z.string(), // instituteId
    outputSchema: RecoverPinOutputSchema,
  },
  async (instituteId) => {
    try {
      const instituteRef = doc(db, 'institutes', instituteId);
      const instituteSnap = await getDoc(instituteRef);

      if (!instituteSnap.exists()) {
        return { success: false, message: 'Instituto no encontrado.' };
      }

      const institute = instituteSnap.data() as Institute;
      const { ownerPin, recoveryEmail } = institute;

      if (!ownerPin) {
        return {
          success: false,
          message: 'No hay un PIN configurado para este instituto.',
        };
      }
      if (!recoveryEmail) {
        return {
          success: false,
          message:
            'No hay un email de recuperación configurado. Contacta a soporte.',
        };
      }

      // In a real application, you would use a service like SendGrid or Nodemailer
      // to send an email to `recoveryEmail` with the `ownerPin`.
      // For this simulation, we just confirm that we *would* send it.
      console.log(
        `[PIN RECOVERY] PIN for institute ${instituteId} is ${ownerPin}. Would send to ${recoveryEmail}.`
      );

      return {
        success: true,
        message: `El PIN ha sido enviado a tu email de recuperación.`,
        recoveryEmail,
      };
    } catch (error) {
      console.error('PIN Recovery Error:', error);
      return {
        success: false,
        message: 'Ocurrió un error inesperado al recuperar el PIN.',
      };
    }
  }
);

export async function recoverPin(instituteId: string): Promise<RecoverPinOutput> {
  return await recoverPinFlow(instituteId);
}
