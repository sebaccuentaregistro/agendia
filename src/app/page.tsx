'use client';

// Forcing another change to clear any caching issues.
// The redirection logic is handled by `components/layout/app-shell.tsx`
// which will redirect to `/login` or `/dashboard` based on authentication state.
// We can return null or a loader here as a fallback.
export default function RootPage() {
  return null;
}
