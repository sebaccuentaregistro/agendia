
'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase';
import { z } from 'zod';

const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: ['v1beta'],
    }),
    firebase,
  ],
});

export { ai, z };
