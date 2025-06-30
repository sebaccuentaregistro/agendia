'use server';

// NOTE: Genkit initialization is temporarily disabled for deployment debugging.
// The `googleAI` plugin requires an API key, which might cause a server crash
// if the key is not present in the production environment. This file exports
// a dummy object to allow the rest of the application to build and run.
// We will restore this file after the deployment is successful.

export const ai = {};
