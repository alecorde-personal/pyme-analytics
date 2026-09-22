import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/server/auth-session';

function toIndustryValue(industry: string) {
  const normalized = industry?.trim();
  if (normalized === 'Kiosco') return 'KIOSK';
  if (normalized === 'Ferretería') return 'OTHER';
  if (normalized === 'Otro') return 'OTHER';
  if (normalized === 'Librería') return 'LIBRARY';
  return 'OTHER';
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      industry?: string;
      address?: string;
      size?: string;
    };

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Sesión requerida.' }, { status: 401 });
    }

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: 'Falta el nombre del negocio.' }, { status: 400 });
    }

    const created = await prisma.business.create({ data: { userId: user.id, name, industry: toIndustryValue(body.industry ?? 'Librería'), address: body.address ?? '', size: body.size ?? '1 a 5 empleados', plan: 'free' } });
    const savedBusiness = { id: created.id, name: created.name, industry: created.industry, address: created.address ?? '', size: created.size ?? '', createdAt: created.createdAt.toISOString() };

    return NextResponse.json({ business: savedBusiness });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'No se pudo guardar el negocio. Verificá la conexión con la base de datos.' }, { status: 503 });
  }
}
