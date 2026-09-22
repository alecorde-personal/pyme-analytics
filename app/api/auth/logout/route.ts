import { NextResponse } from 'next/server';
import { deletePersistentSession, getSessionCookieName } from '@/lib/server/auth-session';

export async function POST(request: Request) {
  try {
    await deletePersistentSession(request);
  } catch {
    // The cookie must still be cleared when the database is unavailable.
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getSessionCookieName(), '', {
    httpOnly: true,
    expires: new Date(0),
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  return response;
}
