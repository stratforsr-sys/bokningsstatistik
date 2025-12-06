import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db';
import { getMeetingFilterForUser } from '@/lib/utils/ownership';
import { MeetingStatus, UserRole } from '@prisma/client';

/**
 * GET /api/meetings
 * Hämtar möten med rollbaserad filtrering
 *
 * - USER: Ser endast möten där hen är owner eller booker
 * - MANAGER/ADMIN: Ser alla möten
 */
export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const query = searchParams.get('query') || searchParams.get('q');
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
      bookerId,
      ownerId,
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
      // Validera att endTime är ett giltigt datum
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
      end = new Date(start.getTime() + 60 * 60 * 1000); // +1 timme som default
    }

    // Skapa eller hämta system-användare om ingen bookerId anges
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
        return NextResponse.json(
          {
            error: 'Invalid bookerId',
            message: `User with ID "${finalBookerId}" does not exist. Please select a valid user or leave empty for system user.`,
          },
          { status: 400 }
        );
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
        return NextResponse.json(
          {
            error: 'Invalid ownerId',
            message: `User with ID "${finalOwnerId}" does not exist. Please select a valid user or leave empty.`,
          },
          { status: 400 }
        );
      }
      ownerUser = ownerExists;
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

    // Hantera databas-specifika fel
    if (error.code === 'P2003') {
      return NextResponse.json(
        {
          error: 'Invalid bookerId or ownerId',
          message: 'The specified user(s) do not exist',
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
