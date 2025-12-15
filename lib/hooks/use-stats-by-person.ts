import useSWR from 'swr';

export interface UserStats {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
  asBooker: {
    total: number;
    completed: number;
    noShow: number;
    canceled: number;
    rescheduled: number;
    showRate: number;
    noShowRate: number;
  };
  asSeller: {
    total: number;
    completed: number;
    noShow: number;
    canceled: number;
    rescheduled: number;
    showRate: number;
    noShowRate: number;
    avgQualityScore: number | null;
    qualityScoreCount: number;
  };
  combined: {
    total: number;
    completed: number;
    noShow: number;
    canceled: number;
    rescheduled: number;
  };
}

export interface StatsByPersonResponse {
  success: boolean;
  count: number;
  stats: UserStats[];
  filters: {
    userIds?: string[];
    startDate?: string;
    endDate?: string;
    role: string;
  };
}

export interface StatsByPersonFilters {
  userIds?: string[];
  startDate?: string;
  endDate?: string;
  role?: 'booker' | 'seller' | 'both';
}

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch stats by person');
  }

  return res.json();
};

export function useStatsByPerson(filters?: StatsByPersonFilters) {
  const params = new URLSearchParams();
  if (filters?.userIds && filters.userIds.length > 0) {
    params.append('userIds', filters.userIds.join(','));
  }
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.role) params.append('role', filters.role);

  const url = `/api/stats/by-person${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, mutate, isLoading } = useSWR<StatsByPersonResponse>(
    filters?.userIds && filters.userIds.length > 0 ? url : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    stats: data?.stats,
    filters: data?.filters,
    count: data?.count,
    loading: isLoading,
    error: error?.message,
    mutate,
  };
}
