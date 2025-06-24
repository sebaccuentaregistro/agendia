import {genkit} from 'firebase-genkit';
import {googleAI} from 'firebase-genkit/plugins/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      // The API key is automatically read from the GOOGLE_API_KEY
      // environment variable if it's set.
    }),
  ],
  // In a production environment, you may want to use a different logger.
  logLevel: 'info',
  // In a production environment, you may want to use a different exporter.
  enableTracingAndMetrics: true,
});
