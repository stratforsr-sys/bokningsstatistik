'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateUserSchema, UpdateUserInput } from '@/lib/validations/user';
import { useUpdateUser, User } from '@/lib/hooks/use-users';
import Modal, { ModalFooter } from '@/components/ui/modal';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Button from '@/components/ui/button';
import { AlertCircle, Info } from 'lucide-react';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
}

export default function EditUserModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: EditUserModalProps) {
  const { updateUser, loading, error, setError } = useUpdateUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
  });

  // Populate form when user changes
  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('email', user.email);
      setValue('role', user.role);
      setValue('isActive', user.isActive);
    }
  }, [user, setValue]);

  const onSubmit = async (data: UpdateUserInput) => {
    if (!user) return;

    setError(null);

    try {
      await updateUser(user.id, data);
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  if (!user) return null;

  const totalMeetings = user._count.bookedMeetings + user._count.ownedMeetings;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Redigera användare" size="md">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Meeting count info */}
          {totalMeetings > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                Denna användare har {totalMeetings} {totalMeetings === 1 ? 'möte' : 'möten'}.
              </p>
            </div>
          )}

          {/* Name */}
          <Input
            label="Namn"
            required
            error={errors.name?.message}
            {...register('name')}
          />

          {/* Email */}
          <Input
            label="E-post"
            type="email"
            required
            error={errors.email?.message}
            {...register('email')}
          />

          {/* Role */}
          <Select
            label="Roll"
            required
            error={errors.role?.message}
            {...register('role')}
            options={[
              { value: 'USER', label: 'USER - Vanlig användare' },
              { value: 'MANAGER', label: 'MANAGER - Hanterare' },
              { value: 'ADMIN', label: 'ADMIN - Administratör' },
            ]}
          />

          {/* Status Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  {...register('isActive')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-telink-violet/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-telink-violet"></div>
              </label>
              <span className="text-sm text-gray-700">
                {user.isActive ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>
            {errors.isActive && (
              <p className="mt-1 text-sm text-red-600">{errors.isActive.message}</p>
            )}
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Avbryt
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Uppdatera
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
