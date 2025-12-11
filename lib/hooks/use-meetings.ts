import useSWR from 'swr';
import { useState } from 'react';

interface Meeting {
  id: string;
  outlookEventId: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  subject: string | null;
  organizerEmail: string;
  status: string;
  statusReason: string | null;
  qualityScore: number | null;
  notes: string | null;
  bookerName: string;
  ownerName: string;
}

interface MeetingsFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  query?: string;
  limit?: number;
  offset?: number;
}

interface MeetingsResponse {
  success: boolean;
  count: number;
  meetings: Meeting[];
}

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch');
  }

  return res.json();
};

export function useMeetings(filters?: MeetingsFilters) {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.query) params.append('query', filters.query);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());

  const url = `/api/meetings${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, mutate, isLoading } = useSWR<MeetingsResponse>(url, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    meetings: data?.meetings || [],
    count: data?.count || 0,
    loading: isLoading,
    error: error?.message,
    mutate,
  };
}

export function useMeeting(id: string | null) {
  const { data, error, mutate, isLoading } = useSWR(
    id ? `/api/meetings/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    meeting: data?.meeting,
    loading: isLoading,
    error: error?.message,
    mutate,
  };
}

export function useCreateMeeting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMeeting = async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create meeting');
      }

      return await res.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createMeeting, loading, error };
}

export function useUpdateMeeting(id: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMeeting = async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update meeting');
      }

      return await res.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateMeeting, loading, error };
}

export function useDeleteMeeting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteMeeting = async (id: string, hardDelete = false) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/meetings/${id}?hardDelete=${hardDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete meeting');
      }

      return await res.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { deleteMeeting, loading, error };
}

export function useUpdateMeetingStatus(id: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (data: {
    status: string;
    statusReason?: string;
    qualityScore?: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/meetings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update status');
      }

      return await res.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateStatus, loading, error };
}
