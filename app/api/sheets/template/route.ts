import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/auth-session';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Sesión requerida.' }, { status: 401 });

  const templateId = process.env.GOOGLE_SHEET_TEMPLATE_ID?.trim();
  if (!templateId) {
    return NextResponse.json({
      configured: false,
      error: 'La plantilla de Google Sheets todavía no está configurada.',
    });
  }

  return NextResponse.json({
    configured: true,
    url: `https://docs.google.com/spreadsheets/d/${templateId}/copy`,
  });
}
