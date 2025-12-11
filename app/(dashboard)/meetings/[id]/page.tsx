import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth/jwt';
import MeetingDetailClient from './meeting-detail-client';

export const metadata = {
  title: 'Mötesdetaljer | Telink Mötesstatistik',
  description: 'Visa och redigera mötesdetaljer',
};

export default async function MeetingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const user = await verifyToken(token);

    if (!user) {
      redirect('/login');
    }

    return <MeetingDetailClient meetingId={params.id} />;
  } catch (error) {
    redirect('/login');
  }
}
