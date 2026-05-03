import { useState } from 'react';
import { X, Cpu, Thermometer, Info, Power, Zap, Edit2, Save, Loader2, Trash2 } from 'lucide-react';
import { useToggleEquipment, useDeleteEquipment, type ModuleEquipment } from '@/hooks/useCatalog';
import { usePatchEquipment } from '@/hooks/usePatchEquipment';
import TenantStatusBadge from '@/components/tenants/TenantStatusBadge';
import { ShieldCheck, AlertTriangle, ShieldAlert, Shield } from 'lucide-react';

const TECHNOL_LABELS: Record<string, string> = {
  mtSiMono:   'Monocristalino (Si)',
  mtSiPoly:   'Policristalino (Si)',
  mtCdTe:     'CdTe (First Solar)',
  mtCIS:      'CIS / CIGS',
  mtAmorphous:'Amorfo',
  mtHIT:      'HIT / HJT',
  mtTopCon:   'TOPCon',
};

function fmt(value: number | null | undefined, unit: string, decimals = 3): string {
  if (value == null || value === 0) return 'N/A';
  return `${Number(value).toFixed(decimals)} ${unit}`;
}

interface ModuleDrawerProps {
  moduleEquipment: ModuleEquipment;
  onClose: () => void;
  onMutated?: () => void;
}

export default function ModuleDrawer({ moduleEquipment: m, onClose, onMutated }: ModuleDrawerProps) {
  const { toggle, loadingId } = useToggleEquipment('/catalog/modules', onMutated);
  const { remove, deletingId } = useDeleteEquipment('/catalog/modules', () => {
    onMutated?.();
    onClose();
  });
  const loading = loadingId === m.id;
  const isDeleting = deletingId === m.id;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ powerWp: m.powerWp, efficiency: m.efficiency || '' });
  const { mutate: patch, loadingId: patchLoadingId } = usePatchEquipment('/catalog/modules', () => {
    setIsEditing(false);
    if (onMutated) onMutated();
  });
  const isSaving = patchLoadingId === m.id;

  const ed = m.electricalData;
  const technolLabel = ed?.technol ? (TECHNOL_LABELS[ed.technol] ?? ed.technol) : null;

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
          {/* Header */}
          <section>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-100">{m.model}</h2>
                <p className="mt-0.5 font-tabular text-[11px] text-slate-600">{m.manufacturer}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <TenantStatusBadge status={m.isActive ? 'ACTIVE' : 'BLOCKED'} />
                {ed?.bankability && (
                  <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    ed.bankability === 'BANKABLE'   ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    ed.bankability === 'ACCEPTABLE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                      'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {ed.bankability === 'BANKABLE'   ? <ShieldCheck className="h-2.5 w-2.5" /> :
                     ed.bankability === 'ACCEPTABLE' ? <Shield className="h-2.5 w-2.5" /> :
                                                       <ShieldAlert className="h-2.5 w-2.5" />}
                    {ed.bankability}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Alertas de Validação */}
          {ed?.validation && ed.validation.length > 0 && (
            <section className="rounded-sm border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                <AlertTriangle className="h-3 w-3" /> Alertas Técnicos (.PAN)
              </div>
              <div className="space-y-2">
                {ed.validation.map((v, i) => (
                  <div key={i} className="flex gap-2 text-[10px] leading-relaxed text-slate-400">
                    <span className={`mt-1 h-1 w-1 shrink-0 rounded-full ${v.status === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <p>{v.message}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Cards de potência e eficiência */}
          <section className="grid grid-cols-2 gap-2">
            <div className="rounded-sm border border-slate-800 bg-slate-900 p-3">
              {isEditing ? (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500">Potência (Wp)</label>
                  <input
                    type="number"
                    value={formData.powerWp}
                    onChange={e => setFormData(s => ({ ...s, powerWp: Number(e.target.value) }))}
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
            <div className="rounded-sm border border-slate-800 bg-slate-900 p-3">
              {isEditing ? (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500">Eficiência (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.efficiency}
                    onChange={e => setFormData(s => ({ ...s, efficiency: e.target.value }))}
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

          {/* Parâmetros Elétricos STC */}
          <section className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Parâmetros Elétricos (STC)</p>
            <div className="rounded-sm border border-slate-800 divide-y divide-slate-800">
              <div className="flex justify-between px-3 py-2">
                <span className="text-xs text-slate-400">Tensão de Circuito Aberto (Voc)</span>
                <span className="text-xs font-mono text-slate-200">{ed?.voc ? `${ed.voc} V` : 'N/A'}</span>
              </div>
              <div className="flex justify-between px-3 py-2">
                <span className="text-xs text-slate-400">Corrente de Curto-Circuito (Isc)</span>
                <span className="text-xs font-mono text-slate-200">{ed?.isc ? `${ed.isc} A` : 'N/A'}</span>
              </div>
              <div className="flex justify-between px-3 py-2">
                <span className="text-xs text-slate-400">Tensão Máx. Potência (Vmp)</span>
                <span className="text-xs font-mono text-slate-200">{ed?.vmp ? `${ed.vmp} V` : 'N/A'}</span>
              </div>
              <div className="flex justify-between px-3 py-2">
                <span className="text-xs text-slate-400">Corrente Máx. Potência (Imp)</span>
                <span className="text-xs font-mono text-slate-200">{ed?.imp ? `${ed.imp} A` : 'N/A'}</span>
              </div>
              {ed?.vMaxIEC && (
                <div className="flex justify-between px-3 py-2">
                  <span className="text-xs text-slate-400">Tensão Máx. Sistema (NBR/IEC)</span>
                  <span className="text-xs font-mono text-slate-200">{ed.vMaxIEC} V</span>
                </div>
              )}
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
                  {(m.tempCoeffPmax ?? ed?.tempCoeffPmax) != null
                    ? `${m.tempCoeffPmax ?? ed?.tempCoeffPmax} %/°C`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between px-3 py-2">
                <span className="text-xs text-slate-400">Coef. de Tensão (Voc)</span>
                <span className="text-xs font-mono text-slate-200">
                  {(m.tempCoeffVoc ?? ed?.tempCoeffVoc) != null
                    ? `${m.tempCoeffVoc ?? ed?.tempCoeffVoc} %/°C`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between px-3 py-2">
                <span className="text-xs text-slate-400">Coef. de Corrente (Isc)</span>
                <span className="text-xs font-mono text-slate-200">
                  {ed?.tempCoeffIsc != null ? `${ed.tempCoeffIsc} %/°C` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between px-3 py-2">
                <span className="text-xs text-slate-400">NOCT / NMOT</span>
                <span className="text-xs font-mono text-slate-200">{m.noct ? `${m.noct} °C` : 'N/A'}</span>
              </div>
            </div>
          </section>

          {/* Características Físicas e Construtivas */}
          <section className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Características Físicas</p>
            <div className="rounded-sm border border-slate-800 divide-y divide-slate-800">
              {technolLabel && (
                <div className="flex justify-between px-3 py-2">
                  <span className="text-xs text-slate-400">Tecnologia</span>
                  <span className="text-xs font-mono text-slate-200">{technolLabel}</span>
                </div>
              )}
              <div className="flex justify-between px-3 py-2">
                <span className="text-xs text-slate-400">Células (série × paralelo)</span>
                <span className="text-xs font-mono text-slate-200">
                  {ed?.nCelS && ed?.nCelP ? `${ed.nCelS} × ${ed.nCelP}` : ed?.nCelS ? `${ed.nCelS}` : 'N/A'}
                </span>
              </div>
              {m.dimensions && (
                <div className="flex justify-between px-3 py-2">
                  <span className="text-xs text-slate-400">Dimensões (L × A)</span>
                  <span className="text-xs font-mono text-slate-200">{m.dimensions}</span>
                </div>
              )}
              {m.weight && (
                <div className="flex justify-between px-3 py-2">
                  <span className="text-xs text-slate-400">Peso</span>
                  <span className="text-xs font-mono text-slate-200">{m.weight} kg</span>
                </div>
              )}
              {ed?.bifacialityFactor != null && ed.bifacialityFactor > 0 && (
                <div className="flex justify-between px-3 py-2">
                  <span className="text-xs text-slate-400">Fator de Bifacialidade</span>
                  <span className="text-xs font-mono text-slate-200">
                    {(ed.bifacialityFactor * 100).toFixed(0)}%
                  </span>
                </div>
              )}
              <div className="flex justify-between px-3 py-2">
                <span className="text-xs text-slate-400">Rs / Rsh (SDM)</span>
                <span className="text-xs font-mono text-slate-200">
                  {ed?.rSerie != null && ed?.rShunt != null
                    ? `${fmt(ed.rSerie, 'Ω', 4)} / ${fmt(ed.rShunt, 'Ω', 0)}`
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
                onClick={() => patch(m.id, {
                  powerWp: Number(formData.powerWp) || m.powerWp,
                  efficiency: formData.efficiency ? Number(formData.efficiency) : null,
                })}
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
            onClick={() => toggle(m.id, !m.isActive)}
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

          {!isEditing && (
            <button
              onClick={() => remove(m.id)}
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
