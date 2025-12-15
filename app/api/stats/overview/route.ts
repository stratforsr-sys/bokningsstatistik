import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { statsService } from '@/lib/services/stats-service';
import { prisma } from '@/lib/db';

/**
 * GET /api/stats/overview
 * Hämtar en komplett översikt med alla statistik-typer
 *
 * ✅ UPDATED: Now includes role-based access control
 * - USER role: Can only view their own stats
 * - ADMIN/MANAGER: Can view all stats or filter by userId
 */
export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = request.nextUrl;
    const requestedUserId = searchParams.get('userId') || searchParams.get('user_id');

    // ✅ SECURITY: Enforce access control for USER role
    if (user.role === 'USER') {
      // USER can only view their own stats
      if (requestedUserId && requestedUserId !== user.sub) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: 'You can only view your own statistics',
          },
          { status: 403 }
        );
      }
    }

    // ✅ For USER role, force their own ID (ignore any query param)
    const targetUserId = user.role === 'USER' ? user.sub : (requestedUserId || undefined);

    // ✅ Pass requestUser for ownership filtering
    const requestUser = { id: user.sub, role: user.role };

    // Hämta statistik för olika perioder parallellt
    const promises: any[] = [
      statsService.getStats({
        userId: targetUserId,
        period: 'today',
        requestUser,
      }),
      statsService.getStats({
        userId: targetUserId,
        period: 'week',
        requestUser,
      }),
      statsService.getStats({
        userId: targetUserId,
        period: 'month',
        requestUser,
      }),
      statsService.getStats({
        userId: targetUserId,
        period: 'total',
        requestUser,
      }),
      statsService.getTrends(targetUserId, 30, requestUser),
    ];

    // ✅ For USER role, also fetch team aggregates for comparison
    if (user.role === 'USER') {
      // Fetch team stats (no userId filter = all users)
      promises.push(
        statsService.getStats({
          period: 'month',
          // No requestUser = no filtering, get all data
        })
      );
    }

    const results = await Promise.all(promises);
    const [today, week, month, total, trends, teamStats] = results;

    // ✅ Calculate comparison data for USER role
    let comparison = null;
    if (user.role === 'USER' && teamStats) {
      // Get all active users for ranking
      const allUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });

      // Calculate user's rank (simplified - can be enhanced later)
      const userShowRate = month.show_rate || 0;
      const teamShowRate = teamStats.show_rate || 0;

      comparison = {
        personal: {
          showRate: userShowRate,
          quality: month.kvalitet_genomsnitt || 0,
          totalMeetings: month.manadens_bokningar || 0,
          completed: month.genomforda || 0,
          noShows: month.noshows || 0,
        },
        teamAverage: {
          showRate: teamShowRate,
          quality: teamStats.kvalitet_genomsnitt || 0,
          totalMeetings: Math.round((teamStats.manadens_bokningar || 0) / Math.max(allUsers.length, 1)),
        },
        totalUsers: allUsers.length,
      };
    }

    const response: any = {
      success: true,
      overview: {
        today,
        week,
        month,
        total,
        trends,
      },
    };

    // ✅ Add comparison data for USER role
    if (comparison) {
      response.comparison = comparison;
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in GET /api/stats/overview:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch overview',
        message: error.message,
      },
      { status: 500 }
    );
  }
});
