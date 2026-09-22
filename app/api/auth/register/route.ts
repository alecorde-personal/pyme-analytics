import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createPersistentSession, getSessionCookieName } from '@/lib/server/auth-session';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; email?: string; password?: string };
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? '';

    if (!name || !email || password.length < 8) {
      return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Ya existe un usuario con ese email.' }, { status: 409 });
    const user = await prisma.user.create({ data: { name, email, passwordHash: hashPassword(password), role: 'OWNER' } });
    const token = await createPersistentSession(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role === 'ADMIN' ? 'admin' : 'owner',
        createdAt: user.createdAt.toISOString(),
      },
    });

    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'No se pudo crear la cuenta.' }, { status: 500 });
  }
}
