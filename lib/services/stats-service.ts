import { prisma } from '@/lib/db';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

export interface StatsQuery {
  userId?: string;
  period: 'today' | 'week' | 'month' | 'total';
  startDate?: Date;
  endDate?: Date;
}

export interface StatsResponse {
  period: string;
  user_id: string | null;
  dagens_bokningar?: number;
  veckans_bokningar?: number;
  manadens_bokningar?: number;
  total_bokningar?: number;
  avbokningar?: number;
  ombokningar?: number;
  noshows?: number;
  genomforda?: number;
  show_rate?: number;
  no_show_rate?: number;
  kvalitet_genomsnitt?: number;
}

/**
 * Statistics Service
 * Beräknar alla KPI:er och statistik
 */
export class StatsService {
  /**
   * Hämtar tidsintervall baserat på period
   */
  private getDateRange(
    period: 'today' | 'week' | 'month' | 'total',
    customStartDate?: Date,
    customEndDate?: Date
  ): { start: Date; end: Date } | null {
    const now = new Date();

    if (customStartDate && customEndDate) {
      return { start: customStartDate, end: customEndDate };
    }

    switch (period) {
      case 'today':
        return {
          start: startOfDay(now),
          end: endOfDay(now),
        };
      case 'week':
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
      case 'total':
        return null;
      default:
        return null;
    }
  }

  /**
   * Huvudfunktion för att beräkna statistik
   */
  async getStats(query: StatsQuery): Promise<StatsResponse> {
    const dateRange = this.getDateRange(query.period, query.startDate, query.endDate);

    const whereBooking: any = {};
    const whereMeeting: any = {};

    if (query.userId) {
      whereBooking.bookerId = query.userId;
      whereMeeting.bookerId = query.userId;
    }

    // Räkna bokningar per period
    const dagens_bokningar = await this.countBookings(query.userId, 'today');
    const veckans_bokningar = await this.countBookings(query.userId, 'week');
    const manadens_bokningar = await this.countBookings(query.userId, 'month');
    const total_bokningar = await this.countBookings(query.userId, 'total');

    if (dateRange) {
      whereMeeting.startTime = {
        gte: dateRange.start,
        lte: dateRange.end,
      };
    }

    // Räkna per status
    const [avbokningar, ombokningar, noshows, genomforda] = await Promise.all([
      prisma.meeting.count({ where: { ...whereMeeting, status: 'CANCELED' } }),
      prisma.meeting.count({ where: { ...whereMeeting, status: 'RESCHEDULED' } }),
      prisma.meeting.count({ where: { ...whereMeeting, status: 'NO_SHOW' } }),
      prisma.meeting.count({ where: { ...whereMeeting, status: 'COMPLETED' } }),
    ]);

    const totalAttended = genomforda + noshows;
    const show_rate = totalAttended > 0 ? genomforda / totalAttended : 0;
    const no_show_rate = totalAttended > 0 ? noshows / totalAttended : 0;

    const kvalitet_genomsnitt = await this.calculateAverageQuality(
      query.userId,
      dateRange?.start,
      dateRange?.end
    );

    return {
      period: query.period,
      user_id: query.userId || null,
      dagens_bokningar,
      veckans_bokningar,
      manadens_bokningar,
      total_bokningar,
      avbokningar,
      ombokningar,
      noshows,
      genomforda,
      show_rate: Math.round(show_rate * 100) / 100,
      no_show_rate: Math.round(no_show_rate * 100) / 100,
      kvalitet_genomsnitt: Math.round(kvalitet_genomsnitt * 10) / 10,
    };
  }

  /**
   * Räknar bokningar baserat på bookingDate
   */
  private async countBookings(
    userId?: string,
    period?: 'today' | 'week' | 'month' | 'total'
  ): Promise<number> {
    const where: any = {};

    if (userId) {
      where.bookerId = userId;
    }

    if (period && period !== 'total') {
      const dateRange = this.getDateRange(period);
      if (dateRange) {
        where.bookingDate = {
          gte: dateRange.start,
          lte: dateRange.end,
        };
      }
    }

    return await prisma.meeting.count({ where });
  }

  /**
   * Beräknar genomsnittlig kvalitetspoäng
   */
  private async calculateAverageQuality(
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const where: any = {
      status: 'COMPLETED',
      qualityScore: { not: null },
    };

    if (userId) {
      where.bookerId = userId;
    }

    if (startDate && endDate) {
      where.startTime = {
        gte: startDate,
        lte: endDate,
      };
    }

    const result = await prisma.meeting.aggregate({
      where,
      _avg: { qualityScore: true },
    });

    return result._avg.qualityScore || 0;
  }

  /**
   * Hämtar detaljerad statistik per person
   */
  async getDetailedStats(
    userIds?: string[],
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ userId: string; userName: string; stats: StatsResponse }>> {
    if (!userIds || userIds.length === 0) {
      const users = await prisma.user.findMany({
        select: { id: true, name: true },
      });
      userIds = users.map((u) => u.id);
    }

    const results = await Promise.all(
      userIds.map(async (userId) => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true },
        });

        const stats = await this.getStats({
          userId,
          period: startDate && endDate ? 'total' : 'month',
          startDate,
          endDate,
        });

        return {
          userId,
          userName: user?.name || 'Unknown',
          stats,
        };
      })
    );

    return results;
  }

  /**
   * Hämtar trenddata över tid
   */
  async getTrends(
    userId?: string,
    days: number = 30
  ): Promise<Array<{ date: string; bokningar: number; genomforda: number; noshows: number }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      startTime: { gte: startDate, lte: endDate },
    };

    if (userId) {
      where.bookerId = userId;
    }

    const meetings = await prisma.meeting.findMany({
      where,
      select: { startTime: true, status: true },
      orderBy: { startTime: 'asc' },
    });

    const trendMap = new Map<string, { bokningar: number; genomforda: number; noshows: number }>();

    meetings.forEach((meeting) => {
      const dateKey = meeting.startTime.toISOString().split('T')[0];

      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, { bokningar: 0, genomforda: 0, noshows: 0 });
      }

      const stats = trendMap.get(dateKey)!;
      stats.bokningar++;

      if (meeting.status === 'COMPLETED') {
        stats.genomforda++;
      } else if (meeting.status === 'NO_SHOW') {
        stats.noshows++;
      }
    });

    return Array.from(trendMap.entries()).map(([date, stats]) => ({
      date,
      ...stats,
    }));
  }
}

export const statsService = new StatsService();
