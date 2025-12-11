import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth/jwt';

// Sökvägar som kräver autentisering
const protectedPaths = ['/dashboard', '/meetings', '/users'];

// Sökvägar för autentisering (inloggade användare redirectas bort från dessa)
const authPaths = ['/login', '/invite/complete'];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const path = request.nextUrl.pathname;

  // Check if path requires authentication
  const isProtectedPath = protectedPaths.some((p) => path.startsWith(p));
  const isAuthPath = authPaths.some((p) => path.startsWith(p));

  if (isProtectedPath) {
    // Redirect to login if no token
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify token
    const payload = await verifyToken(token);
    if (!payload) {
      // Invalid token - redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('access_token');
      return response;
    }

    // Role-based access control for /users (ADMIN only)
    if (path.startsWith('/users') && payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPath && token) {
    const payload = await verifyToken(token);
    if (payload) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// Matchar alla sökvägar utom API routes, static files, etc.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
