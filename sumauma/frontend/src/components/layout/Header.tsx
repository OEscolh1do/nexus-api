import { useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useLogto } from '@logto/react';
import { useState, useRef, useEffect } from 'react';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/tenants': 'Organizações',
  '/users': 'Usuários',
  '/catalog': 'Catálogo FV',
  '/audit': 'Auditoria',
  '/system': 'Sistema',
};

// ── Helpers de avatar ─────────────────────────────────────────────────────────

function getInitials(name?: string | null): string {
  const src = name || '?';
  return src
    .split(/[\s._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

function getAvatarColor(seed?: string | null): string {
  const colors = [
    'bg-indigo-600', 'bg-violet-600', 'bg-teal-600',
    'bg-sky-600',    'bg-amber-600',  'bg-emerald-600',
    'bg-rose-600',   'bg-slate-600'
  ];
  if (!seed) return colors[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const ROLE_META: Record<string, { label: string; cls: string }> = {
  PLATFORM_ADMIN: { label: 'Platform Admin', cls: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  ADMIN:          { label: 'Administrador',  cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  OPERATOR:       { label: 'Operador',       cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

export default function Header() {
  const location = useLocation();
  const { operator, logout } = useAuthStore();
  const { signOut, isAuthenticated: isLogtoAuth } = useLogto();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const pageTitle = pageTitles[location.pathname] || 'Admin';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    if (isLogtoAuth) {
      signOut();
    } else {
      window.location.href = '/login';
    }
  };

  if (!operator) return null;

  const rawRole = operator.role || 'OPERATOR';
  const roleMeta = ROLE_META[rawRole] || ROLE_META.OPERATOR;
  const initials = getInitials(operator.fullName);
  const avatarCls = getAvatarColor(operator.id || operator.username);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Sumaúma</span>
        <span className="text-xs text-slate-700">/</span>
        <span className="text-sm font-bold text-slate-200">{pageTitle}</span>
      </div>

      {/* User Identity Chip (Engineering Square Style) */}
      <div ref={ref} className="relative flex items-center">
        <button
          onClick={() => setOpen(p => !p)}
          className={`relative flex items-center justify-center w-8 h-8 rounded-sm transition-all duration-200 border ${
            open ? 'border-indigo-500 scale-105 shadow-[0_0_12px_rgba(99,102,241,0.2)] bg-slate-800' : 'border-slate-800 hover:border-slate-700 bg-slate-900/50'
          }`}
          title="Conta"
        >
          <div className={`w-full h-full rounded-[1px] flex items-center justify-center text-[10px] font-black text-white ${avatarCls}`}>
            {initials}
          </div>
          
          {/* Status Dot */}
          <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
            rawRole === 'PLATFORM_ADMIN' ? 'bg-violet-500' : rawRole === 'ADMIN' ? 'bg-rose-500' : 'bg-amber-500'
          }`} />
        </button>

        {/* Engineering-Style Card Dropdown */}
        {open && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-800 rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
            {/* Header Card */}
            <div className="p-5 flex flex-col items-center text-center bg-gradient-to-b from-slate-800/20 to-transparent">
              <div className={`w-14 h-14 rounded-sm flex items-center justify-center text-xl font-black text-white mb-3 shadow-xl border-2 border-slate-800 ${avatarCls}`}>
                {initials}
              </div>
              
              <div className="flex flex-col gap-1 mb-3">
                <h3 className="text-sm font-bold text-slate-100 tracking-tight">{operator.fullName}</h3>
                {/* Removido username para simplificação conforme solicitado */}
              </div>

              <span className={`px-2.5 py-0.5 rounded-[3px] text-[8px] font-black uppercase tracking-widest border ${roleMeta.cls}`}>
                {roleMeta.label}
              </span>
            </div>

            {/* Actions */}
            <div className="p-1.5 border-t border-slate-800/60 flex flex-col gap-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded transition-all group"
              >
                <div className="w-7 h-7 rounded-sm bg-slate-800 flex items-center justify-center group-hover:bg-rose-500/20 group-hover:text-rose-400 transition-colors">
                  <LogOut size={12} />
                </div>
                Encerrar Sessão
              </button>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-slate-950/50 border-t border-slate-800/40 text-center">
               <p className="text-[8px] text-slate-700 font-bold uppercase tracking-[0.2em]">Sumaúma v1.0.0</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
