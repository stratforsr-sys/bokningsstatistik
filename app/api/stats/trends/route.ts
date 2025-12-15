import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { statsService } from '@/lib/services/stats-service';

/**
 * GET /api/stats/trends
 * Hämtar trenddata över tid
 *
 * ✅ UPDATED: Now includes role-based access control
 * - USER role: Can only view their own trends
 * - ADMIN/MANAGER: Can view all trends or filter by userId
 */
export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = request.nextUrl;
    const requestedUserId = searchParams.get('userId') || searchParams.get('user_id');
    const days = searchParams.get('days') || '30';

    const daysNum = parseInt(days, 10);

    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      return NextResponse.json(
        {
          error: 'Invalid days parameter',
          message: 'Days must be between 1 and 365',
        },
        { status: 400 }
      );
    }

    // ✅ SECURITY: Enforce access control for USER role
    if (user.role === 'USER') {
      if (requestedUserId && requestedUserId !== user.sub) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: 'You can only view your own trends',
          },
          { status: 403 }
        );
      }
    }

    // ✅ For USER role, force their own ID
    const targetUserId = user.role === 'USER' ? user.sub : (requestedUserId || undefined);

    // ✅ Pass requestUser for ownership filtering
    const requestUser = { id: user.sub, role: user.role };

    const trends = await statsService.getTrends(targetUserId, daysNum, requestUser);

    return NextResponse.json({
      success: true,
      count: trends.length,
      trends,
    });
  } catch (error: any) {
    console.error('Error in GET /api/stats/trends:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch trends',
        message: error.message,
      },
      { status: 500 }
    );
  }
});
