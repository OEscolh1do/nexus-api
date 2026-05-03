import { useLocation } from 'react-router-dom';
import { LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useLogto } from '@logto/react';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/tenants': 'Organizações',
  '/users': 'Usuários',
  '/catalog': 'Catálogo FV',
  '/audit': 'Auditoria',
  '/system': 'Sistema',
};

export default function Header() {
  const location = useLocation();
  const { operator, logout } = useAuthStore();
  const { signOut, isAuthenticated: isLogtoAuth } = useLogto();

  const pageTitle = pageTitles[location.pathname] || 'Admin';

  const handleLogout = async () => {
    // 1. Limpar estado local e avisar backend
    await logout();
    
    // 2. Se estiver autenticado via Logto, fazer o sign out total no provedor
    if (isLogtoAuth) {
      signOut(window.location.origin);
    } else {
      // Fallback para login local
      window.location.href = '/login';
    }
  };

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Admin</span>
        <span className="text-xs text-slate-600">/</span>
        <span className="text-sm font-medium text-slate-200">{pageTitle}</span>
      </div>

      {/* Operator Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs text-slate-400">
            {operator?.fullName || 'Operador'}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          title="Sair"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
}
