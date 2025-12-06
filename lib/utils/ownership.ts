/**
 * Ownership utilities
 * Helper functions för att filtrera resurser baserat på användarroll
 */

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

/**
 * Kontrollerar om en användare har tillgång till ett specifikt möte
 */
export const canAccessMeeting = (
  userId: string,
  userRole: string,
  meeting: { ownerId: string | null; bookerId: string | null }
): boolean => {
  // ADMIN och MANAGER får alltid access
  if (userRole === 'ADMIN' || userRole === 'MANAGER') {
    return true;
  }

  // USER måste vara owner eller booker
  return meeting.ownerId === userId || meeting.bookerId === userId;
};
