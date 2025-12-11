import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db';
import { resetPasswordSchema } from '@/lib/validations/user';
import bcrypt from 'bcrypt';

// PUT /api/users/[id]/password - Återställ lösenord
export const PUT = withRole(
  [UserRole.ADMIN],
  async (request, user, context) => {
    try {
      const { id } = await (context as { params: Promise<{ id: string }> }).params;
      const body = await request.json();

      // Validate input
      const validation = resetPasswordSchema.safeParse(body);

      if (!validation.success) {
        const errors = validation.error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return NextResponse.json(
          {
            success: false,
            error: 'Valideringsfel',
            errors,
          },
          { status: 400 }
        );
      }

      const { newPassword } = validation.data;

      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!targetUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'Användare hittades inte',
          },
          { status: 404 }
        );
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id },
        data: { passwordHash },
      });

      return NextResponse.json({
        success: true,
        message: 'Lösenord återställt',
      });
    } catch (error) {
      console.error('[PUT /api/users/[id]/password] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Ett fel uppstod vid återställning av lösenord',
        },
        { status: 500 }
      );
    }
  }
);
