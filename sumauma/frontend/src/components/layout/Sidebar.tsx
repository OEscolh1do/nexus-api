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
  Shield,
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
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-wide text-slate-200">NEONORTE</span>
            <span className="text-[9px] uppercase tracking-widest text-slate-500">Admin Console</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {/* Seção: Plataforma */}
        {!collapsed && (
          <p className="mb-1 px-3 text-[9px] font-bold uppercase tracking-widest text-slate-600">
            Kurupira · Iaçã
          </p>
        )}
        {navItems.slice(0, 4).map((item) => (
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

        {/* Seção: Observabilidade */}
        {!collapsed && (
          <p className="mb-1 mt-4 px-3 text-[9px] font-bold uppercase tracking-widest text-slate-600">
            Observabilidade
          </p>
        )}
        {collapsed && <div className="my-2 border-t border-slate-800/80" />}
        {navItems.slice(4).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
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

        {/* Seção: Segurança */}
        {!collapsed && (
          <p className="mb-1 mt-4 px-3 text-[9px] font-bold uppercase tracking-widest text-slate-600">
            Segurança
          </p>
        )}
        {collapsed && <div className="my-2 border-t border-slate-800/80" />}
        <NavLink
          to="/operators"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors ${
              isActive
                ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                : 'text-slate-500 hover:bg-violet-500/5 hover:text-violet-300'
            } ${collapsed ? 'justify-center' : ''}`
          }
          title={collapsed ? 'Operadores' : undefined}
        >
          <Shield className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Operadores</span>}
        </NavLink>
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
