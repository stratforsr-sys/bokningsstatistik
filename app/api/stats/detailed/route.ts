import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { statsService } from '@/lib/services/stats-service';

/**
 * GET /api/stats/detailed
 * Hämtar detaljerad statistik per användare
 */
export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = request.nextUrl;
    const userIds = searchParams.get('userIds');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let userIdArray: string[] | undefined;
    if (userIds) {
      // Hantera kommaseparerad sträng
      userIdArray = userIds.split(',').map((id) => id.trim());
    }

    const stats = await statsService.getDetailedStats(
      userIdArray,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json({
      success: true,
      count: stats.length,
      stats,
    });
  } catch (error: any) {
    console.error('Error in GET /api/stats/detailed:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch detailed statistics',
        message: error.message,
      },
      { status: 500 }
    );
  }
});
