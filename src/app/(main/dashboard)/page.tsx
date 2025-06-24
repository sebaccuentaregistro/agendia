import { redirect } from 'next/navigation';

// This page only exists to handle a malformed route.
// It redirects to the correct dashboard page.
export default function MalformedDashboardRedirect() {
  redirect('/dashboard');
  return null;
}
