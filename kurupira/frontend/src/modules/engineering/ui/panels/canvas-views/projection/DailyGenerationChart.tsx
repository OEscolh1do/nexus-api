import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#020617',
    borderColor: '#1e293b',
    borderRadius: '4px',
    color: '#f8fafc',
    fontSize: '10px',
    fontWeight: 'bold',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
  },
  itemStyle: { padding: '2px 0' },
  cursor: { stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '4 4' },
};

interface DailyGenerationChartProps {
  data: any[];
}

export const DailyGenerationChart: React.FC<DailyGenerationChartProps> = ({ 
  data 
}) => {
  // Ajusta o intervalo dos ticks do eixo X conforme a largura da tela (lógica simplificada)
  const getTickInterval = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) return 23; // Exibe menos ticks em mobile
    return 15; // Padrão para desktop
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={data} 
          margin={{ top: 10, right: 8, left: -25, bottom: 0 }}
        >
          <defs>
            <linearGradient id="gradDaily" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="hora" 
            stroke="#334155" 
            tick={{ fill: '#475569', fontSize: 9, fontFamily: 'monospace' }} 
            axisLine={false} 
            tickLine={false} 
            interval={getTickInterval()} 
          />
          <YAxis 
            stroke="#334155" 
            tick={{ fill: '#475569', fontSize: 9, fontFamily: 'monospace' }} 
            axisLine={false} 
            tickLine={false}
            width={40}
          />
          <Tooltip 
            {...TOOLTIP_STYLE} 
            formatter={(value: number | string | undefined) => [`${Number(value || 0).toFixed(3)} kWh`, 'Geração']}
            labelStyle={{ color: '#fbbf24', marginBottom: '4px', fontSize: '9px', textTransform: 'uppercase' }}
          />
          
          <Area 
            type="monotone" 
            dataKey="Geração (kWh)" 
            name="Geração"
            stroke="#f59e0b" 
            fill="url(#gradDaily)" 
            strokeWidth={2} 
            animationDuration={1000}
            activeDot={{ r: 4, strokeWidth: 0, fill: '#f59e0b' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
