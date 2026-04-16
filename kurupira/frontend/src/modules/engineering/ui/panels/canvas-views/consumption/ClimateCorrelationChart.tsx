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
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-slate-400 font-bold mb-2 uppercase tracking-wider">{label}</p>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between gap-4 text-amber-500">
          <span className="text-slate-400">Consumo:</span>
          <span>{kwh.toFixed(0)} kWh</span>
        </div>
        {temp !== null && temp !== undefined && (
          <div className="flex justify-between gap-4 text-orange-500">
            <span className="text-slate-400">Temp Média:</span>
            <span>{temp.toFixed(1)} °C</span>
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
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50 rounded-lg border border-dashed border-slate-700 h-full p-4 min-h-[220px]">
        <Thermometer size={24} className="text-slate-600 mb-2" />
        <p className="text-xs text-slate-500 text-center">
          Dados climáticos não disponíveis<br />{clientData.city ? `para ${clientData.city}` : 'nesta localidade'}
        </p>
        <p className="text-[10px] text-slate-600 mt-2 italic text-center">
          Temperatura mínima padrão: −5°C (conservador)
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 relative min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={climateData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: '#334155' }} />
            
            {/* Eixo esquerdo: kWh */}
            <YAxis yAxisId="kwh" orientation="left" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} unit=" kWh" tickLine={false} axisLine={false} width={56} />
            
            {/* Eixo direito: °C */}
            <YAxis yAxisId="temp" orientation="right" tick={{ fill: '#f97316', fontSize: 10, fontFamily: 'monospace' }} unit="°C" tickLine={false} axisLine={false} width={36} />

            <Tooltip content={<ClimateTooltip />} cursor={{ fill: 'rgba(245,158,11,0.05)' }} />

            {/* Barras de consumo — eixo esquerdo */}
            <Bar yAxisId="kwh" dataKey="consumo" fill="#f59e0b" opacity={0.7} radius={[2,2,0,0]} isAnimationActive={false} />

            {/* Linha de temperatura — eixo direito */}
            <Line yAxisId="temp" type="monotone" dataKey="tempMedia" stroke="#f97316" strokeWidth={2} dot={{ r: 2, fill: '#f97316', strokeWidth: 0 }} activeDot={{ r: 4 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* 4.2 Legenda inline (abaixo do gráfico) */}
      <div className="flex gap-4 mt-3 text-[10px] text-slate-500 justify-center">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/70 inline-block mb-px" />
          Consumo kWh
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-[3px] bg-orange-500 inline-block" />
          Temperatura média °C
        </span>
      </div>
    </div>
  );
};
