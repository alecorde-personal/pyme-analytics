import { describe, expect, it } from 'vitest';
import {
  getAverageTicket,
  getCategoryBreakdown,
  getGrossMargin,
  getMonthOverMonthDelta,
  getTopProducts,
  getTotalSales,
} from './sales';

describe('sales KPIs', () => {
  const rows = [
    { date: new Date('2025-02-01'), product: 'Harry Potter', category: 'Infantil', quantity: 2, unitPrice: 250, unitCost: 140 },
    { date: new Date('2025-02-02'), product: 'El Aleph', category: 'Novela', quantity: 1, unitPrice: 400, unitCost: 230 },
    { date: new Date('2025-02-03'), product: 'Harry Potter', category: 'Infantil', quantity: 3, unitPrice: 250, unitCost: 140 },
    { date: new Date('2025-02-04'), product: 'Cuaderno', category: 'Papelería', quantity: 10, unitPrice: 40, unitCost: 25 },
  ];

  it('calculates total sales', () => {
    expect(getTotalSales(rows)).toBe(500 + 400 + 750 + 400);
  });

  it('calculates average ticket', () => {
    expect(getAverageTicket(rows)).toBe(2050 / 4);
  });

  it('groups sales by category', () => {
    const breakdown = getCategoryBreakdown(rows);
    expect(breakdown.Infantil).toBe(500 + 750);
    expect(breakdown.Novela).toBe(400);
    expect(breakdown.Papelería).toBe(400);
  });

  it('returns top products by quantity', () => {
    expect(getTopProducts(rows)[0]).toEqual({ product: 'Cuaderno', quantity: 10 });
  });

  it('calculates gross margin when cost is present', () => {
    expect(getGrossMargin(rows)).toBe(220 + 170 + 330 + 150);
  });

  it('calculates month-over-month delta', () => {
    expect(getMonthOverMonthDelta(1200, 1000)).toBe(20);
    expect(getMonthOverMonthDelta(100, 0)).toBe(100);
    expect(getMonthOverMonthDelta(0, 0)).toBe(0);
  });
});
