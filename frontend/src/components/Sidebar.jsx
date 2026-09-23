import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import {
  LayoutDashboard,
  Building2,
  FileBarChart2,
  Bell,
  ShieldAlert,
  LogOut,
  ChevronRight,
  Sparkles,
  Globe,
  Users,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

const baseNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vendors', icon: Building2, label: 'Vendors' },
  { to: '/alternatives', icon: Sparkles, label: 'Alternatives' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/reports', icon: FileBarChart2, label: 'Reports' },
];

const adminNavItems = [
  { to: '/users', icon: Users, label: 'Users & Roles' },
  { to: '/audit-log', icon: ClipboardList, label: 'Audit Trail' },
  { to: '/settings', icon: ShieldCheck, label: 'Security & Settings' },
];

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  return (
    <aside
      className={`
        flex flex-col h-screen bg-[#0b0f19] dark:bg-slate-950 border-r border-slate-800
        transition-all duration-300 ease-in-out shrink-0 select-none
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 px-4 py-5 border-b border-slate-800/80 group">
        <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/20 text-slate-950 font-bold text-sm">
          🛡️
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate leading-tight group-hover:text-sky-400 transition">Shadow AI</p>
            <p className="text-slate-400 text-xs truncate">Risk Scanner Suite</p>
          </div>
        )}
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium
              ${isActive
                ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && (
              <span className="truncate">{label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-2.5 py-4 border-t border-slate-800/80 space-y-2">
        <ThemeToggle collapsed={collapsed} />

        {/* Public Landing Link */}
        <Link
          to="/"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-slate-900 transition-all text-xs"
          title="View Public Product Site"
        >
          <Globe size={16} className="shrink-0" />
          {!collapsed && <span className="truncate font-medium">Public Product Site</span>}
        </Link>

        {/* User info */}
        {!collapsed && user && (
          <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <p className="text-slate-200 text-xs font-semibold truncate">{user.email}</p>
            <p className="text-slate-400 text-[11px] font-mono uppercase font-bold text-sky-400">
              Role: {user.role || 'admin'}
            </p>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 text-xs font-medium"
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span className="truncate">Logout</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-all duration-200"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronRight
            size={16}
            className={`transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}
          />
        </button>
      </div>
    </aside>
  );
}
