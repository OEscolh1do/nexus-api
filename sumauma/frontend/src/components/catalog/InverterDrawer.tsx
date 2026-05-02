import { useState } from 'react';
import { X, Battery, Power, Zap, Activity, Edit2, Save, Loader2, Trash2 } from 'lucide-react';
import { useToggleEquipment, useDeleteEquipment, type InverterEquipment } from '@/hooks/useCatalog';
import { usePatchEquipment } from '@/hooks/usePatchEquipment';
import TenantStatusBadge from '@/components/tenants/TenantStatusBadge';

interface InverterDrawerProps {
  inverterEquipment: InverterEquipment;
  onClose: () => void;
  onMutated?: () => void;
}

export default function InverterDrawer({ inverterEquipment: m, onClose, onMutated }: InverterDrawerProps) {
  const { toggle, loadingId } = useToggleEquipment('/catalog/inverters', onMutated);
  const { remove, deletingId } = useDeleteEquipment('/catalog/inverters', () => {
    onMutated?.();
    onClose();
  });
  const loading = loadingId === m.id;
  const isDeleting = deletingId === m.id;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ nominalPowerW: m.nominalPowerW, maxInputV: m.maxInputV || '' });
  const { mutate: patch, loadingId: patchLoadingId } = usePatchEquipment('/catalog/inverters', () => {
    setIsEditing(false);
    if (onMutated) onMutated();
  });
  const isSaving = patchLoadingId === m.id;

  const handleToggle = () => {
    toggle(m.id, !m.isActive);
  };

  const handleDelete = () => {
    remove(m.id);
  };

  const handleSave = () => {
    patch(m.id, {
      nominalPowerW: Number(formData.nominalPowerW) || m.nominalPowerW,
      maxInputV: formData.maxInputV ? Number(formData.maxInputV) : null,
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <div className="fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Battery className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-200">Detalhe do Inversor</span>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-500 hover:text-slate-200 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <section>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-100">{m.model}</h2>
                <p className="mt-0.5 font-tabular text-[11px] text-slate-600">{m.manufacturer}</p>
              </div>
              <TenantStatusBadge status={m.isActive ? 'ACTIVE' : 'BLOCKED'} />
            </div>
          </section>

          <section className="grid grid-cols-2 gap-2">
            <div className="rounded-sm border border-slate-800 bg-slate-900 p-3 relative group">
              {isEditing ? (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500">Potência (W)</label>
                  <input 
                    type="number" 
                    value={formData.nominalPowerW} 
                    onChange={e => setFormData(s => ({...s, nominalPowerW: Number(e.target.value)}))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-sm font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              ) : (
                <>
                  <Power className="mb-1 h-3.5 w-3.5 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-200 truncate">
                    {(m.nominalPowerW / 1000).toFixed(1)} kW
                  </p>
                  <p className="text-[10px] text-slate-500">Potência Nominal AC</p>
                </>
              )}
            </div>
            <div className="rounded-sm border border-slate-800 bg-slate-900 p-3 relative group">
              {isEditing ? (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500">Max Input V</label>
                  <input 
                    type="number" 
                    value={formData.maxInputV} 
                    onChange={e => setFormData(s => ({...s, maxInputV: e.target.value}))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-sm font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              ) : (
                <>
                  <Activity className="mb-1 h-3.5 w-3.5 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-200">
                    {m.electricalData?.phase ?? '—'}
                  </p>
                  <p className="text-[10px] text-slate-500">Conexão AC</p>
                </>
              )}
            </div>
          </section>

          {/* Parâmetros Elétricos */}
          <section className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Parâmetros Elétricos (Entrada DC)</p>
            <div className="rounded-sm border border-slate-800 divide-y divide-slate-800">
              <div className="flex justify-between px-3 py-2">
                <span className="text-xs text-slate-400">Tensão Máxima Absoluta (Vmax)</span>
                <span className="text-xs font-mono text-slate-200">{m.maxInputV ? `${m.maxInputV} V` : 'N/A'}</span>
              </div>
              <div className="flex justify-between px-3 py-2">
                <span className="text-xs text-slate-400">Tensão Mínima Entrada (Vmin)</span>
                <span className="text-xs font-mono text-slate-200">{m.electricalData?.minInputV ? `${m.electricalData.minInputV} V` : 'N/A'}</span>
              </div>
              <div className="flex justify-between px-3 py-2">
                <span className="text-xs text-slate-400">Voc Máx. Hardware (NBR 16690)</span>
                <span className="text-xs font-mono text-slate-200">{m.Voc_max_hardware ? `${m.Voc_max_hardware} V` : 'N/A'}</span>
              </div>
              <div className="flex justify-between px-3 py-2">
                <span className="text-xs text-slate-400">Corrente Máx. Entrada (Isc max)</span>
                <span className="text-xs font-mono text-slate-200">{m.Isc_max_hardware ? `${m.Isc_max_hardware} A` : 'N/A'}</span>
              </div>
            </div>
          </section>
        </div>

        <div className="border-t border-slate-800 px-5 py-4 space-y-2">
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-sm bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-500 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Salvar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex w-full items-center justify-between rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <span>Editar Parâmetros</span>
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={handleToggle}
            disabled={loading || isEditing}
            className={`flex w-full items-center justify-between rounded-sm border px-3 py-2 text-xs transition-colors disabled:opacity-50 ${
              m.isActive
                ? 'border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10'
                : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <span>{loading ? 'Processando...' : m.isActive ? 'Desativar Inversor no Catálogo' : 'Ativar Inversor no Catálogo'}</span>
            <Zap className="h-3.5 w-3.5" />
          </button>

          {!isEditing && (
            <button
              onClick={handleDelete}
              disabled={isDeleting || loading}
              className="flex w-full items-center justify-between rounded-sm border border-transparent px-3 py-2 text-xs font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all opacity-40 hover:opacity-100"
            >
              <span>{isDeleting ? 'Excluindo...' : 'Excluir Permanentemente'}</span>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
