import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar desktop */}
      <Sidebar />

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Nav inferior mobile */}
      <MobileNav />
    </div>
  );
}
