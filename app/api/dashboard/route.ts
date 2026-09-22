import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/server/auth-session';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Sesión requerida.' }, { status: 401 });

    const business = await prisma.business.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } });
    if (!business) return NextResponse.json({ error: 'Completá el onboarding.' }, { status: 409 });

    const sales = await prisma.sale.findMany({ where: { businessId: business.id }, orderBy: { saleDate: 'desc' } });
    const total = sales.reduce((sum, sale) => sum + sale.quantity * sale.unitPrice, 0);
    const margin = sales.reduce((sum, sale) => sum + sale.quantity * (sale.unitPrice - (sale.unitCost ?? 0)), 0);
    const categoryBreakdown = sales.reduce<Record<string, number>>((result, sale) => {
      result[sale.category] = (result[sale.category] ?? 0) + sale.quantity * sale.unitPrice;
      return result;
    }, {});
    const products = sales.reduce<Record<string, { product: string; quantity: number; revenue: number }>>((result, sale) => {
      const current = result[sale.product] ?? { product: sale.product, quantity: 0, revenue: 0 };
      current.quantity += sale.quantity;
      current.revenue += sale.quantity * sale.unitPrice;
      result[sale.product] = current;
      return result;
    }, {});

    return NextResponse.json({
      business: { id: business.id, name: business.name },
      summary: { total, margin, averageTicket: sales.length ? total / sales.length : 0 },
      categoryBreakdown,
      topProducts: Object.values(products).sort((a, b) => b.quantity - a.quantity).slice(0, 10),
      saleCount: sales.length,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'No se pudo cargar el dashboard.' }, { status: 503 });
  }
}
