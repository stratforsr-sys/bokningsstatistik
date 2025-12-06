import { prisma } from '@/lib/db';
import { MeetingStatus, StatusReason } from '@prisma/client';

/**
 * Outlook Event Type
 */
export interface OutlookEvent {
  id: string;
  subject?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  organizer: { emailAddress: { address: string; name: string } };
  attendees?: Array<{ emailAddress: { address: string; name: string }; type: string }>;
  onlineMeeting?: { joinUrl: string };
  bodyPreview?: string;
  iCalUId?: string;
}

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
        bookingDate: new Date(),
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
          select: { id: true, name: true, email: true, role: true },
        },
        owner: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return meeting;
  }

  /**
   * Hämtar möte via Outlook event ID
   */
  async getMeetingByOutlookId(outlookEventId: string) {
    return await prisma.meeting.findUnique({
      where: { outlookEventId },
      include: {
        booker: {
          select: { id: true, name: true, email: true, role: true },
        },
        owner: {
          select: { id: true, name: true, email: true, role: true },
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
   * Hämtar alla möten med filtrering
   */
  async getMeetings(filters: {
    bookerId?: string;
    ownerId?: string;
    status?: MeetingStatus;
    startDate?: Date;
    endDate?: Date;
    query?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.bookerId) {
      where.bookerId = filters.bookerId;
    }

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

    // Simple text search (without fuzzy matching for now)
    if (filters.query && filters.query.trim() !== '') {
      const searchTerm = filters.query.trim();
      where.OR = [
        { subject: { contains: searchTerm, mode: 'insensitive' } },
        { notes: { contains: searchTerm, mode: 'insensitive' } },
        { bodyPreview: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        booker: {
          select: { id: true, name: true, email: true, role: true },
        },
        owner: {
          select: { id: true, name: true, email: true, role: true },
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
    if (qualityScore !== undefined && (qualityScore < 1 || qualityScore > 5)) {
      throw new Error('Quality score must be between 1 and 5');
    }

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
   * Uppdaterar möte
   */
  async updateMeeting(id: string, data: any) {
    return await prisma.meeting.update({
      where: { id },
      data,
      include: {
        booker: true,
        owner: true,
      },
    });
  }

  /**
   * Tar bort ett möte
   */
  async deleteMeeting(id: string, hardDelete: boolean = false) {
    if (hardDelete) {
      return await prisma.meeting.delete({
        where: { id },
      });
    } else {
      return await prisma.meeting.update({
        where: { id },
        data: { status: 'CANCELED' },
      });
    }
  }

  /**
   * Synkroniserar möten från Outlook
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
        synced.skipped++;
      } else {
        const ownerId = defaultOwnerId || userId;
        await this.createMeetingFromOutlook(event, userId, ownerId);
        synced.created++;
      }
    }

    return synced;
  }
}

export const meetingService = new MeetingService();
