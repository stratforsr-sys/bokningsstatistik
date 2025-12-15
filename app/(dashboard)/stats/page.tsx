import { requireAuth } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import StatsClient from './stats-client';

export const metadata = {
  title: 'Statistik per person | Telink Bokningsstatistik',
  description: 'Visa och filtrera statistik per person (bokare och säljare)',
};

export default async function StatsPage() {
  try {
    const user = await requireAuth();

    return <StatsClient user={user} />;
  } catch (error) {
    // User not authenticated
    redirect('/login');
  }
}
