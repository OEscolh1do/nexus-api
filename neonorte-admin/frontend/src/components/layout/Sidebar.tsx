import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  ScrollText,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/tenants', icon: Building2, label: 'Organizações' },
  { path: '/users', icon: Users, label: 'Usuários' },
  { path: '/catalog', icon: Package, label: 'Catálogo FV' },
  { path: '/audit', icon: ScrollText, label: 'Auditoria' },
  { path: '/system', icon: Activity, label: 'Sistema' },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={`flex flex-col border-r border-slate-800 bg-slate-900 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Logo */}
      <div className="flex h-12 items-center gap-2 border-b border-slate-800 px-4">
        <Zap className="h-5 w-5 shrink-0 text-amber-400" />
        {!collapsed && (
          <span className="text-sm font-semibold tracking-wide text-slate-200">
            NEONORTE
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="flex h-10 items-center justify-center border-t border-slate-800 text-slate-500 hover:text-slate-300"
        title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}
