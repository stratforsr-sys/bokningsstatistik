import { useState } from 'react';
import useSWR from 'swr';
import { UserRole } from '@prisma/client';

// User type
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    bookedMeetings: number;
    ownedMeetings: number;
  };
}

// Filters
export interface UsersFilters {
  query?: string;
  role?: UserRole | 'ALL';
  isActive?: boolean | 'ALL';
}

// Fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// useUsers - Lista användare med filters
export function useUsers(filters?: UsersFilters) {
  const params = new URLSearchParams();

  if (filters?.query) {
    params.set('query', filters.query);
  }

  if (filters?.role && filters.role !== 'ALL') {
    params.set('role', filters.role);
  }

  if (filters?.isActive !== undefined && filters.isActive !== 'ALL') {
    params.set('isActive', String(filters.isActive));
  }

  const { data, error, mutate } = useSWR(
    `/api/users?${params.toString()}`,
    fetcher
  );

  return {
    users: (data?.users as User[]) || [],
    count: data?.count || 0,
    loading: !data && !error,
    error: error || data?.error,
    mutate,
  };
}

// useUser - Hämta en användare
export function useUser(id: string | null) {
  const { data, error, mutate } = useSWR(
    id ? `/api/users/${id}` : null,
    fetcher
  );

  return {
    user: data?.user as User | undefined,
    loading: !data && !error && id !== null,
    error: error || data?.error,
    mutate,
  };
}

// useCreateUser - Skapa användare
export function useCreateUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = async (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ett fel uppstod');
      }

      setLoading(false);
      return data.user;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return { createUser, loading, error, setError };
}

// useUpdateUser - Uppdatera användare
export function useUpdateUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUser = async (
    id: string,
    updates: {
      name?: string;
      email?: string;
      role?: UserRole;
      isActive?: boolean;
    }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ett fel uppstod');
      }

      setLoading(false);
      return data.user;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return { updateUser, loading, error, setError };
}

// useDeleteUser - Ta bort användare
export function useDeleteUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteUser = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ett fel uppstod');
      }

      setLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return { deleteUser, loading, error, setError };
}

// useResetPassword - Återställ lösenord
export function useResetPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetPassword = async (id: string, newPassword: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ett fel uppstod');
      }

      setLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return { resetPassword, loading, error, setError };
}
