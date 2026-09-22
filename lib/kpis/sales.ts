export type SalesMetric = {
  date: Date;
  product: string;
  category: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number | null;
  paymentMethod?: string | null;
};

export function getTotalSales(rows: SalesMetric[]) {
  return rows.reduce((sum, row) => sum + row.quantity * row.unitPrice, 0);
}

export function getAverageTicket(rows: SalesMetric[]) {
  if (rows.length === 0) return 0;
  const total = getTotalSales(rows);
  return total / rows.length;
}

export function getCategoryBreakdown(rows: SalesMetric[]) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.category] = (acc[row.category] ?? 0) + row.quantity * row.unitPrice;
    return acc;
  }, {});
}

export function getTopProducts(rows: SalesMetric[]) {
  const map = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.product] = (acc[row.product] ?? 0) + row.quantity;
    return acc;
  }, {});

  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([product, quantity]) => ({ product, quantity }));
}

export function getGrossMargin(rows: SalesMetric[]) {
  return rows.reduce((sum, row) => {
    if (row.unitCost == null) return sum;
    const revenue = row.quantity * row.unitPrice;
    const cost = row.quantity * row.unitCost;
    return sum + (revenue - cost);
  }, 0);
}

export function getMonthOverMonthDelta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}
