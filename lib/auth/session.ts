import { cookies } from 'next/headers';
import { verifyToken, JWTPayload } from './jwt';
import { UserRole } from '@prisma/client';

/**
 * Hämtar nuvarande användare från JWT cookie (Server Components)
 *
 * Returnerar null om ingen användare är inloggad
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Kräver att användaren är autentiserad (Server Components)
 *
 * Kastar error om ingen användare är inloggad
 */
export async function requireAuth(): Promise<JWTPayload> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Kräver specifik roll (Server Components)
 *
 * Kastar error om användaren inte har rätt roll
 */
export async function requireRole(...roles: UserRole[]): Promise<JWTPayload> {
  const user = await requireAuth();

  if (!roles.includes(user.role)) {
    throw new Error(`Forbidden. Required role: ${roles.join(' or ')}`);
  }

  return user;
}
