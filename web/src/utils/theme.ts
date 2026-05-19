export const CATEGORY_COLORS: Record<string, string> = {
  'Alimentación': '#FF6B6B',
  'Transporte': '#4ECDC4',
  'Alojamiento': '#45B7D1',
  'Software': '#6C63FF',
  'Marketing': '#F7DC6F',
  'Oficina': '#82E0AA',
  'Salud': '#F1948A',
  'Educación': '#85C1E9',
  'Entretenimiento': '#BB8FCE',
  'Otro': '#AEB6BF',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Fallido',
  review: 'Revisar',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  review: 'bg-orange-100 text-orange-700',
};

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
