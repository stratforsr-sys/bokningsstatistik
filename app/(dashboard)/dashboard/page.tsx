import { requireAuth } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import DashboardClient from './dashboard-client';

export default async function DashboardPage() {
  try {
    const user = await requireAuth();

    return <DashboardClient user={user} />;
  } catch (error) {
    // User not authenticated - middleware should handle this, but just in case
    redirect('/login');
  }
}
