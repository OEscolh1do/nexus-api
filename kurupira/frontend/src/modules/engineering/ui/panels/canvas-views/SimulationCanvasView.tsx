import React, { useMemo, useState } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '../../../store/useTechStore';
import { CRESESB_DB } from '@/data/irradiation/cresesbData';
import { calculateMinimumPower } from '../../../utils/minimumPower';
import { getDailyProfile, HOUR_LABELS } from '../../../utils/dailyProfile';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis, AreaChart, Area,
} from 'recharts';
import {
  BarChart3, Sun, Zap, Target, ChevronDown, ChevronUp,
  Layers, TrendingUp, Table2, Clock,
} from 'lucide-react';

// ─── CONSTANTS ──────────────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
type ChartView = 'bars' | 'stacked' | 'cumulative' | 'table';

// ─── MINI KPI CARD ──────────────────────────────────────────────────────────────
const MiniKPI: React.FC<{
  label: string; value: string; unit: string; colorClass?: string;
}> = ({ label, value, unit, colorClass = 'text-slate-300' }) => (
  <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    <span className={`text-lg font-black leading-none ${colorClass}`}>
      {value} <span className="text-[10px] font-bold opacity-60">{unit}</span>
    </span>
  </div>
);

// ─── SECTION WRAPPER ────────────────────────────────────────────────────────────
const Section: React.FC<{
  id: string; title: string; icon: React.ReactNode; children: React.ReactNode; className?: string;
}> = ({ id, title, icon, children, className = '' }) => (
  <section id={id} className={`rounded-2xl bg-slate-900 border border-slate-800 shadow-xl p-6 ${className}`}>
    <div className="flex items-center gap-2 mb-5">
      {icon}
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{title}</h3>
    </div>
    {children}
  </section>
);

// ─── LOSS WATERFALL (Spec 04) ───────────────────────────────────────────────────
const LossWaterfall: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const lossProfile = useTechStore((s) => s.lossProfile);
  const prDecimal = useTechStore((s) => s.getPerformanceRatio)();

  const items = [
    { label: 'Orientação', loss: lossProfile.orientation },
    { label: 'Inclinação', loss: lossProfile.inclination },
    { label: 'Sombreamento', loss: lossProfile.shading },
    { label: 'Horizonte', loss: lossProfile.horizon },
    { label: 'Temperatura', loss: lossProfile.temperature },
    { label: 'Mismatch', loss: lossProfile.mismatch },
    { label: 'Sujeira', loss: lossProfile.soiling },
    { label: 'Cabos DC', loss: lossProfile.dcCable },
    { label: 'Cabos AC', loss: lossProfile.acCable },
    { label: 'Inversor', loss: +(100 - lossProfile.inverterEfficiency).toFixed(1) },
  ];

  const totalLoss = items.reduce((a, b) => a + b.loss, 0);

  return (
    <div className="mt-3 rounded-xl border border-slate-800 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-800/40 transition-colors text-left"
      >
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Decomposição de Perdas (PR: {(prDecimal * 100).toFixed(1)}%)
        </span>
        {isOpen ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>

      {isOpen && (
        <div className="px-3 pb-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-20 shrink-0">{item.label}</span>
              <div className="flex-1 h-3 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(item.loss * 5, 100)}%`,
                    backgroundColor: item.loss >= 4 ? '#f43f5e' : item.loss >= 2 ? '#fbbf24' : '#475569',
                  }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-red-400/80 w-10 text-right">-{item.loss}%</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-[10px] font-bold text-slate-400">Perda Total Cumulativa</span>
            <span className="text-xs font-black text-red-400">-{totalLoss.toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════════
export const SimulationCanvasView: React.FC = () => {
  // ── Store ──
  const monthlyConsumption = useSolarStore((s) => s.clientData.invoices[0]?.monthlyHistory || Array(12).fill(s.clientData.averageConsumption || 0));
  const hsp = useSolarStore((s) => s.clientData.monthlyIrradiation || Array(12).fill(0));
  const irradiationCity = useSolarStore((s) => s.clientData.irradiationCity);
  const connectionType = useSolarStore((s) => s.clientData.connectionType);
  const updateMonthlyConsumption = useSolarStore((s) => s.updateMonthlyConsumption);
  const setIrradiationData = useSolarStore((s) => s.setIrradiationData);
  const modules = useSolarStore(selectModules);
  const getPerformanceRatio = useTechStore((s) => s.getPerformanceRatio);

  // ── Derived ──
  const prDecimal = getPerformanceRatio();
  const totalPowerKw = modules.reduce((acc, m) => acc + m.power, 0) / 1000;
  const avgHsp = hsp.length > 0 ? hsp.reduce((a: number, b: number) => a + b, 0) / 12 : 0;

  // ── UI State ──
  const [chartView, setChartView] = useState<ChartView>('bars');
  const [dailyMonth, setDailyMonth] = useState(0);

  // ── BI Engine ──
  const stats = useMemo(() => {
    let sumCons = 0;
    let sumGen = 0;

    const barData = MONTHS.map((month, i) => {
      const cons = monthlyConsumption[i] || 0;
      const gen = totalPowerKw * (hsp[i] || 0) * DAYS_IN_MONTH[i] * prDecimal;
      sumCons += cons;
      sumGen += gen;

      const autoconsumo = Math.min(gen, cons);
      const injecao = Math.max(0, gen - cons);
      const deficit = Math.max(0, cons - gen);

      return {
        month,
        'Consumo (kWh)': cons,
        'Geração (kWh)': gen,
        autoconsumo, injecao, deficit,
      };
    });

    // Cumulativo
    let saldoAcum = 0;
    const cumulativeData = barData.map((d) => {
      saldoAcum += d['Geração (kWh)'] - d['Consumo (kWh)'];
      return { month: d.month, saldo: saldoAcum };
    });

    const balance = sumGen - sumCons;
    const coverage = sumCons > 0 ? (sumGen / sumCons) * 100 : 0;
    const radialData = [{
      name: 'Cobertura', value: Math.min(coverage, 150),
      fill: coverage >= 100 ? '#10b981' : '#f43f5e',
    }];

    return { barData, cumulativeData, radialData, totalCons: sumCons, totalGen: sumGen, balance, coverage };
  }, [monthlyConsumption, hsp, prDecimal, totalPowerKw]);

  // ── Spec 03: Potência Mínima ──
  const modulePowerW = modules.length > 0 ? modules[0].power : undefined;
  const minPower = useMemo(() =>
    calculateMinimumPower(monthlyConsumption, hsp, prDecimal, 1.0, connectionType, modulePowerW),
    [monthlyConsumption, hsp, prDecimal, connectionType, modulePowerW]
  );

  // ── Spec 01: Curva Diária ──
  const dailyData = useMemo(() => {
    const profile = getDailyProfile(totalPowerKw, hsp[dailyMonth] || 0, prDecimal);
    return HOUR_LABELS.map((label, i) => ({ hora: label, 'Geração (kWh)': profile[i] }));
  }, [totalPowerKw, hsp, prDecimal, dailyMonth]);

  const isPositive = stats.balance >= 0;

  // ── Chart View Tabs ──
  const viewTabs: { key: ChartView; label: string; icon: React.ReactNode }[] = [
    { key: 'bars', label: 'Barras', icon: <BarChart3 size={13} /> },
    { key: 'stacked', label: 'Composição', icon: <Layers size={13} /> },
    { key: 'cumulative', label: 'Cumulativo', icon: <TrendingUp size={13} /> },
    { key: 'table', label: 'Tabela', icon: <Table2 size={13} /> },
  ];

  return (
    <div className="w-full min-h-full p-6 md:p-10 flex flex-col items-center overflow-y-auto">
      <div className="w-full max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

        {/* ═══ HEADER ═══ */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <BarChart3 size={24} className="text-indigo-400" />
              </div>
              <h1 className="text-3xl font-black text-slate-100 tracking-tight">Simulação de Geração</h1>
            </div>
            <p className="text-slate-500 font-medium max-w-xl">
              Análise paramétrica completa: consumo, geração, dimensionamento e perdas.
            </p>
          </div>
        </header>

        {/* ═══ ROW 1: DEMANDA × SUPRIMENTO ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ─── BLOCO DEMANDA ─── */}
          <div id="sec-demanda" className="rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-950/20 to-slate-900 p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20">
                <Zap size={16} className="text-teal-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-teal-300 uppercase tracking-widest">Demanda</h2>
                <p className="text-[10px] text-slate-500 font-medium">Perfil de consumo da unidade consumidora</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MiniKPI label="Consumo Anual" value={Math.round(stats.totalCons).toLocaleString('pt-BR')} unit="kWh/ano" colorClass="text-teal-400" />
              <MiniKPI label="Média Mensal" value={Math.round(stats.totalCons / 12).toLocaleString('pt-BR')} unit="kWh/mês" colorClass="text-teal-400" />
            </div>

            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Fatura Mensal (kWh)</span>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {MONTHS.map((month, idx) => (
                  <div key={`cons-${month}`} className="flex flex-col gap-1 focus-within:text-teal-400 text-slate-500 transition-colors">
                    <label className="text-[9px] font-bold uppercase text-inherit text-center">{month}</label>
                    <input type="number"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-slate-300 text-center focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 focus:outline-none transition-all"
                      value={monthlyConsumption[idx] || 0}
                      onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0) updateMonthlyConsumption(idx, v); }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── BLOCO SUPRIMENTO ─── */}
          <div id="sec-suprimento" className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-slate-900 p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Sun size={16} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-amber-300 uppercase tracking-widest">Suprimento</h2>
                <p className="text-[10px] text-slate-500 font-medium">Geração estimada do arranjo fotovoltaico</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MiniKPI label="Geração Anual" value={Math.round(stats.totalGen).toLocaleString('pt-BR')} unit="kWh/ano" colorClass="text-amber-400" />
              <MiniKPI label="Potência DC" value={totalPowerKw.toFixed(2)} unit="kWp" colorClass="text-amber-400" />
              <MiniKPI label="Performance Ratio" value={(prDecimal * 100).toFixed(1)} unit="%" colorClass="text-amber-400" />
              <MiniKPI label="HSP Médio" value={avgHsp.toFixed(2)} unit="kWh/m²/dia" colorClass="text-amber-400" />
            </div>

            {/* Spec 03: Potência Mínima Recomendada */}
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <Target size={18} className="text-indigo-400" />
              </div>
              <div className="flex-1">
                <span className="text-[9px] font-bold text-indigo-400/70 uppercase tracking-widest block mb-1">Potência Mínima Recomendada (100%)</span>
                <span className="text-2xl font-black text-indigo-300">
                  {minPower.yieldPerKwp > 0 ? `${minPower.roundedKwp.toFixed(2)} kWp` : '—'}
                </span>
                {minPower.estimatedModules !== null && (
                  <span className="text-[10px] text-slate-400 ml-2">≈ {minPower.estimatedModules} módulos</span>
                )}
              </div>
              {totalPowerKw > 0 && minPower.roundedKwp > 0 && (
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 block">Atual</span>
                  <span className={`text-sm font-black ${totalPowerKw >= minPower.exactKwp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {totalPowerKw.toFixed(2)} kWp
                  </span>
                </div>
              )}
            </div>

            {/* CRESESB Selector */}
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Estação CRESESB</span>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-bold text-slate-300 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all cursor-pointer"
                value={irradiationCity || ''}
                onChange={(e) => { const k = e.target.value; if (CRESESB_DB[k]) setIrradiationData(CRESESB_DB[k].hsp_monthly, k); }}
              >
                <option value="" disabled>Selecione a cidade base...</option>
                {Object.keys(CRESESB_DB).map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>

            {/* HSP Grid */}
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

            {/* Spec 04: Waterfall de Perdas */}
            <LossWaterfall />
          </div>
        </div>

        {/* ═══ ROW 2: COMPARATIVO (Multi-View) ═══ */}
        <div id="sec-comparativo" className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ─── Chart Area (com tabs) ─── */}
          <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col">
            {/* Tab Bar */}
            <div className="flex items-center gap-1 p-3 pb-0 border-b border-slate-800">
              {viewTabs.map(tab => (
                <button key={tab.key}
                  onClick={() => setChartView(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[11px] font-bold uppercase tracking-wider transition-all
                    ${chartView === tab.key
                      ? 'bg-slate-800 text-slate-200 border-t border-x border-slate-700'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                    }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 p-6 min-h-[350px]">
              {/* VIEW: Barras Lado-a-Lado */}
              {chartView === 'bars' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="month" stroke="#475569" tick={{ fill: '#64748b', fontSize: 12, fontWeight: '600' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }} itemStyle={{ fontWeight: 'bold' }} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', paddingTop: '8px' }} />
                    <Bar dataKey="Consumo (kWh)" fill="#2dd4bf" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Geração (kWh)" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* VIEW: Composição (Stacked) */}
              {chartView === 'stacked' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="month" stroke="#475569" tick={{ fill: '#64748b', fontSize: 12, fontWeight: '600' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }} itemStyle={{ fontWeight: 'bold' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', paddingTop: '8px' }} />
                    <Bar dataKey="autoconsumo" name="Autoconsumo" stackId="gen" fill="#059669" radius={[0, 0, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="injecao" name="Injeção na Rede" stackId="gen" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="deficit" name="Déficit (Rede)" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* VIEW: Cumulativo */}
              {chartView === 'cumulative' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.cumulativeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradPos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="month" stroke="#475569" tick={{ fill: '#64748b', fontSize: 12, fontWeight: '600' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }} itemStyle={{ fontWeight: 'bold' }} />
                    <Area type="monotone" dataKey="saldo" name="Saldo Acumulado (kWh)" stroke="#10b981" fill="url(#gradPos)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {/* VIEW: Tabela Analítica */}
              {chartView === 'table' && (
                <div className="overflow-x-auto h-full">
                  <table className="w-full text-[11px] text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-700">
                        {['Mês', 'Consumo', 'Geração', 'Autocons.', 'Injeção', 'Déficit', 'Saldo Acum.'].map(h => (
                          <th key={h} className="px-2 py-2 text-left font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.barData.map((d, i) => (
                        <tr key={d.month} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <td className="px-2 py-1.5 font-bold text-slate-200">{d.month}</td>
                          <td className="px-2 py-1.5 text-teal-400 font-mono">{Math.round(d['Consumo (kWh)']).toLocaleString('pt-BR')}</td>
                          <td className="px-2 py-1.5 text-amber-400 font-mono">{Math.round(d['Geração (kWh)']).toLocaleString('pt-BR')}</td>
                          <td className="px-2 py-1.5 text-emerald-400 font-mono">{Math.round(d.autoconsumo).toLocaleString('pt-BR')}</td>
                          <td className="px-2 py-1.5 text-yellow-400 font-mono">{Math.round(d.injecao).toLocaleString('pt-BR')}</td>
                          <td className="px-2 py-1.5 text-rose-400 font-mono">{Math.round(d.deficit).toLocaleString('pt-BR')}</td>
                          <td className={`px-2 py-1.5 font-mono font-bold ${stats.cumulativeData[i].saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {Math.round(stats.cumulativeData[i].saldo).toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-600 font-bold">
                        <td className="px-2 py-2 text-slate-200">TOTAL</td>
                        <td className="px-2 py-2 text-teal-400 font-mono">{Math.round(stats.totalCons).toLocaleString('pt-BR')}</td>
                        <td className="px-2 py-2 text-amber-400 font-mono">{Math.round(stats.totalGen).toLocaleString('pt-BR')}</td>
                        <td className="px-2 py-2 text-emerald-400 font-mono">{Math.round(stats.barData.reduce((a, d) => a + d.autoconsumo, 0)).toLocaleString('pt-BR')}</td>
                        <td className="px-2 py-2 text-yellow-400 font-mono">{Math.round(stats.barData.reduce((a, d) => a + d.injecao, 0)).toLocaleString('pt-BR')}</td>
                        <td className="px-2 py-2 text-rose-400 font-mono">{Math.round(stats.barData.reduce((a, d) => a + d.deficit, 0)).toLocaleString('pt-BR')}</td>
                        <td className={`px-2 py-2 font-mono ${stats.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {Math.round(stats.balance).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ─── Radial Donut + Balanço ─── */}
          <div className="col-span-1 p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col h-[450px] items-center text-center relative shadow-xl">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 w-full text-left">Índice de Cobertura</h3>
            <div className="flex-1 w-full max-w-[200px] relative mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={18} data={stats.radialData} startAngle={180} endAngle={-180}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background={{ fill: '#1e293b' }} dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-4xl font-black ${stats.coverage >= 100 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {Math.round(stats.coverage)}<span className="text-xl">%</span>
                </span>
                <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Cobertura</span>
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

        {/* ═══ ROW 3: CURVA DIÁRIA (Spec 01) ═══ */}
        <Section id="sec-curva" title="Curva de Geração Diária Estimada" icon={<Clock size={16} className="text-amber-400" />}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Mês:</span>
            <select
              className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-bold text-slate-300 outline-none focus:border-amber-500 transition-all cursor-pointer"
              value={dailyMonth}
              onChange={(e) => setDailyMonth(parseInt(e.target.value))}
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <span className="text-[10px] text-slate-500">
              HSP: <span className="text-amber-400 font-bold">{hsp[dailyMonth]?.toFixed(2) || '0.00'}</span> kWh/m²/dia
            </span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="hora" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }} itemStyle={{ fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="Geração (kWh)" stroke="#fbbf24" fill="url(#gradSolar)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

      </div>
    </div>
  );
};
