'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resetPasswordSchema } from '@/lib/validations/user';
import { useResetPassword, User } from '@/lib/hooks/use-users';
import Modal, { ModalFooter } from '@/components/ui/modal';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

// Extended schema with confirm password
const confirmPasswordSchema = resetPasswordSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Lösenorden matchar inte',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof confirmPasswordSchema>;

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: ResetPasswordModalProps) {
  const { resetPassword, loading, error, setError } = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(confirmPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!user) return;

    setError(null);

    try {
      await resetPassword(user.id, data.newPassword);
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to reset password:', err);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Återställ lösenord" size="md">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* User Info */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-sm text-gray-600 mb-1">Användare</p>
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>

          {/* New Password */}
          <div>
            <Input
              label="Nytt lösenord"
              type={showPassword ? 'text' : 'password'}
              required
              error={errors.newPassword?.message}
              {...register('newPassword')}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />
          </div>

          {/* Confirm Password */}
          <div>
            <Input
              label="Bekräfta lösenord"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />
          </div>

          {/* Password requirements */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm font-medium text-amber-900 mb-2">Lösenordskrav:</p>
            <ul className="space-y-1 text-xs text-amber-800">
              <li className={newPassword?.length >= 8 ? 'text-green-600 font-medium' : ''}>
                • Minst 8 tecken
              </li>
              <li className={/[A-Z]/.test(newPassword || '') ? 'text-green-600 font-medium' : ''}>
                • Minst en stor bokstav (A-Z)
              </li>
              <li className={/[a-z]/.test(newPassword || '') ? 'text-green-600 font-medium' : ''}>
                • Minst en liten bokstav (a-z)
              </li>
              <li className={/[0-9]/.test(newPassword || '') ? 'text-green-600 font-medium' : ''}>
                • Minst en siffra (0-9)
              </li>
            </ul>
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Avbryt
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Återställ
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
