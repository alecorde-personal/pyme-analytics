import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/server/auth-session';
import { extractSpreadsheetId, readSalesSheet } from '@/lib/server/google-sheets';

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Sesión requerida.' }, { status: 401 });

    const body = (await request.json()) as { sheetUrl?: string };
    const sheetUrl = body.sheetUrl?.trim();
    if (!sheetUrl) return NextResponse.json({ error: 'Pegá la URL de Google Sheets.' }, { status: 400 });

    const googleSheetId = extractSpreadsheetId(sheetUrl);
    if (!googleSheetId) return NextResponse.json({ error: 'URL de Google Sheets inválida.' }, { status: 400 });

    const business = await prisma.business.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } });
    if (!business) return NextResponse.json({ error: 'Completá el onboarding antes de conectar una hoja.' }, { status: 409 });

    await readSalesSheet(googleSheetId);
    const connection = await prisma.sheetConnection.upsert({
      where: { businessId: business.id },
      update: { googleSheetId, sheetUrl, status: 'PENDING' },
      create: { businessId: business.id, googleSheetId, sheetUrl, status: 'PENDING' },
    });

    return NextResponse.json({ connection: { id: connection.id, sheetUrl: connection.sheetUrl, status: connection.status } });
  } catch (error) {
    console.error('Google Sheets connect error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo conectar la hoja.' }, { status: 502 });
  }
}
