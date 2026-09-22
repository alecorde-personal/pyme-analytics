import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/db';

const SESSION_COOKIE = 'pyme_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export async function createPersistentSession(userId: string) {
  const token = randomBytes(32).toString('hex');
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    },
  });
  return token;
}

export async function getAuthenticatedUser(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const token = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(`${SESSION_COOKIE}=`.length);

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function deletePersistentSession(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const token = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(`${SESSION_COOKIE}=`.length);

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
}