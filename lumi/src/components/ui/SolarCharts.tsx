
import React from 'react';
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ComposedChart, Area, AreaChart, ReferenceLine
} from 'recharts';
import { ChartData } from '@/core/types';

interface ChartProps {
  data: ChartData[];
}

export const GenerationChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorGen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#05CD46" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#05CD46" stopOpacity={0.05}/>
            </linearGradient>
            <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#64147D" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#64147D" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#94a3b8'}} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 600, fill: '#94a3b8'}} />
          <Tooltip 
            contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '10px', fontFamily: 'Consolas, monospace' }}
          />
          <Bar dataKey="consumption" name="Consumo (kWh)" fill="url(#colorCons)" radius={[4, 4, 0, 0]} barSize={20} />
          <Area type="monotone" dataKey="generation" name="Geração (kWh)" stroke="#05CD46" strokeWidth={3} fillOpacity={1} fill="url(#colorGen)" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CumulativeSavingsChart: React.FC<{ annualSavings: number, investment: number }> = ({ annualSavings, investment }) => {
  const data = Array.from({ length: 26 }, (_, i) => {
    const savings = (annualSavings * i) - (i === 0 ? 0 : investment);
    return { year: `Ano ${i}`, valor: savings };
  });

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#05CD46" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#05CD46" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="year" hide />
          <YAxis hide />
          <Tooltip 
             formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
             contentStyle={{ borderRadius: '10px', fontSize: '10px', border: 'none' }}
          />
          <ReferenceLine y={0} stroke="#64147D" strokeDasharray="3 3" />
          <Area type="monotone" dataKey="valor" stroke="#05CD46" strokeWidth={3} fill="url(#colorRoi)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};


