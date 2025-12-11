import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth/jwt';
import MeetingsClient from './meetings-client';

export const metadata = {
  title: 'Möten | Telink Mötesstatistik',
  description: 'Hantera och visa alla möten',
};

export default async function MeetingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const user = await verifyToken(token);

    if (!user) {
      redirect('/login');
    }

    return <MeetingsClient user={user} />;
  } catch (error) {
    redirect('/login');
  }
}
