const businessTemplates = {
  Librería: {
    categories: ['Infantil', 'Juvenil', 'Novela', 'Texto escolar', 'Papelería', 'Otros'],
    paymentMethods: ['Efectivo', 'Débito', 'Crédito', 'Transferencia', 'Mercado Pago', 'Otro'],
  },
  Kiosco: {
    categories: ['Bebidas', 'Snacks', 'Cigarrillos', 'Librería', 'Otros'],
    paymentMethods: ['Efectivo', 'Débito', 'Crédito', 'Transferencia', 'Mercado Pago', 'Otro'],
  },
};

export type BusinessTemplate = {
  categories: string[];
  paymentMethods: string[];
};

export function getBusinessTemplate(industry: string): BusinessTemplate {
  return (
    businessTemplates[industry as keyof typeof businessTemplates] ?? {
      categories: ['Otros'],
      paymentMethods: ['Efectivo', 'Débito', 'Crédito', 'Transferencia', 'Mercado Pago', 'Otro'],
    }
  );
}
