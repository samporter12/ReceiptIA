import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: añadir token desde localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: manejar 401
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =============================================
// AUTH SERVICE
// =============================================
export const authService = {
  login: async (email: string, password: string) => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=password`;
    const response = await axios.post(url, { email, password }, {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  register: async (email: string, password: string, fullName: string) => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/signup`;
    const response = await axios.post(
      url,
      { email, password, data: { full_name: fullName } },
      {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/recover`;
    await axios.post(url, { email }, {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
        'Content-Type': 'application/json',
      },
    });
  },

  deleteAccount: async () => {
    await api.delete('/auth/account');
  },
};

// =============================================
// RECEIPTS SERVICE
// =============================================
export const receiptService = {
  getUploadUrl: async (extension = 'jpg') => {
    const res = await api.post('/receipts/upload-url', { file_extension: extension });
    return res.data.data as { upload_url: string; image_key: string };
  },

  processReceipt: async (imageKey: string) => {
    const res = await api.post('/receipts/process', { image_key: imageKey });
    return res.data.data as { receipt_id: string; status: string };
  },

  getReceipts: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    status?: string;
  }) => {
    const res = await api.get('/receipts', { params });
    return res.data;
  },

  getReceipt: async (id: string) => {
    const res = await api.get(`/receipts/${id}`);
    return res.data.data;
  },

  updateReceipt: async (
    id: string,
    data: Partial<{
      merchant_name: string;
      receipt_date: string;
      total_amount: number;
      tax_amount: number;
      currency: string;
      category: string;
    }>
  ) => {
    const res = await api.patch(`/receipts/${id}`, data);
    return res.data.data;
  },

  deleteReceipt: async (id: string) => {
    await api.delete(`/receipts/${id}`);
  },
};

// =============================================
// ANALYTICS SERVICE
// =============================================
export const analyticsService = {
  getDashboard: async () => {
    const res = await api.get('/analytics/dashboard');
    return res.data.data;
  },

  exportCsv: async (): Promise<void> => {
    const res = await api.get('/analytics/export-csv', { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibos_receiptai_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  exportPdf: async (): Promise<void> => {
    const res = await api.get('/analytics/export-pdf', { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibos_receiptai_${new Date().toISOString().split('T')[0]}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export default api;
