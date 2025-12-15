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
    const { id } = await (context as { params: Promise<{ id: string }> }).params;

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
 * ✅ Now supports updating bookerIds and sellerIds (many-to-many relations)
 */
export const PATCH = withAuth(async (request, user, context) => {
  try {
    const { id } = await (context as { params: Promise<{ id: string }> }).params;
    const body = await request.json();
    const {
      subject,
      startTime,
      endTime,
      organizerEmail,
      ownerId,
      notes,
      joinUrl,
      // ✅ NEW: Support for updating many-to-many relations
      bookerIds,
      sellerIds,
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

    // Use transaction to update meeting and junction tables
    const meeting = await prisma.$transaction(async (tx) => {
      // Bygg update-objekt med endast de fält som skickades
      const updateData: any = {};

      if (subject !== undefined) updateData.subject = subject;

      // Validera och konvertera startTime
      if (startTime !== undefined && startTime !== null && startTime !== '') {
        const parsedStart = new Date(startTime);
        if (isNaN(parsedStart.getTime())) {
          throw new Error('Invalid startTime: must be a valid ISO 8601 date string');
        }
        updateData.startTime = parsedStart;
      }

      // Validera och konvertera endTime
      if (endTime !== undefined && endTime !== null && endTime !== '') {
        const parsedEnd = new Date(endTime);
        if (isNaN(parsedEnd.getTime())) {
          throw new Error('Invalid endTime: must be a valid ISO 8601 date string');
        }
        updateData.endTime = parsedEnd;
      }

      if (organizerEmail !== undefined) updateData.organizerEmail = organizerEmail;

      // Validera ownerId om angivet (OLD format - for backward compatibility)
      if (ownerId !== undefined && ownerId !== null && ownerId.trim() !== '') {
        const ownerExists = await tx.user.findUnique({
          where: { id: ownerId.trim() },
        });
        if (!ownerExists) {
          throw new Error(`User with ID "${ownerId}" does not exist`);
        }
        updateData.ownerId = ownerId.trim();
        updateData.ownerName = ownerExists.name;
      }

      if (notes !== undefined) updateData.notes = notes;
      if (joinUrl !== undefined) updateData.joinUrl = joinUrl;

      updateData.lastUpdated = new Date();

      // ✅ Handle bookerIds update (NEW format)
      if (bookerIds !== undefined) {
        if (!Array.isArray(bookerIds) || bookerIds.length === 0) {
          throw new Error('bookerIds must be a non-empty array');
        }

        // Validate all booker IDs exist
        const bookerUsers = await tx.user.findMany({
          where: { id: { in: bookerIds } },
          select: { id: true, name: true },
        });

        if (bookerUsers.length !== bookerIds.length) {
          const foundIds = bookerUsers.map((u) => u.id);
          const missingIds = bookerIds.filter((id) => !foundIds.includes(id));
          throw new Error(`Invalid booker ID(s): ${missingIds.join(', ')}`);
        }

        // Delete existing booker assignments
        await tx.meetingBooker.deleteMany({
          where: { meetingId: id },
        });

        // Create new booker assignments
        await tx.meetingBooker.createMany({
          data: bookerUsers.map((user) => ({
            meetingId: id,
            userId: user.id,
            userName: user.name,
          })),
        });

        // Update old bookerId field for backward compatibility (use first booker)
        updateData.bookerId = bookerUsers[0].id;
        updateData.bookerName = bookerUsers[0].name;
      }

      // ✅ Handle sellerIds update (NEW format)
      if (sellerIds !== undefined) {
        if (!Array.isArray(sellerIds) || sellerIds.length === 0) {
          throw new Error('sellerIds must be a non-empty array');
        }

        // Validate all seller IDs exist
        const sellerUsers = await tx.user.findMany({
          where: { id: { in: sellerIds } },
          select: { id: true, name: true },
        });

        if (sellerUsers.length !== sellerIds.length) {
          const foundIds = sellerUsers.map((u) => u.id);
          const missingIds = sellerIds.filter((id) => !foundIds.includes(id));
          throw new Error(`Invalid seller ID(s): ${missingIds.join(', ')}`);
        }

        // Delete existing seller assignments
        await tx.meetingSeller.deleteMany({
          where: { meetingId: id },
        });

        // Create new seller assignments
        await tx.meetingSeller.createMany({
          data: sellerUsers.map((user) => ({
            meetingId: id,
            userId: user.id,
            userName: user.name,
          })),
        });

        // Update old ownerId field for backward compatibility (use first seller)
        updateData.ownerId = sellerUsers[0].id;
        updateData.ownerName = sellerUsers[0].name;
      }

      // Uppdatera mötet
      const updatedMeeting = await tx.meeting.update({
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
          // ✅ Include new many-to-many relations
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

      return updatedMeeting;
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
    const { id} = await (context as { params: Promise<{ id: string }> }).params;
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
