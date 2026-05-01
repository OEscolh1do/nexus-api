import { Building2 } from 'lucide-react';

export default function TenantsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-200">Organizações</h1>
          <p className="text-xs text-slate-500">Gestão de tenants, assinaturas e limites de API</p>
        </div>
      </div>

      <div className="flex h-96 items-center justify-center rounded-sm border border-dashed border-slate-800 bg-slate-900/50">
        <div className="flex flex-col items-center gap-3 text-center">
          <Building2 className="h-8 w-8 text-slate-700" />
          <p className="text-sm text-slate-500">DataGrid de organizações — em desenvolvimento</p>
          <p className="text-xs text-slate-600">Listagem, filtros, ações de bloqueio e edição de planos</p>
        </div>
      </div>
    </div>
  );
}
