import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db';
import { MeetingStatus } from '@prisma/client';

/**
 * GET /api/stats/by-person
 * Hämtar statistik aggregerad per person
 *
 * Query params:
 * - userIds: Comma-separated user IDs to filter by
 * - startDate, endDate: Date range filter
 * - role: Filter by role (booker, seller, both)
 */
export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = request.nextUrl;
    const userIdsParam = searchParams.get('userIds');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const roleParam = searchParams.get('role') || 'both';

    // Validate role parameter
    const allowedRoles = ['booker', 'seller', 'both'] as const;
    const role = allowedRoles.includes(roleParam as any) ? roleParam : 'both';

    // Parse user IDs
    let userIds: string[] | undefined;
    if (userIdsParam) {
      userIds = userIdsParam.split(',').map((id) => id.trim());
    }

    // Validate dates
    let validStartDate: Date | undefined;
    let validEndDate: Date | undefined;

    if (startDate) {
      validStartDate = new Date(startDate);
      if (isNaN(validStartDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid startDate format. Use ISO 8601 format (YYYY-MM-DD).' },
          { status: 400 }
        );
      }
    }

    if (endDate) {
      validEndDate = new Date(endDate);
      if (isNaN(validEndDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid endDate format. Use ISO 8601 format (YYYY-MM-DD).' },
          { status: 400 }
        );
      }
    }

    if (validStartDate && validEndDate && validStartDate > validEndDate) {
      return NextResponse.json(
        { error: 'startDate must be before or equal to endDate' },
        { status: 400 }
      );
    }

    // Build date filter
    const dateFilter: any = {};
    if (validStartDate || validEndDate) {
      dateFilter.startTime = {};
      if (validStartDate) {
        dateFilter.startTime.gte = validStartDate;
      }
      if (validEndDate) {
        dateFilter.startTime.lte = validEndDate;
      }
    }

    // Get all users (or filtered users) - with pagination
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const users = await prisma.user.findMany({
      where: userIds ? { id: { in: userIds } } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: Math.min(limit, 100), // Max 100 users per request
      skip: offset,
    });

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        stats: [],
        filters: {
          userIds,
          startDate,
          endDate,
          role,
        },
      });
    }

    const userIdsList = users.map((u) => u.id);

    // OPTIMIZED: Fetch all meetings with bookers/sellers in just 2 queries
    // instead of N*10 queries (10 per user)

    // Query 1: Get all meetings where users are bookers
    const meetingsAsBooker = await prisma.meeting.findMany({
      where: {
        bookers: {
          some: {
            userId: { in: userIdsList },
          },
        },
        ...dateFilter,
      },
      select: {
        id: true,
        status: true,
        qualityScore: true,
        bookers: {
          where: {
            userId: { in: userIdsList },
          },
          select: {
            userId: true,
          },
        },
      },
    });

    // Query 2: Get all meetings where users are sellers
    const meetingsAsSeller = await prisma.meeting.findMany({
      where: {
        sellers: {
          some: {
            userId: { in: userIdsList },
          },
        },
        ...dateFilter,
      },
      select: {
        id: true,
        status: true,
        qualityScore: true,
        sellers: {
          where: {
            userId: { in: userIdsList },
          },
          select: {
            userId: true,
          },
        },
      },
    });

    // Calculate stats in memory (MUCH faster than database queries)
    const userStats = users.map((userData) => {
      // Filter meetings for this specific user as booker
      const userBookerMeetings = meetingsAsBooker.filter((m) =>
        m.bookers.some((b) => b.userId === userData.id)
      );

      const totalAsBooker = userBookerMeetings.length;
      const completedAsBooker = userBookerMeetings.filter(
        (m) => m.status === MeetingStatus.COMPLETED
      ).length;
      const noShowAsBooker = userBookerMeetings.filter(
        (m) => m.status === MeetingStatus.NO_SHOW
      ).length;
      const canceledAsBooker = userBookerMeetings.filter(
        (m) => m.status === MeetingStatus.CANCELED
      ).length;
      const rescheduledAsBooker = userBookerMeetings.filter(
        (m) => m.status === MeetingStatus.RESCHEDULED
      ).length;

      // Filter meetings for this specific user as seller
      const userSellerMeetings = meetingsAsSeller.filter((m) =>
        m.sellers.some((s) => s.userId === userData.id)
      );

      const totalAsSeller = userSellerMeetings.length;
      const completedAsSeller = userSellerMeetings.filter(
        (m) => m.status === MeetingStatus.COMPLETED
      ).length;
      const noShowAsSeller = userSellerMeetings.filter(
        (m) => m.status === MeetingStatus.NO_SHOW
      ).length;
      const canceledAsSeller = userSellerMeetings.filter(
        (m) => m.status === MeetingStatus.CANCELED
      ).length;
      const rescheduledAsSeller = userSellerMeetings.filter(
        (m) => m.status === MeetingStatus.RESCHEDULED
      ).length;

      // Calculate quality score average
      const completedWithQuality = userSellerMeetings.filter(
        (m) => m.status === MeetingStatus.COMPLETED && m.qualityScore !== null
      );
      const qualityScoreSum = completedWithQuality.reduce(
        (sum, m) => sum + (m.qualityScore || 0),
        0
      );
      const avgQualityScore =
        completedWithQuality.length > 0
          ? qualityScoreSum / completedWithQuality.length
          : null;

      // Calculate rates
      const showRateAsBooker =
        totalAsBooker > 0 ? completedAsBooker / totalAsBooker : 0;
      const noShowRateAsBooker =
        totalAsBooker > 0 ? noShowAsBooker / totalAsBooker : 0;

      const showRateAsSeller =
        totalAsSeller > 0 ? completedAsSeller / totalAsSeller : 0;
      const noShowRateAsSeller =
        totalAsSeller > 0 ? noShowAsSeller / totalAsSeller : 0;

      return {
        user: userData,
        asBooker: {
          total: totalAsBooker,
          completed: completedAsBooker,
          noShow: noShowAsBooker,
          canceled: canceledAsBooker,
          rescheduled: rescheduledAsBooker,
          showRate: showRateAsBooker,
          noShowRate: noShowRateAsBooker,
        },
        asSeller: {
          total: totalAsSeller,
          completed: completedAsSeller,
          noShow: noShowAsSeller,
          canceled: canceledAsSeller,
          rescheduled: rescheduledAsSeller,
          showRate: showRateAsSeller,
          noShowRate: noShowRateAsSeller,
          avgQualityScore,
          qualityScoreCount: completedWithQuality.length,
        },
        combined: {
          total: totalAsBooker + totalAsSeller,
          completed: completedAsBooker + completedAsSeller,
          noShow: noShowAsBooker + noShowAsSeller,
          canceled: canceledAsBooker + canceledAsSeller,
          rescheduled: rescheduledAsBooker + rescheduledAsSeller,
        },
      };
    });

    // Filter based on role parameter
    let filteredStats = userStats;
    if (role === 'booker') {
      filteredStats = userStats.filter((stat) => stat.asBooker.total > 0);
    } else if (role === 'seller') {
      filteredStats = userStats.filter((stat) => stat.asSeller.total > 0);
    }

    return NextResponse.json({
      success: true,
      count: filteredStats.length,
      stats: filteredStats,
      filters: {
        userIds,
        startDate,
        endDate,
        role,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/stats/by-person:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch stats by person',
        message: error.message,
      },
      { status: 500 }
    );
  }
});
