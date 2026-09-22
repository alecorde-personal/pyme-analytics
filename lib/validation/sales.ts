export type SalesValidationError = {
  rowNumber: number;
  column: string;
  message: string;
};

export type SalesRow = {
  rowNumber: number;
  fecha: string;
  producto: string;
  categoria: string;
  cantidad?: string | number;
  precioUnitario?: string | number;
  medioDePago?: string;
  costoUnitario?: string | number;
};

export const PAYMENT_METHOD_VALUES = {
  Efectivo: 'CASH',
  Débito: 'DEBIT',
  Crédito: 'CREDIT',
  Transferencia: 'TRANSFER',
  'Mercado Pago': 'MERCADO_PAGO',
  Otro: 'OTHER',
} as const;

const VALID_CATEGORIES = [
  'Infantil',
  'Juvenil',
  'Novela',
  'Texto escolar',
  'Papelería',
  'Otros',
];

const VALID_PAYMENT_METHODS = [
  'Efectivo',
  'Débito',
  'Crédito',
  'Transferencia',
  'Mercado Pago',
  'Otro',
];

type ValidSaleRowResult = {
  valid: true;
  value: {
    saleDate: Date;
    product: string;
    category: string;
    quantity: number;
    unitPrice: number;
    paymentMethod: string | null;
    unitCost: number | null;
    sourceRowNumber: number;
  };
};

type InvalidSaleRowResult = {
  valid: false;
  errors: SalesValidationError[];
};

export function normalizeSaleRow(row: SalesRow): ValidSaleRowResult | InvalidSaleRowResult {
  const errors: SalesValidationError[] = [];

  const date = new Date(row.fecha);
  if (!row.fecha || Number.isNaN(date.getTime())) {
    errors.push({ rowNumber: row.rowNumber, column: 'Fecha', message: 'Fecha inválida.' });
  }

  if (!row.producto || row.producto.trim() === '') {
    errors.push({ rowNumber: row.rowNumber, column: 'Producto', message: 'Producto es obligatorio.' });
  }

  if (!row.categoria || !VALID_CATEGORIES.includes(row.categoria.trim())) {
    errors.push({ rowNumber: row.rowNumber, column: 'Categoría', message: 'Categoría inválida.' });
  }

  const quantity = Number(row.cantidad);
  if (row.cantidad === undefined || row.cantidad === null || row.cantidad === '' || !Number.isInteger(quantity) || quantity <= 0) {
    errors.push({ rowNumber: row.rowNumber, column: 'Cantidad', message: 'Debe ser un número entero mayor a 0.' });
  }

  const unitPrice = Number(row.precioUnitario);
  if (row.precioUnitario === undefined || row.precioUnitario === null || row.precioUnitario === '' || !Number.isFinite(unitPrice) || unitPrice <= 0) {
    errors.push({ rowNumber: row.rowNumber, column: 'Precio unitario', message: 'Debe ser un número mayor a 0.' });
  }

  if (row.medioDePago && !VALID_PAYMENT_METHODS.includes(row.medioDePago.trim())) {
    errors.push({ rowNumber: row.rowNumber, column: 'Medio de pago', message: 'Medio de pago inválido.' });
  }

  if (row.costoUnitario !== undefined && row.costoUnitario !== null && row.costoUnitario !== '') {
    const unitCost = Number(row.costoUnitario);
    if (!Number.isFinite(unitCost) || unitCost <= 0) {
      errors.push({ rowNumber: row.rowNumber, column: 'Costo unitario', message: 'Debe ser un número mayor a 0.' });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    value: {
      saleDate: new Date(row.fecha),
      product: row.producto.trim(),
      category: row.categoria.trim(),
      quantity,
      unitPrice,
      paymentMethod: row.medioDePago?.trim() as keyof typeof PAYMENT_METHOD_VALUES || null,
      unitCost: row.costoUnitario === undefined || row.costoUnitario === null || row.costoUnitario === '' ? null : Number(row.costoUnitario),
      sourceRowNumber: row.rowNumber,
    },
  };
}
