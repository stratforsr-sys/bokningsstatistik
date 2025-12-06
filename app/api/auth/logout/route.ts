import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logout successful',
  });

  // Ta bort HttpOnly cookie
  response.cookies.delete('access_token');

  return response;
}
