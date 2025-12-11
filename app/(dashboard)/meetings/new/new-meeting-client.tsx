'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateMeeting } from '@/lib/hooks/use-meetings';
import MeetingForm from '@/components/meetings/meeting-form';
import { ArrowLeft } from 'lucide-react';

export default function NewMeetingClient() {
  const router = useRouter();
  const { createMeeting, loading } = useCreateMeeting();

  const handleCreate = async (data: any) => {
    try {
      const newMeeting = await createMeeting(data);
      router.push(`/meetings/${newMeeting.id}`);
    } catch (err) {
      console.error('Failed to create meeting:', err);
    }
  };

  const handleCancel = () => {
    router.push('/meetings');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/meetings"
              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-md transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka till möten
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Skapa nytt möte</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <MeetingForm
            onSubmit={handleCreate}
            onCancel={handleCancel}
            isLoading={loading}
          />
        </div>
      </main>
    </div>
  );
}
