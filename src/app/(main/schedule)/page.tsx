import { redirect } from 'next/navigation';

// This page was causing an infinite loop.
// It is now corrected to redirect to the main dashboard.
export default function MalformedScheduleRedirect() {
  redirect('/dashboard');
  return null;
}
