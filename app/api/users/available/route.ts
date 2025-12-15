import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

/**
 * GET /api/users/available
 * Returns list of users available for selection (bookers, sellers)
 *
 * ✅ Accessible by ALL authenticated users (USER, MANAGER, ADMIN)
 * ✅ Returns only active users by default
 * ✅ Returns minimal user info (id, name, email, role, isActive)
 */
export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = request.nextUrl;

    // Parse query parameters
    const query = searchParams.get('query') || '';
    const role = searchParams.get('role') as UserRole | null;
    const showInactive = searchParams.get('showInactive') === 'true';

    // Build where clause
    const where: any = {};

    // By default, only show active users
    if (!showInactive) {
      where.isActive = true;
    }

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

    // Query database - only return necessary fields
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
      orderBy: [
        { isActive: 'desc' }, // Active users first
        { name: 'asc' },      // Then alphabetically
      ],
    });

    return NextResponse.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('[GET /api/users/available] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch available users',
      },
      { status: 500 }
    );
  }
});
