import { useState } from 'react';
import { Users, ShieldCheck } from 'lucide-react';
import UsersTab from '@/components/users/UsersTab';
import RolesTab from '@/components/roles/RolesTab';

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-200">
            <Users className="h-5 w-5 text-slate-500" />
            Identidade e Acessos
          </h1>
          <p className="text-xs text-slate-500">
            Gestão cross-tenant de usuários, roles e permissões do ecossistema Ywara
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Usuários
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'roles'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Perfis de Acesso (Roles)
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'roles' && <RolesTab />}
      </div>
    </div>
  );
}
