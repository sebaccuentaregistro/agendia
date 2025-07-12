'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase';
import { z } from 'zod';

const ai = genkit({
  plugins: [
    googleAI(),
    firebase, // The firebase() plugin is not a function and should be passed directly. It's automatically configured by the environment.
  ],
});

export { ai, z };
