import React from 'react';
import { 
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { BankMonthData } from '../../../../utils/projectionMath';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-slate-950 border border-slate-800 p-3 rounded-sm shadow-2xl">
        <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">
          Banco de Créditos — {data.month}
        </div>
        
        <div className="space-y-2">
          {data.deposito > 0 && (
            <div className="flex justify-between gap-4 items-center">
              <span className="text-[9px] font-bold text-emerald-500 uppercase">Reserva Gerada</span>
              <span className="text-[10px] font-black text-white tabular-nums">+{data.deposito.toFixed(0)} kWh</span>
            </div>
          )}
          {data.saque > 0 && (
            <div className="flex justify-between gap-4 items-center">
              <span className="text-[9px] font-bold text-sky-500 uppercase">Reserva Utilizada</span>
              <span className="text-[10px] font-black text-white tabular-nums">-{data.saque.toFixed(0)} kWh</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-800 flex justify-between gap-4 items-center">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Saldo Disponível</span>
            <span className="text-sm font-black text-violet-400 tabular-nums">{data.saldo.toFixed(0)} kWh</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

interface CreditBankChartProps {
  data: BankMonthData[];
}

export const CreditBankChart: React.FC<CreditBankChartProps> = ({ data }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  // Preparar dados para visualização de saque (negativo no gráfico)
  const processedData = data.map(d => ({
    ...d,
    saqueVisual: -d.saque
  }));

  // Formata o mês para apenas a inicial se o espaço for curto
  const formatMonth = (value: string) => {
    if (isMobile) return value.charAt(0).toUpperCase();
    return value;
  };

  // Formata kWh para abreviação técnica (k para milhares)
  const formatYAxis = (v: number) => {
    if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return v.toString();
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart 
          data={processedData} 
          margin={{ top: 15, right: 10, left: -25, bottom: 0 }}
        >
          <defs>
            <linearGradient id="gradBank" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} />
          
          <XAxis 
            dataKey="month" 
            stroke="#334155" 
            tick={{ fill: '#475569', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }} 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={formatMonth}
          />
          
          <YAxis 
            stroke="#334155" 
            tick={{ fill: '#475569', fontSize: 9, fontFamily: 'monospace' }} 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={formatYAxis}
            width={40}
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)', opacity: 0.3 }} />
          
          <ReferenceLine y={0} stroke="#334155" strokeWidth={1} />

          {/* Saldo Acumulado (Área de Fundo) */}
          <Area
            type="monotone"
            dataKey="saldo"
            stroke="#8b5cf6"
            fill="url(#gradBank)"
            strokeWidth={1.5}
            isAnimationActive={true}
            activeDot={{ r: 4, strokeWidth: 0, fill: '#8b5cf6' }}
          />

          {/* Depósitos (Geração Excedente) */}
          <Bar 
            dataKey="deposito" 
            fill="#10b981" 
            fillOpacity={0.8} 
            radius={[2, 2, 0, 0]} 
            barSize={isMobile ? 8 : 12}
          />

          {/* Saques (Uso da Reserva - Domínio Consumo) */}
          <Bar 
            dataKey="saqueVisual" 
            fill="#0ea5e9" 
            fillOpacity={0.8} 
            radius={[0, 0, 2, 2]} 
            barSize={isMobile ? 8 : 12}
          />
          
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
