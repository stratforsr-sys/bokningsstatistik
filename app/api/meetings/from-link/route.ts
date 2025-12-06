import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db';
import { meetingService } from '@/lib/services/meeting-service';
import { graphService } from '@/lib/services/graph-service';
import { msalService } from '@/lib/services/msal-service';
import { UserRole } from '@prisma/client';

/**
 * POST /api/meetings/from-link
 * Skapar eller hittar möte baserat på Outlook/Teams-länk
 * Använder Graph API för att hämta verklig mötesdata från Outlook/Teams
 */
export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const { link, userId, ownerId } = body;

    if (!link) {
      return NextResponse.json(
        { error: 'Missing required field: link' },
        { status: 400 }
      );
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
        return NextResponse.json(
          {
            error: 'Invalid userId',
            message: `User with ID "${finalUserId}" does not exist`,
          },
          { status: 400 }
        );
      }
    }

    // Validera ownerId om angivet
    if (finalOwnerId) {
      const ownerExists = await prisma.user.findUnique({
        where: { id: finalOwnerId },
      });

      if (!ownerExists) {
        return NextResponse.json(
          {
            error: 'Invalid ownerId',
            message: `User with ID "${finalOwnerId}" does not exist`,
          },
          { status: 400 }
        );
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

      return NextResponse.json({
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
        return NextResponse.json(
          {
            error: 'Token expired',
            message: 'Please login again via /auth/login',
          },
          { status: 401 }
        );
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
      return NextResponse.json(
        {
          error: 'Event not found',
          message: 'Could not find the meeting in Outlook calendar. Make sure you have access to it.',
        },
        { status: 404 }
      );
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

      return NextResponse.json({
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

    return NextResponse.json({
      success: true,
      message: 'Meeting created from Outlook/Teams link',
      meeting,
      action: 'created',
    });
  } catch (error: any) {
    console.error('Error in POST /api/meetings/from-link:', error);
    return NextResponse.json(
      {
        error: 'Failed to process meeting link',
        message: error.message,
      },
      { status: 500 }
    );
  }
});
