'use client';

import useSWR from 'swr';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useAuth() {
  const router = useRouter();
  const { data, error, mutate } = useSWR('/api/auth/me', fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      mutate(null, false); // Clear cache
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return {
    user: data?.user,
    loading: !error && !data,
    error,
    logout,
    isAuthenticated: !!data?.user,
    isAdmin: data?.user?.role === 'ADMIN',
    isManager: data?.user?.role === 'MANAGER' || data?.user?.role === 'ADMIN',
  };
}
