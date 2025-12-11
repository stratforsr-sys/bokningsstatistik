'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMeeting, useUpdateMeeting, useDeleteMeeting } from '@/lib/hooks/use-meetings';
import MeetingDetailCard from '@/components/meetings/meeting-detail-card';
import MeetingForm from '@/components/meetings/meeting-form';
import Button from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import ErrorMessage from '@/components/ui/error-message';
import Modal, { ModalFooter } from '@/components/ui/modal';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

interface MeetingDetailClientProps {
  meetingId: string;
}

export default function MeetingDetailClient({ meetingId }: MeetingDetailClientProps) {
  const router = useRouter();
  const { meeting, loading, error, mutate } = useMeeting(meetingId);
  const { updateMeeting, loading: updateLoading } = useUpdateMeeting(meetingId);
  const { deleteMeeting, loading: deleteLoading } = useDeleteMeeting();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleUpdate = async (data: any) => {
    try {
      await updateMeeting(data);
      setIsEditing(false);
      mutate();
    } catch (err) {
      console.error('Failed to update meeting:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMeeting(meetingId);
      router.push('/meetings');
    } catch (err) {
      console.error('Failed to delete meeting:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/meetings"
                className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-md transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tillbaka till möten
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Mötesdetaljer</h1>
            </div>
            {!isEditing && meeting && (
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Redigera
                </Button>
                <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Ta bort
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && <ErrorMessage message={error} variant="card" />}

        {/* Meeting Content */}
        {!loading && meeting && (
          <>
            {isEditing ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Redigera möte
                </h2>
                <MeetingForm
                  initialData={{
                    subject: meeting.subject,
                    startTime: new Date(meeting.startTime),
                    endTime: new Date(meeting.endTime),
                    status: meeting.status as any,
                    notes: meeting.notes || '',
                    qualityScore: meeting.qualityScore,
                    outlookLink: meeting.outlookLink || '',
                  }}
                  onSubmit={handleUpdate}
                  onCancel={() => setIsEditing(false)}
                  isLoading={updateLoading}
                  isEdit
                />
              </div>
            ) : (
              <MeetingDetailCard meeting={meeting} />
            )}
          </>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Ta bort möte"
        size="sm"
      >
        <p className="text-sm text-gray-600">
          Är du säker på att du vill ta bort detta möte? Denna åtgärd kan inte ångras.
        </p>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleteLoading}
          >
            Avbryt
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteLoading}>
            Ta bort möte
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
