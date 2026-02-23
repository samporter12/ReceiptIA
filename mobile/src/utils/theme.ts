export const Colors = {
  // Primarios
    primary: '#6C63FF',
    primaryDark: '#5A52D5',
    primaryLight: '#EEF0FF',

  // Secundarios
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

  // Neutros
    background: '#F8F9FE',
    surface: '#FFFFFF',
    border: '#E8E8F0',

    // Texto
    textPrimary: '#1A1A2E',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textWhite: '#FFFFFF',

  // Categorías (colores únicos por categoría)
    categories: {
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
    } as Record<string, string>,
};

export const Spacing = {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
    };

export const BorderRadius = {
    sm: 8, md: 12, lg: 16, xl: 24, full: 9999,
    };

export const FontSize = {
    xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24, xxxl: 32,
    };

export const Shadow = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    medium: {
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
    },
};