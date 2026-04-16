import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSolarStore } from '@/core/state/solarStore';
import { Thermometer } from 'lucide-react';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const ClimateTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const kwh = payload.find((p: any) => p.dataKey === 'consumo')?.value ?? 0;
  const temp = payload.find((p: any) => p.dataKey === 'tempMedia')?.value ?? 0;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-sm p-3 text-[10px] shadow-2xl backdrop-blur-md">
      <p className="text-slate-500 font-bold mb-2 uppercase tracking-widest font-mono">{label}</p>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">CONSUMO</span>
          <span className="text-amber-500 font-mono tabular-nums">{kwh.toFixed(0)} kWh</span>
        </div>
        {temp !== null && temp !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">TEMP MÉDIA</span>
            <span className="text-orange-500 font-mono tabular-nums">{temp.toFixed(1)} °C</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const ClimateCorrelationChart: React.FC = () => {
  const clientData = useSolarStore(s => s.clientData);
  const weatherData = useSolarStore(s => s.weatherData);
  
  const averageConsumption = clientData.averageConsumption || 0;
  
  const monthlyConsumption: number[] = useMemo(() => {
    const inv = clientData.invoices?.[0];
    if (inv?.monthlyHistory?.length === 12) return inv.monthlyHistory;
    return Array(12).fill(averageConsumption);
  }, [clientData.invoices, averageConsumption]);

  const climateData = useMemo(() => {
    return MESES.map((mes, i) => ({
      mes,
      consumo: monthlyConsumption[i] ?? 0,
      tempMedia: weatherData?.temp_monthly?.[i] ?? null,
    }));
  }, [monthlyConsumption, weatherData]);

  // Se não houver dados de clima, renderiza o fallback
  if (!weatherData?.temp_monthly || weatherData.temp_monthly.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50 rounded-sm border border-dashed border-slate-800 h-full p-6 min-h-[220px]">
        <Thermometer size={24} className="text-slate-700 mb-3" />
        <p className="text-[10px] text-slate-500 text-center font-bold uppercase tracking-widest leading-relaxed">
          Monitoramento Climático<br />Indisponível
        </p>
        <div className="mt-4 pt-4 border-t border-slate-800/50 w-full">
          <p className="text-[9px] text-slate-600 italic text-center leading-tight">
            Utilizando baseline normativo de −5°C<br />para cálculos de Voc.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 relative min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={climateData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: '#475569', fontSize: 9, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={{ stroke: '#334155' }} />
            
            {/* Eixo esquerdo: kWh */}
            <YAxis yAxisId="kwh" orientation="left" tick={{ fill: '#475569', fontSize: 9, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} width={45} className="tabular-nums" />
            
            {/* Eixo direito: °C */}
            <YAxis yAxisId="temp" orientation="right" tick={{ fill: '#f97316', fontSize: 9, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} width={30} className="tabular-nums" />

            <Tooltip content={<ClimateTooltip />} cursor={{ fill: 'rgba(245,158,11,0.03)' }} />

            {/* Barras de consumo — eixo esquerdo */}
            <Bar yAxisId="kwh" dataKey="consumo" fill="#f59e0b" opacity={0.6} radius={0} isAnimationActive={false} />

            {/* Linha de temperatura — eixo direito */}
            <Line yAxisId="temp" type="monotone" dataKey="tempMedia" stroke="#f97316" strokeWidth={1.5} dot={{ r: 1.5, fill: '#f97316', strokeWidth: 0 }} activeDot={{ r: 3 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* 4.2 Legenda inline (abaixo do gráfico) */}
      <div className="flex flex-col gap-1.5 mt-4 p-3 border-t border-slate-800/50">
        <span className="flex items-center justify-between text-[9px] text-slate-500 font-mono uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-none bg-amber-500/60 inline-block" />
            Consumo
          </div>
          <span className="text-slate-600 italic">Histórico</span>
        </span>
        <span className="flex items-center justify-between text-[9px] text-slate-500 font-mono uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-[1px] bg-orange-500 inline-block" />
            Temperatura
          </div>
          <span className="text-slate-600 italic">TMY Data</span>
        </span>
      </div>
    </div>
  );
};
