import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../db';
import { UserRole } from '@prisma/client';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

/**
 * POST /api/users/invite
 * Bjuder in en ny användare via email (ADMIN only)
 */
router.post('/invite', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { email, role = 'USER' } = req.body;

    // Validera input
    if (!email || !email.trim()) {
      return res.status(400).json({
        error: 'Missing required field: email',
      });
    }

    // Validera email-format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
      });
    }

    // Validera role
    const validRoles: UserRole[] = ['USER', 'MANAGER', 'ADMIN'];
    if (!validRoles.includes(role as UserRole)) {
      return res.status(400).json({
        error: 'Invalid role',
        validValues: validRoles,
      });
    }

    const emailLower = email.toLowerCase().trim();

    // Kontrollera om användaren redan finns
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists',
      });
    }

    // Kontrollera om det redan finns en aktiv invite
    const existingInvite = await prisma.userInvite.findFirst({
      where: {
        email: emailLower,
        acceptedAt: null,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (existingInvite) {
      return res.status(409).json({
        error: 'Invite already exists',
        message: 'An active invite for this email already exists',
      });
    }

    // Generera säker random token (32 bytes)
    const token = crypto.randomBytes(32).toString('base64url');

    // Hash:a token för lagring
    const tokenHash = await bcrypt.hash(token, 10);

    // Sätt expiration (7 dagar)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Skapa invite
    const invite = await prisma.userInvite.create({
      data: {
        email: emailLower,
        role: role as UserRole,
        tokenHash,
        expiresAt,
      },
    });

    // Bygg invite URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}/invite/complete?token=${token}`;

    // TODO: Skicka email med invite-länk via SMTP/extern tjänst
    console.log(`📧 Invite skapad för ${email}:`);
    console.log(`   Länk: ${inviteUrl}`);
    console.log(`   Utgår: ${expiresAt.toISOString()}`);

    res.status(201).json({
      success: true,
      message: 'Invite created successfully',
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
      // Returnera länk (i produktion skulle denna skickas via email istället)
      inviteUrl,
      // TODO: Ta bort inviteUrl från response när email-sändning implementeras
    });
  } catch (error: any) {
    console.error('Error in POST /api/users/invite:', error);
    res.status(500).json({
      error: 'Failed to create invite',
      message: error.message,
    });
  }
});

/**
 * GET /api/users
 * Hämtar alla användare (kräver autentisering)
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error: any) {
    console.error('Error in GET /api/users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message,
    });
  }
});

/**
 * GET /api/users/:id
 * Hämtar en specifik användare (kräver autentisering)
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error('Error in GET /api/users/:id:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: error.message,
    });
  }
});

/**
 * POST /api/users
 * Skapar en ny användare direkt (ADMIN only)
 * OBS: Använd /api/users/invite för att bjuda in användare istället
 */
router.post('/', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { name, email, role = 'BOOKER' } = req.body;

    // Validera obligatoriska fält
    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Missing required field: name',
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        error: 'Missing required field: email',
      });
    }

    // Validera email-format (enkel)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
      });
    }

    // Validera role
    const validRoles: UserRole[] = ['BOOKER', 'SALES', 'ADMIN'];
    if (!validRoles.includes(role as UserRole)) {
      return res.status(400).json({
        error: 'Invalid role',
        validValues: validRoles,
      });
    }

    // Kontrollera om email redan finns
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists',
        existingUser: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
        },
      });
    }

    // Skapa användare
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role as UserRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user,
    });
  } catch (error: any) {
    console.error('Error in POST /api/users:', error);
    res.status(500).json({
      error: 'Failed to create user',
      message: error.message,
    });
  }
});

/**
 * PATCH /api/users/:id
 * Uppdaterar en användare (ADMIN only)
 */
router.patch('/:id', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    // Kontrollera om användaren finns
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Bygg update-data
    const updateData: any = {};

    if (name !== undefined && name.trim() !== '') {
      updateData.name = name.trim();
    }

    if (email !== undefined && email.trim() !== '') {
      // Validera email-format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format',
        });
      }

      const emailLower = email.trim().toLowerCase();

      // Kontrollera om email redan används av annan användare
      if (emailLower !== existingUser.email.toLowerCase()) {
        const emailExists = await prisma.user.findUnique({
          where: { email: emailLower },
        });

        if (emailExists) {
          return res.status(409).json({
            error: 'Email already in use',
            message: 'Another user is already using this email address',
          });
        }
      }

      updateData.email = emailLower;
    }

    if (role !== undefined) {
      // Validera role
      const validRoles: UserRole[] = ['BOOKER', 'SALES', 'ADMIN'];
      if (!validRoles.includes(role as UserRole)) {
        return res.status(400).json({
          error: 'Invalid role',
          validValues: validRoles,
        });
      }
      updateData.role = role as UserRole;
    }

    // Om ingen data att uppdatera
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update',
        message: 'Please provide at least one field to update (name, email, or role)',
      });
    }

    // Uppdatera användare
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/users/:id:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/users/:id
 * Tar bort en användare permanent (ADMIN only)
 * Alla möten behålls med användarens namn intakt (onDelete: SetNull)
 */
router.delete('/:id', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Kontrollera om användaren finns
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Ta bort användaren (möten behålls med namn tack vare onDelete: SetNull)
    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
      note: `User ${user.name} has been deleted. All their meetings remain intact with their name preserved.`,
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/users/:id:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: error.message,
    });
  }
});

export default router;
