import { useState } from 'react';
import { X, Battery, Zap, Activity, Edit2, Save, Loader2, Trash2, Maximize2, Weight, ArrowDownToLine, ArrowUpFromLine, Gauge, ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useToggleEquipment, useDeleteEquipment, type InverterEquipment } from '@/hooks/useCatalog';
import { usePatchEquipment } from '@/hooks/usePatchEquipment';
import { mergeTechnicalData, syncInverterData } from '@/lib/catalogSync';
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
  const [formData, setFormData] = useState({
    nominalPowerW: m.nominalPowerW,
    maxInputV: m.maxInputV || '',
    mpptCount: m.mpptCount || '',
    efficiency: m.efficiency || '',
    width: m.width || '',
    height: m.height || '',
    depth: m.depth || '',
    weight: m.weight || '',
    // Advanced fields
    vMinMpp: (m.electricalData as any)?.vMinMpp || '',
    vMaxMpp: (m.electricalData as any)?.vMaxMpp || '',
    iMaxDC: (m.electricalData as any)?.iMaxDC || '',
  });

  const { mutate: patch, loadingId: patchLoadingId } = usePatchEquipment('/catalog/inverters', () => {
    setIsEditing(false);
    if (onMutated) onMutated();
  });
  const isSaving = patchLoadingId === m.id;

  const ed = m.electricalData as InverterEquipment['electricalData'] & {
    vMinMpp?: number;
    vMaxMpp?: number;
    fNom?: number;
    iMaxDC?: number;
    vNomDC?: number;
    vAcOut?: number;
    pNomDCW?: number;
    pMaxDCW?: number;
    maxOutputW?: number;
    iNomAC?: number;
    iMaxAC?: number;
    width?: number;
    height?: number;
    depth?: number;
    weight?: number;
  };

  // Helpers de Formatação (Padrão Backoffice PT-BR)
  const formatW = (w: number | undefined | null) => w ? `${(w / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kW` : '—';
  const formatV = (v: number | undefined | null) => v ? `${v.toLocaleString('pt-BR')} V` : '—';
  const formatA = (a: number | undefined | null) => a ? `${a.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} A` : '—';
  const formatEff = (eff: number | undefined | null) => {
    if (eff == null) return '—';
    const val = eff <= 1 ? eff * 100 : eff;
    return `${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  };
  const formatDim = (val: number | undefined | null) => val ? val.toLocaleString('pt-BR', { minimumFractionDigits: 3 }) : '—';
  const formatWeight = (w: number | undefined | null) => w ? `${w.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg` : '—';

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <div className="fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl">
        {/* Header Fixo */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Battery className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-200">Detalhe do Inversor</span>
          </div>
          <button onClick={onClose} className="rounded-sm p-1 text-slate-500 hover:text-slate-200 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {/* 1. Identificação */}
          <section className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-100 leading-tight">{m.model}</h2>
                <div className="flex items-center gap-2">
                  <span className="rounded-sm bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fabricante</span>
                  <p className="text-xs font-medium text-slate-500">{m.manufacturer}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <TenantStatusBadge status={m.isActive ? 'ACTIVE' : 'BLOCKED'} />
                <div className="flex flex-wrap justify-end gap-1">
                  {m.afci && (
                    <div className="rounded-sm bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-bold text-indigo-400 border border-indigo-500/20">
                      AFCI
                    </div>
                  )}
                  {m.rsd && (
                    <div className="rounded-sm bg-orange-500/10 px-1.5 py-0.5 text-[9px] font-bold text-orange-400 border border-orange-500/20">
                      RSD
                    </div>
                  )}
                  {m.portaria515Compliant && (
                    <div className="rounded-sm bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
                      INMETRO 515
                    </div>
                  )}
                </div>
                {ed?.bankability && (
                  <div className={`flex items-center gap-1 rounded-sm px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    ed.bankability === 'BANKABLE'    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    ed.bankability === 'ACCEPTABLE'  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                       'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {ed.bankability === 'BANKABLE'   ? <ShieldCheck className="h-2.5 w-2.5" /> :
                     ed.bankability === 'ACCEPTABLE' ? <AlertTriangle className="h-2.5 w-2.5" /> :
                                                        <ShieldAlert className="h-2.5 w-2.5" />}
                    {ed.bankability}
                  </div>
                )}
              </div>
            </div>

            {/* Alertas Críticos de Validação */}
            {ed?.validation && ed.validation.length > 0 && (
              <div className="rounded-sm border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  <AlertTriangle className="h-3 w-3" /> Alertas Técnicos (.OND)
                </div>
                <div className="space-y-1.5">
                  {ed.validation.map((v, i) => (
                    <div key={i} className="flex gap-2 text-[10px] leading-relaxed text-slate-400">
                      <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${v.status === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <p>{v.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 2. Dimensões e Peso */}
          <section className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
              <Maximize2 className="h-3 w-3" /> Dimensões e Físico
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-sm border border-slate-800 bg-slate-900/40 p-2">
                <p className="text-[10px] text-slate-500 mb-0.5">L x A x P</p>
                <p className="font-mono text-xs text-slate-200">
                  {ed?.width && ed?.height && ed?.depth 
                    ? `${formatDim(ed.width)} × ${formatDim(ed.height)} × ${formatDim(ed.depth)} m`
                    : m.width && m.height && m.depth
                    ? `${formatDim(m.width)} × ${formatDim(m.height)} × ${formatDim(m.depth)} m`
                    : '—'}
                </p>
              </div>
              <div className="rounded-sm border border-slate-800 bg-slate-900/40 p-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 mb-0.5">Peso</p>
                  <Weight className="h-2.5 w-2.5 text-slate-700" />
                </div>
                <p className="font-mono text-xs text-slate-200">{formatWeight(m.weight || ed?.weight)}</p>
              </div>
            </div>
          </section>

          {/* 3. Entrada CC (DC) */}
          <section className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
              <ArrowDownToLine className="h-3 w-3 text-sky-500" /> Entrada CC (DC)
            </div>
            <div className="rounded-sm border border-slate-800 bg-slate-900/50 divide-y divide-slate-800">
              <div className="flex justify-between px-3 py-2 text-[11px]">
                <span className="text-slate-500">Janela MPPT (Vmin - Vmax)</span>
                <span className="font-mono text-slate-200 tracking-tight">
                  {ed?.vMinMpp && ed?.vMaxMpp ? `${formatV(ed.vMinMpp)} - ${formatV(ed.vMaxMpp)}` : '—'}
                </span>
              </div>
              <div className="flex justify-between px-3 py-2 text-[11px] bg-red-500/5">
                <span className="text-slate-500">Tensão Máx. Hardware (Voc)</span>
                <span className="font-mono font-bold text-red-400">{formatV(m.Voc_max_hardware || m.maxInputV)}</span>
              </div>
              <div className="flex justify-between px-3 py-2 text-[11px]">
                <span className="text-slate-500">Corrente Máx. Hardware (Isc)</span>
                <span className="font-mono text-slate-200">{formatA(m.Isc_max_hardware || ed?.iMaxDC)}</span>
              </div>
              <div className="flex justify-between px-3 py-2 text-[11px]">
                <span className="text-slate-500">MPPTs / Entradas</span>
                <span className="font-mono text-slate-200 tracking-widest">{m.mpptCount ?? '—'} / {ed?.nbInputs ?? '—'}</span>
              </div>
              <div className="flex justify-between px-3 py-2 text-[11px] bg-slate-900/30">
                <span className="text-slate-500">Potência CC Nominal / Máx.</span>
                <span className="font-mono text-slate-200">{formatW(ed?.pNomDCW)} / {formatW(ed?.pMaxDCW)}</span>
              </div>
            </div>
          </section>

          {/* 4. Saída CA (AC) */}
          <section className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
              <ArrowUpFromLine className="h-3 w-3 text-emerald-500" /> Saída CA (AC)
            </div>
            <div className="rounded-sm border border-slate-800 bg-slate-900/50 divide-y divide-slate-800">
              <div className="flex justify-between px-3 py-2 text-[11px]">
                <span className="text-slate-500">Tensão de Rede (Vac) / Fases</span>
                <span className="font-mono text-slate-200">{formatV(ed?.vAcOut)} • {ed?.phase || '—'}</span>
              </div>
              <div className="flex justify-between px-3 py-2 text-[11px]">
                <span className="text-slate-500">Potência Nominal Saída</span>
                <span className="font-mono font-bold text-emerald-400">{formatW(m.nominalPowerW)}</span>
              </div>
              <div className="flex justify-between px-3 py-2 text-[11px]">
                <span className="text-slate-500">Potência Máxima Saída</span>
                <span className="font-mono text-slate-200">{formatW(ed?.maxOutputW)}</span>
              </div>
              <div className="flex justify-between px-3 py-2 text-[11px]">
                <span className="text-slate-500">Corrente Nom. / Máx. CA</span>
                <span className="font-mono text-slate-200">{formatA(ed?.iNomAC)} / {formatA(ed?.iMaxAC)}</span>
              </div>
              <div className="flex justify-between px-3 py-2 text-[11px]">
                <span className="text-slate-500">Frequência Nominal</span>
                <span className="font-mono text-slate-200">{ed?.fNom ? `${ed.fNom} Hz` : '—'}</span>
              </div>
            </div>
          </section>

          {/* 5. Eficiência e Performance */}
          <section className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
              <Gauge className="h-3 w-3 text-amber-500" /> Eficiência e Performance
            </div>
            <div className="rounded-sm border border-slate-800 bg-slate-900/50 divide-y divide-slate-800">
              <div className="flex justify-between px-3 py-2 text-[11px]">
                <span className="text-slate-500">Eficiência Máxima / Euro</span>
                <span className="font-mono text-slate-200">{formatEff(m.efficiency)} / {formatEff(ed?.effEuro)}</span>
              </div>
              <div className="flex justify-between px-3 py-2 text-[11px] bg-slate-900/30">
                <span className="text-slate-500">Resfriamento / Cooling</span>
                <span className="font-mono text-slate-200 uppercase tracking-tighter">{m.coolingType || 'Passive'}</span>
              </div>
              <div className="flex justify-between px-3 py-2 text-[11px]">
                <span className="text-slate-500">Limiar Ativação (Pthreshold)</span>
                <span className="font-mono text-amber-400">{ed?.pThreshold ? `${ed.pThreshold.toLocaleString('pt-BR')} W` : '—'}</span>
              </div>
              <div className="flex justify-between px-3 py-2 text-[11px]">
                <span className="text-slate-500">Símbolo Unifilar</span>
                <span className="font-mono text-slate-500 italic">{m.unifilarSymbolRef || 'inverter-default'}</span>
              </div>
              <div className="flex justify-between px-3 py-2 text-[11px] bg-slate-900/30">
                <span className="text-slate-500">Derating Térmico (Pnom / Pmax)</span>
                <span className="font-mono text-slate-200">{ed?.tPNom ?? '—'}°C / {ed?.tPMax ?? '—'}°C</span>
              </div>
            </div>
          </section>

          {/* 6. Curva de Eficiência (Tabela Compacta) */}
          {ed?.efficiencyCurve && ed.efficiencyCurve.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                <Activity className="h-3 w-3" /> Curva de Eficiência (Pin vs Pout)
              </div>
              <div className="overflow-hidden rounded-sm border border-slate-800 bg-slate-900/30">
                <table className="w-full text-left text-[10px] tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-500">
                      <th className="px-3 py-1.5 font-medium">Pin (W)</th>
                      <th className="px-3 py-1.5 font-medium">Pout (W)</th>
                      <th className="px-3 py-1.5 font-medium text-right">Rendimento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 font-mono">
                    {ed.efficiencyCurve.map((p, i) => (
                      <tr key={i} className="text-slate-300 hover:bg-slate-800/20 transition-colors">
                        <td className="px-3 py-1">{p.power.toLocaleString('pt-BR')}</td>
                        <td className="px-3 py-1">{p.pOut?.toLocaleString('pt-BR') ?? '—'}</td>
                        <td className="px-3 py-1 text-right text-sky-400 font-bold">
                          {p.pOut ? `${((p.pOut / p.power) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Editor Inline (se ativo) */}
          {isEditing && (
            <section className="rounded-sm border border-sky-500/20 bg-sky-500/5 p-4 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-sky-400">Editor de Parâmetros</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Potência Nom. (W)</label>
                  <input
                    type="number"
                    value={formData.nominalPowerW}
                    onChange={e => setFormData(s => ({ ...s, nominalPowerW: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Vabsmax (V)</label>
                  <input
                    type="number"
                    value={formData.maxInputV}
                    onChange={e => setFormData(s => ({ ...s, maxInputV: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">MPPTs</label>
                  <input
                    type="number"
                    value={formData.mpptCount}
                    onChange={e => setFormData(s => ({ ...s, mpptCount: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Eficiência (fraç.)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.efficiency}
                    onChange={e => setFormData(s => ({ ...s, efficiency: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Largura (m)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.width}
                    onChange={e => setFormData(s => ({ ...s, width: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Altura (m)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.height}
                    onChange={e => setFormData(s => ({ ...s, height: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Profundidade (m)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.depth}
                    onChange={e => setFormData(s => ({ ...s, depth: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Vmin MPP (V)</label>
                  <input
                    type="number"
                    value={formData.vMinMpp}
                    onChange={e => setFormData(s => ({ ...s, vMinMpp: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Vmax MPP (V)</label>
                  <input
                    type="number"
                    value={formData.vMaxMpp}
                    onChange={e => setFormData(s => ({ ...s, vMaxMpp: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Imax DC (A)</label>
                  <input
                    type="number"
                    value={formData.iMaxDC}
                    onChange={e => setFormData(s => ({ ...s, iMaxDC: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={e => setFormData(s => ({ ...s, weight: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer de Ações Fixo */}
        <div className="border-t border-slate-800 bg-slate-950 px-5 py-4 space-y-2">
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const payload: any = {
                    nominalPowerW: Number(formData.nominalPowerW),
                    maxInputV: formData.maxInputV ? Number(formData.maxInputV) : null,
                    Voc_max_hardware: formData.maxInputV ? Number(formData.maxInputV) : null,
                    Isc_max_hardware: formData.iMaxDC ? Number(formData.iMaxDC) : null,
                    mpptCount: formData.mpptCount ? Number(formData.mpptCount) : null,
                    efficiency: formData.efficiency ? Number(formData.efficiency) : null,
                    width: formData.width ? Number(formData.width) : null,
                    height: formData.height ? Number(formData.height) : null,
                    depth: formData.depth ? Number(formData.depth) : null,
                    weight: formData.weight ? Number(formData.weight) : null,
                  };

                  // Merge e Sincronização de Dados de Engenharia
                  const currentED = (m.electricalData as any) || {};
                  const updatedED = mergeTechnicalData(currentED, {
                    vMinMpp: formData.vMinMpp ? Number(formData.vMinMpp) : currentED.vMinMpp,
                    vMaxMpp: formData.vMaxMpp ? Number(formData.vMaxMpp) : currentED.vMaxMpp,
                    iMaxDC: formData.iMaxDC ? Number(formData.iMaxDC) : currentED.iMaxDC,
                  });

                  payload.electricalData = syncInverterData(payload, updatedED);
                  
                  patch(m.id, payload);
                }}
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
              className="flex w-full items-center justify-between rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-[11px] font-medium text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <span>Editar Parâmetros Técnicos</span>
              <Edit2 className="h-3 w-3" />
            </button>
          )}

          <button
            onClick={() => toggle(m.id, !m.isActive)}
            disabled={loading || isEditing}
            className={`flex w-full items-center justify-between rounded-sm border px-3 py-2 text-[11px] font-medium transition-colors disabled:opacity-50 ${
              m.isActive
                ? 'border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10'
                : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <span>{loading ? 'Processando...' : m.isActive ? 'Desativar Equipamento' : 'Ativar no Catálogo'}</span>
            <Zap className="h-3 w-3" />
          </button>

          {!isEditing && (
            <button
              onClick={() => remove(m.id)}
              disabled={isDeleting || loading}
              className="flex w-full items-center justify-between rounded-sm border border-transparent px-3 py-2 text-[11px] font-medium text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-all opacity-60 hover:opacity-100"
            >
              <span>{isDeleting ? 'Excluindo...' : 'Excluir Permanentemente'}</span>
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
