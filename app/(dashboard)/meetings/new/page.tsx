import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth/jwt';
import NewMeetingClient from './new-meeting-client';

export const metadata = {
  title: 'Nytt möte | Telink Mötesstatistik',
  description: 'Skapa ett nytt möte',
};

export default async function NewMeetingPage() {
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

    return <NewMeetingClient />;
  } catch (error) {
    redirect('/login');
  }
}
