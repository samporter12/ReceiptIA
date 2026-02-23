export interface User {
    id: string;
    email: string;
    full_name?: string;
    plan: 'free' | 'pro';
    receipts_count_this_month: number;
}

export interface Receipt {
    id: string;
    merchant_name?: string;
    receipt_date?: string;
    total_amount?: number;
    tax_amount?: number;
    currency: string;
    category?: ReceiptCategory;
    confidence_score?: number;
    needs_review: boolean;
    processing_status: ProcessingStatus;
    image_url: string;
    created_at: string;
}

export type ProcessingStatus =
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'review';

export type ReceiptCategory =
    | 'Alimentación'
    | 'Transporte'
    | 'Alojamiento'
    | 'Software'
    | 'Marketing'
    | 'Oficina'
    | 'Salud'
    | 'Educación'
    | 'Entretenimiento'
    | 'Otro';

export const CATEGORIES: ReceiptCategory[] = [
    'Alimentación', 'Transporte', 'Alojamiento', 'Software',
    'Marketing', 'Oficina', 'Salud', 'Educación', 'Entretenimiento', 'Otro',
];

export interface DashboardData {
    current_month: {
        total: number;
        receipt_count: number;
        tax_recoverable: number;
    };
    last_month: {
        total: number;
        receipt_count: number;
    };
    percentage_change: number;
    top_categories: { category: string; total: number }[];
    pending_review: number;
}

// Tipos para navegación
export type AuthStackParamList = {
    Onboarding: undefined;
    Login: undefined;
    Register: undefined;
};

export type MainTabParamList = {
    Dashboard: undefined;
    Scan: undefined;
    Receipts: undefined;
    Profile: undefined;
};

export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
    ReceiptDetail: { receiptId: string };
    ReviewReceipt: { receiptId: string };
};