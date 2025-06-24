import { redirect } from 'next/navigation';

// This page only exists to handle a malformed route.
// It redirects to the correct schedule page.
export default function MalformedScheduleRedirect() {
  redirect('/schedule');
  return null;
}
