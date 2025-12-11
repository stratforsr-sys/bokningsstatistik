import { SignJWT, jwtVerify } from 'jose';
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
export async function createToken(user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}): Promise<string> {
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-this';
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET not set in environment! Using default (INSECURE)');
  }

  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  // Convert "7d" to seconds (7 days = 604800 seconds)
  const expiresInSeconds = jwtExpiresIn === '7d' ? 604800 : 604800;

  const secret = new TextEncoder().encode(jwtSecret);

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .sign(secret);
}

/**
 * Verifierar en JWT token och returnerar payload
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-this';
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch (error: any) {
    return null;
  }
}
