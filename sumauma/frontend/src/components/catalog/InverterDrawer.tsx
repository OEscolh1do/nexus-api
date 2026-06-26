import { useState } from 'react';
import {
  Cpu, ChevronLeft, Save, Loader2, Edit2, Maximize2,
  Info, ArrowDownToLine, ArrowUpFromLine, Layers,
  ShieldCheck, GitFork,
} from 'lucide-react';
import { usePatchEquipment } from '@/hooks/usePatchEquipment';
import type { InverterEquipment } from '@/hooks/useCatalog';
import type { TopologyConfig } from '@/lib/types/topology';
import { extractBlockDiagramFootprint } from '@/lib/types/topology';
import TenantStatusBadge from '@/components/tenants/TenantStatusBadge';
import TopologyEditor from '@/components/topology/TopologyEditor';

type InverterFormData = Pick<InverterEquipment,
  | 'manufacturer' | 'model' | 'nominalPowerW' | 'maxInputV' | 'mpptCount' | 'efficiency'
  | 'width' | 'height' | 'depth' | 'weight' | 'Voc_max_hardware' | 'Isc_max_hardware'
  | 'coolingType' | 'afci' | 'rsd' | 'portaria515Compliant'
> & {
  vMinMpp: number | string;
  vMaxMpp: number | string;
  iMaxDC: number | string;
};

interface InverterDrawerProps {
  inverterEquipment: InverterEquipment;
  onClose: () => void;
  onMutated: () => void;
}

// ── Payload de specs ─────────────────────────────────────────────────────────
function buildSpecsPayload(formData: InverterFormData, electricalData: InverterEquipment['electricalData']) {
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

// ── Topology node count summary ───────────────────────────────────────────────
function TopologySummary({ config }: { config: TopologyConfig }) {
  const inverterNode = config.nodes.find(n => n.kind === 'inverter');
  const mpptCount    = config.nodes.filter(n => n.kind === 'mppt-input').length;
  const stringCount  = config.nodes.filter(n => n.kind === 'pv-string').length;
  const phase = inverterNode?.data.phase === 'tri' ? 'TRI' : 'MONO';

  return (
    <div className="flex gap-6">
      <div className="flex flex-col items-center">
        <span className="text-[8px] text-slate-600 font-black uppercase">Nós</span>
        <span className="text-[11px] font-mono text-slate-300 font-bold">{config.nodes.length}</span>
      </div>
      <div className="h-6 w-px bg-slate-800" />
      <div className="flex flex-col items-center">
        <span className="text-[8px] text-slate-600 font-black uppercase">MPPTs</span>
        <span className="text-[11px] font-mono text-sky-400 font-bold">{mpptCount || '—'}</span>
      </div>
      <div className="h-6 w-px bg-slate-800" />
      <div className="flex flex-col items-center">
        <span className="text-[8px] text-slate-600 font-black uppercase">Strings</span>
        <span className="text-[11px] font-mono text-amber-400 font-bold">{stringCount || '—'}</span>
      </div>
      <div className="h-6 w-px bg-slate-800" />
      <div className="flex flex-col items-center">
        <span className="text-[8px] text-slate-600 font-black uppercase">Saída</span>
        <span className="text-[11px] font-mono text-emerald-400 font-bold">{phase}</span>
      </div>
    </div>
  );
}

// ── Pure formatters — module-level to avoid recreation on every render ────────

function formatW(w?: number | null): string {
  return w ? `${(w / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kW` : '—';
}

function formatV(v?: number | null): string {
  return v ? `${v.toLocaleString('pt-BR')} V` : '—';
}

function formatEff(eff?: number | null): string {
  if (eff == null) return '—';
  const val = eff <= 1 ? eff * 100 : eff;
  return `${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InverterDrawer({ inverterEquipment: m, onClose, onMutated }: InverterDrawerProps) {
  const { mutate: patch, loadingId } = usePatchEquipment('/catalog/inverters', onMutated);
  const isSaving = loadingId === m.id;

  const [editMode, setEditMode] = useState<'none' | 'specs' | 'topology'>('none');

  const [formData, setFormData] = useState({
    ...m,
    vMinMpp: m.electricalData?.vMinMpp || '',
    vMaxMpp: m.electricalData?.vMaxMpp || '',
    iMaxDC: m.electricalData?.iMaxDC || '',
  });

  // Local topology state — seeded from saved config; persists across tab switches
  const [blockConfig,   setBlockConfig]   = useState<TopologyConfig | null>(m.typologyConfig ?? null);
  const [unifileConfig, setUnifileConfig] = useState<TopologyConfig | null>(null);

  const hasTopology = (blockConfig?.nodes.length ?? 0) > 0;

  return (
    <div className="w-full flex flex-col bg-slate-950 border border-slate-800 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 min-h-[85vh]">

      {/* ── Header ──────────────────────────────────────────────────────── */}
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
                  {m.portaria515Compliant && (
                    <div className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase tracking-tighter">
                      INMETRO 515
                    </div>
                  )}
                  {m.electricalData?.bankability === 'BANKABLE' && (
                    <div className="px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-[8px] font-black text-sky-400 uppercase flex items-center gap-1 tracking-tighter">
                      <ShieldCheck className="h-3 w-3" /> BANKABLE
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                {m.manufacturer} • FICHA TÉCNICA v6.1
              </p>
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

        {/* ── VIEW: Detalhes rápidos ──────────────────────────────────── */}
        {editMode === 'none' && (
          <div className="p-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">

              {/* CARD 1: Topologia */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Topologia FV</p>
                  <button
                    onClick={() => setEditMode('topology')}
                    className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-500 hover:text-violet-400 transition-colors"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="h-48 flex items-center justify-center bg-slate-900/20 rounded-lg border border-slate-800/40 p-6 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {hasTopology ? (
                    <div className="flex flex-col items-center gap-4">
                      <GitFork className="h-8 w-8 text-violet-500 opacity-60" />
                      <TopologySummary config={blockConfig!} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <GitFork className="h-8 w-8 text-slate-700" />
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">
                        Topologia não configurada
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 2: Métricas Nominais */}
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

              {/* CARD 3: Compliance */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Compliance & Features</p>
                <div className="bg-slate-900/20 rounded-lg border border-slate-800/40 p-6 flex flex-col gap-3 h-48 justify-center">
                  {([
                    { label: 'Portaria INMETRO 515', value: m.portaria515Compliant, on: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
                    { label: 'Proteção AFCI',         value: m.afci,                on: 'bg-amber-500/10  border-amber-500/20  text-amber-400'   },
                    { label: 'Rapid Shutdown (RSD)',  value: m.rsd,                 on: 'bg-sky-500/10    border-sky-500/20    text-sky-400'     },
                  ] as const).map(({ label, value, on }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">{label}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                        value ? on : 'bg-slate-800 border-slate-700 text-slate-600'
                      }`}>
                        {value ? 'Sim' : 'Não'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="mt-8 flex items-center justify-between border-t border-slate-800/60 pt-6">
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Data de Criação</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {m.createdAt ? new Date(m.createdAt).toLocaleDateString('pt-BR') : '—'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditMode('specs')}
                  className="flex items-center gap-2 px-6 py-2 rounded bg-slate-900 border border-slate-700 text-[10px] font-black text-slate-300 hover:bg-slate-800 hover:border-slate-500 transition-all uppercase tracking-widest"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Editar Parâmetros
                </button>
                <button
                  onClick={() => setEditMode('topology')}
                  className="flex items-center gap-2 px-6 py-2 rounded bg-violet-700 text-[10px] font-black text-white hover:bg-violet-600 transition-all uppercase tracking-widest shadow-lg shadow-violet-900/40"
                >
                  <Layers className="h-3.5 w-3.5" />
                  {hasTopology ? 'Editar Topologia' : 'Configurar Topologia'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW: Edição de specs ──────────────────────────────────── */}
        {editMode === 'specs' && (
          <div className="p-8 animate-in slide-in-from-right-4 duration-300">
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
                <button
                  onClick={() => setEditMode('none')}
                  className="px-6 py-2 rounded border border-slate-800 text-[10px] font-black text-slate-500 hover:text-slate-200 transition-colors uppercase tracking-widest"
                >
                  Descartar
                </button>
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
              {/* Identificação */}
              <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <Info className="h-4 w-4 text-slate-400" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação & Compliance</h4>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Fabricante</label>
                    <input
                      type="text"
                      value={formData.manufacturer}
                      onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 focus:border-sky-500/50 outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Modelo</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={e => setFormData({ ...formData, model: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 focus:border-sky-500/50 outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 pt-2">
                  {([
                    { label: 'Inmetro 515',        key: 'portaria515Compliant' as const },
                    { label: 'Proteção AFCI',       key: 'afci'                as const },
                    { label: 'Rapid Shutdown',      key: 'rsd'                 as const },
                  ] as const).map(opt => (
                    <label key={opt.key} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData[opt.key] ?? false}
                        onChange={e => setFormData({ ...formData, [opt.key]: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0 focus:ring-offset-0 transition-colors"
                      />
                      <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Entrada CC */}
              <div className="bg-slate-900/20 border border-sky-500/10 rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-sky-500/10 pb-4">
                  <ArrowDownToLine className="h-4 w-4 text-sky-400" />
                  <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Parâmetros de Entrada CC (DC)</h4>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Tensão Máx (Voc)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.maxInputV || ''}
                        onChange={e => setFormData({ ...formData, maxInputV: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded pl-3 pr-8 py-2 text-xs font-mono text-red-400 focus:border-red-500/50 outline-none transition-colors"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 font-black">V</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Qtd MPPT</label>
                    <input
                      type="number"
                      value={formData.mpptCount || ''}
                      onChange={e => setFormData({ ...formData, mpptCount: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-sky-400 focus:border-sky-500/50 outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Isc Máx</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.Isc_max_hardware || ''}
                        onChange={e => setFormData({ ...formData, Isc_max_hardware: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded pl-3 pr-8 py-2 text-xs font-mono text-slate-200 focus:border-sky-500/50 outline-none transition-colors"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 font-black">A</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Saída CA */}
              <div className="bg-slate-900/20 border border-emerald-500/10 rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-emerald-500/10 pb-4">
                  <ArrowUpFromLine className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Parâmetros de Saída CA (AC)</h4>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Potência Nominal (Pn)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.nominalPowerW || ''}
                        onChange={e => setFormData({ ...formData, nominalPowerW: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded pl-3 pr-8 py-2 text-xs font-mono text-emerald-400 focus:border-emerald-500/50 outline-none transition-colors"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 font-black">W</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Eficiência Máx</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.efficiency || ''}
                        onChange={e => setFormData({ ...formData, efficiency: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded pl-3 pr-8 py-2 text-xs font-mono text-amber-400 focus:border-amber-500/50 outline-none transition-colors"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 font-black">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Físico */}
              <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <Maximize2 className="h-4 w-4 text-slate-400" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Físico & Mecânica</h4>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {([
                    { label: 'Larg (mm)', key: 'width'  as const },
                    { label: 'Alt (mm)',  key: 'height' as const },
                    { label: 'Prof (mm)', key: 'depth'  as const },
                    { label: 'Peso (kg)', key: 'weight' as const },
                  ] as const).map(field => (
                    <div key={field.key} className="space-y-1">
                      <label className="text-[7px] text-slate-500 uppercase font-black tracking-tighter">{field.label}</label>
                      <input
                        type="number"
                        value={formData[field.key] || ''}
                        onChange={e => setFormData({ ...formData, [field.key]: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono text-slate-300 outline-none focus:border-sky-500/30"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW: Topology editor ──────────────────────────────────── */}
        {editMode === 'topology' && (
          <div className="flex flex-col h-full min-h-[70vh] animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-950 shrink-0">
              <div className="flex items-center gap-3">
                <GitFork className="h-4 w-4 text-violet-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-300">
                  Editor de Topologia — {m.model}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEditMode('none')}
                  className="px-5 py-2 rounded bg-slate-900 border border-slate-700 text-[10px] font-black text-slate-400 hover:text-slate-100 transition-all uppercase tracking-widest"
                >
                  Descartar
                </button>
                <button
                  disabled={isSaving}
                  onClick={async () => {
                    // Extract blockDiagramFootprint from inverter node in topology
                    const inverterNode = blockConfig?.nodes.find(n => n.kind === 'inverter');
                    const footprint = inverterNode ? extractBlockDiagramFootprint(inverterNode.data) : null;

                    await patch(m.id, {
                      typologyConfig: blockConfig ?? null,
                      unifileConfig: unifileConfig ?? null,
                      blockDiagramFootprint: footprint,
                    });
                    setEditMode('none');
                  }}
                  className="px-8 py-2 rounded bg-violet-600 text-[10px] font-black text-white hover:bg-violet-500 disabled:opacity-50 transition-all uppercase tracking-widest shadow-lg shadow-violet-900/40 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Salvar Topologia
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 min-h-0">
              <TopologyEditor
                blockConfig={blockConfig}
                unifileConfig={unifileConfig}
                onBlockChange={setBlockConfig}
                onUnifileChange={setUnifileConfig}
                initialView="block"
                className="h-full"
              />
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
