'use server';

import {genkit} from '@genkit-ai/core';
import {enableFirebaseTelemetry} from '@genkit-ai/firebase';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    enableFirebaseTelemetry(),
    googleAI({
      // The API key is automatically read from the GOOGLE_API_KEY
      // environment variable if it's set.
    }),
  ],
});
