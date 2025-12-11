'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserRole } from '@prisma/client';
import { createUserSchema, CreateUserInput } from '@/lib/validations/user';
import { useCreateUser } from '@/lib/hooks/use-users';
import Modal, { ModalFooter } from '@/components/ui/modal';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Button from '@/components/ui/button';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateUserModalProps) {
  const { createUser, loading, error, setError } = useCreateUser();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'USER',
    },
  });

  const password = watch('password');

  // Calculate password strength
  const getPasswordStrength = () => {
    if (!password) return { text: '', color: '' };

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const isLongEnough = password.length >= 8;

    const score = [hasUpper, hasLower, hasNumber, isLongEnough].filter(Boolean).length;

    if (score === 4) return { text: 'Starkt', color: 'text-green-600' };
    if (score >= 2) return { text: 'Medel', color: 'text-yellow-600' };
    return { text: 'Svagt', color: 'text-red-600' };
  };

  const passwordStrength = getPasswordStrength();

  const onSubmit = async (data: CreateUserInput) => {
    setError(null);

    try {
      await createUser(data);
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to create user:', err);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Skapa ny användare" size="md">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
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

          {/* Password */}
          <div>
            <Input
              label="Lösenord"
              type={showPassword ? 'text' : 'password'}
              required
              error={errors.password?.message}
              {...register('password')}
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
            {/* Password requirements */}
            <div className="mt-2 space-y-1 text-xs text-gray-600">
              <p className="flex items-center gap-2">
                <span className={password?.length >= 8 ? 'text-green-600' : ''}>
                  • Minst 8 tecken
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className={/[A-Z]/.test(password || '') ? 'text-green-600' : ''}>
                  • Minst en stor bokstav
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className={/[a-z]/.test(password || '') ? 'text-green-600' : ''}>
                  • Minst en liten bokstav
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className={/[0-9]/.test(password || '') ? 'text-green-600' : ''}>
                  • Minst en siffra
                </span>
              </p>
              {password && password.length > 0 && (
                <p className="mt-2">
                  Styrka: <span className={`font-medium ${passwordStrength.color}`}>{passwordStrength.text}</span>
                </p>
              )}
            </div>
          </div>

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
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Avbryt
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Skapa
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
