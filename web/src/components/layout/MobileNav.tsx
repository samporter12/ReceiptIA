import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Camera, User } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/receipts', icon: Receipt, label: 'Recibos' },
  { to: '/scan', icon: Camera, label: 'Escanear' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
      <div className="flex">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} className={isActive ? 'text-primary' : 'text-text-muted'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
