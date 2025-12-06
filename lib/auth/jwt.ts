import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

export interface JWTPayload {
  sub: string; // user id
  email: string;
  name: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Skapar en JWT token för en användare
 */
export function createToken(user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}): string {
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-this';
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET not set in environment! Using default (INSECURE)');
  }

  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn } as jwt.SignOptions);
}

/**
 * Verifierar en JWT token och returnerar payload
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-this';
    return jwt.verify(token, jwtSecret) as JWTPayload;
  } catch (error) {
    return null;
  }
}
