/**
 * Ownership utilities
 * Helper functions för att filtrera resurser baserat på användarroll
 */

/**
 * Helper function för att filtrera meetings baserat på användarroll
 *
 * För USER: returnera endast möten där user är owner eller booker (både gamla och nya relationer)
 * För ADMIN/MANAGER: returnera alla möten (ingen filtrering)
 *
 * Används i GET /api/meetings för att bygga where-clause
 */
export const getMeetingFilterForUser = (userId: string, userRole: string) => {
  // ADMIN och MANAGER ser alla möten
  if (userRole === 'ADMIN' || userRole === 'MANAGER') {
    return {};
  }

  // USER ser endast sina egna möten (både gamla och nya relationer)
  return {
    OR: [
      // OLD relations (backward compatibility)
      { ownerId: userId },
      { bookerId: userId },
      // NEW many-to-many relations
      { bookers: { some: { userId } } },
      { sellers: { some: { userId } } },
    ],
  };
};

/**
 * Helper function för att filtrera stats baserat på användarroll
 *
 * För USER: returnera endast möten där user är owner eller booker (både gamla och nya relationer)
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
        // OLD relations (backward compatibility)
        { ownerId: requestUserId },
        { bookerId: requestUserId },
        // NEW many-to-many relations
        { bookers: { some: { userId: requestUserId } } },
        { sellers: { some: { userId: requestUserId } } },
      ],
    };
  }

  // ADMIN/MANAGER kan se alla eller filtrera på specifik användare
  if (targetUserId) {
    return {
      OR: [
        // OLD relations (backward compatibility)
        { ownerId: targetUserId },
        { bookerId: targetUserId },
        // NEW many-to-many relations
        { bookers: { some: { userId: targetUserId } } },
        { sellers: { some: { userId: targetUserId } } },
      ],
    };
  }

  // Ingen filtrering - visa alla
  return {};
};

/**
 * Kontrollerar om en användare har tillgång till ett specifikt möte
 *
 * OBS: För att kontrollera många-till-många relationer behöver du inkludera
 * bookers och sellers i query och skicka dem till denna funktion
 */
export const canAccessMeeting = (
  userId: string,
  userRole: string,
  meeting: {
    ownerId: string | null;
    bookerId: string | null;
    bookers?: Array<{ userId: string }>;
    sellers?: Array<{ userId: string }>;
  }
): boolean => {
  // ADMIN och MANAGER får alltid access
  if (userRole === 'ADMIN' || userRole === 'MANAGER') {
    return true;
  }

  // USER måste vara owner, booker, eller i många-till-många relationer
  const isOldOwner = meeting.ownerId === userId;
  const isOldBooker = meeting.bookerId === userId;
  const isNewBooker = meeting.bookers?.some((b) => b.userId === userId) ?? false;
  const isNewSeller = meeting.sellers?.some((s) => s.userId === userId) ?? false;

  return isOldOwner || isOldBooker || isNewBooker || isNewSeller;
};
