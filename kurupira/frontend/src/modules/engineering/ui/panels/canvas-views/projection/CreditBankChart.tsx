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
              <span className="text-[9px] font-bold text-amber-500 uppercase">Reserva Utilizada</span>
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
  // Preparar dados para visualização de saque (negativo no gráfico)
  const processedData = data.map(d => ({
    ...d,
    saqueVisual: -d.saque
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={processedData} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
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
          tick={{ fill: '#475569', fontSize: 9, fontWeight: 700 }} 
          axisLine={false} 
          tickLine={false} 
        />
        
        <YAxis 
          stroke="#334155" 
          tick={{ fill: '#475569', fontSize: 9 }} 
          axisLine={false} 
          tickLine={false} 
        />
        
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.3 }} />
        
        <ReferenceLine y={0} stroke="#334155" strokeWidth={1} />

        {/* Saldo Acumulado (Área de Fundo) */}
        <Area
          type="monotone"
          dataKey="saldo"
          stroke="#8b5cf6"
          fill="url(#gradBank)"
          strokeWidth={1.5}
          isAnimationActive={true}
        />

        {/* Depósitos (Geração Excedente) */}
        <Bar 
          dataKey="deposito" 
          fill="#10b981" 
          fillOpacity={0.7} 
          radius={[2, 2, 0, 0]} 
          barSize={12}
        />

        {/* Saques (Uso da Reserva) */}
        <Bar 
          dataKey="saqueVisual" 
          fill="#f59e0b" 
          fillOpacity={0.7} 
          radius={[0, 0, 2, 2]} 
          barSize={12}
        />
        
      </ComposedChart>
    </ResponsiveContainer>
  );
};
