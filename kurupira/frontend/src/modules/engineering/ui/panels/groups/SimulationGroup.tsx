/**
 * =============================================================================
 * SIMULATION GROUP — Geração vs Consumo + FDI Dashboard (UX-002)
 * =============================================================================
 *
 * Grupo extraído do RightInspector (SimulationMetricsSection).
 * Contém o gráfico Recharts de barras (consumo × geração) e o micro-dashboard FDI.
 * Auto-suficiente: consome suas próprias stores e hooks.
 * =============================================================================
 */

import React, { useMemo } from 'react';
import {
  BarChart3, ArrowUpRight, ArrowDownRight,
  CheckCircle2, AlertTriangle, Activity,
} from 'lucide-react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '../../../store/useTechStore';
import { useTechKPIs } from '../../../hooks/useTechKPIs';
import { getFdiStatus } from '../../../constants/thresholds';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

// =============================================================================
// CONSTANTS
// =============================================================================

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// =============================================================================
// COMPONENT
// =============================================================================

export const SimulationGroup: React.FC = () => {
  const clientData = useSolarStore((state) => state.clientData);
  const modules = useSolarStore(selectModules);
  const { getPerformanceRatio } = useTechStore();
  const { kpi } = useTechKPIs();

  const data = useMemo(() => {
    const totalPowerKw = modules.reduce((acc, m) => acc + m.power, 0) / 1000;
    const pr = getPerformanceRatio();

    const consumptionInvoices = clientData.invoices?.[0]?.monthlyHistory;
    const hasMonthlyData = consumptionInvoices?.length === 12 && consumptionInvoices.some((v) => v > 0);

    const consumptionHistory = hasMonthlyData
      ? consumptionInvoices
      : Array(12).fill(clientData.averageConsumption || 400);

    const avgCons = consumptionHistory.reduce((a: number, b: number) => a + b, 0) / 12;

    const irradiationData =
      clientData.monthlyIrradiation &&
      clientData.monthlyIrradiation.length === 12 &&
      clientData.monthlyIrradiation.some((v) => v > 0)
        ? clientData.monthlyIrradiation
        : Array(12).fill(4.5);

    let totalGenYear = 0;
    let totalConsYear = 0;

    const chartData = MONTHS.map((month, idx) => {
      const hsp = irradiationData[idx];
      const consumption = consumptionHistory[idx] || avgCons;
      const generation = totalPowerKw * hsp * 30 * pr;

      totalGenYear += generation;
      totalConsYear += consumption;

      return { name: month, consumo: Math.round(consumption), geracao: Math.round(generation) };
    });

    const averageGen = totalGenYear / 12;
    const averageCons = totalConsYear / 12;
    const coverage = totalConsYear > 0 ? totalGenYear / totalConsYear : 0;

    return { chartData, averageGen, averageCons, coverage };
  }, [modules, clientData, getPerformanceRatio]);

  const isPositive = data.averageGen >= data.averageCons;
  const hasEquipment = modules.length > 0;

  // FDI Evaluation
  const fdiPercent = kpi.dcAcRatio * 100;
  const fdiStatus = getFdiStatus(kpi.dcAcRatio);
  const isFdiLow = fdiStatus === 'oversized';
  const isFdiHigh = fdiStatus === 'clipping';

  return (
    <div className="p-3 space-y-3">
      {/* ── CHART ── */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-3 relative h-[140px] flex flex-col pt-1">
        <div className="flex items-center justify-between z-10 relative mb-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <BarChart3 size={11} className="text-teal-400" />
            <span>Geração vs Consumo</span>
          </div>

          <div className={`flex items-center gap-1 text-[10px] font-bold ${isPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {(data.coverage * 100).toFixed(0)}%
          </div>
        </div>

        {!hasEquipment && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-900/80 px-2 py-1 rounded">Sem módulos</span>
          </div>
        )}

        <div className={`flex-1 min-h-0 w-full -ml-3 ${!hasEquipment ? 'opacity-20' : ''}`}>
          <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
            <BarChart data={data.chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barGap={0}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 7, fill: '#64748b' }} interval="preserveStartEnd" />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '10px', borderRadius: '6px' }}
                itemStyle={{ padding: 0 }}
              />
              <Bar dataKey="consumo" fill="#fb923c" radius={[2, 2, 0, 0]} barSize={6} animationDuration={500} />
              <Bar dataKey="geracao" fill="#2dd4bf" radius={[2, 2, 0, 0]} barSize={6} animationDuration={500} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-800">
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-500 uppercase font-bold">Consumo Médio</span>
            <span className="text-[10px] font-bold text-orange-400">{data.averageCons.toFixed(0)} kWh</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[8px] text-slate-500 uppercase font-bold">Geração Est.</span>
            <span className="text-[10px] font-bold text-teal-400">{data.averageGen.toFixed(0)} kWh</span>
          </div>
        </div>
      </div>

      {/* ── FDI MICRO-DASHBOARD ── */}
      {hasEquipment && (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-2.5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">FDI (DC/AC)</span>
            <span
              className={`text-base font-black leading-none mt-0.5 ${
                isFdiHigh ? 'text-red-400' : isFdiLow ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {fdiPercent.toFixed(1)}%
            </span>
          </div>
          <div className="flex flex-col items-end text-right justify-center">
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
                isFdiHigh
                  ? 'border-red-900/50 bg-red-900/20'
                  : isFdiLow
                    ? 'border-amber-900/50 bg-amber-900/20'
                    : 'border-emerald-900/50 bg-emerald-900/20'
              }`}
            >
              {isFdiHigh ? (
                <Activity size={10} className="text-red-400" />
              ) : isFdiLow ? (
                <AlertTriangle size={10} className="text-amber-400" />
              ) : (
                <CheckCircle2 size={10} className="text-emerald-400" />
              )}
              <span
                className={`text-[9px] font-bold ${
                  isFdiHigh ? 'text-red-400' : isFdiLow ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {isFdiHigh ? 'Clipping Anual' : isFdiLow ? 'Oversized AC' : 'Ideal'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
