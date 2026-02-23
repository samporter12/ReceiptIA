    // =============================================
    // TIPOS CENTRALES DE RECEIPTAI
    // =============================================

export interface User {
    id: string;
    email: string;
    full_name?: string;
    plan: 'free' | 'pro';
    receipts_count_this_month: number;
}

export interface Receipt {
    id: string;
    user_id: string;
    merchant_name?: string;
    receipt_date?: string;       // ISO8601: YYYY-MM-DD
    total_amount?: number;
    tax_amount?: number;
    currency: string;
    category?: ReceiptCategory;
    confidence_score?: number;
    needs_review: boolean;
    processing_status: ProcessingStatus;
    image_url: string;
    image_key: string;
    raw_ocr_text?: string;
    created_at: string;
    updated_at: string;
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

export interface ExtractedReceiptData {
    merchant_name: string | null;
    date: string | null;
    total_amount: number | null;
    tax_amount: number | null;
    currency: string;
    category: ReceiptCategory;
    confidence: number;
    needs_review: boolean;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        total: number;
        page: number;
        limit: number;
        total_pages: number;
    };
}

    // Limits por plan
export const PLAN_LIMITS = {
    free: { receipts_per_month: 15 },
    pro: { receipts_per_month: Infinity },
} as const;