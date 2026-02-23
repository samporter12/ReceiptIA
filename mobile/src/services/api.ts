import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.43.79.103:3000/api/v1';

console.log('🔗 API_URL:', API_URL);

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: añadir token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  const url = (config.baseURL ?? '') + (config.url ?? '');
  console.log('🔗 Llamando a:', url);
  console.log('🔑 Token:', token ? '✅' : '❌ vacío');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: errores
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['access_token', 'user']);
    }
    return Promise.reject(error);
  }
);

// =============================================
// AUTH SERVICE
// =============================================
export const authService = {
  login: async (email: string, password: string) => {
    const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`;
    const response = await axios.post(url, { email, password }, {
      headers: {
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  register: async (email: string, password: string, fullName: string) => {
    const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/signup`;
    const response = await axios.post(url,
      { email, password, data: { full_name: fullName } },
      {
        headers: {
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
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

  uploadImageToS3: async (uploadUrl: string, imageUri: string) => {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': 'image/jpeg' },
    });
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

  updateReceipt: async (id: string, data: Partial<{
    merchant_name: string;
    receipt_date: string;
    total_amount: number;
    tax_amount: number;
    currency: string;
    category: string;
  }>) => {
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
};

export default api;