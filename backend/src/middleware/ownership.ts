import { Request, Response, NextFunction } from 'express';
import prisma from '../db';

/**
 * Middleware som kontrollerar om en USER äger en specifik resurs (möte)
 *
 * För USER-rollen:
 * - Kan bara se/ändra möten där owner_id = user.id ELLER booker_id = user.id
 *
 * För ADMIN och MANAGER:
 * - Får alltid access (skippar ownership-check)
 *
 * VIKTIGT: Måste användas EFTER authMiddleware
 *
 * Exempel:
 * router.patch('/:id', authMiddleware, requireMeetingOwnership, handler)
 */
export const requireMeetingOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // ADMIN och MANAGER får alltid access
    if (req.user.role === 'ADMIN' || req.user.role === 'MANAGER') {
      return next();
    }

    // För USER: kolla ownership
    const meetingId = req.params.id;

    if (!meetingId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Meeting ID required',
      });
    }

    // Hämta mötet
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: {
        id: true,
        ownerId: true,
        bookerId: true,
      },
    });

    if (!meeting) {
      return res.status(404).json({
        error: 'Meeting not found',
      });
    }

    // Kontrollera om användaren äger mötet
    const isOwner = meeting.ownerId === req.user.id;
    const isBooker = meeting.bookerId === req.user.id;

    if (!isOwner && !isBooker) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this meeting',
      });
    }

    // Användaren äger mötet, fortsätt
    next();
  } catch (error: any) {
    console.error('Ownership middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify ownership',
    });
  }
};

/**
 * Helper function för att filtrera meetings baserat på användarroll
 *
 * För USER: returnera endast möten där user är owner eller booker
 * För ADMIN/MANAGER: returnera alla möten (ingen filtrering)
 *
 * Används i GET /api/meetings för att bygga where-clause
 */
export const getMeetingFilterForUser = (userId: string, userRole: string) => {
  // ADMIN och MANAGER ser alla möten
  if (userRole === 'ADMIN' || userRole === 'MANAGER') {
    return {};
  }

  // USER ser endast sina egna möten
  return {
    OR: [
      { ownerId: userId },
      { bookerId: userId },
    ],
  };
};

/**
 * Helper function för att filtrera stats baserat på användarroll
 *
 * För USER: returnera endast möten där user är owner eller booker
 * För ADMIN/MANAGER: om userId anges, filtrera på det, annars alla
 */
export const getStatsFilterForUser = (
  requestUserId: string,
  userRole: string,
  targetUserId?: string
) => {
  // USER kan bara se sin egen statistik
  if (userRole === 'USER') {
    return {
      OR: [
        { ownerId: requestUserId },
        { bookerId: requestUserId },
      ],
    };
  }

  // ADMIN/MANAGER kan se alla eller filtrera på specifik användare
  if (targetUserId) {
    return {
      OR: [
        { ownerId: targetUserId },
        { bookerId: targetUserId },
      ],
    };
  }

  // Ingen filtrering - visa alla
  return {};
};
