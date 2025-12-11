import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db';
import { createUserSchema } from '@/lib/validations/user';
import bcrypt from 'bcrypt';

// GET /api/users - Lista alla användare
export const GET = withRole([UserRole.ADMIN], async (request) => {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query = searchParams.get('query') || '';
    const role = searchParams.get('role') as UserRole | null;
    const isActiveParam = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build where clause
    const where: any = {};

    // Search filter (name or email)
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Role filter
    if (role && ['USER', 'MANAGER', 'ADMIN'].includes(role)) {
      where.role = role;
    }

    // Active status filter
    if (isActiveParam !== null) {
      where.isActive = isActiveParam === 'true';
    }

    // Query database
    const [users, count] = await Promise.all([
      prisma.user.findMany({
        where,
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
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      count,
      users,
    });
  } catch (error) {
    console.error('[GET /api/users] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Ett fel uppstod vid hämtning av användare',
      },
      { status: 500 }
    );
  }
});

// POST /api/users - Skapa ny användare
export const POST = withRole([UserRole.ADMIN], async (request) => {
  try {
    const body = await request.json();

    // Validate input
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map((err) => ({
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

    const { name, email, password, role } = validation.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
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

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Användare skapad',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/users] Error:', error);

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
        error: 'Ett fel uppstod vid skapande av användare',
      },
      { status: 500 }
    );
  }
});
