import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Camera, User, Zap } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/receipts', icon: Receipt, label: 'Recibos' },
  { to: '/scan', icon: Camera, label: 'Escanear' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 flex-col bg-surface border-r border-border">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-text-primary text-lg leading-none">ReceiptAI</h1>
            <p className="text-xs text-text-muted mt-0.5">Gestión inteligente</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                isActive
                  ? 'bg-primary-light text-primary'
                  : 'text-text-secondary hover:bg-background hover:text-text-primary'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-text-muted text-center">ReceiptAI v1.0.0</p>
      </div>
    </aside>
  );
}
