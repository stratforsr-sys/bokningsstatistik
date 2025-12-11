'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useMeetings } from '@/lib/hooks/use-meetings';
import { useMeetingsStore } from '@/lib/stores/meetings-store';
import { JWTPayload } from '@/lib/auth/jwt';
import MeetingsLayout from '@/components/meetings/layout/meetings-layout';
import Spinner from '@/components/ui/spinner';
import ErrorMessage from '@/components/ui/error-message';

interface MeetingsClientProps {
  user: JWTPayload;
}

function MeetingsContent({ user }: MeetingsClientProps) {
  const router = useRouter();
  const { filters } = useMeetingsStore();

  // Fetch meetings with filters from Zustand store
  const { meetings, loading, error } = useMeetings(filters);

  const handleCreateMeeting = () => {
    router.push('/meetings/new');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <ErrorMessage message={error} variant="card" />
      </div>
    );
  }

  return (
    <MeetingsLayout
      user={user}
      meetings={meetings || []}
      onCreateMeeting={handleCreateMeeting}
    />
  );
}

export default function MeetingsClient({ user }: MeetingsClientProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    }>
      <MeetingsContent user={user} />
    </Suspense>
  );
}
