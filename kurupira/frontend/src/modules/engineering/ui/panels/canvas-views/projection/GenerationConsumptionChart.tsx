import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { ProjectionMonthData } from '../../../../utils/projectionMath';

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

interface GenerationConsumptionChartProps {
  data: ProjectionMonthData[];
}

export const GenerationConsumptionChart: React.FC<GenerationConsumptionChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} />
        <XAxis 
          dataKey="month" 
          stroke="#334155" 
          tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} 
          axisLine={false} 
          tickLine={false} 
        />
        <YAxis 
          stroke="#334155" 
          tick={{ fill: '#475569', fontSize: 10 }} 
          axisLine={false} 
          tickLine={false} 
        />
        <Tooltip 
          {...TOOLTIP_STYLE} 
          formatter={(value: any) => [`${Number(value || 0).toFixed(0)} kWh`, '']}
        />
        <Legend 
          iconType="circle" 
          wrapperStyle={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', paddingTop: '10px' }} 
        />
        <Bar dataKey="cons" name="Consumo (kWh)" fill="#0ea5e9" radius={[2, 2, 0, 0]} maxBarSize={32} />
        <Bar dataKey="gen"  name="Geração (kWh)" fill="#f59e0b" radius={[2, 2, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
};
