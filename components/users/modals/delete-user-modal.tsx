'use client';

import { useDeleteUser, User } from '@/lib/hooks/use-users';
import Modal, { ModalFooter } from '@/components/ui/modal';
import Button from '@/components/ui/button';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
}

export default function DeleteUserModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: DeleteUserModalProps) {
  const { deleteUser, loading, error, setError } = useDeleteUser();

  const handleDelete = async () => {
    if (!user) return;

    setError(null);

    try {
      await deleteUser(user.id);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!user) return null;

  const totalMeetings = user._count.bookedMeetings + user._count.ownedMeetings;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Ta bort användare" size="md">
      <div className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Warning */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900 mb-1">
              Är du säker på att du vill inaktivera denna användare?
            </p>
            <p className="text-sm text-amber-700">
              Denna åtgärd kan inte ångras. Användaren kommer inte längre kunna logga in.
            </p>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-600 mb-1">Namn</p>
              <p className="font-medium text-gray-900">{user.name}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Roll</p>
              <p className="font-medium text-gray-900">{user.role}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-600 mb-1">E-post</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
            {totalMeetings > 0 && (
              <div className="col-span-2">
                <p className="text-gray-600 mb-1">Möten</p>
                <p className="font-medium text-gray-900">
                  {totalMeetings} {totalMeetings === 1 ? 'möte' : 'möten'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info about soft delete */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            Användaren kommer att inaktiveras men deras möteshistorik sparas. Du kan reaktivera användaren senare genom att redigera kontot.
          </p>
        </div>
      </div>

      <ModalFooter>
        <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
          Avbryt
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          loading={loading}
        >
          Inaktivera
        </Button>
      </ModalFooter>
    </Modal>
  );
}
