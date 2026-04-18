import React, { useState, useMemo } from 'react';
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
} from 'recharts';
import { useSolarStore } from '@/core/state/solarStore';
import { Zap, Sun, Thermometer } from 'lucide-react';
import { cn } from '@/lib/utils';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Custom Tooltip component
const CustomConsumptionTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const base = payload.find((p: any) => p.dataKey === 'consumoBase')?.value ?? 0;
  const simul = payload.find((p: any) => p.dataKey === 'cargasSimuladas')?.value ?? 0;
  const hsp = payload.find((p: any) => p.dataKey === 'hsp')?.value ?? null;
  const temp = payload.find((p: any) => p.dataKey === 'temp')?.value ?? null;
  const total = base + simul;

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

  // Fetch monthly history or use uniform history derived from averageConsumption
  const monthlyConsumption: number[] = useMemo(() => {
    const inv = clientData.invoices?.[0];
    if (inv?.monthlyHistory?.length === 12) return inv.monthlyHistory;
    return Array(12).fill(averageConsumption);
  }, [clientData.invoices, averageConsumption]);

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
        cargasSimuladas: cargasSimuladas, // Removendo o Math.round para manter precisão
        media: media, // Removendo o Math.round
        hsp: hspArray[i] ?? 0,
        temp: tempArray[i] ?? 0,
      };
    });
  }, [monthlyConsumption, simulatedItems, clientData.monthlyIrradiation, weatherData]);

  const isEmpty = averageConsumption === 0 && chartData.every(d => d.consumoBase === 0 && d.cargasSimuladas === 0);

  return (
    <div className="flex flex-col h-full gap-4 z-0">
      
      {/* ── CONTROLES SUPERIORES (Unificados) ────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-slate-900 border border-slate-800/60 p-3 rounded-sm shrink-0">
        
        {/* Visibility Toggles */}
        <div className="flex items-center gap-2 pr-4 border-r border-slate-800">
           <span className="text-[11px] text-slate-600 uppercase font-black tracking-widest mr-2">Camadas Climáticas (TMY):</span>
           <button 
             onClick={() => setShowHSP(!showHSP)}
             className={cn(
               "flex items-center gap-1.5 px-2 py-1 border rounded-sm transition-all active:scale-95",
               showHSP 
                ? "bg-sky-500/10 border-sky-500 text-sky-500" 
                : "bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400 hover:border-slate-700"
             )}
           >
             <Sun size={10} />
             <span className="text-[11px] font-black uppercase tracking-tighter">HSP</span>
           </button>
           <button 
             onClick={() => setShowTemp(!showTemp)}
             className={cn(
               "flex items-center gap-1.5 px-2 py-1 border rounded-sm transition-all active:scale-95",
               showTemp 
                ? "bg-rose-500/10 border-rose-500 text-rose-500" 
                : "bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400 hover:border-slate-700"
             )}
           >
             <Thermometer size={10} />
             <span className="text-[11px] font-black uppercase tracking-tighter">TEMP</span>
           </button>
        </div>

        {/* Legenda Dinâmica */}
        <div className="hidden lg:flex items-center gap-4 h-6">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-sky-500 rounded-sm" />
              <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Histórico</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-sky-500/30 rounded-sm" />
              <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Simulado</span>
           </div>
        </div>
      </div>

      {/* ── ÁREA DO GRÁFICO (REDUZIDA) ────────────────────────────────── */}
      <div className="flex-1 relative min-h-[160px] max-h-[220px]">
        {isEmpty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
            <Zap size={24} className="text-sky-500/40 mb-2" />
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Aguardando dados de consumo</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
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
              {(showHSP || showTemp) && (
                <YAxis 
                  yAxisId="climate"
                  orientation="right"
                  domain={[0, 45]}
                  tick={{ fill: '#475569', fontSize: 11, fontFamily: 'var(--font-mono)' }} 
                  width={35} 
                  tickLine={false} 
                  axisLine={false} 
                  className="tabular-nums"
                />
              )}
              
              <Tooltip content={<CustomConsumptionTooltip />} cursor={{ fill: 'rgba(245,158,11,0.03)' }} />
              <ReferenceLine yAxisId="energy" y={chartData[0]?.media} stroke="#0ea5e9" strokeDasharray="3 3" strokeOpacity={0.2} />
              
              <Bar 
                yAxisId="energy"
                dataKey="consumoBase" 
                stackId="a" 
                fill="#0ea5e9" 
                radius={[0,0,0,0]} 
                isAnimationActive={false}
              />
              <Bar 
                yAxisId="energy"
                dataKey="cargasSimuladas" 
                stackId="a" 
                fill="#0ea5e9" 
                opacity={0.3} 
                radius={[0,0,0,0]} 
                isAnimationActive={false} 
              />

              {showHSP && (
                <Line
                  yAxisId="climate"
                  type="monotone"
                  dataKey="hsp"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {showTemp && (
                <Line
                  yAxisId="climate"
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
        )}
      </div>

      {/* ── GRADE DE EDIÇÃO DIRETA (12 MESES) ────────────────────────── */}
      {!isEmpty && (
        <div className="flex flex-col gap-2">
           <span className="text-[11px] text-slate-600 uppercase font-black tracking-widest ml-1">Lançamento por Mês Elétrico (History Grid)</span>
           <div className="grid grid-cols-6 lg:grid-cols-12 gap-1.5 p-2 bg-slate-900 border border-slate-800/80 rounded-sm">
              {chartData.map((d, i) => (
                <div key={d.mes} className="flex flex-col items-center gap-1 group">
                   <label className="text-[11px] text-slate-500 group-hover:text-sky-500 transition-colors uppercase font-bold tracking-tighter">
                      {d.mes}
                   </label>
                   <input
                     type="number"
                     value={monthlyConsumption[i].toFixed(2) || ''}
                     onChange={e => updateMonthlyConsumption(i, Number(e.target.value))}
                     className="w-full bg-slate-950 border border-slate-800 rounded-sm py-1.5 text-xs text-sky-500/80 font-mono text-center tabular-nums focus:border-sky-500 focus:text-sky-400 focus:outline-none focus:bg-slate-900 transition-all placeholder:text-slate-800"
                     placeholder="0.00"
                   />
                   <div className="text-[11px] text-slate-700 font-mono">
                      {d.cargasSimuladas > 0 ? `+${d.cargasSimuladas.toFixed(2)}` : ''}
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

    </div>
  );
};
