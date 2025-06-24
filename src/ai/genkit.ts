import {genkit} from '@genkit-ai/core';
import firebase from '@genkit-ai/firebase';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    firebase(),
    googleAI({
      // The API key is automatically read from the GOOGLE_API_KEY
      // environment variable if it's set.
    }),
  ],
});
