import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db';
import { getStatsFilterForUser } from '@/lib/utils/ownership';

/**
 * GET /api/stats/summary
 * Hämtar sammanfattande statistik med rollbaserad filtrering
 *
 * - USER: Kan bara se sin egen statistik
 * - MANAGER/ADMIN: Kan se all statistik eller filtrera på userId
 */
export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId') || searchParams.get('user_id');
    const period = searchParams.get('period') || 'month';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validera period
    const validPeriods = ['today', 'week', 'month', 'total'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        {
          error: 'Invalid period',
          validValues: validPeriods,
        },
        { status: 400 }
      );
    }

    // Använd getStatsFilterForUser för rollbaserad filtrering
    const filter = getStatsFilterForUser(
      user.sub,
      user.role,
      userId || undefined
    );

    // Räkna möten baserat på filter och period
    let dateFilter: any = {};
    const now = new Date();

    switch (period) {
      case 'today':
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        dateFilter = { startTime: { gte: startOfDay } };
        break;
      case 'week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        dateFilter = { startTime: { gte: startOfWeek } };
        break;
      case 'month':
        const startOfMonth = new Date(now);
        startOfMonth.setDate(now.getDate() - 30);
        dateFilter = { startTime: { gte: startOfMonth } };
        break;
      case 'total':
        dateFilter = {};
        break;
    }

    if (startDate) {
      dateFilter.startTime = { ...dateFilter.startTime, gte: new Date(startDate) };
    }
    if (endDate) {
      dateFilter.startTime = { ...dateFilter.startTime, lte: new Date(endDate) };
    }

    const where = { ...filter, ...dateFilter };

    const [totalMeetings, completedMeetings, noShowMeetings, canceledMeetings] = await Promise.all([
      prisma.meeting.count({ where }),
      prisma.meeting.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.meeting.count({ where: { ...where, status: 'NO_SHOW' } }),
      prisma.meeting.count({ where: { ...where, status: 'CANCELED' } }),
    ]);

    const stats = {
      totalMeetings,
      completedMeetings,
      noShowMeetings,
      canceledMeetings,
      completionRate: totalMeetings > 0 ? (completedMeetings / totalMeetings) * 100 : 0,
      period,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Error in GET /api/stats/summary:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch statistics',
        message: error.message,
      },
      { status: 500 }
    );
  }
});
