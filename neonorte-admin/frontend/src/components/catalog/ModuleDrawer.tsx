import { useState } from 'react';
import { X, Cpu, Thermometer, Info, Power, Zap, Edit2, Save, Loader2 } from 'lucide-react';
import { useToggleEquipment, type ModuleEquipment } from '@/hooks/useCatalog';
import { usePatchEquipment } from '@/hooks/usePatchEquipment';
import TenantStatusBadge from '@/components/tenants/TenantStatusBadge';

interface ModuleDrawerProps {
  moduleEquipment: ModuleEquipment;
  onClose: () => void;
  onMutated?: () => void;
}

export default function ModuleDrawer({ moduleEquipment: m, onClose, onMutated }: ModuleDrawerProps) {
  const { toggle, loadingId } = useToggleEquipment('/catalog/modules', onMutated);
  const loading = loadingId === m.id;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ powerWp: m.powerWp, efficiency: m.efficiency || '' });
  const { mutate: patch, loadingId: patchLoadingId } = usePatchEquipment('/catalog/modules', () => {
    setIsEditing(false);
    if (onMutated) onMutated();
  });
  const isSaving = patchLoadingId === m.id;

  const handleToggle = () => {
    toggle(m.id, !m.isActive);
  };

  const handleSave = () => {
    patch(m.id, {
      powerWp: Number(formData.powerWp) || m.powerWp,
      efficiency: formData.efficiency ? Number(formData.efficiency) : null,
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <div className="fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-200">Detalhe do Módulo FV</span>
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
                  <label className="text-[10px] text-slate-500">Potência (Wp)</label>
                  <input 
                    type="number" 
                    value={formData.powerWp} 
                    onChange={e => setFormData(s => ({...s, powerWp: Number(e.target.value)}))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-sm font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              ) : (
                <>
                  <Power className="mb-1 h-3.5 w-3.5 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-200 truncate">{m.powerWp} Wp</p>
                  <p className="text-[10px] text-slate-500">Potência Nominal</p>
                </>
              )}
            </div>
            <div className="rounded-sm border border-slate-800 bg-slate-900 p-3 relative group">
              {isEditing ? (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500">Eficiência (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={formData.efficiency} 
                    onChange={e => setFormData(s => ({...s, efficiency: e.target.value}))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-sm font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              ) : (
                <>
                  <Info className="mb-1 h-3.5 w-3.5 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-200">{m.efficiency ? `${m.efficiency}%` : 'N/A'}</p>
                  <p className="text-[10px] text-slate-500">Eficiência</p>
                </>
              )}
            </div>
          </section>

          {/* Parâmetros Elétricos */}
          <section className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Parâmetros Elétricos (STC)</p>
            <div className="rounded-sm border border-slate-800 divide-y divide-slate-800">
              <div className="flex justify-between px-3 py-2">
                <span className="text-xs text-slate-400">Tensão de Circuito Aberto (Voc)</span>
                <span className="text-xs font-mono text-slate-200">{m.electricalData?.voc ? `${m.electricalData.voc} V` : 'N/A'}</span>
              </div>
              <div className="flex justify-between px-3 py-2">
                <span className="text-xs text-slate-400">Corrente de Curto-Circuito (Isc)</span>
                <span className="text-xs font-mono text-slate-200">{m.electricalData?.isc ? `${m.electricalData.isc} A` : 'N/A'}</span>
              </div>
              <div className="flex justify-between px-3 py-2">
                <span className="text-xs text-slate-400">Tensão Máx. Potência (Vmp)</span>
                <span className="text-xs font-mono text-slate-200">{m.electricalData?.vmp ? `${m.electricalData.vmp} V` : 'N/A'}</span>
              </div>
              <div className="flex justify-between px-3 py-2">
                <span className="text-xs text-slate-400">Corrente Máx. Potência (Imp)</span>
                <span className="text-xs font-mono text-slate-200">{m.electricalData?.imp ? `${m.electricalData.imp} A` : 'N/A'}</span>
              </div>
            </div>
          </section>

          {/* Coeficientes Térmicos */}
          <section className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Thermometer className="h-3 w-3" /> Coeficientes Térmicos
            </p>
            <div className="rounded-sm border border-slate-800 divide-y divide-slate-800">
              <div className="flex justify-between px-3 py-2">
                <span className="text-xs text-slate-400">Coef. de Potência (Pmax)</span>
                <span className="text-xs font-mono text-slate-200">
                  {(m.tempCoeffPmax ?? m.electricalData?.tempCoeffPmax) !== undefined
                    ? `${m.tempCoeffPmax ?? m.electricalData?.tempCoeffPmax} %/°C`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between px-3 py-2">
                <span className="text-xs text-slate-400">Coef. de Tensão (Voc)</span>
                <span className="text-xs font-mono text-slate-200">
                  {(m.tempCoeffVoc ?? m.electricalData?.tempCoeffVoc) !== undefined
                    ? `${m.tempCoeffVoc ?? m.electricalData?.tempCoeffVoc} %/°C`
                    : 'N/A'}
                </span>
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
            <span>{loading ? 'Processando...' : m.isActive ? 'Desativar Módulo no Catálogo' : 'Ativar Módulo no Catálogo'}</span>
            <Zap className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
