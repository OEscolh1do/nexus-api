import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { useTechStore, LossProfile } from '../../../../store/useTechStore';

export const LossWaterfallChart: React.FC = () => {
  const lossProfile = useTechStore((s: any) => s.lossProfile);
  const prMode = useTechStore((s: any) => s.prCalculationMode);

  // Mapeamento de rótulos amigáveis
  const LOSS_LABELS: Record<keyof LossProfile, string> = {
    orientation: 'Orientação',
    inclination: 'Inclinação',
    shading: 'Sombreamento',
    horizon: 'Horizonte',
    temperature: 'Temperatura',
    mismatch: 'Mismatch',
    soiling: 'Sujeira',
    dcCable: 'Cabos CC',
    acCable: 'Cabos AC',
    inverterEfficiency: 'Inversor',
  };

  // Gerar dados para o Waterfall
  const generateData = () => {
    const steps = [];
    let currentVal = 100;

    // 1. Base Ideal
    steps.push({ name: 'Ideal', start: 0, end: 100, display: 100, type: 'base' });

    // 2. Aplicar perdas sequencialmente
    const lossKeys: (keyof LossProfile)[] = [
      'temperature', 'shading', 'soiling', 'orientation', 'inclination', 
      'horizon', 'mismatch', 'dcCable', 'acCable'
    ];

    lossKeys.forEach(key => {
      const lossPct = lossProfile[key];
      if (lossPct > 0) {
        const prevVal = currentVal;
        if (prMode === 'iec') {
          // Multiplicativo: Val * (1 - loss/100)
          currentVal = currentVal * (1 - lossPct / 100);
        } else {
          // Aditivo: Val - loss
          currentVal = currentVal - lossPct;
        }
        steps.push({ 
          name: LOSS_LABELS[key], 
          start: currentVal, 
          end: prevVal, 
          display: -(prevVal - currentVal),
          type: 'loss' 
        });
      }
    });

    // 3. Eficiência do Inversor
    const invLoss = 100 - lossProfile.inverterEfficiency;
    if (invLoss > 0) {
      const prevVal = currentVal;
      if (prMode === 'iec') {
        currentVal = currentVal * (lossProfile.inverterEfficiency / 100);
      } else {
        currentVal = currentVal - invLoss;
      }
      steps.push({ 
        name: 'Inversor', 
        start: currentVal, 
        end: prevVal, 
        display: -(prevVal - currentVal),
        type: 'loss' 
      });
    }

    // 4. Resultado Final (PR)
    steps.push({ name: 'Real (PR)', start: 0, end: currentVal, display: currentVal, type: 'total' });

    return steps.map(s => ({
      ...s,
      // Recharts Bar precisa de [min, max] para simular waterfall
      value: [s.start, s.end]
    }));
  };

  const chartData = generateData();

  // Encurta os rótulos para mobile
  const formatLabel = (name: string) => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      const shortcuts: Record<string, string> = {
        'Orientação': 'Ori.',
        'Inclinação': 'Inc.',
        'Sombreamento': 'Somb.',
        'Horizonte': 'Horiz.',
        'Temperatura': 'Temp.',
        'Cabos CC': 'CC',
        'Cabos AC': 'AC',
        'Inversor': 'Inv.',
        'Real (PR)': 'PR'
      };
      return shortcuts[name] || name.substring(0, 4) + '.';
    }
    return name;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          margin={{ top: 25, right: 10, left: -25, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#334155" 
            tick={{ fill: '#475569', fontSize: 8, fontWeight: 700, fontFamily: 'monospace' }} 
            axisLine={false} 
            tickLine={false}
            tickFormatter={formatLabel}
          />
          <YAxis 
            domain={[0, 110]} 
            stroke="#334155" 
            tick={{ fill: '#475569', fontSize: 9, fontFamily: 'monospace' }} 
            axisLine={false} 
            tickLine={false} 
            width={40}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 p-2 shadow-2xl rounded-sm">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{d.name}</p>
                    <div className="flex items-baseline gap-1">
                      <span className={cn(
                        "text-xs font-mono font-black",
                        d.type === 'loss' ? "text-rose-500" : d.type === 'total' ? "text-emerald-400" : "text-slate-300"
                      )}>
                        {d.display.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" radius={[2, 2, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.type === 'base' ? '#1e293b' : entry.type === 'loss' ? '#f43f5e' : '#10b981'} 
                fillOpacity={entry.type === 'loss' ? 0.6 : 0.9}
              />
            ))}
            <LabelList 
              dataKey="display" 
              position="top" 
              formatter={(v: any) => `${v > 0 ? '+' : ''}${Number(v).toFixed(1)}%`}
              style={{ fill: '#475569', fontSize: 7, fontWeight: '900', fontFamily: 'monospace' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
