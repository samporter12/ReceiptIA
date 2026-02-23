import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<{ needsConfirmation: boolean }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('access_token');
        const savedUser = await AsyncStorage.getItem('user');
        console.log('💾 Sesión guardada:', savedToken ? '✅' : '❌');
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('❌ Error cargando sesión:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const saveSession = async (accessToken: string, userData: User) => {
    await AsyncStorage.setItem('access_token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    
    // Verificar que se guardó
    const check = await AsyncStorage.getItem('access_token');
    console.log('💾 Token guardado:', check ? '✅' : '❌ FALLÓ');
    
    setToken(accessToken);
    setUser(userData);
  };

  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password);
    if (!data.access_token) throw new Error('No se recibió token');
    const userData: User = {
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata?.full_name,
      plan: 'free',
      receipts_count_this_month: 0,
    };
    await saveSession(data.access_token, userData);
  };

  const register = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ needsConfirmation: boolean }> => {
    const data = await authService.register(email, password, fullName);
    
    if (data.access_token && data.user) {
      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || fullName,
        plan: 'free',
        receipts_count_this_month: 0,
      };
      await saveSession(data.access_token, userData);
      return { needsConfirmation: false };
    }

    if (data.user && !data.session) {
      return { needsConfirmation: true };
    }

    throw new Error('Respuesta inesperada');
  };

  const logout = async () => {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};