import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { useSolarStore } from '@/core/state/solarStore';
import { Zap, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Custom Tooltip component
const CustomConsumptionTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const base = payload.find((p: any) => p.dataKey === 'consumoBase')?.value ?? 0;
  const simul = payload.find((p: any) => p.dataKey === 'cargasSimuladas')?.value ?? 0;
  const media = payload.find((p: any) => typeof p.payload.media === 'number')?.payload?.media ?? 0;
  const total = base + simul;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-sm p-4 text-[11px] shadow-2xl backdrop-blur-md">
      <p className="text-slate-500 font-bold mb-3 uppercase tracking-widest font-mono">{label}</p>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between gap-6">
          <span className="text-slate-400">HISTÓRICO BASE</span>
          <span className="text-amber-500 font-mono tabular-nums">{base.toFixed(0)} kWh</span>
        </div>
        {simul > 0 && (
          <div className="flex justify-between gap-6">
            <span className="text-slate-400">CARGAS SIMULADAS</span>
            <span className="text-amber-300 font-mono tabular-nums">+{simul.toFixed(0)} kWh</span>
          </div>
        )}
        <div className="flex justify-between gap-6 border-t border-slate-800 pt-2 mt-1">
          <span className="text-slate-300 font-bold">TOTAL MENSAL</span>
          <span className="text-white font-mono font-bold tabular-nums">{total.toFixed(0)} kWh</span>
        </div>
        {media > 0 && (
           <div className="text-[9px] text-slate-600 font-mono text-right mt-1 border-l border-amber-500/30 pl-2">
             MÉDIA ANUAL REF: {media.toFixed(0)} kWh
           </div>
        )}
      </div>
    </div>
  );
};

interface EditPopoverProps {
  monthIndex: number;
  value: number;
  onSave: (v: number) => void;
  onClose: () => void;
}

const EditPopover: React.FC<EditPopoverProps> = ({ monthIndex, value, onSave, onClose }) => {
  const [draft, setDraft] = useState(String(Math.round(value)));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  const commit = () => {
    const v = parseFloat(draft.replace(',', '.'));
    if (!isNaN(v) && v >= 0) onSave(v);
    onClose();
  };

  return (
    <div className="bg-slate-800 border border-amber-600/50 rounded-sm px-2 py-1.5 flex items-center gap-1.5 shadow-xl shadow-black/40 z-50">
      <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider">{MESES[monthIndex]}</span>
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onClose(); }}
        className="w-16 bg-slate-900 text-amber-300 text-xs font-mono text-right px-1 py-0.5 border border-slate-700 rounded-sm focus:outline-none focus:border-amber-500"
      />
      <span className="text-[9px] text-slate-500 font-mono">kWh</span>
      <button onClick={commit} className="text-emerald-400 hover:text-emerald-300 transition-colors">
        <Check size={12} />
      </button>
    </div>
  );
};

export const ConsumptionChart: React.FC = () => {
  const clientData = useSolarStore(s => s.clientData);
  const averageConsumption = clientData.averageConsumption || 0;
  const updateClientData = useSolarStore(s => s.updateClientData);
  const updateMonthlyConsumption = useSolarStore(s => s.updateMonthlyConsumption);
  const simulatedItems = useSolarStore(s => s.simulatedItems);

  const [editingMonth, setEditingMonth] = useState<number | null>(null);

  // Fetch monthly history or use uniform history derived from averageConsumption
  const monthlyConsumption: number[] = useMemo(() => {
    const inv = clientData.invoices?.[0];
    if (inv?.monthlyHistory?.length === 12) return inv.monthlyHistory;
    return Array(12).fill(averageConsumption);
  }, [clientData.invoices, averageConsumption]);

  // Derived chart data combining base consumption and simulated per-month profile
  const chartData = useMemo(() => {
    // Calculate uniform average for ReferenceLine
    const validMonths = monthlyConsumption.filter(v => v > 0);
    const media = validMonths.length > 0 ? (validMonths.reduce((a, b) => a + b, 0) / validMonths.length) : 0;

    return MESES.map((mes, i) => {
      // Aggregate simulated loads for the given month 'i'
      const cargasSimuladas = Object.values(simulatedItems.entities).reduce((sum, item) => {
        const duty = item.dutyCycle ?? 1;
        const kWh = ((item.power * duty * item.hoursPerDay * (item.daysPerMonth ?? 30) * item.qty) / 1000);
        
        const isConstante = !item.perfil || item.perfil === 'constante';
        const isVerao = item.perfil === 'verao' && [0, 1, 2, 9, 10, 11].includes(i); // Jan,Feb,Mar,Oct,Nov,Dec
        const isInverno = item.perfil === 'inverno' && [4, 5, 6, 7].includes(i); // May,Jun,Jul,Aug
        
        const ativo = isConstante || isVerao || isInverno;
        return sum + (ativo ? kWh : 0);
      }, 0);

      return {
        mes,
        consumoBase: monthlyConsumption[i] ?? 0,
        cargasSimuladas: Math.round(cargasSimuladas),
        media: Math.round(media),
      };
    });
  }, [monthlyConsumption, simulatedItems]);

  const isEmpty = averageConsumption === 0 && chartData.every(d => d.consumoBase === 0 && d.cargasSimuladas === 0);

  return (
    <div className="flex flex-col h-full z-0">
      {/* 3.1 Campo de entrada rápida (topo do painel) */}
      <div className={cn(
        "flex items-center gap-4 mb-4 p-4 bg-slate-900 rounded-sm border transition-colors shrink-0",
        averageConsumption === 0 
          ? "border-amber-500 border-dashed animate-pulse-slow" 
          : "border-amber-500/20"
      )}>
        <Zap size={14} className="text-amber-400 shrink-0" />
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Consumo médio mensal</span>
        <input
          type="number"
          value={averageConsumption || ''}
          onChange={e => updateClientData({ averageConsumption: Number(e.target.value) })}
          className="w-32 bg-slate-800 border border-slate-700 rounded-sm px-3 py-1.5 text-sm text-white text-right font-mono tabular-nums focus:border-amber-500 focus:outline-none placeholder:text-slate-600 focus:bg-slate-950 transition-all"
          min={0} 
          placeholder={averageConsumption === 0 ? "0" : "kWh"}
        />
        <span className="text-[10px] text-slate-500 font-mono">kWh/mês</span>
      </div>

      {/* 3.2 Gráfico ComposedChart */}
      <div className="flex-1 relative min-h-[220px]">
        {isEmpty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="p-4 rounded-full bg-amber-500/10 text-amber-500/60 mb-4">
              <Zap size={32} />
            </div>
            <p className="text-slate-300 font-medium">Nenhum consumo informado</p>
            <p className="text-slate-600 text-xs text-center mt-1 max-w-[200px]">
              Insira o consumo médio acima para visualizar o perfil de 12 meses.
            </p>
          </div>
        ) : (
          <>
            {editingMonth !== null && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50">
                <EditPopover
                  monthIndex={editingMonth}
                  value={monthlyConsumption[editingMonth]}
                  onSave={(v) => updateMonthlyConsumption(editingMonth, v)}
                  onClose={() => setEditingMonth(null)}
                />
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 500 }} 
                  tickLine={false} 
                  axisLine={{ stroke: '#334155' }} 
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-mono)' }} 
                  unit=" kWh" 
                  width={60} 
                  tickLine={false} 
                  axisLine={false} 
                  className="tabular-nums"
                />
                <Tooltip content={<CustomConsumptionTooltip />} cursor={{ fill: 'rgba(245,158,11,0.03)' }} />

                {/* Linha de média */}
                <ReferenceLine y={chartData[0]?.media} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.3} />

                {/* Consumo base */}
                <Bar 
                  dataKey="consumoBase" 
                  stackId="a" 
                  fill="#f59e0b" 
                  opacity={0.8} 
                  radius={[0,0,0,0]} 
                  isAnimationActive={false}
                  onClick={(_, index) => setEditingMonth(editingMonth === index ? null : index)}
                  cursor="pointer"
                >
                  {chartData.map((_, i) => (
                    <Cell 
                      key={`cell-${i}`} 
                      fill={editingMonth === i ? '#fbbf24' : '#f59e0b'}
                      className="transition-colors hover:fill-amber-400"
                    />
                  ))}
                </Bar>

                {/* Cargas simuladas empilhadas */}
                {chartData.some(d => d.cargasSimuladas > 0) && (
                  <Bar 
                    dataKey="cargasSimuladas" 
                    stackId="a" 
                    fill="#fbbf24" 
                    opacity={0.3} 
                    radius={[0,0,0,0]} 
                    isAnimationActive={false} 
                  />
                )}

              </ComposedChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
};
