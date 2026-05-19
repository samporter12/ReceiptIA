import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar sesión desde localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const fetchUserProfile = useCallback(async (accessToken: string): Promise<User> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Obtener perfil desde Supabase
    const { data } = await axios.get(
      `${supabaseUrl}/rest/v1/profiles?select=*&limit=1`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const profile = data?.[0];
    if (!profile) throw new Error('Perfil no encontrado');

    // Obtener conteo del mes
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: countData } = await axios.get(
      `${supabaseUrl}/rest/v1/receipts?select=id&created_at=gte.${firstDay}`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
          Prefer: 'count=exact',
        },
      }
    );

    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      plan: profile.plan || 'free',
      receipts_count_this_month: Array.isArray(countData) ? countData.length : 0,
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const res = await axios.post(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      { email, password },
      { headers: { apikey: anonKey, 'Content-Type': 'application/json' } }
    );

    const { access_token } = res.data;
    const userProfile = await fetchUserProfile(access_token);

    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user', JSON.stringify(userProfile));
    setToken(access_token);
    setUser(userProfile);
  }, [fetchUserProfile]);

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    await axios.post(
      `${supabaseUrl}/auth/v1/signup`,
      { email, password, data: { full_name: fullName } },
      { headers: { apikey: anonKey, 'Content-Type': 'application/json' } }
    );
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('access_token');
    if (!storedToken) return;
    try {
      const userProfile = await fetchUserProfile(storedToken);
      localStorage.setItem('user', JSON.stringify(userProfile));
      setUser(userProfile);
    } catch {
      // silently fail
    }
  }, [fetchUserProfile]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
