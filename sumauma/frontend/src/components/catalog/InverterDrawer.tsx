import { useState } from 'react';
import {
  Cpu, ChevronLeft, Save, Loader2, Edit2, Maximize2,
  Info, ArrowDownToLine, ArrowUpFromLine, Layers,
  AlertCircle, ShieldCheck, XCircle, X
} from 'lucide-react';
import { usePatchEquipment } from '@/hooks/usePatchEquipment';
import type { InverterEquipment } from '@/hooks/useCatalog';
import TenantStatusBadge from '@/components/tenants/TenantStatusBadge';
import ParametricSymbolBuilder from './ParametricSymbolBuilder';
import BlockDiagramFootprintBuilder from './BlockDiagramFootprintBuilder';
import ParametricSymbolPreview from './ParametricSymbolPreview';

interface InverterDrawerProps {
  inverterEquipment: InverterEquipment;
  onClose: () => void;
  onMutated: () => void;
}

// ── Payload de specs (reutilizado nas duas rotas de save) ────────────────────
function buildSpecsPayload(formData: any, electricalData: any) {
  return {
    manufacturer: formData.manufacturer,
    model: formData.model,
    nominalPowerW: formData.nominalPowerW ? Number(formData.nominalPowerW) : null,
    maxInputV: formData.maxInputV ? Number(formData.maxInputV) : null,
    mpptCount: formData.mpptCount ? Number(formData.mpptCount) : null,
    efficiency: formData.efficiency ? Number(formData.efficiency) : null,
    width: formData.width ? Number(formData.width) : null,
    height: formData.height ? Number(formData.height) : null,
    depth: formData.depth ? Number(formData.depth) : null,
    weight: formData.weight ? Number(formData.weight) : null,
    Voc_max_hardware: formData.Voc_max_hardware ? Number(formData.Voc_max_hardware) : null,
    Isc_max_hardware: formData.Isc_max_hardware ? Number(formData.Isc_max_hardware) : null,
    coolingType: formData.coolingType,
    afci: formData.afci,
    rsd: formData.rsd,
    portaria515Compliant: formData.portaria515Compliant,
    electricalData: {
      ...(electricalData || {}),
      vMinMpp: formData.vMinMpp ? Number(formData.vMinMpp) : null,
      vMaxMpp: formData.vMaxMpp ? Number(formData.vMaxMpp) : null,
      iMaxDC: formData.iMaxDC ? Number(formData.iMaxDC) : null,
    },
  };
}

// ── Validação do workspace CAD antes do PATCH ─────────────────────────────────
function validateCadData(symbolConfig: any, blockDiagramFootprint: any): string[] {
  const errors: string[] = [];

  // — Símbolo Unifilar (ParametricSymbolConfig) ————————————————————
  if (!symbolConfig) {
    errors.push('Símbolo unifilar não configurado — abra o painel e configure ao menos 1 canal MPPT.');
  } else {
    if (symbolConfig.type !== 'parametric-block') {
      errors.push('Símbolo unifilar com tipo inválido (esperado "parametric-block").');
    }
    if (!symbolConfig.dimensions?.width || symbolConfig.dimensions.width <= 0) {
      errors.push('Símbolo: largura do bloco deve ser maior que zero.');
    }
    if (!symbolConfig.dimensions?.height || symbolConfig.dimensions.height <= 0) {
      errors.push('Símbolo: altura do bloco deve ser maior que zero.');
    }
    const ports: Record<string, unknown> = symbolConfig.ports ?? {};
    const hasMppt = Object.keys(ports).some((k) => k.startsWith('mppt_') && k.endsWith('_pos'));
    if (!hasMppt) {
      errors.push('Símbolo: nenhum canal MPPT configurado — adicione ao menos 1 par de pinos CC.');
    }
    if (!ports['ac_out']) {
      errors.push('Símbolo: porta de saída CA (ac_out) ausente.');
    }
  }

  // — Footprint de Blocos (BlockDiagramFootprint) ——————————————————
  if (!blockDiagramFootprint) {
    errors.push('Footprint de hardware não configurado — abra o painel e defina os canais MPPT.');
  } else {
    const channels: any[] = blockDiagramFootprint.mpptChannels ?? [];
    if (channels.length === 0) {
      errors.push('Footprint: nenhum canal MPPT definido.');
    } else {
      channels.forEach((ch) => {
        if (!ch.inputCount || ch.inputCount < 1) {
          errors.push(`Footprint MPPT ${ch.mpptIndex ?? '?'}: número de entradas físicas deve ser ≥ 1.`);
        }
      });
    }
    const phase = blockDiagramFootprint.acOutput?.phase;
    if (!blockDiagramFootprint.acOutput?.label?.trim()) {
      errors.push('Footprint: label da saída CA está vazio.');
    }
    if (phase !== 'mono' && phase !== 'tri') {
      errors.push('Footprint: fase da saída CA inválida — selecione "mono" ou "tri".');
    }
  }

  return errors;
}

export default function InverterDrawer({ inverterEquipment: m, onClose, onMutated }: InverterDrawerProps) {
  const { mutate: patch, loadingId } = usePatchEquipment('/catalog/inverters', onMutated);
  const isSaving = !!loadingId;
  
  const [editMode, setEditMode] = useState<'none' | 'specs' | 'cad-workspace'>('none');
  const [cadErrors, setCadErrors] = useState<string[]>([]);
  
  // Inicializa formData achatando o electricalData para facilitar o binding nos inputs
  const [formData, setFormData] = useState({
    ...m,
    vMinMpp: m.electricalData?.vMinMpp || '',
    vMaxMpp: m.electricalData?.vMaxMpp || '',
    iMaxDC: m.electricalData?.iMaxDC || '',
  });

  const formatW = (w: number | undefined | null) => w ? `${(w / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kW` : '—';
  const formatV = (v: number | undefined | null) => v ? `${v.toLocaleString('pt-BR')} V` : '—';
  
  const formatEff = (eff: number | undefined | null) => {
    if (eff == null) return '—';
    const val = eff <= 1 ? eff * 100 : eff;
    return `${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%`;
  };

  const ed = m as any;

  return (
    <div className="w-full flex flex-col bg-slate-950 border border-slate-800 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 min-h-[85vh]">
      
      {/* COMPACT HEADER - COCKPIT STYLE */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-6">
          <button 
            onClick={onClose} 
            className="group flex items-center gap-2 px-3 py-1.5 rounded border border-slate-800 bg-slate-900/50 text-[10px] font-black text-slate-500 hover:text-sky-400 hover:border-sky-500/30 transition-all uppercase tracking-widest"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Catálogo
          </button>

          <div className="h-px w-8 bg-slate-800" />

          <div className="flex items-center gap-4">
            <div className="h-10 w-10 flex items-center justify-center bg-sky-500/10 rounded border border-sky-500/20 shadow-[0_0_15px_-5px_rgba(14,165,233,0.3)]">
              <Cpu className="h-6 w-6 text-sky-400" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-100 tracking-tight">{m.model}</h2>
                <div className="flex gap-1">
                  {m.portaria515Compliant && <div className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase tracking-tighter">INMETRO 515</div>}
                  {ed?.bankability === 'BANKABLE' && <div className="px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-[8px] font-black text-sky-400 uppercase flex items-center gap-1 tracking-tighter"><ShieldCheck className="h-3 w-3" /> BANKABLE</div>}
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{m.manufacturer} • FICHA TÉCNICA v6.0</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <TenantStatusBadge status={m.isActive ? 'ACTIVE' : 'BLOCKED'} />
          <div className="h-8 w-px bg-slate-800 mx-2" />
          <div className="flex flex-col items-end">
             <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">ID do Equipamento</span>
             <span className="text-[10px] font-mono text-slate-400">{m.id.slice(0, 8)}...</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-slate-950/40 scrollbar-thin scrollbar-thumb-slate-800">
        
        {/* VIEW MODE: DETALHES RÁPIDOS */}
        {editMode === 'none' ? (
          <div className="p-8 animate-in fade-in zoom-in-95 duration-500">
            {/* GRID DE CARDS TÉCNICOS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              
              {/* CARD 1: SÍMBOLO UNIFILAR */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Símbolo Unifilar (IEC)</p>
                  <button onClick={() => setEditMode('cad-workspace')} className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-500 hover:text-sky-400 transition-colors">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="h-48 flex items-center justify-center bg-slate-900/20 rounded-lg border border-slate-800/40 p-6 relative group overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   {m.symbolConfig ? (
                     <ParametricSymbolPreview config={m.symbolConfig} className="h-full w-full" />
                   ) : (
                     <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-slate-700" />
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">Símbolo não configurado</p>
                     </div>
                   )}
                </div>
              </div>

              {/* CARD 2: DIAGRAMA DE HARDWARE */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Footprint de Hardware (L2)</p>
                  <button onClick={() => setEditMode('cad-workspace')} className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-500 hover:text-sky-400 transition-colors">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="h-48 flex items-center justify-center bg-slate-900/20 rounded-lg border border-slate-800/40 p-6 relative group overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   {m.blockDiagramFootprint ? (
                     <div className="flex flex-col items-center gap-4 scale-90">
                       <svg viewBox="0 0 120 60" className="h-full w-32 overflow-visible">
                          <rect x="2" y="2" width="78" height="28" rx="1" fill="black" opacity="0.2" />
                          <rect x="0" y="0" width="78" height="28" rx="1" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                          <line x1="0" y1="28" x2="78" y2="0" stroke="#334155" strokeWidth="0.5" opacity="0.4" />
                          <text x="39" y="14" textAnchor="middle" fontSize={5} fill="#475569" fontWeight="bold">L2 ENGINE</text>
                       </svg>
                       <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                             <span className="text-[8px] text-slate-600 font-black uppercase">MPPTs</span>
                             <span className="text-[10px] font-mono text-slate-400 font-bold">{m.blockDiagramFootprint.mpptChannels.length}</span>
                          </div>
                          <div className="h-6 w-px bg-slate-800" />
                          <div className="flex flex-col items-center">
                             <span className="text-[8px] text-slate-600 font-black uppercase">Saída</span>
                             <span className="text-[10px] font-mono text-emerald-500 font-bold">{m.blockDiagramFootprint.acOutput.phase === 'tri' ? 'TRI' : 'MONO'}</span>
                          </div>
                       </div>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-slate-700" />
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">Hardware não definido</p>
                     </div>
                   )}
                </div>
              </div>

              {/* CARD 3: STATUS & MÉTRICAS NOMINAIS */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Métricas Nominais (STC)</p>
                <div className="bg-slate-900/20 rounded-lg border border-slate-800/40 p-6 grid grid-cols-2 gap-y-6 gap-x-4 h-48">
                   <div className="flex flex-col gap-1">
                      <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Potência Nominal</span>
                      <span className="text-sm font-black text-emerald-400 font-mono tracking-tighter">{formatW(m.nominalPowerW)}</span>
                   </div>
                   <div className="flex flex-col gap-1">
                      <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Eficiência</span>
                      <span className="text-sm font-black text-amber-400 font-mono tracking-tighter">{formatEff(m.efficiency)}</span>
                   </div>
                   <div className="flex flex-col gap-1">
                      <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Tensão Máxima</span>
                      <span className="text-sm font-black text-red-400 font-mono tracking-tighter">{formatV(m.maxInputV)}</span>
                   </div>
                   <div className="flex flex-col gap-1">
                      <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Canais MPPT</span>
                      <span className="text-sm font-black text-sky-400 font-mono tracking-tighter">{m.mpptCount || '—'}</span>
                   </div>
                </div>
              </div>

            </div>

            {/* BARRA DE AÇÕES INFERIOR */}
            <div className="mt-8 flex items-center justify-between border-t border-slate-800/60 pt-6">
              <div className="flex gap-4">
                 <div className="flex flex-col">
                    <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Data de Criação</span>
                    <span className="text-[10px] text-slate-400 font-medium">{m.createdAt ? new Date(m.createdAt).toLocaleDateString('pt-BR') : '—'}</span>
                 </div>
                 <div className="h-8 w-px bg-slate-800" />
                 <div className="flex flex-col">
                    <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Última Revisão</span>
                    <span className="text-[10px] text-slate-400 font-medium">v6.0.3-stable</span>
                 </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditMode('specs')} className="flex items-center gap-2 px-6 py-2 rounded bg-slate-900 border border-slate-700 text-[10px] font-black text-slate-300 hover:bg-slate-800 hover:border-slate-500 transition-all uppercase tracking-widest">
                  <Edit2 className="h-3.5 w-3.5" />
                  Editar Parâmetros
                </button>
                <button onClick={() => setEditMode('cad-workspace')} className="flex items-center gap-2 px-6 py-2 rounded bg-sky-600 text-[10px] font-black text-white hover:bg-sky-500 transition-all uppercase tracking-widest shadow-lg shadow-sky-900/40">
                  <Layers className="h-3.5 w-3.5" />
                  Abrir Workspace CAD
                </button>
              </div>
            </div>
          </div>
        ) : editMode === 'specs' ? (
          <div className="p-8 animate-in slide-in-from-right-4 duration-300">
            {/* Header de Edição */}
            <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-sky-500/10 rounded flex items-center justify-center border border-sky-500/20">
                  <Edit2 className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">Edição de Ficha Técnica</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Instrumentação e Parâmetros Nominais</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditMode('none')} className="px-6 py-2 rounded border border-slate-800 text-[10px] font-black text-slate-500 hover:text-slate-200 transition-colors uppercase tracking-widest">Descartar</button>
                <button
                  onClick={async () => {
                    await patch(m.id, buildSpecsPayload(formData, m.electricalData));
                    setEditMode('none');
                  }}
                  disabled={isSaving}
                  className="px-8 py-2 rounded bg-sky-600 text-[10px] font-black text-white hover:bg-sky-500 transition-colors uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-sky-900/20"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar Alterações
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <Info className="h-4 w-4 text-slate-400" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação & Compliance</h4>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Fabricante</label>
                    <input type="text" value={formData.manufacturer} onChange={e => setFormData({ ...formData, manufacturer: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 focus:border-sky-500/50 outline-none transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Modelo</label>
                    <input type="text" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 focus:border-sky-500/50 outline-none transition-colors" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 pt-2">
                  {[
                    { id: 'p515', label: 'Inmetro 515', key: 'portaria515Compliant' },
                    { id: 'afci', label: 'Proteção AFCI', key: 'afci' },
                    { id: 'rsd', label: 'Rapid Shutdown', key: 'rsd' },
                  ].map(opt => (
                    <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={(formData as any)[opt.key]} 
                        onChange={e => setFormData({ ...formData, [opt.key]: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0 focus:ring-offset-0 transition-colors"
                      />
                      <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* QUADRANTE 2: Entrada CC (DC Side) */}
              <div className="bg-slate-900/20 border border-sky-500/10 rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-sky-500/10 pb-4">
                  <ArrowDownToLine className="h-4 w-4 text-sky-400" />
                  <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Parâmetros de Entrada CC (DC)</h4>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Tensão Máx (Voc)</label>
                    <div className="relative">
                      <input type="number" value={formData.maxInputV || ''} onChange={e => setFormData({ ...formData, maxInputV: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded pl-3 pr-8 py-2 text-xs font-mono text-red-400 focus:border-red-500/50 outline-none transition-colors" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 font-black">V</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Qtd MPPT</label>
                    <input type="number" value={formData.mpptCount || ''} onChange={e => setFormData({ ...formData, mpptCount: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-sky-400 focus:border-sky-500/50 outline-none transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Isc Máx</label>
                    <div className="relative">
                      <input type="number" value={formData.Isc_max_hardware || ''} onChange={e => setFormData({ ...formData, Isc_max_hardware: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded pl-3 pr-8 py-2 text-xs font-mono text-slate-200 focus:border-sky-500/50 outline-none transition-colors" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 font-black">A</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QUADRANTE 3: Saída CA (AC Side) */}
              <div className="bg-slate-900/20 border border-emerald-500/10 rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-emerald-500/10 pb-4">
                  <ArrowUpFromLine className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Parâmetros de Saída CA (AC)</h4>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Potência Nominal (Pn)</label>
                    <div className="relative">
                      <input type="number" value={formData.nominalPowerW || ''} onChange={e => setFormData({ ...formData, nominalPowerW: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded pl-3 pr-8 py-2 text-xs font-mono text-emerald-400 focus:border-emerald-500/50 outline-none transition-colors" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 font-black">W</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Eficiência Máx</label>
                    <div className="relative">
                      <input type="number" step="0.01" value={formData.efficiency || ''} onChange={e => setFormData({ ...formData, efficiency: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded pl-3 pr-8 py-2 text-xs font-mono text-amber-400 focus:border-amber-500/50 outline-none transition-colors" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 font-black">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QUADRANTE 4: Mecânica & Físico */}
              <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <Maximize2 className="h-4 w-4 text-slate-400" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Físico & Mecânica</h4>
                </div>
                <div className="grid grid-cols-4 gap-4">
                   {[
                     { label: 'Larg (mm)', key: 'width' },
                     { label: 'Alt (mm)', key: 'height' },
                     { label: 'Prof (mm)', key: 'depth' },
                     { label: 'Peso (kg)', key: 'weight' },
                   ].map(field => (
                     <div key={field.key} className="space-y-1">
                        <label className="text-[7px] text-slate-500 uppercase font-black tracking-tighter">{field.label}</label>
                        <input type="number" value={(formData as any)[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono text-slate-300 outline-none focus:border-sky-500/30" />
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ── Workspace Toolbar ──────────────────────────────────────── */}
            <div className="border-b border-slate-800/40 bg-slate-950 shadow-2xl z-10">
              <div className="px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-12">
                   <div className="flex flex-col">
                      <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Potência (Pn)</span>
                      <span className="text-sm font-black text-emerald-400 font-mono tabular-nums">{formatW(m.nominalPowerW)}</span>
                   </div>
                   <div className="h-8 w-px bg-slate-800/50" />
                   <div className="flex flex-col">
                      <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Tensão Máx</span>
                      <span className="text-sm font-black text-red-400 font-mono tabular-nums">{formatV(m.maxInputV)}</span>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   {/* Indicador silencioso de erros CAD */}
                   {cadErrors.length > 0 && (
                     <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-950/60 border border-red-500/30">
                       <XCircle className="h-3 w-3 text-red-400 shrink-0" />
                       <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">
                         {cadErrors.length} erro{cadErrors.length > 1 ? 's' : ''}
                       </span>
                     </div>
                   )}
                   <button
                     onClick={() => { setCadErrors([]); setEditMode('none'); }}
                     className="px-5 py-2 rounded bg-slate-900 border border-slate-700 text-[10px] font-black text-slate-400 hover:text-slate-100 transition-all uppercase tracking-widest"
                   >
                     Sair do Workspace
                   </button>
                   <button
                     disabled={isSaving}
                     onClick={async () => {
                       const errors = validateCadData(formData.symbolConfig, formData.blockDiagramFootprint);
                       if (errors.length > 0) {
                         setCadErrors(errors);
                         return;
                       }
                       setCadErrors([]);
                       // Save unificado: specs + CAD em um único PATCH
                       await patch(m.id, {
                         ...buildSpecsPayload(formData, m.electricalData),
                         symbolConfig: formData.symbolConfig ?? undefined,
                         blockDiagramFootprint: formData.blockDiagramFootprint ?? null,
                       });
                       setEditMode('none');
                     }}
                     className="px-8 py-2 rounded bg-emerald-600 text-[10px] font-black text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest shadow-lg shadow-emerald-900/40 flex items-center gap-2"
                     title="Salva specs + símbolo unifilar + footprint em um único PATCH"
                   >
                     {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                     Salvar Tudo
                   </button>
                </div>
              </div>

              {/* ── Banner de Erros de Validação ──────────────────────── */}
              {cadErrors.length > 0 && (
                <div className="mx-8 mb-4 rounded-lg border border-red-500/25 bg-red-950/30 px-4 py-3 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="space-y-1 min-w-0">
                        <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">
                          Corrija os erros antes de salvar
                        </p>
                        <ul className="space-y-0.5">
                          {cadErrors.map((err, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-red-600 mt-px shrink-0 text-[10px]">•</span>
                              <span className="text-[10px] text-red-300/80 font-mono leading-relaxed">{err}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <button
                      onClick={() => setCadErrors([])}
                      className="shrink-0 text-red-600 hover:text-red-400 transition-colors"
                      title="Fechar"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-800">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <ParametricSymbolBuilder
                  initialConfig={formData.symbolConfig ?? null}
                  onChange={(config) => {
                    setCadErrors([]);
                    setFormData(prev => ({ ...prev, symbolConfig: config ?? undefined }));
                  }}
                />
                <BlockDiagramFootprintBuilder
                  initialFootprint={formData.blockDiagramFootprint ?? null}
                  inverterId={m.id}
                  onChange={(fp) => {
                    setCadErrors([]);
                    setFormData(prev => ({ ...prev, blockDiagramFootprint: fp }));
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
