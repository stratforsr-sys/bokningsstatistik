import prisma from '../db';
import { MeetingCreateInput, MeetingUpdateInput, OutlookEvent } from '../types';
import { MeetingStatus, StatusReason } from '@prisma/client';

/**
 * Meeting Service
 * Hanterar all möteslogik och databasoperationer
 */

export class MeetingService {
  /**
   * Skapar ett nytt möte från Outlook/Teams event
   */
  async createMeetingFromOutlook(event: OutlookEvent, bookerId: string, ownerId: string) {
    const attendeesJson = event.attendees ? JSON.stringify(event.attendees) : null;

    // Hämta användarnamn
    const booker = await prisma.user.findUnique({
      where: { id: bookerId },
      select: { name: true },
    });
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { name: true },
    });

    if (!booker || !owner) {
      throw new Error('Booker or owner not found');
    }

    const meeting = await prisma.meeting.create({
      data: {
        outlookEventId: event.id,
        bookingDate: new Date(), // När vi skapar mötet i systemet
        startTime: new Date(event.start.dateTime),
        endTime: new Date(event.end.dateTime),
        subject: event.subject,
        organizerEmail: event.organizer.emailAddress.address,
        attendees: attendeesJson,
        joinUrl: event.onlineMeeting?.joinUrl,
        bodyPreview: event.bodyPreview,
        bookerId,
        bookerName: booker.name,
        ownerId,
        ownerName: owner.name,
        status: 'BOOKED',
      },
      include: {
        booker: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return meeting;
  }

  /**
   * Uppdaterar ett möte baserat på Outlook event (om det ändrats)
   */
  async updateMeetingFromOutlook(meetingId: string, event: OutlookEvent) {
    const attendeesJson = event.attendees ? JSON.stringify(event.attendees) : null;

    return await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        startTime: new Date(event.start.dateTime),
        endTime: new Date(event.end.dateTime),
        subject: event.subject,
        organizerEmail: event.organizer.emailAddress.address,
        attendees: attendeesJson,
        joinUrl: event.onlineMeeting?.joinUrl,
        bodyPreview: event.bodyPreview,
      },
      include: {
        booker: true,
        owner: true,
      },
    });
  }

  /**
   * Hämtar möte via Outlook event ID
   */
  async getMeetingByOutlookId(outlookEventId: string) {
    return await prisma.meeting.findUnique({
      where: { outlookEventId },
      include: {
        booker: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Hämtar möte via internt ID
   */
  async getMeetingById(id: string) {
    return await prisma.meeting.findUnique({
      where: { id },
      include: {
        booker: true,
        owner: true,
      },
    });
  }

  /**
   * Fuzzy search med pg_trgm similarity
   * Hittar möten även med felstavningar
   */
  async fuzzySearchMeetings(
    searchTerm: string,
    filters: {
      bookerId?: string;
      ownerId?: string;
      status?: MeetingStatus;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ) {
    // Similarity threshold: 0.3 = ganska tolerant, 0.5 = striktare
    const similarityThreshold = 0.2; // Lägre = mer tolerant mot felstavningar

    // Bygg WHERE-clause för filter
    const conditions: string[] = [];
    const params: any[] = [searchTerm, similarityThreshold];
    let paramIndex = 3;

    if (filters.bookerId) {
      conditions.push(`"bookerId" = $${paramIndex}`);
      params.push(filters.bookerId);
      paramIndex++;
    }

    if (filters.ownerId) {
      conditions.push(`"ownerId" = $${paramIndex}`);
      params.push(filters.ownerId);
      paramIndex++;
    }

    if (filters.status) {
      conditions.push(`status = $${paramIndex}::text::"MeetingStatus"`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.startDate && filters.endDate) {
      conditions.push(`"startTime" >= $${paramIndex} AND "startTime" <= $${paramIndex + 1}`);
      params.push(filters.startDate, filters.endDate);
      paramIndex += 2;
    } else if (filters.startDate) {
      conditions.push(`"startTime" >= $${paramIndex}`);
      params.push(filters.startDate);
      paramIndex++;
    } else if (filters.endDate) {
      conditions.push(`"startTime" <= $${paramIndex}`);
      params.push(filters.endDate);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    // Raw SQL query med fuzzy matching
    const query = `
      SELECT
        m.*,
        GREATEST(
          similarity(COALESCE(m.subject, ''), $1),
          similarity(COALESCE(m.notes, ''), $1),
          similarity(COALESCE(m."bodyPreview", ''), $1)
        ) as search_score
      FROM "Meeting" m
      WHERE (
        similarity(COALESCE(m.subject, ''), $1) > $2
        OR similarity(COALESCE(m.notes, ''), $1) > $2
        OR similarity(COALESCE(m."bodyPreview", ''), $1) > $2
        OR COALESCE(m.subject, '') ILIKE '%' || $1 || '%'
        OR COALESCE(m.notes, '') ILIKE '%' || $1 || '%'
        OR COALESCE(m."bodyPreview", '') ILIKE '%' || $1 || '%'
      )
      ${whereClause}
      ORDER BY search_score DESC, m."startTime" DESC
      LIMIT ${filters.limit || 100}
      OFFSET ${filters.offset || 0}
    `;

    const rawResults = await prisma.$queryRawUnsafe<any[]>(query, ...params);

    // Hämta relaterade users för varje möte
    const meetingIds = rawResults.map((m) => m.id);
    if (meetingIds.length === 0) return [];

    const meetings = await prisma.meeting.findMany({
      where: { id: { in: meetingIds } },
      include: {
        booker: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Sortera enligt search_score från fuzzy search
    const meetingMap = new Map(meetings.map((m) => [m.id, m]));
    return rawResults
      .map((raw) => meetingMap.get(raw.id))
      .filter((m) => m !== undefined);
  }

  /**
   * Hämtar alla möten med filtrering och sökning
   */
  async getMeetings(filters: {
    bookerId?: string; // Den som har bokat mötet
    ownerId?: string; // Mötes ägare (optional, separat från bookerId)
    status?: MeetingStatus;
    startDate?: Date;
    endDate?: Date;
    query?: string; // Söksträng för textbaserad sökning
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    // Filtrera på den som har bokat mötet (bookerId)
    if (filters.bookerId) {
      where.bookerId = filters.bookerId;
    }

    // Filtrera på mötes ägare (ownerId) - separat från bookerId
    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.startTime = {};
      if (filters.startDate) {
        where.startTime.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.startTime.lte = filters.endDate;
      }
    }

    // Intelligent fuzzy sökning på text och datum
    if (filters.query && filters.query.trim() !== '') {
      const searchTerm = filters.query.trim();

      // Smart datum-detektion: Om söktermen ser ut som ett datum (YYYY-MM-DD), sök på det
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      const isDateSearch = datePattern.test(searchTerm);

      if (isDateSearch) {
        // Datum-sökning (exakt matching med vanlig Prisma query)
        try {
          const searchDate = new Date(searchTerm);
          if (!isNaN(searchDate.getTime())) {
            const startOfSearchDay = new Date(searchDate);
            startOfSearchDay.setHours(0, 0, 0, 0);
            const endOfSearchDay = new Date(searchDate);
            endOfSearchDay.setHours(23, 59, 59, 999);

            where.startTime = {
              gte: startOfSearchDay,
              lte: endOfSearchDay,
            };
          }
        } catch (error) {
          console.log('Could not parse date from search query:', searchTerm);
        }

        // Använd vanlig Prisma query för datum-sökning
        const meetings = await prisma.meeting.findMany({
          where,
          include: {
            booker: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            startTime: 'desc',
          },
          take: filters.limit || 100,
          skip: filters.offset || 0,
        });

        return meetings;
      } else {
        // Text-sökning: Använd fuzzy search för att hitta även med felstavningar
        return await this.fuzzySearchMeetings(searchTerm, {
          bookerId: filters.bookerId,
          ownerId: filters.ownerId,
          status: filters.status,
          startDate: filters.startDate,
          endDate: filters.endDate,
          limit: filters.limit,
          offset: filters.offset,
        });
      }
    }

    // Ingen sökning: Använd vanlig Prisma query med filter
    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        booker: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });

    return meetings;
  }

  /**
   * Uppdaterar mötesstatus
   */
  async updateMeetingStatus(
    id: string,
    status: MeetingStatus,
    statusReason?: StatusReason,
    qualityScore?: number,
    notes?: string
  ) {
    // Validera kvalitetspoäng
    if (qualityScore !== undefined && (qualityScore < 1 || qualityScore > 5)) {
      throw new Error('Quality score must be between 1 and 5');
    }

    // Validera att quality score bara sätts för COMPLETED möten
    if (qualityScore !== undefined && status !== 'COMPLETED') {
      throw new Error('Quality score can only be set for completed meetings');
    }

    return await prisma.meeting.update({
      where: { id },
      data: {
        status,
        statusReason,
        qualityScore: status === 'COMPLETED' ? qualityScore : null,
        notes,
      },
      include: {
        booker: true,
        owner: true,
      },
    });
  }

  /**
   * Tar bort ett möte (soft delete genom status eller hard delete)
   */
  async deleteMeeting(id: string, hardDelete: boolean = false) {
    if (hardDelete) {
      return await prisma.meeting.delete({
        where: { id },
      });
    } else {
      // Soft delete - sätt status till CANCELED
      return await prisma.meeting.update({
        where: { id },
        data: {
          status: 'CANCELED',
        },
      });
    }
  }

  /**
   * Synkroniserar möten från Outlook för en användare
   */
  async syncMeetingsFromOutlook(
    events: OutlookEvent[],
    userId: string,
    defaultOwnerId?: string
  ) {
    const synced = {
      created: 0,
      updated: 0,
      skipped: 0,
    };

    for (const event of events) {
      const existing = await this.getMeetingByOutlookId(event.id);

      if (existing) {
        // Uppdatera om start/sluttid ändrats
        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);

        if (
          eventStart.getTime() !== existing.startTime.getTime() ||
          eventEnd.getTime() !== existing.endTime.getTime()
        ) {
          await this.updateMeetingFromOutlook(existing.id, event);
          synced.updated++;
        } else {
          synced.skipped++;
        }
      } else {
        // Skapa nytt möte
        const ownerId = defaultOwnerId || userId;
        await this.createMeetingFromOutlook(event, userId, ownerId);
        synced.created++;
      }
    }

    return synced;
  }
}

export const meetingService = new MeetingService();
