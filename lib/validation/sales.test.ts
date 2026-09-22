import { describe, expect, it } from 'vitest';
import { normalizeSaleRow } from './sales';

describe('normalizeSaleRow', () => {
  it('accepts a valid row', () => {
    const result = normalizeSaleRow({
      rowNumber: 7,
      fecha: '2025-02-15',
      producto: 'Harry Potter',
      categoria: 'Infantil',
      cantidad: 3,
      precioUnitario: 250,
      medioDePago: 'Efectivo',
      costoUnitario: 150,
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value.product).toBe('Harry Potter');
      expect(result.value.quantity).toBe(3);
      expect(result.value.unitPrice).toBe(250);
    }
  });

  it('rejects invalid quantity', () => {
    const result = normalizeSaleRow({
      rowNumber: 12,
      fecha: '2025-02-15',
      producto: 'Libro',
      categoria: 'Novela',
      cantidad: 0,
      precioUnitario: 120,
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual({
        rowNumber: 12,
        column: 'Cantidad',
        message: 'Debe ser un número mayor a 0.',
      });
    }
  });

  it('rejects invalid payment method', () => {
    const result = normalizeSaleRow({
      rowNumber: 14,
      fecha: '2025-02-15',
      producto: 'Cuaderno',
      categoria: 'Papelería',
      cantidad: 5,
      precioUnitario: 60,
      medioDePago: 'Bitcoin',
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((error) => error.column === 'Medio de pago')).toBe(true);
    }
  });
});
