import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/server/auth-session';
import { PAYMENT_METHOD_VALUES, normalizeSaleRow, SalesRow } from '@/lib/validation/sales';
import { readSalesSheet } from '@/lib/server/google-sheets';

const HEADER_NAMES = ['fecha', 'producto', 'categoria', 'cantidad', 'precioUnitario', 'medioDePago', 'costoUnitario'];

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Sesión requerida.' }, { status: 401 });

    const business = await prisma.business.findFirst({ where: { userId: user.id }, include: { sheetConnection: true }, orderBy: { createdAt: 'asc' } });
    if (!business?.sheetConnection) return NextResponse.json({ error: 'Conectá una hoja antes de sincronizar.' }, { status: 409 });

    const values = await readSalesSheet(business.sheetConnection.googleSheetId);
    const rows = values.slice(1).map((cells, index) => {
      const row = Object.fromEntries(HEADER_NAMES.map((header, columnIndex) => [header, cells[columnIndex] ?? ''])) as Omit<SalesRow, 'rowNumber'>;
      return { ...row, rowNumber: index + 2 } as SalesRow;
    });
    const validRows = [] as ReturnType<typeof normalizeSaleRow>[];
    const errors = [] as { rowNumber: number; column: string; message: string }[];

    for (const row of rows) {
      const result = normalizeSaleRow(row);
      validRows.push(result);
      if (!result.valid) errors.push(...result.errors);
    }

    const validValues = validRows.filter((result): result is Extract<typeof result, { valid: true }> => result.valid).map((result) => result.value);
    const syncLog = await prisma.syncLog.create({ data: { businessId: business.id, rowsRead: rows.length, rowsValid: validValues.length, rowsInvalid: errors.length, status: errors.length && !validValues.length ? 'FAILED' : 'PENDING', errors: { create: errors.map((error) => ({ rowNumber: error.rowNumber, column: error.column, message: error.message })) } } });

    if (errors.length > 0) {
      await prisma.syncLog.update({ where: { id: syncLog.id }, data: { status: 'FAILED', finishedAt: new Date() } });
      return NextResponse.json({ error: 'La hoja contiene filas inválidas.', syncLogId: syncLog.id, rowsRead: rows.length, rowsValid: validValues.length, rowsInvalid: errors.length, errors }, { status: 422 });
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.sale.deleteMany({ where: { businessId: business.id } });
      if (validValues.length > 0) {
        await transaction.sale.createMany({ data: validValues.map((sale) => ({ businessId: business.id, saleDate: sale.saleDate, product: sale.product, category: sale.category, quantity: sale.quantity, unitPrice: sale.unitPrice, paymentMethod: sale.paymentMethod ? PAYMENT_METHOD_VALUES[sale.paymentMethod] : null, unitCost: sale.unitCost, sourceRowNumber: sale.sourceRowNumber })) });
      }
      await transaction.syncLog.update({ where: { id: syncLog.id }, data: { status: 'SUCCESS', finishedAt: new Date() } });
      await transaction.sheetConnection.update({ where: { businessId: business.id }, data: { status: 'OK', lastSyncedAt: new Date() } });
    });

    return NextResponse.json({ syncLogId: syncLog.id, rowsRead: rows.length, rowsImported: validValues.length });
  } catch (error) {
    console.error('Google Sheets sync error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo sincronizar la hoja.' }, { status: 502 });
  }
}
