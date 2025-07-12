import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase';
import { z } from 'zod';

const ai = genkit({
  plugins: [
    googleAI(),
  ],
});

export { ai, z };
