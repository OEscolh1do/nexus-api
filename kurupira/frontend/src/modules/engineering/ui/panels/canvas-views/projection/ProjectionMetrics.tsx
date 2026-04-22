import React from 'react';
import { TrendingUp, Activity, DollarSign, Zap, TreePine, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';

// Fatores de Conversão (Base: Matriz Elétrica Brasileira)
const CO2_FACTOR = 0.092;  // kg/kWh (SIN/MCTI 2023)
const TREE_FACTOR = 0.0046; // árvores/kWh

// Helper local
function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface KpiCardProps {
  label: string;
  value: string;
  unit: string;
  color: string;
  borderColor?: string;
  icon: React.ReactNode;
  sub?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ 
  label, value, unit, color, borderColor = 'border-slate-800/60', icon, sub 
}) => (
  <div className={cn('flex flex-col gap-1 px-4 py-3 border-r', borderColor, 'min-w-0')}>
    <div className="flex items-center gap-1.5">
      <span className={cn('opacity-60', color)}>{icon}</span>
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">
        {label}
      </span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className={cn('text-xl font-black font-mono tabular-nums tracking-tighter leading-none', color)}>
        {value}
      </span>
      <span className="text-[9px] font-bold text-slate-500 uppercase shrink-0">{unit}</span>
    </div>
    {sub && (
      <span className="text-[9px] text-slate-500 font-medium truncate">{sub}</span>
    )}
  </div>
);

interface ProjectionMetricsProps {
  totalGen: number;
  totalCons: number;
  coverage: number;
  economiaAno: number;
  totalPowerKw: number;
  tariffRate: number;
  moduleCount: number;
}

export const ProjectionMetrics: React.FC<ProjectionMetricsProps> = ({
  totalGen,
  totalCons,
  coverage,
  economiaAno,
  totalPowerKw,
  tariffRate,
  moduleCount,
}) => {
  const co2Saved = totalGen * CO2_FACTOR;
  const treesSaved = totalGen * TREE_FACTOR;

  return (
    <div className="shrink-0 flex items-stretch border-b border-slate-800/60 bg-black/20 overflow-x-auto custom-scrollbar">
      <KpiCard
        label="Geração Estimada"
        value={totalGen.toLocaleString('pt-BR')}
        unit="kWh/ano"
        color="text-amber-400"
        icon={<TrendingUp size={10} />}
        sub={`${(totalGen / 12).toFixed(0)} kWh/mês médio`}
      />
      <KpiCard
        label="Cobertura Solar"
        value={Math.round(coverage).toString()}
        unit="%"
        color={coverage >= 100 ? 'text-emerald-400' : 'text-rose-400'}
        icon={<Activity size={10} />}
        sub={`Consumo: ${totalCons.toLocaleString('pt-BR')} kWh`}
      />
      <KpiCard
        label="Economia Projetada"
        value={tariffRate > 0 ? `R$ ${formatBRL(economiaAno)}` : '—'}
        unit={tariffRate > 0 ? '/ano' : ''}
        color="text-emerald-400"
        icon={<DollarSign size={10} />}
        sub={tariffRate > 0 ? `Tarifa: R$ ${tariffRate.toFixed(2)}/kWh` : 'Configure a tarifa'}
      />
      <KpiCard
        label="Potência Instalada"
        value={totalPowerKw.toFixed(2)}
        unit="kWp"
        color="text-amber-400"
        icon={<Zap size={10} />}
        sub={`${moduleCount} módulo${moduleCount !== 1 ? 's' : ''}`}
      />
      <KpiCard
        label="Árvores Plantadas"
        value={Math.round(treesSaved).toString()}
        unit="un"
        color="text-emerald-500"
        icon={<TreePine size={10} />}
        sub="Impacto por absorção"
      />
      <KpiCard
        label="CO2 Evitado"
        value={co2Saved.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
        unit="kg/ano"
        color="text-sky-400"
        borderColor="border-transparent"
        icon={<Cloud size={10} />}
        sub="Matriz Elétrica BR"
      />
    </div>
  );
};
