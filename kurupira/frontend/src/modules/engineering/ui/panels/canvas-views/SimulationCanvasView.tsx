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
  BarChart3, Sun, Zap, ChevronDown, ChevronUp,
  Layers, TrendingUp, Table2, Clock, Settings2,
} from 'lucide-react';

// ─── CONSTANTS ──────────────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
type AnalysisTab = 'stacked' | 'cumulative' | 'daily' | 'table';

// ─── KPI PILL ───────────────────────────────────────────────────────────────────
const KpiPill: React.FC<{
  label: string; value: string; unit: string; color: string; subtitle?: string;
}> = ({ label, value, unit, color, subtitle }) => (
  <div className="flex flex-col gap-0.5 px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800/60 min-w-0">
    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest truncate">{label}</span>
    <div className="flex items-baseline gap-1">
      <span className={`text-xl font-black leading-none ${color}`}>{value}</span>
      <span className="text-[9px] font-bold text-slate-500">{unit}</span>
    </div>
    {subtitle && <span className="text-[8px] text-slate-600 truncate">{subtitle}</span>}
  </div>
);

// ─── LOSS WATERFALL ─────────────────────────────────────────────────────────────
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
    <div className="rounded-xl border border-slate-800 overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-800/40 transition-colors text-left">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Decomposição do PR ({(prDecimal * 100).toFixed(1)}%)
        </span>
        {isOpen ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>
      {isOpen && (
        <div className="px-3 pb-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-20 shrink-0">{item.label}</span>
              <div className="flex-1 h-2.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(item.loss * 5, 100)}%`, backgroundColor: item.loss >= 4 ? '#f43f5e' : item.loss >= 2 ? '#fbbf24' : '#475569' }} />
              </div>
              <span className="text-[10px] font-mono font-bold text-red-400/80 w-10 text-right">-{item.loss}%</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-[10px] font-bold text-slate-400">Perda Total</span>
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
  const [analysisTab, setAnalysisTab] = useState<AnalysisTab>('stacked');
  const [dailyMonth, setDailyMonth] = useState(0);
  const [configOpen, setConfigOpen] = useState(false);

  // ── BI Engine ──
  const stats = useMemo(() => {
    let sumCons = 0, sumGen = 0;
    const barData = MONTHS.map((month, i) => {
      const cons = +(monthlyConsumption[i] || 0).toFixed(2);
      const gen = +(totalPowerKw * (hsp[i] || 0) * DAYS_IN_MONTH[i] * prDecimal).toFixed(2);
      sumCons += cons; sumGen += gen;
      const autoconsumo = +Math.min(gen, cons).toFixed(2);
      const injecao = +Math.max(0, gen - cons).toFixed(2);
      const deficit = +Math.max(0, cons - gen).toFixed(2);
      return { month, 'Consumo (kWh)': cons, 'Geração (kWh)': gen, autoconsumo, injecao, deficit };
    });
    let saldoAcum = 0;
    const cumulativeData = barData.map((d) => { saldoAcum = +(saldoAcum + d['Geração (kWh)'] - d['Consumo (kWh)']).toFixed(2); return { month: d.month, saldo: saldoAcum }; });
    const balance = +(sumGen - sumCons).toFixed(2);
    const coverage = sumCons > 0 ? +(sumGen / sumCons * 100).toFixed(2) : 0;
    const radialData = [{ name: 'Cobertura', value: Math.min(coverage, 150), fill: coverage >= 100 ? '#10b981' : '#f43f5e' }];
    return { barData, cumulativeData, radialData, totalCons: +sumCons.toFixed(2), totalGen: +sumGen.toFixed(2), balance, coverage };
  }, [monthlyConsumption, hsp, prDecimal, totalPowerKw]);

  const modulePowerW = modules.length > 0 ? modules[0].power : undefined;
  const minPower = useMemo(() =>
    calculateMinimumPower(monthlyConsumption, hsp, prDecimal, 1.0, connectionType, modulePowerW),
    [monthlyConsumption, hsp, prDecimal, connectionType, modulePowerW]);

  const dailyData = useMemo(() => {
    const profile = getDailyProfile(totalPowerKw, hsp[dailyMonth] || 0, prDecimal);
    return HOUR_LABELS.map((label, i) => ({ hora: label, 'Geração (kWh)': +profile[i].toFixed(2) }));
  }, [totalPowerKw, hsp, prDecimal, dailyMonth]);

  const isPositive = stats.balance >= 0;

  const analysisTabs: { key: AnalysisTab; label: string; icon: React.ReactNode }[] = [
    { key: 'stacked', label: 'Composição', icon: <Layers size={12} /> },
    { key: 'cumulative', label: 'Cumulativo', icon: <TrendingUp size={12} /> },
    { key: 'daily', label: 'Curva Diária', icon: <Clock size={12} /> },
    { key: 'table', label: 'Tabela', icon: <Table2 size={12} /> },
  ];

  // ── Tooltip Style ──
  const tooltipStyle = { contentStyle: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }, itemStyle: { fontWeight: 'bold' as const } };

  return (
    <div className="w-full min-h-full p-6 md:p-8 flex flex-col items-center overflow-y-auto">
      <div className="w-full max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

        {/* ═══════════════════════════════════════════════════════════════════
            FAIXA 1 — RESUMO EXECUTIVO
        ═══════════════════════════════════════════════════════════════════ */}

        {/* Header */}
        <header className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <BarChart3 size={22} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">Simulação de Geração</h1>
            <p className="text-xs text-slate-500 font-medium">Balanço energético paramétrico do arranjo fotovoltaico</p>
          </div>
        </header>

        {/* KPI Strip - Reagrupado */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          
          {/* Grupo 1: Visão Geral */}
          <div className="lg:col-span-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3 flex flex-col gap-3">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Visão Geral do Sistema</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <KpiPill label="Consumo Anual" value={Math.round(stats.totalCons).toLocaleString('pt-BR')} unit="kWh" color="text-teal-400" subtitle={`${Math.round(stats.totalCons / 12).toLocaleString('pt-BR')} kWh/mês`} />
              <KpiPill label="Geração Estimada" value={Math.round(stats.totalGen).toLocaleString('pt-BR')} unit="kWh" color="text-amber-400" subtitle={`${totalPowerKw.toFixed(2)} kWp instalado`} />
              <KpiPill label="Cobertura" value={`${Math.round(stats.coverage)}`} unit="%" color={stats.coverage >= 100 ? 'text-emerald-400' : 'text-rose-400'} subtitle={`Balanço: ${isPositive ? '+' : ''}${Math.round(stats.balance).toLocaleString('pt-BR')} kWh`} />
            </div>
          </div>

          {/* Grupo 2: Dimensionamento */}
          <div className="lg:col-span-2 rounded-xl border border-indigo-500/20 bg-indigo-950/10 p-3 flex flex-col gap-3">
            <h3 className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-widest px-1">Guia de Dimensionamento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <KpiPill label="Potência Mín (100%)" value={minPower.yieldPerKwp > 0 ? minPower.roundedKwp.toFixed(2) : '—'} unit="kWp" color="text-indigo-400" subtitle={minPower.estimatedModules ? `≈ ${minPower.estimatedModules} módulos` : undefined} />
              <KpiPill label="Performance Ratio" value={(prDecimal * 100).toFixed(1)} unit="%" color="text-amber-400" subtitle={`HSP médio: ${avgHsp.toFixed(2)}`} />
            </div>
          </div>

        </div>

        {/* Main Chart + Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* BarChart Principal */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col h-[360px]">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Consumo vs Geração — Mensal</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.barData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11, fontWeight: '600' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#cbd5e1', paddingTop: '6px' }} />
                  <Bar dataKey="Consumo (kWh)" fill="#2dd4bf" radius={[3, 3, 0, 0]} maxBarSize={38} />
                  <Bar dataKey="Geração (kWh)" fill="#fbbf24" radius={[3, 3, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut + Balanço */}
          <div className="col-span-1 p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col h-[360px] items-center text-center relative shadow-xl">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 w-full text-left">Índice de Cobertura</h3>
            <div className="flex-1 w-full max-w-[180px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="72%" outerRadius="100%" barSize={16} data={stats.radialData} startAngle={180} endAngle={-180}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background={{ fill: '#1e293b' }} dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-3xl font-black ${stats.coverage >= 100 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {Math.round(stats.coverage)}<span className="text-lg">%</span>
                </span>
              </div>
            </div>
            <div className={`w-full p-3 rounded-xl border text-left ${isPositive ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-rose-950/20 border-rose-500/20'}`}>
              <span className={`text-[8px] font-bold uppercase tracking-widest block mb-0.5 ${isPositive ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                Balanço Anual
              </span>
              <span className={`text-lg font-black ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? '+' : ''}{Math.round(stats.balance).toLocaleString('pt-BR')}
                <span className="text-[10px] opacity-60 ml-1 font-bold">kWh</span>
              </span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            FAIXA 2 — ANÁLISE AVANÇADA (Tabs)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          {/* Tab Bar */}
          <div className="flex items-center gap-0.5 px-3 pt-3 border-b border-slate-800">
            {analysisTabs.map(tab => (
              <button key={tab.key} onClick={() => setAnalysisTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-[10px] font-bold uppercase tracking-wider transition-all
                  ${analysisTab === tab.key ? 'bg-slate-800 text-slate-200 border-t border-x border-slate-700' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}

            {/* Mês selector (só aparece na tab daily) */}
            {analysisTab === 'daily' && (
              <div className="ml-auto flex items-center gap-2 pb-1">
                <select className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] font-bold text-slate-300 outline-none cursor-pointer"
                  value={dailyMonth} onChange={(e) => setDailyMonth(parseInt(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <span className="text-[9px] text-slate-500">HSP: <span className="text-amber-400 font-bold">{hsp[dailyMonth]?.toFixed(2) || '—'}</span></span>
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="p-5 h-[300px]">

            {/* Composição (Stacked) */}
            {analysisTab === 'stacked' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.barData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11, fontWeight: '600' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#cbd5e1', paddingTop: '6px' }} />
                  <Bar dataKey="autoconsumo" name="Autoconsumo" stackId="gen" fill="#059669" maxBarSize={45} />
                  <Bar dataKey="injecao" name="Injeção na Rede" stackId="gen" fill="#fbbf24" radius={[3, 3, 0, 0]} maxBarSize={45} />
                  <Bar dataKey="deficit" name="Déficit (Rede)" fill="#f43f5e" radius={[3, 3, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* Cumulativo */}
            {analysisTab === 'cumulative' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.cumulativeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11, fontWeight: '600' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="saldo" name="Saldo Acumulado (kWh)" stroke="#10b981" fill="url(#gradCum)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {/* Curva Diária */}
            {analysisTab === 'daily' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="hora" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="Geração (kWh)" stroke="#fbbf24" fill="url(#gradSol)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {/* Tabela Analítica */}
            {analysisTab === 'table' && (
              <div className="overflow-x-auto h-full">
                <table className="w-full text-[11px] text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-700">
                      {['Mês', 'Consumo', 'Geração', 'Autocons.', 'Injeção', 'Déficit', 'Saldo Acum.'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.barData.map((d, i) => (
                      <tr key={d.month} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-3 py-1.5 font-bold text-slate-200">{d.month}</td>
                        <td className="px-3 py-1.5 text-teal-400 font-mono">{Math.round(d['Consumo (kWh)']).toLocaleString('pt-BR')}</td>
                        <td className="px-3 py-1.5 text-amber-400 font-mono">{Math.round(d['Geração (kWh)']).toLocaleString('pt-BR')}</td>
                        <td className="px-3 py-1.5 text-emerald-400 font-mono">{Math.round(d.autoconsumo).toLocaleString('pt-BR')}</td>
                        <td className="px-3 py-1.5 text-yellow-400 font-mono">{Math.round(d.injecao).toLocaleString('pt-BR')}</td>
                        <td className="px-3 py-1.5 text-rose-400 font-mono">{Math.round(d.deficit).toLocaleString('pt-BR')}</td>
                        <td className={`px-3 py-1.5 font-mono font-bold ${stats.cumulativeData[i].saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {Math.round(stats.cumulativeData[i].saldo).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-600 font-bold">
                      <td className="px-3 py-2 text-slate-200">TOTAL</td>
                      <td className="px-3 py-2 text-teal-400 font-mono">{Math.round(stats.totalCons).toLocaleString('pt-BR')}</td>
                      <td className="px-3 py-2 text-amber-400 font-mono">{Math.round(stats.totalGen).toLocaleString('pt-BR')}</td>
                      <td className="px-3 py-2 text-emerald-400 font-mono">{Math.round(stats.barData.reduce((a, d) => a + d.autoconsumo, 0)).toLocaleString('pt-BR')}</td>
                      <td className="px-3 py-2 text-yellow-400 font-mono">{Math.round(stats.barData.reduce((a, d) => a + d.injecao, 0)).toLocaleString('pt-BR')}</td>
                      <td className="px-3 py-2 text-rose-400 font-mono">{Math.round(stats.barData.reduce((a, d) => a + d.deficit, 0)).toLocaleString('pt-BR')}</td>
                      <td className={`px-3 py-2 font-mono ${stats.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {Math.round(stats.balance).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            FAIXA 3 — CONFIGURAÇÃO (Colapsável)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <button onClick={() => setConfigOpen(!configOpen)}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-800/30 transition-colors text-left">
            <div className="flex items-center gap-2.5">
              <Settings2 size={16} className="text-slate-400" />
              <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">Parâmetros de Entrada</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 font-bold">
                {irradiationCity || 'Sem cidade'} • {connectionType || 'mono'}
              </span>
            </div>
            {configOpen ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
          </button>

          {configOpen && (
            <div className="px-5 pb-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200 border-t border-slate-800 pt-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Consumo */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-teal-400" />
                    <span className="text-xs font-bold text-teal-300 uppercase tracking-widest">Fatura Mensal (kWh)</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {MONTHS.map((month, idx) => (
                      <div key={`c-${month}`} className="flex flex-col gap-1 focus-within:text-teal-400 text-slate-500 transition-colors">
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

                {/* Irradiação */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sun size={14} className="text-amber-400" />
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">Irradiação (HSP / CRESESB)</span>
                  </div>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-bold text-slate-300 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all cursor-pointer"
                    value={irradiationCity || ''}
                    onChange={(e) => { const k = e.target.value; if (CRESESB_DB[k]) setIrradiationData(CRESESB_DB[k].hsp_monthly, k); }}>
                    <option value="" disabled>Selecione a cidade...</option>
                    {Object.keys(CRESESB_DB).map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {MONTHS.map((month, idx) => (
                      <div key={`h-${month}`} className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase text-center">{month}</label>
                        <div className="w-full bg-slate-950/50 border border-amber-800/30 border-dashed rounded px-1.5 py-1 text-[11px] font-mono text-amber-500/90 text-center">
                          {hsp[idx] ? hsp[idx].toFixed(2) : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Waterfall */}
              <LossWaterfall />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
