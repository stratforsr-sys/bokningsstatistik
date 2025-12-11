import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/db';
import { createToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validera input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Hitta användare
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Generiskt felmeddelande för säkerhet (avslöja inte om användaren finns)
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verifiera lösenord
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Skapa JWT token
    console.log('[LOGIN API] Creating token for user:', user.email);
    const token = await createToken(user);
    console.log('[LOGIN API] Token created:', token.substring(0, 50) + '...');

    // Skapa response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });

    // Sätt HttpOnly cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60, // 7 dagar
      path: '/',
    };
    console.log('[LOGIN API] Setting cookie with options:', cookieOptions);
    response.cookies.set('access_token', token, cookieOptions);
    console.log('[LOGIN API] Cookie set successfully');

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
