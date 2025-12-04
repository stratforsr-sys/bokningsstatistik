import { Router, Request, Response } from 'express';
import { statsService } from '../services/statsService';
import { authMiddleware } from '../middleware/auth';
import { getStatsFilterForUser } from '../middleware/ownership';
import { StatsQuery } from '../types';
import prisma from '../db';

const router = Router();

/**
 * GET /api/stats/summary
 * Hämtar sammanfattande statistik med rollbaserad filtrering
 *
 * - USER: Kan bara se sin egen statistik
 * - MANAGER/ADMIN: Kan se all statistik eller filtrera på userId
 */
router.get('/summary', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId, user_id, period = 'month', startDate, endDate } = req.query;

    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Acceptera både userId (camelCase) och user_id (snake_case) för bakåtkompatibilitet
    const targetUserId = userId || user_id;

    // Validera period
    const validPeriods = ['today', 'week', 'month', 'total'];
    if (!validPeriods.includes(period as string)) {
      return res.status(400).json({
        error: 'Invalid period',
        validValues: validPeriods,
      });
    }

    // Använd getStatsFilterForUser för rollbaserad filtrering
    const filter = getStatsFilterForUser(
      req.user.id,
      req.user.role,
      targetUserId as string | undefined
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
      dateFilter.startTime = { ...dateFilter.startTime, gte: new Date(startDate as string) };
    }
    if (endDate) {
      dateFilter.startTime = { ...dateFilter.startTime, lte: new Date(endDate as string) };
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

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Error in GET /api/stats/summary:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message,
    });
  }
});

/**
 * GET /api/stats/detailed
 * Hämtar detaljerad statistik per användare (kräver autentisering)
 */
router.get('/detailed', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userIds, startDate, endDate } = req.query;

    let userIdArray: string[] | undefined;
    if (userIds) {
      // Hantera både kommaseparerad sträng och array
      if (typeof userIds === 'string') {
        userIdArray = userIds.split(',').map((id) => id.trim());
      } else if (Array.isArray(userIds)) {
        userIdArray = userIds as string[];
      }
    }

    const stats = await statsService.getDetailedStats(
      userIdArray,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      count: stats.length,
      stats,
    });
  } catch (error: any) {
    console.error('Error in GET /api/stats/detailed:', error);
    res.status(500).json({
      error: 'Failed to fetch detailed statistics',
      message: error.message,
    });
  }
});

/**
 * GET /api/stats/trends
 * Hämtar trenddata över tid (kräver autentisering)
 */
router.get('/trends', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId, user_id, days = '30' } = req.query;

    // Acceptera både userId (camelCase) och user_id (snake_case) för bakåtkompatibilitet
    const finalUserId = userId || user_id;

    const daysNum = parseInt(days as string, 10);

    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      return res.status(400).json({
        error: 'Invalid days parameter',
        message: 'Days must be between 1 and 365',
      });
    }

    const trends = await statsService.getTrends(finalUserId as string | undefined, daysNum);

    res.json({
      success: true,
      count: trends.length,
      trends,
    });
  } catch (error: any) {
    console.error('Error in GET /api/stats/trends:', error);
    res.status(500).json({
      error: 'Failed to fetch trends',
      message: error.message,
    });
  }
});

/**
 * GET /api/stats/overview
 * Hämtar en komplett översikt med alla statistik-typer (kräver autentisering)
 */
router.get('/overview', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId, user_id } = req.query;

    // Acceptera både userId (camelCase) och user_id (snake_case) för bakåtkompatibilitet
    const finalUserId = userId || user_id;

    // Hämta statistik för olika perioder parallellt
    const [today, week, month, total, trends] = await Promise.all([
      statsService.getStats({
        userId: finalUserId as string | undefined,
        period: 'today',
      }),
      statsService.getStats({
        userId: finalUserId as string | undefined,
        period: 'week',
      }),
      statsService.getStats({
        userId: finalUserId as string | undefined,
        period: 'month',
      }),
      statsService.getStats({
        userId: finalUserId as string | undefined,
        period: 'total',
      }),
      statsService.getTrends(finalUserId as string | undefined, 30),
    ]);

    res.json({
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
    res.status(500).json({
      error: 'Failed to fetch overview',
      message: error.message,
    });
  }
});

export default router;
