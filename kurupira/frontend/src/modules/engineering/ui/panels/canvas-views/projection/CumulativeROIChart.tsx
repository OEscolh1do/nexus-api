import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { ROIYearData } from '../../../../utils/projectionMath';

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#020617',
    borderColor: '#1e293b',
    borderRadius: '4px',
    color: '#f8fafc',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  itemStyle: { fontWeight: 'bold' as const },
  cursor: { fill: '#1e293b', opacity: 0.5 },
};

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface CumulativeROIChartProps {
  data: ROIYearData[];
}

export const CumulativeROIChart: React.FC<CumulativeROIChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="gradROI" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} />
        <XAxis 
          dataKey="year" 
          stroke="#334155" 
          tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} 
          axisLine={false} 
          tickLine={false}
          label={{ value: 'Anos', position: 'insideBottomRight', offset: -5, fontSize: 8, fill: '#475569', fontWeight: 'bold' }}
        />
        <YAxis 
          stroke="#334155" 
          tickFormatter={(v) => `R$ ${v/1000}k`}
          tick={{ fill: '#475569', fontSize: 10 }} 
          axisLine={false} 
          tickLine={false} 
        />
        <Tooltip 
          {...TOOLTIP_STYLE} 
          formatter={(value: any) => [formatBRL(Number(value)), 'Economia Acumulada']}
          labelFormatter={(label) => `Ano ${label}`}
        />
        <Area 
          type="monotone" 
          dataKey="cumulative" 
          stroke="#10b981" 
          strokeWidth={3}
          fill="url(#gradROI)" 
          animationDuration={1500}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
