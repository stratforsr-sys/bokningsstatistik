import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db';
import { updateUserSchema } from '@/lib/validations/user';
import { JWTPayload } from '@/lib/auth/jwt';

// GET /api/users/[id] - Hämta en användare
export const GET = withRole(
  [UserRole.ADMIN],
  async (request, user, context) => {
    try {
      const { id } = await (context as { params: Promise<{ id: string }> }).params;

      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              bookedMeetings: true,
              ownedMeetings: true,
            },
          },
        },
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

      return NextResponse.json({
        success: true,
        user: targetUser,
      });
    } catch (error) {
      console.error('[GET /api/users/[id]] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Ett fel uppstod vid hämtning av användare',
        },
        { status: 500 }
      );
    }
  }
);

// PUT /api/users/[id] - Uppdatera en användare
export const PUT = withRole(
  [UserRole.ADMIN],
  async (request, user, context) => {
    try {
      const { id } = await (context as { params: Promise<{ id: string }> }).params;
      const body = await request.json();

      // Validate input
      const validation = updateUserSchema.safeParse(body);

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

      const updates = validation.data;

      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { id },
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

      // Prevent admin from deactivating themselves
      if (updates.isActive === false && id === user.sub) {
        return NextResponse.json(
          {
            success: false,
            error: 'Du kan inte inaktivera ditt eget konto',
          },
          { status: 400 }
        );
      }

      // If email is being changed, check uniqueness
      if (updates.email && updates.email !== targetUser.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: updates.email },
        });

        if (existingUser) {
          return NextResponse.json(
            {
              success: false,
              error: 'E-postadressen används redan',
            },
            { status: 409 }
          );
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updates,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Användare uppdaterad',
        user: updatedUser,
      });
    } catch (error) {
      console.error('[PUT /api/users/[id]] Error:', error);

      // Handle Prisma unique constraint error (P2002)
      if ((error as any).code === 'P2002') {
        return NextResponse.json(
          {
            success: false,
            error: 'E-postadressen används redan',
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Ett fel uppstod vid uppdatering av användare',
        },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/users/[id] - Soft delete användare
export const DELETE = withRole(
  [UserRole.ADMIN],
  async (request, user, context) => {
    try {
      const { id } = await (context as { params: Promise<{ id: string }> }).params;

      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { id },
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

      // Prevent admin from deleting themselves
      if (id === user.sub) {
        return NextResponse.json(
          {
            success: false,
            error: 'Du kan inte ta bort ditt eget konto',
          },
          { status: 400 }
        );
      }

      // Soft delete - set isActive to false
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: 'Användare inaktiverad',
      });
    } catch (error) {
      console.error('[DELETE /api/users/[id]] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Ett fel uppstod vid inaktivering av användare',
        },
        { status: 500 }
      );
    }
  }
);
