import React, { useState } from 'react';
import { NavLink, Navigate, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Image as ImageIcon, FileText, Newspaper, LogOut, ExternalLink, Menu, X } from 'lucide-react';
import { useAdminAuth } from './AdminAuthProvider';

const navItems: { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean }[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/partners', label: 'Partners', icon: Users },
  { to: '/admin/photos', label: 'Photos', icon: ImageIcon },
  { to: '/admin/reports', label: 'Reports', icon: FileText },
  { to: '/admin/posts', label: 'Posts', icon: Newspaper },
];

const AdminLayout: React.FC = () => {
  const { session, isAdmin, loading, signOut } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-brandSlate font-bold">Loading...</p>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-gray-100 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-brandGreen uppercase tracking-tight">SGC Admin</h1>
          <p className="text-brandSlate text-xs font-medium mt-1 truncate">{session.user.email}</p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="md:hidden text-brandSlate hover:text-brandPink p-1 -mr-1 -mt-1"
        >
          <X size={22} />
        </button>
      </div>

      <nav className="flex-grow p-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive ? 'bg-brandPink text-white' : 'text-brandSlate hover:bg-gray-50'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 space-y-1">
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-brandSlate hover:bg-gray-50 transition-all"
        >
          <ExternalLink size={18} />
          View Site
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-[#486e7c]/5">
      {/* Mobile top bar with menu toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 flex items-center justify-between px-4 py-3">
        <h1 className="text-base font-extrabold text-brandGreen uppercase tracking-tight">SGC Admin</h1>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="text-brandSlate hover:text-brandPink p-1"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Backdrop, mobile only, closes drawer on tap */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-40"
        />
      )}

      {/* Sidebar: static on desktop, slide-in drawer on mobile */}
      <aside
        className={`w-64 bg-white border-r border-gray-100 flex flex-col shrink-0 fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      <main className="flex-grow p-8 md:p-12 pt-20 md:pt-12 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
