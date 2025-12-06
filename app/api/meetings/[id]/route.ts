import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db';
import { canAccessMeeting } from '@/lib/utils/ownership';
import { meetingService } from '@/lib/services/meeting-service';

/**
 * GET /api/meetings/[id]
 * Hämtar ett specifikt möte (med ownership-check för USER)
 */
export const GET = withAuth(async (request, user, context) => {
  try {
    const { id } = context!.params;

    const meeting = await meetingService.getMeetingById(id);

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Kontrollera ownership för USER
    if (!canAccessMeeting(user.sub, user.role, meeting)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to access this meeting',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      meeting,
    });
  } catch (error: any) {
    console.error('Error in GET /api/meetings/:id:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch meeting',
        message: error.message,
      },
      { status: 500 }
    );
  }
});

/**
 * PATCH /api/meetings/[id]
 * Uppdaterar ett möte (med ownership-check för USER)
 */
export const PATCH = withAuth(async (request, user, context) => {
  try {
    const { id } = context!.params;
    const body = await request.json();
    const {
      subject,
      startTime,
      endTime,
      organizerEmail,
      ownerId,
      notes,
      joinUrl,
    } = body;

    // Validera att mötet finns
    const existing = await meetingService.getMeetingById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Kontrollera ownership för USER
    if (!canAccessMeeting(user.sub, user.role, existing)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to update this meeting',
        },
        { status: 403 }
      );
    }

    // Bygg update-objekt med endast de fält som skickades
    const updateData: any = {};

    if (subject !== undefined) updateData.subject = subject;

    // Validera och konvertera startTime
    if (startTime !== undefined && startTime !== null && startTime !== '') {
      const parsedStart = new Date(startTime);
      if (isNaN(parsedStart.getTime())) {
        return NextResponse.json(
          {
            error: 'Invalid startTime',
            message: 'Start time must be a valid ISO 8601 date string',
            received: startTime,
          },
          { status: 400 }
        );
      }
      updateData.startTime = parsedStart;
    }

    // Validera och konvertera endTime
    if (endTime !== undefined && endTime !== null && endTime !== '') {
      const parsedEnd = new Date(endTime);
      if (isNaN(parsedEnd.getTime())) {
        return NextResponse.json(
          {
            error: 'Invalid endTime',
            message: 'End time must be a valid ISO 8601 date string',
            received: endTime,
          },
          { status: 400 }
        );
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
        return NextResponse.json(
          {
            error: 'Invalid ownerId',
            message: `User with ID "${ownerId}" does not exist`,
          },
          { status: 400 }
        );
      }
      updateData.ownerId = ownerId.trim();
      updateData.ownerName = ownerExists.name;
    }

    if (notes !== undefined) updateData.notes = notes;
    if (joinUrl !== undefined) updateData.joinUrl = joinUrl;

    updateData.lastUpdated = new Date();

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

    return NextResponse.json({
      success: true,
      message: 'Meeting updated successfully',
      meeting,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/meetings/:id:', error);
    return NextResponse.json(
      {
        error: 'Failed to update meeting',
        message: error.message,
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/meetings/[id]
 * Tar bort ett möte (med ownership-check för USER)
 */
export const DELETE = withAuth(async (request, user, context) => {
  try {
    const { id } = context!.params;
    const { searchParams } = request.nextUrl;
    const hardDelete = searchParams.get('hardDelete') === 'true';

    // Validera att mötet finns och kontrollera ownership
    const existing = await meetingService.getMeetingById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Kontrollera ownership för USER
    if (!canAccessMeeting(user.sub, user.role, existing)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to delete this meeting',
        },
        { status: 403 }
      );
    }

    await meetingService.deleteMeeting(id, hardDelete);

    return NextResponse.json({
      success: true,
      message: hardDelete ? 'Meeting deleted permanently' : 'Meeting canceled',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/meetings/:id:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete meeting',
        message: error.message,
      },
      { status: 500 }
    );
  }
});
