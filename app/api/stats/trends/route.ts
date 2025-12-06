import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { statsService } from '@/lib/services/stats-service';

/**
 * GET /api/stats/trends
 * Hämtar trenddata över tid
 */
export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId') || searchParams.get('user_id');
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

    const trends = await statsService.getTrends(userId || undefined, daysNum);

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
