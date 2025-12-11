import useSWR from 'swr';

interface StatsResponse {
  success: boolean;
  overview: {
    today: StatsPeriod;
    week: StatsPeriod;
    month: StatsPeriod;
    total: StatsPeriod;
    trends: TrendData[];
  };
}

interface StatsPeriod {
  period: string;
  user_id: string | null;
  dagens_bokningar: number;
  veckans_bokningar: number;
  manadens_bokningar: number;
  total_bokningar: number;
  avbokningar: number;
  ombokningar: number;
  noshows: number;
  genomforda: number;
  show_rate: number;
  no_show_rate: number;
  kvalitet_genomsnitt: number;
}

interface TrendData {
  date: string;
  bokningar: number;
  genomforda: number;
  noshows: number;
}

interface DetailedStatsFilters {
  userId?: string;
  period?: 'today' | 'week' | 'month' | 'total';
  startDate?: string;
  endDate?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch stats');
  }

  return res.json();
};

export function useStats() {
  const { data, error, mutate, isLoading } = useSWR<StatsResponse>(
    '/api/stats/overview',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    stats: data?.overview,
    loading: isLoading,
    error: error?.message,
    mutate,
  };
}

export function useDetailedStats(filters?: DetailedStatsFilters) {
  const params = new URLSearchParams();
  if (filters?.userId) params.append('userId', filters.userId);
  if (filters?.period) params.append('period', filters.period);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const url = `/api/stats/detailed${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, mutate, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    stats: data?.stats,
    loading: isLoading,
    error: error?.message,
    mutate,
  };
}
