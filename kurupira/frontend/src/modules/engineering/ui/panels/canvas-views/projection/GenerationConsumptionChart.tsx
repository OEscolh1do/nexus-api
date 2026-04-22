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
  // Formata o mês para apenas a inicial se o espaço for curto (lógica simplificada)
  const formatMonth = (value: string) => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return value.charAt(0).toUpperCase();
    }
    return value;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          margin={{ 
            top: 10, 
            right: 5, 
            left: -20, 
            bottom: 0 
          }}
        >
          <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="month" 
            stroke="#334155" 
            tick={{ fill: '#475569', fontSize: 9, fontWeight: 700 }} 
            axisLine={false} 
            tickLine={false}
            tickFormatter={formatMonth}
            interval={0}
          />
          <YAxis 
            stroke="#334155" 
            tick={{ fill: '#475569', fontSize: 9, fontFamily: 'monospace' }} 
            axisLine={false} 
            tickLine={false}
            width={35}
          />
          <Tooltip 
            {...TOOLTIP_STYLE} 
            formatter={(value: any) => [`${Number(value || 0).toFixed(0)} kWh`, '']}
            labelStyle={{ color: '#fbbf24', marginBottom: '4px' }}
          />
          <Legend 
            iconType="circle" 
            iconSize={8}
            wrapperStyle={{ 
              fontSize: '9px', 
              fontWeight: 800, 
              color: '#64748b', 
              paddingTop: '15px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }} 
          />
          <Bar 
            dataKey="baseCons" 
            name="Base" 
            stackId="cons" 
            fill="#0ea5e9" 
            radius={[0, 0, 0, 0]} 
            maxBarSize={24} 
          />
          <Bar 
            dataKey="addedLoad" 
            name="Adicional" 
            stackId="cons" 
            fill="#0369a1" 
            radius={[2, 2, 0, 0]} 
            maxBarSize={24} 
          />
          <Bar 
            dataKey="gen"  
            name="Geração" 
            fill="#f59e0b" 
            radius={[2, 2, 0, 0]} 
            maxBarSize={24} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
