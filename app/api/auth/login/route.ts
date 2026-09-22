import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createPersistentSession, getSessionCookieName } from '@/lib/server/auth-session';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) return NextResponse.json({ error: 'Email o contraseña inválidos.' }, { status: 401 });
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
    console.error('Login error:', error);
    return NextResponse.json({ error: 'No se pudo iniciar sesión. Verificá que la base de datos esté configurada.' }, { status: 503 });
  }
}
