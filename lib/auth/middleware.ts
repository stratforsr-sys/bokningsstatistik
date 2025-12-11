import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, JWTPayload } from './jwt';
import { UserRole } from '@prisma/client';

/**
 * Higher-order function för att skydda API routes med JWT-autentisering
 *
 * Läser token från HttpOnly cookie och verifierar den
 */
export function withAuth<T = any>(
  handler: (request: NextRequest, user: JWTPayload, context?: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: T) => {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No authentication token provided' },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Pass context as third parameter for dynamic routes like [id]
    return handler(request, user, context);
  };
}

/**
 * Higher-order function för rollbaserad access control
 *
 * Måste användas tillsammans med withAuth
 */
export function withRole<T = any>(
  roles: UserRole[],
  handler: (request: NextRequest, user: JWTPayload, context?: T) => Promise<NextResponse>
) {
  return withAuth<T>(async (request, user, context) => {
    if (!roles.includes(user.role)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: `Access denied. Required role: ${roles.join(' or ')}`,
          userRole: user.role,
        },
        { status: 403 }
      );
    }

    return handler(request, user, context);
  });
}
