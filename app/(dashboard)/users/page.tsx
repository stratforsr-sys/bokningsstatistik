import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth/jwt';
import UsersClient from './users-client';

export default async function UsersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const user = await verifyToken(token);

  if (!user) {
    redirect('/login');
  }

  // Double check ADMIN role (middleware also checks this)
  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <UsersClient />;
}
