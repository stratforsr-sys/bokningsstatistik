import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { graphService } from '../services/graphService';
import { msalService } from '../services/msalService';
import { meetingService } from '../services/meetingService';
import { authMiddleware, createToken } from '../middleware/auth';
import prisma from '../db';

const router = Router();

// ============================================================================
// EMAIL/PASSWORD AUTHENTICATION
// ============================================================================

/**
 * POST /auth/login
 * Email/password login med JWT
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validera input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and password are required',
      });
    }

    // Hitta användare
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Generellt felmeddelande för säkerhet (avslöja inte om email finns)
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Kontrollera att användaren har ett lösenord (inte bara OAuth)
    if (!user.passwordHash) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'This account uses Microsoft login. Please use /auth/login endpoint instead.',
      });
    }

    // Verifiera lösenord
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // TODO: Implementera rate limiting och account lockout efter X misslyckade försök
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Skapa JWT
    const token = createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Sätt HttpOnly cookie
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Returnera user info (utan password!)
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      // För API-klienter som inte kan använda cookies
      token,
    });
  } catch (error: any) {
    console.error('Error in POST /auth/login:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message,
    });
  }
});

/**
 * POST /auth/logout
 * Loggar ut användaren genom att rensa cookie
 */
router.post('/logout', (req: Request, res: Response) => {
  // Rensa cookie
  res.clearCookie('access_token');

  // TODO: Implementera token blacklist för extra säkerhet
  // (JWT tokens är annars giltiga tills de går ut)

  res.json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * POST /auth/invite/complete
 * Slutför invite genom att skapa användare med lösenord
 */
router.post('/invite/complete', async (req: Request, res: Response) => {
  try {
    const { token, name, password } = req.body;

    // Validera input
    if (!token || !name || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Token, name, and password are required',
      });
    }

    // Validera lösenord (minst 8 tecken)
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Weak password',
        message: 'Password must be at least 8 characters long',
      });
    }

    // TODO: Lägg till mer omfattande lösenordskrav (stora/små bokstäver, siffror, etc.)

    // Hash:a token för att söka i databasen
    const tokenHash = await bcrypt.hash(token, 10);

    // Hitta invite - vi behöver söka genom alla invites och jämföra
    const invites = await prisma.userInvite.findMany({
      where: {
        acceptedAt: null,
        expiresAt: {
          gte: new Date(), // Inte utgången
        },
      },
    });

    let matchingInvite = null;
    for (const invite of invites) {
      const matches = await bcrypt.compare(token, invite.tokenHash);
      if (matches) {
        matchingInvite = invite;
        break;
      }
    }

    if (!matchingInvite) {
      return res.status(404).json({
        error: 'Invalid or expired invite',
        message: 'This invite link is invalid or has expired',
      });
    }

    // Kontrollera att email inte redan används
    const existingUser = await prisma.user.findUnique({
      where: { email: matchingInvite.email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists',
      });
    }

    // Hash:a lösenord
    const passwordHash = await bcrypt.hash(password, 10);

    // Skapa användare
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: matchingInvite.email.toLowerCase().trim(),
        passwordHash,
        role: matchingInvite.role,
        isActive: true,
      },
    });

    // Markera invite som accepterad
    await prisma.userInvite.update({
      where: { id: matchingInvite.id },
      data: {
        acceptedAt: new Date(),
      },
    });

    // Auto-login: skapa JWT
    const jwtToken = createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Sätt HttpOnly cookie
    res.cookie('access_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: jwtToken,
    });
  } catch (error: any) {
    console.error('Error in POST /auth/invite/complete:', error);
    res.status(500).json({
      error: 'Failed to complete invite',
      message: error.message,
    });
  }
});

// ============================================================================
// MICROSOFT OAUTH (EXISTING)
// ============================================================================

/**
 * GET /auth/microsoft/login
 * Redirectar användaren till Microsoft login (MSAL OAuth)
 * Ändrat från /auth/login till /auth/microsoft/login för att undvika konflikt
 */
router.get('/microsoft/login', async (req: Request, res: Response) => {
  try {
    // Generera state för CSRF-skydd
    const state = Math.random().toString(36).substring(7);

    // TODO: Spara state i session eller temporär lagring för validering i callback
    // För production bör vi implementera ordentlig session-hantering

    const authUrl = await msalService.getAuthUrl(state);
    res.redirect(authUrl);
  } catch (error: any) {
    console.error('Error in /auth/login:', error);
    res.status(500).json({
      error: 'Failed to initiate login',
      message: error.message,
    });
  }
});

/**
 * GET /auth/callback
 * OAuth callback från Microsoft
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      return res.status(400).json({
        error: 'OAuth error',
        message: error_description || error,
      });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Missing authorization code',
      });
    }

    // TODO: Validera state mot sparad state (CSRF-skydd)

    // Byt code mot token med MSAL
    const tokenResponse = await msalService.getTokenFromCode(code);

    // Hämta användarinfo
    const userInfo = await graphService.getUserInfo(tokenResponse.access_token);

    // Kolla om användaren finns, annars skapa
    let user = await prisma.user.findUnique({
      where: { email: userInfo.email },
    });

    if (!user) {
      // Skapa ny användare (default role: BOOKER)
      user = await prisma.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.name,
          role: 'BOOKER',
        },
      });
      console.log(`✨ Ny användare skapad: ${user.name} (${user.email})`);
    }

    // Spara eller uppdatera token
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);

    // Hitta befintlig token
    const existingToken = await prisma.userToken.findFirst({
      where: { userId: user.id },
    });

    if (existingToken) {
      await prisma.userToken.update({
        where: { id: existingToken.id },
        data: {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresAt,
        },
      });
    } else {
      await prisma.userToken.create({
        data: {
          userId: user.id,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresAt,
        },
      });
    }

    // TODO: Skapa session/JWT för frontend
    // För nu: returnera token och användarinfo (OBS: osäkert i produktion!)
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      // OBS: I produktion, skicka inte access token direkt till frontend!
      // Använd sessions eller HTTP-only cookies
      accessToken: tokenResponse.access_token,
    });
  } catch (error: any) {
    console.error('Error in /auth/callback:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: error.message,
    });
  }
});

/**
 * POST /auth/sync
 * Synkroniserar möten från Outlook för inloggad användare
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { userId, startDate, endDate, limit } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId',
      });
    }

    // Hämta användarens token
    const userToken = await prisma.userToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!userToken) {
      return res.status(401).json({
        error: 'User not authenticated',
        message: 'Please login first',
      });
    }

    // Kontrollera om token har gått ut
    const now = new Date();
    let accessToken = userToken.accessToken;

    if (userToken.expiresAt < now) {
      // Token har gått ut, försök förnya
      if (!userToken.refreshToken) {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Please login again',
        });
      }

      const newToken = await msalService.refreshAccessToken(userToken.refreshToken);
      accessToken = newToken.access_token;

      // Uppdatera token i databasen
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
    }

    // Hämta events från Outlook
    const events = await graphService.getCalendarEvents(
      accessToken,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit || 50
    );

    // Synkronisera till databas
    const syncResult = await meetingService.syncMeetingsFromOutlook(events, userId, userId);

    res.json({
      success: true,
      message: 'Meetings synced successfully',
      events: events.length,
      syncResult,
    });
  } catch (error: any) {
    console.error('Error in /auth/sync:', error);
    res.status(500).json({
      error: 'Sync failed',
      message: error.message,
    });
  }
});

/**
 * GET /auth/me
 * Hämtar information om inloggad användare
 * Använder authMiddleware för att hämta user från JWT
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    // req.user sätts av authMiddleware
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Hämta fullständig user-info från databas
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
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
    console.error('Error in GET /auth/me:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: error.message,
    });
  }
});

export default router;
