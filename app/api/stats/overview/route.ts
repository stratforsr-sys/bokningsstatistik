import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { statsService } from '@/lib/services/stats-service';

/**
 * GET /api/stats/overview
 * Hämtar en komplett översikt med alla statistik-typer
 */
export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId') || searchParams.get('user_id');

    // Hämta statistik för olika perioder parallellt
    const [today, week, month, total, trends] = await Promise.all([
      statsService.getStats({
        userId: userId || undefined,
        period: 'today',
      }),
      statsService.getStats({
        userId: userId || undefined,
        period: 'week',
      }),
      statsService.getStats({
        userId: userId || undefined,
        period: 'month',
      }),
      statsService.getStats({
        userId: userId || undefined,
        period: 'total',
      }),
      statsService.getTrends(userId || undefined, 30),
    ]);

    return NextResponse.json({
      success: true,
      overview: {
        today,
        week,
        month,
        total,
        trends,
      },
    });
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
