import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { canAccessMeeting } from '@/lib/utils/ownership';
import { meetingService } from '@/lib/services/meeting-service';
import { MeetingStatus, StatusReason } from '@prisma/client';

/**
 * PATCH /api/meetings/[id]/status
 * Uppdaterar status för ett möte (med ownership-check för USER)
 */
export const PATCH = withAuth(async (request, user, context) => {
  try {
    const { id } = await (context as { params: Promise<{ id: string }> }).params;
    const body = await request.json();
    const { status, statusReason, qualityScore, notes } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Missing required field: status' },
        { status: 400 }
      );
    }

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
          message: 'You do not have permission to update this meeting',
        },
        { status: 403 }
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
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: 'Invalid status',
          validValues: validStatuses,
        },
        { status: 400 }
      );
    }

    // Uppdatera mötet
    const meeting = await meetingService.updateMeetingStatus(
      id,
      status as MeetingStatus,
      statusReason as StatusReason | undefined,
      qualityScore ? parseInt(qualityScore, 10) : undefined,
      notes
    );

    return NextResponse.json({
      success: true,
      message: 'Meeting status updated',
      meeting,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/meetings/:id/status:', error);
    return NextResponse.json(
      {
        error: 'Failed to update meeting status',
        message: error.message,
      },
      { status: 400 }
    );
  }
});
