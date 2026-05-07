import { Users } from 'lucide-react';
import UsersTab from '@/components/users/UsersTab';

export default function UsersPage() {
  return (
    <div className="flex h-full flex-col gap-4">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-200">
            <Users className="h-5 w-5 text-slate-500" />
            Contas e Acessos
          </h1>
          <p className="text-xs text-slate-500">
            Gestão unificada de usuários e organizações do ecossistema Ywara
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <UsersTab />
      </div>
    </div>
  );
}
