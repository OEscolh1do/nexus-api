import { useState } from 'react';
import { X, Cpu, Thermometer, Info, Zap, Edit2, Save, Loader2, Trash2 } from 'lucide-react';
import { useToggleEquipment, useDeleteEquipment, type ModuleEquipment } from '@/hooks/useCatalog';
import { usePatchEquipment } from '@/hooks/usePatchEquipment';
import { mergeTechnicalData, syncModuleData } from '@/lib/catalogSync';
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
  const [formData, setFormData] = useState({ 
    powerWp: m.powerWp, 
    efficiency: m.efficiency || '',
    dimensions: m.dimensions || '',
    weight: m.weight || '',
    // Technical parameters (Advanced Edit)
    voc: (m.electricalData as any)?.voc || '',
    isc: (m.electricalData as any)?.isc || '',
    vmp: (m.electricalData as any)?.vmp || '',
    imp: (m.electricalData as any)?.imp || '',
    tempCoeffVoc: m.tempCoeffVoc || (m.electricalData as any)?.tempCoeffVoc || '',
    tempCoeffPmax: m.tempCoeffPmax || (m.electricalData as any)?.tempCoeffPmax || '',
  });

  const { mutate: patch, loadingId: patchLoadingId } = usePatchEquipment('/catalog/modules', () => {
    setIsEditing(false);
    if (onMutated) onMutated();
  });
  const isSaving = patchLoadingId === m.id;

  // Casting estendido para electricalData (campos PVSyst)
  const ed = m.electricalData as ModuleEquipment['electricalData'] & {
    technol?: string;
    nCelS?: number;
    nCelP?: number;
    voc?: number;
    isc?: number;
    vmp?: number;
    imp?: number;
    vMaxIEC?: number;
    bifacialityFactor?: number;
    tempCoeffPmax?: number;
    tempCoeffVoc?: number;
    tempCoeffIsc?: number;
    rSerie?: number;
    rShunt?: number;
    lidLoss?: number;
    depth?: number;
    iamPoints?: Array<[number, number]>;
    relEffic?: {
      g800?: number;
      g600?: number;
      g400?: number;
      g200?: number;
    };
  };

  const technolLabel = ed?.technol ? (TECHNOL_LABELS[ed.technol] ?? ed.technol) : null;

  // Helpers de Formatação (Padrão Backoffice PT-BR)
  const formatN = (val: number | undefined | null, dec = 2) => 
    val != null ? val.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : '—';
  
  const formatP = (val: number | undefined | null) => 
    val != null ? `${(val * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—';

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

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* 1. Identificação e Comercial */}
          <section>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white tracking-tight leading-tight">{m.model}</h2>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">{m.manufacturer}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <TenantStatusBadge status={m.isActive ? 'ACTIVE' : 'BLOCKED'} />
                {m.bifacial && (
                  <div className="rounded-sm bg-sky-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-sky-400 border border-sky-500/20">
                    BIFACIAL
                  </div>
                )}
                {ed?.bankability && (
                  <div className={`flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[9px] font-bold tracking-wider border ${
                    ed.bankability === 'BANKABLE'   ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    ed.bankability === 'ACCEPTABLE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                      'bg-red-500/10 text-red-400 border-red-500/20'
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

          {/* Alertas Técnicos */}
          {ed?.validation && ed.validation.length > 0 && (
            <section className="rounded-sm border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="mb-2.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-500">
                <AlertTriangle className="h-3.5 w-3.5" /> Alertas Técnicos (.PAN)
              </div>
              <div className="space-y-2">
                {ed.validation.map((v, i) => (
                  <div key={i} className="flex gap-2.5 text-[11px] leading-relaxed text-slate-400">
                    <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${v.status === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <p>{v.message}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2. Dimensões e Físico */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-sky-500" />
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Dimensões e Físico</h3>
            </div>
            <div className="rounded-sm border border-slate-800 divide-y divide-slate-800 bg-slate-900/50">
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-[11px] text-slate-400">L x A x P</span>
                {isEditing ? (
                  <input
                    value={formData.dimensions}
                    onChange={e => setFormData(s => ({ ...s, dimensions: e.target.value }))}
                    className="h-6 w-32 bg-slate-950 border border-slate-700 rounded-sm px-2 text-[11px] font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                    placeholder="L x A x P"
                  />
                ) : (
                  <span className="text-[11px] font-mono text-slate-200 tabular-nums">
                    {m.dimensions || '—'}{ (m.depth || ed?.depth) ? ` x ${m.depth || ed?.depth} m` : ''}
                  </span>
                )}
              </div>
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-[11px] text-slate-400">Peso Total</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={e => setFormData(s => ({ ...s, weight: e.target.value }))}
                    className="h-6 w-24 bg-slate-950 border border-slate-700 rounded-sm px-2 text-[11px] font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                ) : (
                  <span className="text-[11px] font-mono text-slate-200 tabular-nums">{m.weight ? `${m.weight.toLocaleString('pt-BR')} kg` : '—'}</span>
                )}
              </div>
              <div className="flex justify-between px-3 py-2.5 bg-slate-900/30">
                <span className="text-[11px] text-slate-400">Tecnologia</span>
                <span className="text-[11px] font-mono text-slate-200 text-right">{technolLabel || '—'}</span>
              </div>
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-[11px] text-slate-400">Arranjo Células</span>
                <span className="text-[11px] font-mono text-slate-200 tabular-nums">
                  {ed?.nCelS && ed?.nCelP ? `${ed.nCelS} série x ${ed.nCelP} paral.` : ed?.nCelS || '—'}
                  {m.cellSizeClass ? ` (${m.cellSizeClass})` : ''}
                </span>
              </div>
            </div>
          </section>

          {/* 3. Performance STC */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-emerald-500" />
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Performance STC (1000W/m²)</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-px bg-slate-800 rounded-sm overflow-hidden border border-slate-800 shadow-inner">
              <div className="bg-slate-900 p-3">
                <p className="text-[10px] text-slate-500 mb-1">Potência Nominal</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.powerWp}
                    onChange={e => setFormData(s => ({ ...s, powerWp: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-sm font-mono text-emerald-400 focus:border-sky-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-mono font-bold text-emerald-400 tabular-nums">{formatN(m.powerWp, 1)} Wp</p>
                )}
              </div>
              <div className="bg-slate-900 p-3">
                <p className="text-[10px] text-slate-500 mb-1">Eficiência</p>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={formData.efficiency}
                    onChange={e => setFormData(s => ({ ...s, efficiency: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-sm font-mono text-emerald-400 focus:border-sky-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
                    {m.efficiency ? `${Number(m.efficiency).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%` : '—'}
                  </p>
                )}
              </div>
              <div className="bg-slate-900 p-3">
                <p className="text-[10px] text-slate-500 mb-1 truncate">Tensão Voc</p>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.1"
                    value={formData.voc}
                    onChange={e => setFormData(s => ({ ...s, voc: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-mono text-slate-200 tabular-nums">{formatN(ed?.voc, 2)} V</p>
                )}
              </div>
              <div className="bg-slate-900 p-3">
                <p className="text-[10px] text-slate-500 mb-1 truncate">Corrente Isc</p>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.1"
                    value={formData.isc}
                    onChange={e => setFormData(s => ({ ...s, isc: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-mono text-slate-200 tabular-nums">{formatN(ed?.isc, 2)} A</p>
                )}
              </div>
              <div className="bg-slate-900 p-3">
                <p className="text-[10px] text-slate-500 mb-1 truncate">Tensão Vmp</p>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.1"
                    value={formData.vmp}
                    onChange={e => setFormData(s => ({ ...s, vmp: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-mono text-slate-200 tabular-nums">{formatN(ed?.vmp, 2)} V</p>
                )}
              </div>
              <div className="bg-slate-900 p-3">
                <p className="text-[10px] text-slate-500 mb-1 truncate">Corrente Imp</p>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.1"
                    value={formData.imp}
                    onChange={e => setFormData(s => ({ ...s, imp: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-mono text-slate-200 tabular-nums">{formatN(ed?.imp, 2)} A</p>
                )}
              </div>
            </div>
          </section>

          {/* 4. Coeficientes de Temperatura */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Thermometer className="h-3.5 w-3.5 text-amber-500" />
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Comportamento Térmico</h3>
            </div>
            <div className="rounded-sm border border-slate-800 divide-y divide-slate-800 bg-slate-900/50">
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-[11px] text-slate-400">Coef. de Potência (muPmp)</span>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.001"
                    value={formData.tempCoeffPmax}
                    onChange={e => setFormData(s => ({ ...s, tempCoeffPmax: e.target.value }))}
                    className="h-6 w-24 bg-slate-950 border border-slate-700 rounded-sm px-2 text-[11px] font-mono text-amber-400 focus:border-sky-500 focus:outline-none"
                  />
                ) : (
                  <span className="text-[11px] font-mono text-amber-400 tabular-nums">
                    {formatN(m.tempCoeffPmax ?? ed?.tempCoeffPmax, 3)} %/°C
                  </span>
                )}
              </div>
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-[11px] text-slate-400">Coef. de Tensão (muVoc)</span>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.001"
                    value={formData.tempCoeffVoc}
                    onChange={e => setFormData(s => ({ ...s, tempCoeffVoc: e.target.value }))}
                    className="h-6 w-24 bg-slate-950 border border-slate-700 rounded-sm px-2 text-[11px] font-mono text-amber-400 focus:border-sky-500 focus:outline-none"
                  />
                ) : (
                  <span className="text-[11px] font-mono text-amber-400 tabular-nums">
                    {formatN(m.tempCoeffVoc ?? ed?.tempCoeffVoc, 3)} %/°C
                  </span>
                )}
              </div>
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-[11px] text-slate-400">Coef. de Corrente (muIsc)</span>
                <span className="text-[11px] font-mono text-amber-400 tabular-nums">
                  {formatN(ed?.tempCoeffIsc, 3)} %/°C
                </span>
              </div>
              <div className="flex justify-between px-3 py-2.5 bg-slate-900/30">
                <span className="text-[11px] text-slate-400">NOCT / NMOT</span>
                <span className="text-[11px] font-mono text-slate-200 tabular-nums">{m.noct ? `${m.noct} °C` : '—'}</span>
              </div>
            </div>
          </section>

          {/* 5. Eficiência em Baixa Irradiação */}
          {ed?.relEffic && (ed.relEffic.g800 || ed.relEffic.g200) && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Eficiência em Baixa Irradiação</h3>
              </div>
              <div className="grid grid-cols-4 gap-px bg-slate-800 rounded-sm overflow-hidden border border-slate-800 shadow-inner">
                <div className="bg-slate-900/50 p-2 text-center">
                  <p className="text-[9px] text-slate-500 mb-0.5">800W/m²</p>
                  <p className={`text-[11px] font-mono tabular-nums ${ed.relEffic.g800 && ed.relEffic.g800 > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {ed.relEffic.g800 != null ? `${ed.relEffic.g800 > 0 ? '+' : ''}${ed.relEffic.g800.toFixed(2)}%` : '—'}
                  </p>
                </div>
                <div className="bg-slate-900/50 p-2 text-center">
                  <p className="text-[9px] text-slate-500 mb-0.5">600W/m²</p>
                  <p className={`text-[11px] font-mono tabular-nums ${ed.relEffic.g600 && ed.relEffic.g600 > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {ed.relEffic.g600 != null ? `${ed.relEffic.g600 > 0 ? '+' : ''}${ed.relEffic.g600.toFixed(2)}%` : '—'}
                  </p>
                </div>
                <div className="bg-slate-900/50 p-2 text-center">
                  <p className="text-[9px] text-slate-500 mb-0.5">400W/m²</p>
                  <p className={`text-[11px] font-mono tabular-nums ${ed.relEffic.g400 && ed.relEffic.g400 > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {ed.relEffic.g400 != null ? `${ed.relEffic.g400 > 0 ? '+' : ''}${ed.relEffic.g400.toFixed(2)}%` : '—'}
                  </p>
                </div>
                <div className="bg-slate-900/50 p-2 text-center">
                  <p className="text-[9px] text-slate-500 mb-0.5">200W/m²</p>
                  <p className={`text-[11px] font-mono tabular-nums ${ed.relEffic.g200 && ed.relEffic.g200 > 0 ? 'text-emerald-400' : 'text-red-400/80'}`}>
                    {ed.relEffic.g200 != null ? `${ed.relEffic.g200 > 0 ? '+' : ''}${ed.relEffic.g200.toFixed(2)}%` : '—'}
                  </p>
                </div>
              </div>
              <p className="text-[9px] text-slate-600 italic">Delta de eficiência relativa em relação ao STC.</p>
            </section>
          )}

          {/* 6. Engenharia e Modelagem */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Engenharia e Modelagem</h3>
            </div>
            <div className="rounded-sm border border-slate-800 divide-y divide-slate-800 bg-slate-900/50">
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-[11px] text-slate-400">Fator de Bifacialidade</span>
                <span className="text-[11px] font-mono text-emerald-400 tabular-nums">{formatP(ed?.bifacialityFactor)}</span>
              </div>
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-[11px] text-slate-400">Resistência Série (RSerie)</span>
                <span className="text-[11px] font-mono text-slate-300 tabular-nums">{formatN(ed?.rSerie, 4)} Ω</span>
              </div>
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-[11px] text-slate-400">Resistência Shunt (RShunt)</span>
                <span className="text-[11px] font-mono text-slate-300 tabular-nums">{formatN(ed?.rShunt, 1)} Ω</span>
              </div>
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-[11px] text-slate-400">Símbolo Unifilar</span>
                <span className="text-[11px] font-mono text-slate-400 italic">{m.unifilarSymbolRef || 'solar-panel-default'}</span>
              </div>
              <div className="flex justify-between px-3 py-2.5 bg-slate-900/30">
                <span className="text-[11px] text-slate-400">Tensão Máx. Sistema (IEC)</span>
                <span className="text-[11px] font-mono text-slate-200 tabular-nums">{ed?.vMaxIEC ? `${ed.vMaxIEC} V` : '—'}</span>
              </div>
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-[11px] text-slate-400">Degradação Anual (Calculada)</span>
                <span className="text-[11px] font-mono text-red-400/80 tabular-nums">{formatP(m.degradacaoAnual)} / ano</span>
              </div>
              {ed?.lidLoss != null && (
                <div className="flex justify-between px-3 py-2.5 bg-slate-900/30">
                  <span className="text-[11px] text-slate-400">LID Loss (STC)</span>
                  <span className="text-[11px] font-mono text-red-400/80 tabular-nums">{formatN(ed.lidLoss, 2)}%</span>
                </div>
              )}
            </div>
          </section>

          {/* 6. Perfil de Ângulo (IAM) */}
          {ed?.iamPoints && ed.iamPoints.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-sky-500 rotate-90" />
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Perfil de Ângulo (IAM)</h3>
              </div>
              <div className="rounded-sm border border-slate-800 bg-slate-900/30 p-2 overflow-hidden">
                <div className="grid grid-cols-5 gap-1">
                  {ed.iamPoints.slice(0, 10).map(([angle, factor], idx) => (
                    <div key={idx} className="flex flex-col items-center p-1 border border-slate-800 rounded-sm bg-slate-900/50">
                      <span className="text-[9px] text-slate-500">{angle}°</span>
                      <span className="text-[10px] font-mono text-slate-300">{factor.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[9px] text-slate-600 text-center italic">Perfil de incidência óptica (Transmission Factor)</p>
              </div>
            </section>
          )}
        </div>

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
                    powerWp: Number(formData.powerWp) || m.powerWp,
                    efficiency: formData.efficiency ? Number(formData.efficiency) : null,
                    dimensions: formData.dimensions || null,
                    weight: formData.weight ? Number(formData.weight) : null,
                    tempCoeffPmax: formData.tempCoeffPmax ? Number(formData.tempCoeffPmax) : null,
                    tempCoeffVoc: formData.tempCoeffVoc ? Number(formData.tempCoeffVoc) : null,
                  };

                  // Merge e Sincronização de Dados de Engenharia
                  const currentED = (m.electricalData as any) || {};
                  const updatedED = mergeTechnicalData(currentED, {
                    voc: formData.voc ? Number(formData.voc) : currentED.voc,
                    isc: formData.isc ? Number(formData.isc) : currentED.isc,
                    vmp: formData.vmp ? Number(formData.vmp) : currentED.vmp,
                    imp: formData.imp ? Number(formData.imp) : currentED.imp,
                    tempCoeffVoc: payload.tempCoeffVoc,
                    tempCoeffPmax: payload.tempCoeffPmax,
                  });

                  payload.electricalData = syncModuleData(payload, updatedED);
                  
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
              className="flex w-full items-center justify-between rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors shadow-sm"
            >
              <span>Editar Parâmetros</span>
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={() => toggle(m.id, !m.isActive)}
            disabled={loading || isEditing}
            className={`flex w-full items-center justify-between rounded-sm border px-3 py-2 text-xs transition-all disabled:opacity-50 ${
              m.isActive
                ? 'border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 active:scale-[0.98]'
                : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 active:scale-[0.98]'
            }`}
          >
            <span>{loading ? 'Processando...' : m.isActive ? 'Desativar Módulo no Catálogo' : 'Ativar Módulo no Catálogo'}</span>
            <Zap className="h-3.5 w-3.5" />
          </button>

          {!isEditing && (
            <button
              onClick={() => remove(m.id)}
              disabled={isDeleting || loading}
              className="flex w-full items-center justify-between rounded-sm border border-transparent px-3 py-2 text-xs font-medium text-slate-600 hover:bg-red-500/10 hover:text-red-500 transition-all opacity-40 hover:opacity-100"
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
