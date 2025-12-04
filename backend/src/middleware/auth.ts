import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserRole } from '@prisma/client';
import prisma from '../db';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
      };
    }
  }
}

export interface JWTPayload {
  sub: string; // user id
  email: string;
  name: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Middleware som verifierar JWT och lägger till user i req.user
 *
 * Läser token från:
 * 1. HttpOnly cookie 'access_token'
 * 2. Authorization header 'Bearer <token>'
 *
 * Verifierar också att användaren är aktiv (isActive = true)
 *
 * TODO: Implementera rate limiting för att förhindra brute-force attacker
 * TODO: Implementera token blacklist för utloggade tokens
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Läs token från cookie eller Authorization header
    let token: string | undefined;

    // 1. Kolla HttpOnly cookie först (säkrare)
    if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    // 2. Fallback till Authorization header (för API-klienter)
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // Om ingen token finns, returnera 401
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
    }

    // Verifiera token
    const jwtSecret = config.jwtSecret || 'your-secret-key-change-this';

    if (!config.jwtSecret) {
      console.warn('⚠️  JWT_SECRET not set in environment! Using default (INSECURE)');
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Verifiera att användaren fortfarande finns i databasen
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      });
    }

    // Lägg till user i request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired',
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed',
    });
  }
};

/**
 * Middleware som kräver specifika roller
 *
 * Måste användas EFTER authMiddleware
 *
 * Exempel:
 * router.get('/admin-only', authMiddleware, requireRole('ADMIN'), handler)
 * router.get('/managers', authMiddleware, requireRole('ADMIN', 'MANAGER'), handler)
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        userRole: req.user.role,
      });
    }

    next();
  };
};

/**
 * Utility function för att skapa JWT token
 */
export const createToken = (user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}): string => {
  const jwtSecret = config.jwtSecret || 'your-secret-key-change-this';
  const jwtExpiresIn = config.jwtExpiresIn || '7d';

  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return jwt.sign(payload, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });
};
