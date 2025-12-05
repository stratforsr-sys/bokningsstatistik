import { Router, Request, Response } from 'express';
import { meetingService } from '../services/meetingService';
import { graphService } from '../services/graphService';
import { authMiddleware, requireRole } from '../middleware/auth';
import { requireMeetingOwnership, getMeetingFilterForUser } from '../middleware/ownership';
import prisma from '../db';
import { MeetingStatus, StatusReason, UserRole } from '@prisma/client';

const router = Router();

/**
 * GET /api/meetings
 * Hämtar möten med rollbaserad filtrering
 *
 * - USER: Ser endast möten där hen är owner eller booker
 * - MANAGER/ADMIN: Ser alla möten
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      status,
      startDate,
      endDate,
      query,
      q,
      limit = '100',
      offset = '0',
    } = req.query;

    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Acceptera både query och q för sökning
    const searchQuery = query || q;

    // Bygg where-clause baserat på roll
    const roleFilter = getMeetingFilterForUser(req.user.id, req.user.role);

    // Kombinera rollfilter med övriga filter
    const where: any = {
      ...roleFilter,
    };

    if (status) {
      where.status = status as MeetingStatus;
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate as string);
      }
    }

    if (searchQuery) {
      where.OR = [
        { subject: { contains: searchQuery as string, mode: 'insensitive' } },
        { organizerEmail: { contains: searchQuery as string, mode: 'insensitive' } },
        { notes: { contains: searchQuery as string, mode: 'insensitive' } },
      ];
    }

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
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    });

    res.json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error: any) {
    console.error('Error in GET /api/meetings:', error);
    res.status(500).json({
      error: 'Failed to fetch meetings',
      message: error.message,
    });
  }
});

/**
 * GET /api/meetings/:id
 * Hämtar ett specifikt möte (med ownership-check för USER)
 */
router.get('/:id', authMiddleware, requireMeetingOwnership, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const meeting = await meetingService.getMeetingById(id);

    if (!meeting) {
      return res.status(404).json({
        error: 'Meeting not found',
      });
    }

    res.json({
      success: true,
      meeting,
    });
  } catch (error: any) {
    console.error('Error in GET /api/meetings/:id:', error);
    res.status(500).json({
      error: 'Failed to fetch meeting',
      message: error.message,
    });
  }
});

/**
 * PATCH /api/meetings/:id/status
 * Uppdaterar status för ett möte (med ownership-check för USER)
 */
router.patch('/:id/status', authMiddleware, requireMeetingOwnership, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, statusReason, qualityScore, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Missing required field: status',
      });
    }

    // Validera status
    const validStatuses: MeetingStatus[] = [
      'BOOKED',
      'COMPLETED',
      'NO_SHOW',
      'CANCELED',
      'RESCHEDULED',
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        validValues: validStatuses,
      });
    }

    // Uppdatera mötet
    const meeting = await meetingService.updateMeetingStatus(
      id,
      status as MeetingStatus,
      statusReason as StatusReason | undefined,
      qualityScore ? parseInt(qualityScore, 10) : undefined,
      notes
    );

    res.json({
      success: true,
      message: 'Meeting status updated',
      meeting,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/meetings/:id/status:', error);
    res.status(400).json({
      error: 'Failed to update meeting status',
      message: error.message,
    });
  }
});

/**
 * POST /api/meetings
 * Skapar ett nytt möte manuellt (kräver autentisering)
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      subject,
      bookingDate,
      startTime,
      endTime,
      organizerEmail,
      bookerId,
      ownerId,
      status = 'BOOKED',
      attendees,
      joinUrl,
      notes,
    } = req.body;

    // Validera obligatoriska fält
    if (!subject) {
      return res.status(400).json({
        error: 'Missing required field: subject',
      });
    }

    if (!startTime) {
      return res.status(400).json({
        error: 'Missing required field: startTime',
      });
    }

    // Sätt standardvärden och validera datum
    const now = new Date();
    const booking = bookingDate ? new Date(bookingDate) : now;
    const start = new Date(startTime);

    // Validera att startTime är ett giltigt datum
    if (isNaN(start.getTime())) {
      return res.status(400).json({
        error: 'Invalid startTime',
        message: 'Start time must be a valid ISO 8601 date string',
        received: startTime,
      });
    }

    // Hantera endTime - antingen använd given tid eller sätt +1 timme
    let end: Date;
    if (endTime && endTime.trim() !== '') {
      end = new Date(endTime);
      // Validera att endTime är ett giltigt datum
      if (isNaN(end.getTime())) {
        return res.status(400).json({
          error: 'Invalid endTime',
          message: 'End time must be a valid ISO 8601 date string or left empty',
          received: endTime,
        });
      }
    } else {
      end = new Date(start.getTime() + 60 * 60 * 1000); // +1 timme som default
    }

    // Skapa eller hämta system-användare om ingen bookerId anges
    // VIKTIGT: Hantera både undefined, null och tom sträng ""
    let finalBookerId = bookerId && bookerId.trim() !== '' ? bookerId.trim() : null;
    let finalOwnerId = ownerId && ownerId.trim() !== '' ? ownerId.trim() : null;

    // Om bookerId är null eller tom sträng, skapa/hämta system-användare
    let bookerUser: { id: string; name: string } | null = null;
    if (!finalBookerId) {
      let systemUser = await prisma.user.findUnique({
        where: { email: 'system@telink.se' },
      });

      if (!systemUser) {
        systemUser = await prisma.user.create({
          data: {
            name: 'System',
            email: 'system@telink.se',
            role: UserRole.ADMIN,
          },
        });
        console.log('✨ System-användare skapad för manuella möten');
      }

      finalBookerId = systemUser.id;
      bookerUser = { id: systemUser.id, name: systemUser.name };
    } else {
      // Validera att bookerId faktiskt existerar
      const bookerExists = await prisma.user.findUnique({
        where: { id: finalBookerId },
        select: { id: true, name: true },
      });

      if (!bookerExists) {
        return res.status(400).json({
          error: 'Invalid bookerId',
          message: `User with ID "${finalBookerId}" does not exist. Please select a valid user or leave empty for system user.`,
        });
      }
      bookerUser = bookerExists;
    }

    // Om ownerId inte anges, använd bookerId
    let ownerUser: { id: string; name: string } | null = null;
    if (!finalOwnerId) {
      finalOwnerId = finalBookerId;
      ownerUser = bookerUser;
    } else {
      // Validera att ownerId faktiskt existerar
      const ownerExists = await prisma.user.findUnique({
        where: { id: finalOwnerId },
        select: { id: true, name: true },
      });

      if (!ownerExists) {
        return res.status(400).json({
          error: 'Invalid ownerId',
          message: `User with ID "${finalOwnerId}" does not exist. Please select a valid user or leave empty.`,
        });
      }
      ownerUser = ownerExists;
    }

    // Validera att starttid är före sluttid
    if (start >= end) {
      return res.status(400).json({
        error: 'Start time must be before end time',
      });
    }

    // Validera status
    const validStatuses: MeetingStatus[] = [
      'BOOKED',
      'COMPLETED',
      'NO_SHOW',
      'CANCELED',
      'RESCHEDULED',
    ];
    if (!validStatuses.includes(status as MeetingStatus)) {
      return res.status(400).json({
        error: 'Invalid status',
        validValues: validStatuses,
      });
    }

    // Skapa mötet
    const meeting = await prisma.meeting.create({
      data: {
        subject,
        bookingDate: booking,
        startTime: start,
        endTime: end,
        lastUpdated: now,
        organizerEmail: organizerEmail || 'unknown@telink.se',
        bookerId: finalBookerId,
        bookerName: bookerUser!.name,
        ownerId: finalOwnerId,
        ownerName: ownerUser!.name,
        status: status as MeetingStatus,
        attendees: attendees ? JSON.stringify(attendees) : null,
        joinUrl: joinUrl || null,
        notes: notes || null,
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

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      meeting,
    });
  } catch (error: any) {
    console.error('Error in POST /api/meetings:', error);

    // Hantera databas-specifika fel
    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'Invalid bookerId or ownerId',
        message: 'The specified user(s) do not exist',
      });
    }

    res.status(500).json({
      error: 'Failed to create meeting',
      message: error.message,
    });
  }
});

/**
 * POST /api/meetings/from-link
 * Skapar eller hittar möte baserat på Outlook/Teams-länk
 * Använder Graph API för att hämta verklig mötesdata från Outlook/Teams
 * (kräver autentisering)
 */
router.post('/from-link', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { link, userId, ownerId } = req.body;

    if (!link) {
      return res.status(400).json({
        error: 'Missing required field: link',
      });
    }

    // Om userId inte anges, använd system-användare
    let finalUserId = userId;
    let finalOwnerId = ownerId;

    if (!finalUserId) {
      console.log('Creating meeting from link without userId - using system user');
      // Skapa/hämta system-användare
      let systemUser = await prisma.user.findUnique({
        where: { email: 'system@telink.se' },
      });

      if (!systemUser) {
        systemUser = await prisma.user.create({
          data: {
            name: 'System',
            email: 'system@telink.se',
            role: UserRole.ADMIN,
          },
        });
        console.log('✨ System-användare skapad för möte från länk');
      }

      finalUserId = systemUser.id;
    } else {
      // Validera att userId existerar
      const userExists = await prisma.user.findUnique({
        where: { id: finalUserId },
      });

      if (!userExists) {
        return res.status(400).json({
          error: 'Invalid userId',
          message: `User with ID "${finalUserId}" does not exist`,
        });
      }
    }

    // Validera ownerId om angivet
    if (finalOwnerId) {
      const ownerExists = await prisma.user.findUnique({
        where: { id: finalOwnerId },
      });

      if (!ownerExists) {
        return res.status(400).json({
          error: 'Invalid ownerId',
          message: `User with ID "${finalOwnerId}" does not exist`,
        });
      }
    } else {
      finalOwnerId = finalUserId; // Använd userId om ingen ownerId anges
    }

    // Hämta användarens token (endast om vi har ett faktiskt userId, inte system user)
    const userToken = await prisma.userToken.findFirst({
      where: { userId: finalUserId },
      orderBy: { createdAt: 'desc' },
    });

    // Om ingen token finns (t.ex. system user), skapa basiskt möte utan Graph API
    if (!userToken) {
      console.log('No user token found - creating basic meeting without Graph API');

      // Hämta användarnas namn
      const booker = await prisma.user.findUnique({
        where: { id: finalUserId },
        select: { name: true },
      });
      const owner = await prisma.user.findUnique({
        where: { id: finalOwnerId },
        select: { name: true },
      });

      // Skapa ett basiskt möte med länken
      const now = new Date();
      const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Imorgon
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 timme

      const meeting = await prisma.meeting.create({
        data: {
          subject: 'Möte från länk (ej autentiserad)',
          bookingDate: now,
          startTime: startTime,
          endTime: endTime,
          lastUpdated: now,
          organizerEmail: 'unknown@telink.se',
          joinUrl: link,
          bookerId: finalUserId,
          bookerName: booker?.name || 'Unknown',
          ownerId: finalOwnerId,
          ownerName: owner?.name || 'Unknown',
          status: 'BOOKED',
          notes: 'Möte skapat från länk utan Graph API-autentisering. Vänligen logga in för att hämta fullständig mötesdata.',
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

      return res.json({
        success: true,
        message: 'Basic meeting created. Login via /auth/login to fetch full meeting data from Graph API.',
        meeting,
        action: 'created_basic',
      });
    }

    // Kontrollera om token har gått ut och förnya om nödvändigt
    const tokenCheckTime = new Date();
    let accessToken = userToken.accessToken;

    if (userToken.expiresAt < tokenCheckTime && userToken.refreshToken) {
      try {
        const { msalService } = await import('../services/msalService');
        const newToken = await msalService.refreshAccessToken(userToken.refreshToken);
        accessToken = newToken.access_token;

        // Uppdatera token
        const newExpiresAt = new Date();
        newExpiresAt.setSeconds(newExpiresAt.getSeconds() + newToken.expires_in);

        await prisma.userToken.update({
          where: { id: userToken.id },
          data: {
            accessToken: newToken.access_token,
            refreshToken: newToken.refresh_token || userToken.refreshToken,
            expiresAt: newExpiresAt,
          },
        });
      } catch (error) {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Please login again via /auth/login',
        });
      }
    }

    // Parsa länken för att identifiera typ
    const parsed = graphService.parseMeetingLink(link);
    let event;

    if (parsed.type === 'event' && parsed.id) {
      // Försök hämta direkt via event ID
      try {
        event = await graphService.getEventById(accessToken, parsed.id);
      } catch (error) {
        console.log('Could not fetch by event ID, trying iCalUId...');
        event = await graphService.findEventByICalUId(accessToken, parsed.id);
      }
    } else if (parsed.type === 'teams' || parsed.type === 'unknown') {
      // För Teams-länkar eller okända länkar, sök via joinUrl
      console.log('Searching for event by joinUrl...');
      event = await graphService.findEventByJoinUrl(accessToken, link);
    }

    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
        message: 'Could not find the meeting in Outlook calendar. Make sure you have access to it.',
      });
    }

    // Kolla om mötet redan finns i databasen
    let meeting = await meetingService.getMeetingByOutlookId(event.id);

    if (meeting) {
      // Uppdatera befintligt möte med senaste data
      const updatedMeeting = await prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          subject: event.subject,
          startTime: new Date(event.start.dateTime),
          endTime: new Date(event.end.dateTime),
          organizerEmail: event.organizer.emailAddress.address,
          joinUrl: event.onlineMeeting?.joinUrl || meeting.joinUrl,
          lastUpdated: new Date(),
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

      return res.json({
        success: true,
        message: 'Meeting already exists and was updated',
        meeting: updatedMeeting,
        action: 'updated',
      });
    }

    // Skapa nytt möte från Outlook event med validerade user IDs
    meeting = await meetingService.createMeetingFromOutlook(
      event,
      finalUserId,
      finalOwnerId
    );

    res.json({
      success: true,
      message: 'Meeting created from Outlook/Teams link',
      meeting,
      action: 'created',
    });
  } catch (error: any) {
    console.error('Error in POST /api/meetings/from-link:', error);
    res.status(500).json({
      error: 'Failed to process meeting link',
      message: error.message,
    });
  }
});

/**
 * PATCH /api/meetings/:id
 * Uppdaterar ett möte (med ownership-check för USER)
 */
router.patch('/:id', authMiddleware, requireMeetingOwnership, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      subject,
      startTime,
      endTime,
      organizerEmail,
      ownerId,
      notes,
      joinUrl,
    } = req.body;

    // Bygg update-objekt med endast de fält som skickades
    const updateData: any = {};

    if (subject !== undefined) updateData.subject = subject;

    // Validera och konvertera startTime
    if (startTime !== undefined && startTime !== null && startTime !== '') {
      const parsedStart = new Date(startTime);
      if (isNaN(parsedStart.getTime())) {
        return res.status(400).json({
          error: 'Invalid startTime',
          message: 'Start time must be a valid ISO 8601 date string',
          received: startTime,
        });
      }
      updateData.startTime = parsedStart;
    }

    // Validera och konvertera endTime
    if (endTime !== undefined && endTime !== null && endTime !== '') {
      const parsedEnd = new Date(endTime);
      if (isNaN(parsedEnd.getTime())) {
        return res.status(400).json({
          error: 'Invalid endTime',
          message: 'End time must be a valid ISO 8601 date string',
          received: endTime,
        });
      }
      updateData.endTime = parsedEnd;
    }

    if (organizerEmail !== undefined) updateData.organizerEmail = organizerEmail;

    // Validera ownerId om angivet
    if (ownerId !== undefined && ownerId !== null && ownerId.trim() !== '') {
      const ownerExists = await prisma.user.findUnique({
        where: { id: ownerId.trim() },
      });
      if (!ownerExists) {
        return res.status(400).json({
          error: 'Invalid ownerId',
          message: `User with ID "${ownerId}" does not exist`,
        });
      }
      updateData.ownerId = ownerId.trim();
    }

    if (notes !== undefined) updateData.notes = notes;
    if (joinUrl !== undefined) updateData.joinUrl = joinUrl;

    // Validera att mötet finns
    const existing = await meetingService.getMeetingById(id);
    if (!existing) {
      return res.status(404).json({
        error: 'Meeting not found',
      });
    }

    // Uppdatera mötet
    const meeting = await prisma.meeting.update({
      where: { id },
      data: updateData,
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

    res.json({
      success: true,
      message: 'Meeting updated successfully',
      meeting,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/meetings/:id:', error);
    res.status(500).json({
      error: 'Failed to update meeting',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/meetings/:id
 * Tar bort ett möte (med ownership-check för USER)
 */
router.delete('/:id', authMiddleware, requireMeetingOwnership, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { hardDelete = 'false' } = req.query;

    const isHardDelete = hardDelete === 'true';

    await meetingService.deleteMeeting(id, isHardDelete);

    res.json({
      success: true,
      message: isHardDelete ? 'Meeting deleted permanently' : 'Meeting canceled',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/meetings/:id:', error);
    res.status(500).json({
      error: 'Failed to delete meeting',
      message: error.message,
    });
  }
});

export default router;
