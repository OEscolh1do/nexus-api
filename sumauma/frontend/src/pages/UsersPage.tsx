import { useState } from 'react';
import { Users, Building2, UserCircle2 } from 'lucide-react';
import UsersTab from '@/components/users/UsersTab';
import TenantsTab from '@/components/tenants/TenantsTab';

type Tab = 'users' | 'tenants';

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-200">
            <UserCircle2 className="h-5 w-5 text-slate-500" />
            Contas e Acessos
          </h1>
          <p className="text-xs text-slate-500">
            Gestão unificada de usuários e organizações do ecossistema Ywara
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          Usuários
        </button>
        <button
          onClick={() => setActiveTab('tenants')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'tenants'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Organizações
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'users' ? <UsersTab /> : <TenantsTab />}
      </div>
    </div>
  );
}
