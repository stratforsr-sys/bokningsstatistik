import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const createUserSchema = z.object({
  name: z.string().min(2, 'Namnet måste vara minst 2 tecken').max(100, 'Namnet får vara max 100 tecken'),
  email: z.string().email('Ogiltig e-postadress').toLowerCase(),
  password: z
    .string()
    .min(8, 'Lösenordet måste vara minst 8 tecken')
    .regex(/[A-Z]/, 'Lösenordet måste innehålla minst en stor bokstav')
    .regex(/[a-z]/, 'Lösenordet måste innehålla minst en liten bokstav')
    .regex(/[0-9]/, 'Lösenordet måste innehålla minst en siffra'),
  role: z.enum(['USER', 'MANAGER', 'ADMIN'], {
    errorMap: () => ({ message: 'Ogiltig roll' }),
  }),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(2, 'Namnet måste vara minst 2 tecken').max(100, 'Namnet får vara max 100 tecken').optional(),
    email: z.string().email('Ogiltig e-postadress').toLowerCase().optional(),
    role: z.enum(['USER', 'MANAGER', 'ADMIN'], {
      errorMap: () => ({ message: 'Ogiltig roll' }),
    }).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minst ett fält måste uppdateras',
  });

export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Lösenordet måste vara minst 8 tecken')
    .regex(/[A-Z]/, 'Lösenordet måste innehålla minst en stor bokstav')
    .regex(/[a-z]/, 'Lösenordet måste innehålla minst en liten bokstav')
    .regex(/[0-9]/, 'Lösenordet måste innehålla minst en siffra'),
});

// Type exports för TypeScript
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
