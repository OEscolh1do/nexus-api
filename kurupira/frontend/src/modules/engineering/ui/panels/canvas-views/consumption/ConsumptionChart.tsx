import React, { useState, useMemo, useEffect } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from 'recharts';
import { useSolarStore } from '@/core/state/solarStore';
import { Zap, Sun, Thermometer, TrendingUp, ArrowUp, CalendarDays, DollarSign, Pencil, BarChart3, Clipboard, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';

const formatBRL = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Custom Tooltip component
const CustomConsumptionTooltip = ({ active, payload, label, tariffRate }: any) => {
  if (!active || !payload?.length) return null;
  const base = payload.find((p: any) => p.dataKey === 'consumoBase')?.value ?? 0;
  const simul = payload.find((p: any) => p.dataKey === 'cargasSimuladas')?.value ?? 0;
  const hsp = payload.find((p: any) => p.dataKey === 'hsp')?.value ?? null;
  const temp = payload.find((p: any) => p.dataKey === 'temp')?.value ?? null;
  const total = base + simul;
  const cost = tariffRate > 0 ? total * tariffRate : null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-sm p-4 text-[11px] shadow-2xl backdrop-blur-md z-50">
      <p className="text-slate-500 font-bold mb-3 uppercase tracking-widest font-mono border-b border-slate-800 pb-2">{label}</p>
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between gap-8">
          <span className="text-slate-400">HISTÓRICO BASE</span>
          <span className="text-sky-500 font-mono tabular-nums">{base.toFixed(2)} kWh</span>
        </div>
        {simul > 0 && (
          <div className="flex justify-between gap-8">
            <span className="text-slate-400">CARGAS SIMULADAS</span>
            <span className="text-sky-300 font-mono tabular-nums">+{simul.toFixed(2)} kWh</span>
          </div>
        )}
        <div className="flex justify-between gap-8 border-t border-slate-800 pt-2 mt-1">
          <span className="text-slate-300 font-bold">CARGA TOTAL</span>
          <span className="text-white font-mono font-bold tabular-nums">{total.toFixed(2)} kWh</span>
        </div>
        {cost !== null && (
          <div className="flex justify-between gap-8">
            <span className="text-emerald-600 font-bold">CUSTO ESTIMADO</span>
            <span className="text-emerald-400 font-mono font-bold tabular-nums">{formatBRL(cost)}</span>
          </div>
        )}

        {(hsp !== null || temp !== null) && (
          <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-slate-800/80">
             {hsp !== null && (
               <div className="flex justify-between gap-8">
                 <div className="flex items-center gap-1.5 grayscale opacity-60">
                   <Sun size={10} className="text-amber-500" />
                   <span className="text-[11px] uppercase font-bold tracking-tighter">HSP MENSAL</span>
                 </div>
                 <span className="text-amber-400 font-mono font-bold">{hsp.toFixed(2)}</span>
               </div>
             )}
             {temp !== null && (
               <div className="flex justify-between gap-8">
                 <div className="flex items-center gap-1.5 grayscale opacity-60">
                   <Thermometer size={10} className="text-rose-500" />
                   <span className="text-[11px] uppercase font-bold tracking-tighter">TEMP. AMBIENTE</span>
                 </div>
                 <span className="text-rose-400 font-mono font-bold">{temp.toFixed(2)}°C</span>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export const ConsumptionChart: React.FC = () => {
  const clientData = useSolarStore(s => s.clientData);
  const weatherData = useSolarStore(s => s.weatherData);
  const averageConsumption = clientData.averageConsumption || 0;
  const updateMonthlyConsumption = useSolarStore(s => s.updateMonthlyConsumption);
  const simulatedItems = useSolarStore(s => s.simulatedItems);

  // Climate Visibility States
  const [showHSP, setShowHSP] = useState(false);
  const [showTemp, setShowTemp] = useState(false);

  const activeInvoiceId = useSolarStore(s => s.activeInvoiceId);
  
  const activeInvoice = useMemo(() => {
    const invs = clientData.invoices || [];
    return invs.find(inv => inv.id === activeInvoiceId) || invs[0];
  }, [clientData.invoices, activeInvoiceId]);

  // Fetch monthly history of the active invoice
  const monthlyConsumption: number[] = useMemo(() => {
    if (activeInvoice?.monthlyHistory?.length === 12) return activeInvoice.monthlyHistory;
    return Array(12).fill(0);
  }, [activeInvoice]);

  // Local state for History Grid inputs to allow empty fields during editing
  const [localConsumption, setLocalConsumption] = useState<string[]>(
    monthlyConsumption.map(v => Math.round(v).toString())
  );

  // Sync local state when store changes (e.g., project load or average adjustment)
  useEffect(() => {
    setLocalConsumption(monthlyConsumption.map(v => Math.round(v).toString()));
  }, [monthlyConsumption]);

  const handleInputChange = (index: number, value: string) => {
    const newLocal = [...localConsumption];
    newLocal[index] = value;
    setLocalConsumption(newLocal);
  };

  const handleInputBlur = (index: number, value: string) => {
    // If empty, commit as 0 to the store, but local state remains manageable
    const numValue = value === '' ? 0 : Number(value);
    updateMonthlyConsumption(index, numValue);
  };

  // Derived chart data combining base consumption and simulated per-month profile
  const chartData = useMemo(() => {
    const validMonths = monthlyConsumption.filter(v => v > 0);
    const media = validMonths.length > 0 ? (validMonths.reduce((a, b) => a + b, 0) / validMonths.length) : 0;

    const hspArray = weatherData?.hsp_monthly || clientData.monthlyIrradiation || Array(12).fill(0);
    const tempArray = weatherData?.temp_monthly || 
                     (weatherData?.ambient_temp_avg ? Array(12).fill(weatherData.ambient_temp_avg) : Array(12).fill(0));

    return MESES.map((mes, i) => {
      const cargasSimuladas = Object.values(simulatedItems.entities).reduce((sum, item) => {
        const duty = item.dutyCycle ?? 1;
        const kWh = ((item.power * duty * item.hoursPerDay * (item.daysPerMonth ?? 30) * item.qty) / 1000);
        return sum + kWh;
      }, 0);

      return {
        mes,
        consumoBase: monthlyConsumption[i] ?? 0,
        cargasSimuladas: cargasSimuladas,
        media: media,
        hsp: hspArray[i] ?? 0,
        temp: tempArray[i] ?? 0,
      };
    });
  }, [monthlyConsumption, simulatedItems, clientData.monthlyIrradiation, weatherData]);

  // KPIs derivados
  const kpis = useMemo(() => {
    const totals = chartData.map(d => d.consumoBase + d.cargasSimuladas);
    const validTotals = totals.filter(v => v > 0);
    const media = validTotals.length > 0 ? validTotals.reduce((a, b) => a + b, 0) / validTotals.length : 0;
    const pico = validTotals.length > 0 ? Math.max(...validTotals) : 0;
    const totalAnual = totals.reduce((a, b) => a + b, 0);
    const picoIndex = totals.indexOf(pico);
    const picoMes = picoIndex >= 0 ? MESES[picoIndex] : '';
    // Percentages for legend
    const totalBase = chartData.reduce((s, d) => s + d.consumoBase, 0);
    const totalSim = chartData.reduce((s, d) => s + d.cargasSimuladas, 0);
    const totalAll = totalBase + totalSim;
    const pctBase = totalAll > 0 ? Math.round((totalBase / totalAll) * 100) : 100;
    const pctSim = totalAll > 0 ? 100 - pctBase : 0;
    return { media, pico, totalAnual, picoMes, pctBase, pctSim };
  }, [chartData]);

  const tariffRate = activeInvoice?.tariffRate ?? 0;
  const monthlyCost = kpis.media * tariffRate;

  // Animated KPI values
  const animMedia = useAnimatedValue(kpis.media);
  const animPico = useAnimatedValue(kpis.pico);
  const animTotal = useAnimatedValue(kpis.totalAnual);
  const animCost = useAnimatedValue(monthlyCost);

  // Adaptive Climate Domains (Smart Correlation Scaling)
  const climateDomains = useMemo(() => {
    // 1. Temperature Domain (Min Span: 15°C)
    const temps = chartData.map(d => d.temp);
    const tMin = Math.min(...temps);
    const tMax = Math.max(...temps);
    const tRange = tMax - tMin;
    const tMinSpan = 15;
    
    let tempDomain: [number, number];
    if (tRange < tMinSpan) {
       const center = (tMax + tMin) / 2;
       tempDomain = [center - tMinSpan / 2, center + tMinSpan / 2];
    } else {
       tempDomain = [tMin - 5, tMax + 2];
    }

    // 2. HSP Domain (Min Span: 3.0)
    const hsps = chartData.map(d => d.hsp);
    const hMin = Math.min(...hsps);
    const hMax = Math.max(...hsps);
    const hRange = hMax - hMin;
    const hMinSpan = 3.0;

    let hspDomain: [number, number];
    if (hRange < hMinSpan) {
       const center = (hMax + hMin) / 2;
       hspDomain = [Math.max(0, center - hMinSpan / 2), center + hMinSpan / 2];
    } else {
       hspDomain = [Math.max(0, hMin - 1), hMax + 1];
    }

    return { tempDomain, hspDomain };
  }, [chartData]);

  const isEmpty = averageConsumption === 0 && chartData.every(d => d.consumoBase === 0 && d.cargasSimuladas === 0);

  return (
    <div className="flex flex-col h-full gap-3 z-0">

      {/* ── KPI BAR ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-800/40 border border-slate-800/60 rounded-sm shrink-0 overflow-hidden">
        {/* Consumo Médio */}
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-900/60">
          <div className="p-1.5 bg-sky-500/10 border border-sky-500/20 rounded-sm shrink-0">
            <TrendingUp size={10} className="text-sky-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] text-slate-600 font-black uppercase tracking-[0.15em] leading-none mb-0.5">{isEmpty ? 'Configure o consumo' : 'Consumo Médio'}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[13px] font-mono font-black text-slate-100 tabular-nums leading-none">
                {isEmpty ? '—' : Math.round(animMedia)}
              </span>
              {!isEmpty && <span className="text-[8px] text-slate-500 font-bold uppercase">kWh</span>}
            </div>
          </div>
        </div>

        {/* Mês de Pico */}
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-900/60">
          <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-sm shrink-0">
            <ArrowUp size={10} className="text-amber-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] text-slate-600 font-black uppercase tracking-[0.15em] leading-none mb-0.5">{isEmpty ? 'Pico' : `Pico (${kpis.picoMes})`}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[13px] font-mono font-black text-slate-100 tabular-nums leading-none">
                {isEmpty ? '—' : Math.round(animPico)}
              </span>
              {!isEmpty && <span className="text-[8px] text-slate-500 font-bold uppercase">kWh</span>}
            </div>
          </div>
        </div>

        {/* Demanda Anual */}
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-900/60">
          <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-sm shrink-0">
            <CalendarDays size={10} className="text-indigo-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] text-slate-600 font-black uppercase tracking-[0.15em] leading-none mb-0.5">Demanda Anual</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[13px] font-mono font-black text-slate-100 tabular-nums leading-none">
                {isEmpty ? '—' : animTotal >= 1000 ? (animTotal / 1000).toFixed(2) : Math.round(animTotal)}
              </span>
              <span className="text-[8px] text-slate-500 font-bold uppercase">
                {isEmpty ? '' : kpis.totalAnual >= 1000 ? 'MWh' : 'kWh'}
              </span>
            </div>
          </div>
        </div>

        {/* 4º KPI: Custo Mensal Estimado */}
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-900/60">
          <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-sm shrink-0">
            <DollarSign size={10} className="text-emerald-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] text-slate-600 font-black uppercase tracking-[0.15em] leading-none mb-0.5">{tariffRate > 0 ? 'Custo Mensal' : 'Configure a tarifa'}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[13px] font-mono font-black text-slate-100 tabular-nums leading-none">
                {isEmpty || tariffRate <= 0 ? '—' : formatBRL(animCost)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* ── CONTROLES E LEGENDA (UNIFICADOS) ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-3 bg-slate-900 border border-slate-800/60 p-3 lg:px-3 lg:py-1.5 rounded-sm shrink-0">
        
        {/* Visibility Toggles */}
        <div className="flex items-center gap-2 pr-0 sm:pr-4 border-b sm:border-b-0 sm:border-r border-slate-800 pb-2 sm:pb-0">
            <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest mr-1">Camadas TMY:</span>
            <button 
              onClick={() => setShowHSP(!showHSP)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 border rounded-sm transition-all active:scale-95",
                showHSP 
                 ? "bg-amber-500/10 border-amber-500 text-amber-500" 
                 : "bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400 hover:border-slate-700"
              )}
            >
              <Sun size={10} />
              <span className="text-[10px] font-black uppercase tracking-tighter">HSP</span>
            </button>
            <button 
              onClick={() => setShowTemp(!showTemp)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 border rounded-sm transition-all active:scale-95",
                showTemp 
                 ? "bg-rose-500/10 border-rose-500 text-rose-500" 
                 : "bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400 hover:border-slate-700"
              )}
            >
              <Thermometer size={10} />
              <span className="text-[10px] font-black uppercase tracking-tighter">TEMP</span>
            </button>
        </div>

        {/* Legenda Dinâmica com Percentuais */}
        <div className="flex items-center gap-4 h-5">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-sky-500 rounded-sm" />
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Histórico{!isEmpty && kpis.pctBase < 100 ? ` (${kpis.pctBase}%)` : ''}</span>
           </div>
           {kpis.pctSim > 0 && (
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-sky-500/30 rounded-sm" />
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Simulado ({kpis.pctSim}%)</span>
             </div>
           )}
        </div>
      </div>

      {/* ── ÁREA DO GRÁFICO (FLEXÍVEL) ────────────────────────────────── */}
      <div className="flex-1 relative min-h-[140px] max-h-none">
        {isEmpty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 pointer-events-auto">
            <div className="flex flex-col items-center gap-2">
              <Zap size={28} className="text-sky-500/30" />
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Configure o Consumo</p>
              <p className="text-[10px] text-slate-600 max-w-xs text-center">Escolha como iniciar a análise de consumo desta UC</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-md px-4">
              <button
                className="flex flex-col items-center gap-1.5 p-3 bg-slate-900/80 border border-slate-800 rounded-sm hover:border-sky-500/40 hover:bg-slate-900 transition-all group"
                onClick={() => {
                  const avgInput = document.querySelector<HTMLInputElement>('[data-field="average-consumption"]');
                  avgInput?.focus();
                }}
              >
                <Clipboard size={14} className="text-sky-500/60 group-hover:text-sky-400 transition-colors" />
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Informar Média</span>
                <span className="text-[8px] text-slate-600 text-center leading-tight">Média mensal em kWh</span>
              </button>
              <button
                className="flex flex-col items-center gap-1.5 p-3 bg-slate-900/80 border border-slate-800 rounded-sm hover:border-sky-500/40 hover:bg-slate-900 transition-all group"
                onClick={() => {
                  const gridEl = document.getElementById('consumption-history-grid');
                  gridEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              >
                <BarChart3 size={14} className="text-sky-500/60 group-hover:text-sky-400 transition-colors" />
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Preencher Histórico</span>
                <span className="text-[8px] text-slate-600 text-center leading-tight">12 meses individuais</span>
              </button>
              <button
                className="flex flex-col items-center gap-1.5 p-3 bg-slate-900/80 border border-slate-800 rounded-sm hover:border-sky-500/40 hover:bg-slate-900 transition-all group"
                onClick={() => {
                  const loadsEl = document.getElementById('simulated-loads-panel');
                  loadsEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                <Settings2 size={14} className="text-sky-500/60 group-hover:text-sky-400 transition-colors" />
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Simular Cargas</span>
                <span className="text-[8px] text-slate-600 text-center leading-tight">Inventário de equipamentos</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="barSimGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fill: '#475569', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }} 
                  tickLine={false} 
                  axisLine={{ stroke: '#1e293b' }} 
                />
                <YAxis 
                  yAxisId="energy"
                  tick={{ fill: '#475569', fontSize: 11, fontFamily: 'var(--font-mono)' }} 
                  unit="" 
                  width={45} 
                  tickLine={false} 
                  axisLine={false} 
                  className="tabular-nums"
                />
                {showHSP && (
                  <YAxis 
                    yAxisId="hsp"
                    orientation="right"
                    hide={true}
                    domain={climateDomains.hspDomain}
                  />
                )}
                {showTemp && (
                  <YAxis 
                    yAxisId="temp"
                    orientation="right"
                    domain={climateDomains.tempDomain}
                    tick={{ fill: '#475569', fontSize: 11, fontFamily: 'var(--font-mono)' }} 
                    width={35} 
                    tickLine={false} 
                    axisLine={false} 
                    className="tabular-nums"
                  />
                )}
                <Tooltip content={<CustomConsumptionTooltip tariffRate={tariffRate} />} cursor={{ fill: 'rgba(245,158,11,0.03)' }} />
                <ReferenceLine yAxisId="energy" y={chartData[0]?.media} stroke="#0ea5e9" strokeDasharray="3 3" strokeOpacity={0.2}>
                  {!isEmpty && chartData[0]?.media > 0 && (
                    <Label
                      value={`Média: ${Math.round(chartData[0].media)} kWh`}
                      position="insideTopLeft"
                      fill="#475569"
                      fontSize={9}
                      fontFamily="var(--font-mono)"
                      offset={4}
                    />
                  )}
                </ReferenceLine>
                
                <Bar 
                  yAxisId="energy"
                  dataKey="consumoBase" 
                  stackId="a" 
                  fill="url(#barGradient)" 
                  radius={[0,0,0,0]} 
                  isAnimationActive={false}
                />
                <Bar 
                  yAxisId="energy"
                  dataKey="cargasSimuladas" 
                  stackId="a" 
                  fill="url(#barSimGradient)" 
                  radius={[0,0,0,0]} 
                  isAnimationActive={false} 
                />

                {showHSP && (
                  <Line
                    yAxisId="hsp"
                    type="monotone"
                    dataKey="hsp"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 2, fill: '#f59e0b', strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                )}
                {showTemp && (
                  <Line
                    yAxisId="temp"
                    type="monotone"
                    dataKey="temp"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5 shrink-0" id="consumption-history-grid">
         <div className="flex items-center gap-1.5 ml-1">
           <Pencil size={8} className="text-slate-600" />
           <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Grade Histórica — Edite por mês</span>
         </div>
         <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 p-2 bg-slate-900 border border-slate-800/80 rounded-sm">
            {(() => {
              const values = monthlyConsumption;
              const maxVal = Math.max(...values, 1);
              const positiveValues = values.filter(v => v > 0);
              const minVal = positiveValues.length > 0 ? Math.min(...positiveValues) : 0;
              const maxIdx = values.indexOf(Math.max(...values));
              const minIdx = values.findIndex(v => v > 0 && v === minVal);
              return chartData.map((d, i) => {
                const val = values[i] ?? 0;
                const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                const isMax = i === maxIdx && val > 0;
                const isMin = i === minIdx && val > 0 && minIdx !== maxIdx;
                return (
                  <div key={d.mes} className="flex flex-col items-center gap-1 group">
                     <label className="text-[11px] text-slate-500 group-hover:text-sky-500 transition-colors uppercase font-bold tracking-tighter">
                        {d.mes}
                     </label>
                     <input
                       type="number"
                       value={localConsumption[i]}
                       onChange={e => handleInputChange(i, e.target.value)}
                       onBlur={e => handleInputBlur(i, e.target.value)}
                       className={cn(
                         "w-full bg-slate-950 border rounded-sm py-1.5 text-xs text-sky-400/90 font-mono text-center tabular-nums focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 focus:text-sky-300 focus:outline-none focus:bg-slate-900 transition-all placeholder:text-slate-800",
                         isMax ? 'border-amber-500/30 ring-1 ring-amber-500/10' :
                         isMin ? 'border-sky-500/20 ring-1 ring-sky-500/10' :
                         'border-slate-800'
                       )}
                       placeholder="0"
                     />
                     {/* Micro-barra proporcional */}
                     <div className="w-full h-[3px] bg-slate-800 rounded-full overflow-hidden">
                       <div
                         className={cn(
                           "h-full rounded-full transition-all duration-300",
                           isMax ? 'bg-amber-500/60' : 'bg-sky-500/50'
                         )}
                         style={{ width: `${pct}%` }}
                       />
                     </div>
                     <div className="text-[10px] text-slate-700 font-mono">
                        {d.cargasSimuladas > 0 ? `+${Math.round(d.cargasSimuladas)}` : ''}
                     </div>
                  </div>
                );
              });
            })()}
         </div>
      </div>
    </div>
  );
};
