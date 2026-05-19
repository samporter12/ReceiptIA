import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import { analyticsService } from '../../services/api';
import { DashboardData } from '../../types';
import { useAuth } from '../../store/AuthContext';
import { CATEGORY_COLORS, formatCurrency } from '../../utils/theme';
import Spinner from '../../components/ui/Spinner';
import {
  TrendingUp, TrendingDown, Receipt, DollarSign,
  AlertCircle, Camera, RefreshCw,
} from 'lucide-react';

// Genera datos de tendencia ficticios si el backend no los devuelve
function buildTrendData(data: DashboardData) {
  if (data.monthly_trend && data.monthly_trend.length > 0) return data.monthly_trend;
  // Fallback: solo muestra el mes actual y anterior
  const now = new Date();
  return [
    {
      month: new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toLocaleString('es-CO', { month: 'short', year: '2-digit' }),
      total: data.last_month.total,
    },
    {
      month: now.toLocaleString('es-CO', { month: 'short', year: '2-digit' }),
      total: data.current_month.total,
    },
  ];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError(false);
      const dashboard = await analyticsService.getDashboard();
      setData(dashboard);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
        <RefreshCw size={48} className="text-text-muted" />
        <h2 className="text-xl font-bold text-text-primary">Sin conexión</h2>
        <p className="text-text-secondary text-sm">No se pudieron cargar los datos del dashboard</p>
        <button onClick={loadData} className="btn-primary px-6">Reintentar</button>
      </div>
    );
  }

  const isPositiveChange = (data?.percentage_change ?? 0) >= 0;
  const trendData = data ? buildTrendData(data) : [];
  const usagePercent = data?.plan_usage.limit
    ? (data.plan_usage.count / data.plan_usage.limit) * 100
    : 0;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-primary">
            Hola, {user?.full_name?.split(' ')[0] || 'Usuario'} 👋
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">Aquí está tu resumen del mes</p>
        </div>
        <button
          onClick={() => navigate('/scan')}
          className="btn-primary hidden md:flex"
        >
          <Camera size={18} />
          Escanear recibo
        </button>
      </div>

      {/* Alerta plan Free al 80% */}
      {data?.plan_usage?.limit && data.plan_usage.count >= Math.floor(data.plan_usage.limit * 0.8) && (
        <div className="flex items-center gap-3 bg-warning/10 border border-warning/30 rounded-2xl p-4">
          <AlertCircle size={20} className="text-warning flex-shrink-0" />
          <p className="text-sm text-warning font-semibold">
            Usaste {data.plan_usage.count}/{data.plan_usage.limit} recibos del mes.{' '}
            {data.plan_usage.count >= data.plan_usage.limit
              ? '¡Límite alcanzado! Actualiza a Pro.'
              : 'Considera actualizar a Pro para recibos ilimitados.'}
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total del mes */}
        <div className="card lg:col-span-2 bg-gradient-to-br from-primary to-primary-dark text-white">
          <p className="text-white/75 text-sm font-medium">Gasto total este mes</p>
          <p className="text-4xl font-black mt-1">
            {formatCurrency(data?.current_month.total ?? 0)}
          </p>
          <div className={`flex items-center gap-1.5 mt-2 text-sm font-semibold ${isPositiveChange ? 'text-red-200' : 'text-green-200'}`}>
            {isPositiveChange ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(data?.percentage_change ?? 0).toFixed(1)}% vs mes anterior
          </div>
        </div>

        {/* Recibos */}
        <div className="card flex flex-col">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
            <Receipt size={20} className="text-primary" />
          </div>
          <p className="text-2xl font-black text-text-primary">{data?.current_month.receipt_count ?? 0}</p>
          <p className="text-xs text-text-secondary mt-1">Recibos este mes</p>
        </div>

        {/* IVA recuperable */}
        <div className="card flex flex-col">
          <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center mb-3">
            <DollarSign size={20} className="text-success" />
          </div>
          <p className="text-2xl font-black text-text-primary">
            {formatCurrency(data?.current_month.tax_recoverable ?? 0)}
          </p>
          <p className="text-xs text-text-secondary mt-1">IVA recuperable</p>
        </div>
      </div>

      {/* Gráfica de tendencia 6 meses — REPO-39 */}
      {trendData.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-text-primary mb-1">Tendencia de gastos</h2>
          <p className="text-xs text-text-secondary mb-4">Últimos {trendData.length} meses</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Gasto']}
                contentStyle={{ borderRadius: 12, border: '1px solid #E8E8F0', fontSize: 13 }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#6C63FF"
                strokeWidth={2.5}
                fill="url(#colorTotal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top categorías */}
        {(data?.top_categories?.length ?? 0) > 0 && (
          <div className="card">
            <h2 className="font-bold text-text-primary mb-4">Top categorías</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data!.top_categories} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 12, fill: '#1A1A2E' }} width={90} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Total']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #E8E8F0', fontSize: 13 }}
                />
                <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                  {data!.top_categories.map((entry) => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || '#6C63FF'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Plan usage + acciones rápidas */}
        <div className="space-y-4">
          {user?.plan === 'free' && data?.plan_usage && (
            <div className="card">
              <div className="flex justify-between items-center mb-2">
                <p className="font-semibold text-text-primary text-sm">Uso del plan Free</p>
                <p className="text-sm font-bold text-primary">
                  {data.plan_usage.count}/{data.plan_usage.limit ?? 15}
                </p>
              </div>
              <div className="w-full bg-border rounded-full h-2 mb-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-text-muted">Actualiza a Pro para recibos ilimitados</p>
            </div>
          )}

          {/* Por revisar */}
          {(data?.pending_review ?? 0) > 0 && (
            <div
              className="card cursor-pointer hover:border-warning/50 transition-colors"
              onClick={() => navigate('/receipts')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center">
                  <AlertCircle size={20} className="text-warning" />
                </div>
                <div>
                  <p className="font-bold text-text-primary">{data?.pending_review} por revisar</p>
                  <p className="text-xs text-text-secondary">Recibos que necesitan tu atención</p>
                </div>
              </div>
            </div>
          )}

          {/* CTA escanear mobile */}
          <button
            onClick={() => navigate('/scan')}
            className="md:hidden btn-primary w-full py-3"
          >
            <Camera size={18} />
            Escanear nuevo recibo
          </button>
        </div>
      </div>
    </div>
  );
}
