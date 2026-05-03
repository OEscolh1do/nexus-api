import { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmTenantDeleteModalProps {
  tenantName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export default function ConfirmTenantDeleteModal({
  tenantName,
  onConfirm,
  onCancel,
  loading,
}: ConfirmTenantDeleteModalProps) {
  const [confirmName, setConfirmName] = useState('');
  const isMatch = confirmName.trim().toLowerCase() === tenantName.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={!loading ? onCancel : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-sm border border-red-500/30 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Exclusão Crítica</h3>
          </div>
          <button 
            onClick={onCancel}
            disabled={loading}
            className="text-slate-500 hover:text-slate-300 disabled:opacity-30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs leading-relaxed text-slate-300">
            Você está prestes a excluir permanentemente a organização <span className="font-bold text-slate-100">"{tenantName}"</span>. 
            Esta ação é irreversível e removerá todos os usuários e dados vinculados.
          </p>

          <div className="rounded-sm bg-red-500/5 border border-red-500/10 p-3">
            <p className="text-[11px] text-red-400 font-medium">
              Atenção: Todos os usuários desta organização perderão o acesso imediatamente.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] text-slate-500 uppercase">Digite o nome da organização para confirmar:</label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={tenantName}
              disabled={loading}
              className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!isMatch || loading}
            className="flex items-center gap-2 rounded-sm bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
