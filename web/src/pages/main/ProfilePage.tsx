import { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { analyticsService, authService } from '../../services/api';
import {
  Star, FileText, Shield, HelpCircle, LogOut,
  Trash2, ChevronRight, AlertTriangle,
} from 'lucide-react';
import Spinner from '../../components/ui/Spinner';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'deleting' | 'done'>('confirm');
  const [deleteError, setDeleteError] = useState('');

  const handleExportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await analyticsService.exportCsv();
    } catch {
      alert('No se pudo exportar. Intenta de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await analyticsService.exportPdf();
    } catch {
      alert('No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  // REPO-40: Eliminar cuenta
  const handleDeleteAccount = async () => {
    setDeleteStep('deleting');
    setDeleteError('');
    try {
      await authService.deleteAccount();
      setDeleteStep('done');
      setTimeout(() => {
        logout();
      }, 2000);
    } catch {
      setDeleteError('No se pudo eliminar la cuenta. Contacta con soporte.');
      setDeleteStep('confirm');
    }
  };

  const usagePercent = user?.plan === 'free'
    ? (user.receipts_count_this_month / 15) * 100
    : 100;

  const initials = (user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase();

  const menuItems = [
    { icon: Star, label: 'Actualizar a Pro', color: '#F59E0B', action: () => {} },
    { icon: FileText, label: exporting ? 'Exportando...' : 'Exportar PDF', color: '#6C63FF', action: handleExportPdf },
    { icon: FileText, label: exporting ? 'Exportando...' : 'Exportar CSV', color: '#22C55E', action: handleExportCsv },
    { icon: Shield, label: 'Privacidad y términos', color: '#22C55E', action: () => window.open('https://receiptai.app/privacidad', '_blank') },
    { icon: HelpCircle, label: 'Ayuda y soporte', color: '#3B82F6', action: () => window.open('mailto:soporte@receiptai.app') },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-black text-text-primary">Perfil</h1>

      {/* Avatar y datos */}
      <div className="card text-center">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black text-white">
          {initials}
        </div>
        <h2 className="text-xl font-black text-text-primary">{user?.full_name || 'Usuario'}</h2>
        <p className="text-text-secondary text-sm mt-1">{user?.email}</p>
        <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-bold ${
          user?.plan === 'pro'
            ? 'bg-primary text-white'
            : 'bg-primary-light text-primary border border-primary'
        }`}>
          <Star size={12} />
          Plan {user?.plan === 'pro' ? 'Pro' : 'Gratuito'}
        </div>
      </div>

      {/* Uso del plan */}
      {user?.plan === 'free' && (
        <div className="card">
          <div className="flex justify-between items-center mb-2">
            <p className="font-semibold text-text-primary text-sm">Uso este mes</p>
            <p className="text-sm font-bold text-primary">
              {user.receipts_count_this_month}/15 recibos
            </p>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all ${usagePercent >= 100 ? 'bg-error' : usagePercent >= 80 ? 'bg-warning' : 'bg-primary'}`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-text-muted">Actualiza a Pro para recibos ilimitados</p>
        </div>
      )}

      {/* Menú de acciones */}
      <div className="card p-0 overflow-hidden">
        {menuItems.map(({ icon: Icon, label, color, action }, i) => (
          <button
            key={label}
            onClick={action}
            disabled={exporting}
            className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-background transition-colors text-left ${
              i < menuItems.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '20' }}>
              <Icon size={18} style={{ color }} />
            </div>
            <span className="flex-1 text-sm font-medium text-text-primary">{label}</span>
            <ChevronRight size={16} className="text-text-muted" />
          </button>
        ))}
      </div>

      {/* Acciones peligrosas */}
      <div className="card p-0 overflow-hidden border-error/20">
        {/* Cerrar sesión */}
        <button
          onClick={() => setConfirmLogout(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-error/5 transition-colors border-b border-border"
        >
          <div className="w-9 h-9 rounded-xl bg-error/10 flex items-center justify-center flex-shrink-0">
            <LogOut size={18} className="text-error" />
          </div>
          <span className="flex-1 text-sm font-medium text-error">Cerrar sesión</span>
          <ChevronRight size={16} className="text-text-muted" />
        </button>

        {/* REPO-40: Eliminar cuenta */}
        <button
          onClick={() => setConfirmDelete(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-error/5 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-error/10 flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-error" />
          </div>
          <div className="flex-1 text-left">
            <span className="block text-sm font-medium text-error">Eliminar mi cuenta</span>
            <span className="block text-xs text-text-muted">Elimina todos tus datos permanentemente (GDPR)</span>
          </div>
          <ChevronRight size={16} className="text-text-muted" />
        </button>
      </div>

      <p className="text-center text-xs text-text-muted pb-4">ReceiptAI v1.0.0</p>

      {/* Modal: confirmar logout */}
      {confirmLogout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-text-primary">Cerrar sesión</h3>
            <p className="text-text-secondary text-sm mt-2">¿Estás seguro de que quieres cerrar sesión?</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmLogout(false)} className="flex-1 btn-secondary">Cancelar</button>
              <button onClick={logout} className="flex-1 btn-danger">Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar eliminar cuenta — REPO-40 */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-xl">
            {deleteStep === 'done' ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trash2 size={28} className="text-success" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">Cuenta eliminada</h3>
                <p className="text-text-secondary text-sm mt-2">Todos tus datos han sido eliminados. Hasta pronto.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={24} className="text-error" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Eliminar cuenta</h3>
                    <p className="text-xs text-text-muted">Esta acción es irreversible</p>
                  </div>
                </div>
                <p className="text-text-secondary text-sm">
                  Se eliminarán permanentemente:
                </p>
                <ul className="text-sm text-text-secondary mt-2 space-y-1 list-disc list-inside">
                  <li>Tu cuenta y datos de perfil</li>
                  <li>Todos tus recibos e imágenes</li>
                  <li>Tu historial de gastos</li>
                </ul>
                {deleteError && (
                  <div className="bg-error/10 border border-error/20 rounded-xl px-3 py-2 text-error text-xs mt-3">
                    {deleteError}
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 btn-secondary"
                    disabled={deleteStep === 'deleting'}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 btn-danger"
                    disabled={deleteStep === 'deleting'}
                  >
                    {deleteStep === 'deleting' ? <Spinner size="sm" /> : 'Eliminar todo'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
