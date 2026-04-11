import React, { useMemo } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '../../../store/useTechStore';
import { CRESESB_DB } from '@/data/irradiation/cresesbData';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import { BarChart3, Sun, Zap } from 'lucide-react';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// ─── MINI KPI CARD ──────────────────────────────────────────────────────────────
const MiniKPI: React.FC<{
  label: string;
  value: string;
  unit: string;
  colorClass?: string;
}> = ({ label, value, unit, colorClass = 'text-slate-300' }) => (
  <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    <span className={`text-lg font-black leading-none ${colorClass}`}>
      {value} <span className="text-[10px] font-bold opacity-60">{unit}</span>
    </span>
  </div>
);

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export const SimulationCanvasView: React.FC = () => {
  // ── Store ──
  const monthlyConsumption = useSolarStore((s) => s.clientData.invoices[0]?.monthlyHistory || Array(12).fill(s.clientData.averageConsumption || 0));
  const hsp = useSolarStore((s) => s.clientData.monthlyIrradiation || Array(12).fill(0));
  const irradiationCity = useSolarStore((s) => s.clientData.irradiationCity);
  const updateMonthlyConsumption = useSolarStore((s) => s.updateMonthlyConsumption);
  const setIrradiationData = useSolarStore((s) => s.setIrradiationData);
  const modules = useSolarStore(selectModules);
  const getPerformanceRatio = useTechStore((s) => s.getPerformanceRatio);

  // ── Derived Values ──
  const prDecimal = getPerformanceRatio();
  const totalPowerKw = modules.reduce((acc, m) => acc + m.power, 0) / 1000;
  const avgHsp = hsp.length > 0 ? hsp.reduce((a: number, b: number) => a + b, 0) / 12 : 0;

  // ── BI Engine ──
  const stats = useMemo(() => {
    let sumCons = 0;
    let sumGen = 0;

    const barData = MONTHS.map((month, i) => {
      const cons = monthlyConsumption[i] || 0;
      const gen = totalPowerKw * (hsp[i] || 0) * DAYS_IN_MONTH[i] * prDecimal;
      sumCons += cons;
      sumGen += gen;
      return { month, 'Consumo (kWh)': cons, 'Geração (kWh)': gen };
    });

    const balance = sumGen - sumCons;
    const coverage = sumCons > 0 ? (sumGen / sumCons) * 100 : 0;
    const radialData = [{
      name: 'Cobertura',
      value: Math.min(coverage, 150),
      fill: coverage >= 100 ? '#10b981' : '#f43f5e'
    }];

    return { barData, radialData, totalCons: sumCons, totalGen: sumGen, balance, coverage };
  }, [monthlyConsumption, hsp, prDecimal, totalPowerKw]);

  const isPositive = stats.balance >= 0;

  return (
    <div className="w-full min-h-full p-6 md:p-10 flex flex-col items-center overflow-y-auto">
      <div className="w-full max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* ═══════════════════════════════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════════════════════════════ */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <BarChart3 size={24} className="text-indigo-400" />
              </div>
              <h1 className="text-3xl font-black text-slate-100 tracking-tight">Simulação de Geração</h1>
            </div>
            <p className="text-slate-500 font-medium max-w-xl">
              Comparativo paramétrico entre consumo histórico e geração projetada do arranjo fotovoltaico.
            </p>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════════
            ROW 1: DEMANDA (esquerda) × SUPRIMENTO (direita)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* ─── BLOCO A: DEMANDA ─── */}
          <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-950/20 to-slate-900 p-6 flex flex-col gap-5">
            {/* Header do bloco */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20">
                <Zap size={16} className="text-teal-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-teal-300 uppercase tracking-widest">Demanda</h2>
                <p className="text-[10px] text-slate-500 font-medium">Perfil de consumo da unidade consumidora</p>
              </div>
            </div>

            {/* KPIs do bloco */}
            <div className="grid grid-cols-2 gap-3">
              <MiniKPI
                label="Consumo Anual"
                value={Math.round(stats.totalCons).toLocaleString('pt-BR')}
                unit="kWh/ano"
                colorClass="text-teal-400"
              />
              <MiniKPI
                label="Média Mensal"
                value={Math.round(stats.totalCons / 12).toLocaleString('pt-BR')}
                unit="kWh/mês"
                colorClass="text-teal-400"
              />
            </div>

            {/* Grid de inputs */}
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Fatura Mensal (kWh)</span>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {MONTHS.map((month, idx) => (
                  <div key={`cons-${month}`} className="flex flex-col gap-1 focus-within:text-teal-400 text-slate-500 transition-colors">
                    <label className="text-[9px] font-bold uppercase text-inherit text-center">{month}</label>
                    <input
                      type="number"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-slate-300 text-center focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 focus:outline-none transition-all"
                      value={monthlyConsumption[idx] || 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val >= 0) updateMonthlyConsumption(idx, val);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── BLOCO B: SUPRIMENTO ─── */}
          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-slate-900 p-6 flex flex-col gap-5">
            {/* Header do bloco */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Sun size={16} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-amber-300 uppercase tracking-widest">Suprimento</h2>
                <p className="text-[10px] text-slate-500 font-medium">Geração estimada do arranjo fotovoltaico</p>
              </div>
            </div>

            {/* KPIs do bloco */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MiniKPI
                label="Geração Anual"
                value={Math.round(stats.totalGen).toLocaleString('pt-BR')}
                unit="kWh/ano"
                colorClass="text-amber-400"
              />
              <MiniKPI
                label="Potência Instalada"
                value={totalPowerKw.toFixed(2)}
                unit="kWp"
                colorClass="text-amber-400"
              />
              <MiniKPI
                label="Performance Ratio"
                value={(prDecimal * 100).toFixed(1)}
                unit="%"
                colorClass="text-amber-400"
              />
              <MiniKPI
                label="HSP Médio Anual"
                value={avgHsp.toFixed(2)}
                unit="kWh/m²/dia"
                colorClass="text-amber-400"
              />
            </div>

            {/* Seletor CRESESB */}
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Estação CRESESB</span>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-bold text-slate-300 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all cursor-pointer"
                value={irradiationCity || ''}
                onChange={(e) => {
                  const key = e.target.value;
                  if (CRESESB_DB[key]) setIrradiationData(CRESESB_DB[key].hsp_monthly, key);
                }}
              >
                <option value="" disabled>Selecione a cidade base...</option>
                {Object.keys(CRESESB_DB).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Grid HSP read-only */}
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Irradiação Mensal (HSP)</span>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {MONTHS.map((month, idx) => (
                  <div key={`hsp-${month}`} className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase text-center">{month}</label>
                    <div className="w-full bg-slate-950/50 border border-amber-800/30 border-dashed rounded px-1.5 py-1 text-[11px] font-mono text-amber-500/90 text-center">
                      {hsp[idx] ? hsp[idx].toFixed(2) : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ROW 2: COMPARATIVO (BarChart + Radial + Balanço)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ─── Bar Chart ─── */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col h-[400px]">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Matriz Mensal: Consumo vs Geração</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#475569" tick={{ fill: '#64748b', fontSize: 12, fontWeight: '600' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    cursor={{ fill: '#1e293b', opacity: 0.4 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', paddingTop: '10px' }} />
                  <Bar dataKey="Consumo (kWh)" fill="#2dd4bf" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  <Bar dataKey="Geração (kWh)" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ─── Radial Donut + Balanço ─── */}
          <div className="col-span-1 p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col h-[400px] items-center text-center relative shadow-xl">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 w-full text-left">Índice de Cobertura</h3>

            <div className="flex-1 w-full max-w-[220px] relative mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%" cy="50%"
                  innerRadius="70%" outerRadius="100%"
                  barSize={20}
                  data={stats.radialData}
                  startAngle={180} endAngle={-180}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background={{ fill: '#1e293b' }} dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-4xl font-black ${stats.coverage >= 100 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {Math.round(stats.coverage)}<span className="text-xl">%</span>
                </span>
                <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Taxa de Cobertura</span>
              </div>
            </div>

            {/* Balanço Líquido */}
            <div className={`w-full p-4 rounded-xl border text-left mt-auto ${isPositive ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-rose-950/20 border-rose-500/20'}`}>
              <span className={`text-[9px] font-bold uppercase tracking-widest block mb-1 ${isPositive ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                Balanço Físico (Sobra/Falta)
              </span>
              <span className={`text-xl font-black ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? '+' : ''}{Math.round(stats.balance).toLocaleString('pt-BR')}
                <span className="text-xs opacity-60 ml-1 font-bold">kWh/ano</span>
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
