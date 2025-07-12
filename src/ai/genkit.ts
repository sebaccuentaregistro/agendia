// src/ai/genkit.ts
'use server';

import { genkit } from 'genkit';
import { googleAI } from 'genkit/googleai';
import { firebase } from '@genkit-ai/firebase';
import { z } from 'zod';

const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: ['v1beta'],
    }),
    firebase(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export { ai, z };
