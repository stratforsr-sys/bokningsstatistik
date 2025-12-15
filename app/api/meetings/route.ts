import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db';
import { getMeetingFilterForUser } from '@/lib/utils/ownership';
import { MeetingStatus, UserRole } from '@prisma/client';

/**
 * GET /api/meetings
 * Hämtar möten med rollbaserad filtrering
 *
 * - USER: Ser endast möten där hen är owner/booker eller seller/booker i nya relationer
 * - MANAGER/ADMIN: Ser alla möten
 *
 * Query params:
 * - status: Filter by meeting status
 * - startDate, endDate: Date range filter
 * - query: Search in subject, email, notes
 * - bookerIds: Comma-separated user IDs to filter by bookers
 * - sellerIds: Comma-separated user IDs to filter by sellers
 * - limit, offset: Pagination
 */
export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const query = searchParams.get('query') || searchParams.get('q');
    const bookerIds = searchParams.get('bookerIds'); // NEW: Filter by multiple bookers
    const sellerIds = searchParams.get('sellerIds'); // NEW: Filter by multiple sellers
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Bygg where-clause baserat på roll
    const roleFilter = getMeetingFilterForUser(user.sub, user.role);

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
        where.startTime.gte = new Date(startDate);
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate);
      }
    }

    // NEW: Filter by multiple bookers
    if (bookerIds) {
      const ids = bookerIds.split(',').map((id) => id.trim());
      where.bookers = {
        some: {
          userId: { in: ids },
        },
      };
    }

    // NEW: Filter by multiple sellers
    if (sellerIds) {
      const ids = sellerIds.split(',').map((id) => id.trim());
      where.sellers = {
        some: {
          userId: { in: ids },
        },
      };
    }

    if (query) {
      where.OR = [
        { subject: { contains: query, mode: 'insensitive' } },
        { organizerEmail: { contains: query, mode: 'insensitive' } },
        { notes: { contains: query, mode: 'insensitive' } },
      ];
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        // OLD RELATIONS (deprecated but kept for backward compatibility)
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
        // NEW RELATIONS (many-to-many)
        bookers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
              },
            },
          },
          orderBy: {
            assignedAt: 'asc',
          },
        },
        sellers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
              },
            },
          },
          orderBy: {
            assignedAt: 'asc',
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error: any) {
    console.error('Error in GET /api/meetings:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch meetings',
        message: error.message,
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/meetings
 * Skapar ett nytt möte manuellt
 *
 * Supports both old (single bookerId/ownerId) and new (arrays bookerIds/sellerIds) formats
 */
export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const {
      subject,
      bookingDate,
      startTime,
      endTime,
      organizerEmail,
      // OLD FORMAT (deprecated but supported for backward compatibility)
      bookerId,
      ownerId,
      // NEW FORMAT (preferred)
      bookerIds,
      sellerIds,
      status = 'BOOKED',
      attendees,
      joinUrl,
      notes,
    } = body;

    // Validera obligatoriska fält
    if (!subject) {
      return NextResponse.json(
        { error: 'Missing required field: subject' },
        { status: 400 }
      );
    }

    if (!startTime) {
      return NextResponse.json(
        { error: 'Missing required field: startTime' },
        { status: 400 }
      );
    }

    // Determine which format is being used
    const useNewFormat = bookerIds !== undefined || sellerIds !== undefined;

    // Validate that at least one booker and seller is provided
    if (useNewFormat) {
      if (!bookerIds || !Array.isArray(bookerIds) || bookerIds.length === 0) {
        return NextResponse.json(
          { error: 'At least one booker is required (bookerIds must be a non-empty array)' },
          { status: 400 }
        );
      }
      if (!sellerIds || !Array.isArray(sellerIds) || sellerIds.length === 0) {
        return NextResponse.json(
          { error: 'At least one seller is required (sellerIds must be a non-empty array)' },
          { status: 400 }
        );
      }
    }

    // Sätt standardvärden och validera datum
    const now = new Date();
    const booking = bookingDate ? new Date(bookingDate) : now;
    const start = new Date(startTime);

    // Validera att startTime är ett giltigt datum
    if (isNaN(start.getTime())) {
      return NextResponse.json(
        {
          error: 'Invalid startTime',
          message: 'Start time must be a valid ISO 8601 date string',
          received: startTime,
        },
        { status: 400 }
      );
    }

    // Hantera endTime - antingen använd given tid eller sätt +1 timme
    let end: Date;
    if (endTime && endTime.trim() !== '') {
      end = new Date(endTime);
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          {
            error: 'Invalid endTime',
            message: 'End time must be a valid ISO 8601 date string or left empty',
            received: endTime,
          },
          { status: 400 }
        );
      }
    } else {
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }

    // Validera att starttid är före sluttid
    if (start >= end) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      );
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
      return NextResponse.json(
        {
          error: 'Invalid status',
          validValues: validStatuses,
        },
        { status: 400 }
      );
    }

    // Create meeting with junction records in a transaction
    const meeting = await prisma.$transaction(async (tx) => {
      // Determine final user IDs
      let finalBookerIds: string[];
      let finalSellerIds: string[];

      if (useNewFormat) {
        finalBookerIds = bookerIds;
        finalSellerIds = sellerIds;
      } else {
        // OLD FORMAT: Convert single IDs to arrays
        let finalBookerId = bookerId && bookerId.trim() !== '' ? bookerId.trim() : null;
        let finalOwnerId = ownerId && ownerId.trim() !== '' ? ownerId.trim() : null;

        // Create or get system user if no bookerId provided
        if (!finalBookerId) {
          let systemUser = await tx.user.findUnique({
            where: { email: 'system@telink.se' },
          });

          if (!systemUser) {
            systemUser = await tx.user.create({
              data: {
                name: 'System',
                email: 'system@telink.se',
                role: UserRole.ADMIN,
              },
            });
            console.log('✨ System-användare skapad för manuella möten');
          }
          finalBookerId = systemUser.id;
        }

        // If no ownerId, use bookerId
        if (!finalOwnerId) {
          finalOwnerId = finalBookerId;
        }

        finalBookerIds = [finalBookerId];
        finalSellerIds = [finalOwnerId];
      }

      // Validate that all user IDs exist and fetch user data
      const bookerUsers = await tx.user.findMany({
        where: { id: { in: finalBookerIds } },
        select: { id: true, name: true },
      });

      if (bookerUsers.length !== finalBookerIds.length) {
        const foundIds = bookerUsers.map((u) => u.id);
        const missingIds = finalBookerIds.filter((id) => !foundIds.includes(id));
        throw new Error(`Invalid booker ID(s): ${missingIds.join(', ')}`);
      }

      const sellerUsers = await tx.user.findMany({
        where: { id: { in: finalSellerIds } },
        select: { id: true, name: true },
      });

      if (sellerUsers.length !== finalSellerIds.length) {
        const foundIds = sellerUsers.map((u) => u.id);
        const missingIds = finalSellerIds.filter((id) => !foundIds.includes(id));
        throw new Error(`Invalid seller ID(s): ${missingIds.join(', ')}`);
      }

      // For backward compatibility, set old fields to first booker/seller
      const firstBooker = bookerUsers[0];
      const firstSeller = sellerUsers[0];

      // Create the meeting
      const newMeeting = await tx.meeting.create({
        data: {
          subject,
          bookingDate: booking,
          startTime: start,
          endTime: end,
          lastUpdated: now,
          organizerEmail: organizerEmail || 'unknown@telink.se',
          // OLD FIELDS (for backward compatibility)
          bookerId: firstBooker.id,
          bookerName: firstBooker.name,
          ownerId: firstSeller.id,
          ownerName: firstSeller.name,
          status: status as MeetingStatus,
          attendees: attendees ? JSON.stringify(attendees) : null,
          joinUrl: joinUrl || null,
          notes: notes || null,
        },
      });

      // Create booker junction records
      await tx.meetingBooker.createMany({
        data: bookerUsers.map((user) => ({
          meetingId: newMeeting.id,
          userId: user.id,
          userName: user.name,
        })),
      });

      // Create seller junction records
      await tx.meetingSeller.createMany({
        data: sellerUsers.map((user) => ({
          meetingId: newMeeting.id,
          userId: user.id,
          userName: user.name,
        })),
      });

      // Return meeting with includes
      return await tx.meeting.findUnique({
        where: { id: newMeeting.id },
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
          bookers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  isActive: true,
                },
              },
            },
            orderBy: {
              assignedAt: 'asc',
            },
          },
          sellers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  isActive: true,
                },
              },
            },
            orderBy: {
              assignedAt: 'asc',
            },
          },
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Meeting created successfully',
        meeting,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/meetings:', error);

    // Handle database-specific errors
    if (error.code === 'P2003') {
      return NextResponse.json(
        {
          error: 'Invalid user ID(s)',
          message: 'One or more specified users do not exist',
        },
        { status: 400 }
      );
    }

    // Handle duplicate assignment error
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          error: 'Duplicate assignment',
          message: 'A user cannot be assigned to the same meeting multiple times',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create meeting',
        message: error.message,
      },
      { status: 500 }
    );
  }
});
