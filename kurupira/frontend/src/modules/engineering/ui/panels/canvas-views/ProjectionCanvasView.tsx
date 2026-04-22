/**
 * =============================================================================
 * PROJECTION CANVAS VIEW — Cockpit de Projeção Energética
 * =============================================================================
 * Spec: views-spec-view-simulation-v1.md
 * Ativada por: activeFocusedBlock === 'projection'
 * Acento: Amber (Geração/Módulos — Matriz Semântica context.md v3.8.1)
 *
 * Layout (Cockpit Vertical, full-width):
 *   HEADER HUD   — Geração Anual + PR + Payback
 *   PAINEL 1     — Decomposição de PR (ProjectionLossBar — motor reutilizado)
 *   PAINEL 2     — KPIs: Geração | Cobertura | Economia R$ | kWp Instalado
 *   PAINEL 3     — Gráfico Multi-visão (Barras / Composição / Curva Diária / Tabela)
 *   PAINEL 4     — Banco de Créditos ANEEL (acumulação 12 meses)
 * =============================================================================
 */

import React, { useMemo, useState } from 'react';
import { TrendingUp, BarChart2, Layers, Clock, Table2, ChevronDown, Sliders, Zap } from 'lucide-react';

import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '../../../store/useTechStore';
import { useUIStore } from '@/core/state/uiStore';
import { getDailyProfile, HOUR_LABELS } from '../../../utils/dailyProfile';
import { cn } from '@/lib/utils';

// Importações dos novos componentes e utilitários
import { ProjectionLossSidebar } from './projection/ProjectionLossSidebar';
import { ProjectionMetrics } from './projection/ProjectionMetrics';
import { GenerationConsumptionChart } from './projection/GenerationConsumptionChart';
import { CumulativeROIChart } from './projection/CumulativeROIChart';
import { FinancialBalanceChart } from './projection/FinancialBalanceChart';
import { DailyGenerationChart } from './projection/DailyGenerationChart';
import { AnalyticsTable } from './projection/AnalyticsTable';
import { CreditBankChart } from './projection/CreditBankChart';
import { LossWaterfallChart } from './projection/LossWaterfallChart';
import { calculateProjectionStats, MONTHS } from '../../../utils/projectionMath';

// ─── CONSTANTES & TIPOS ───────────────────────────────────────────────────────


// ─── SUB-COMPONENTES AUXILIARES ───────────────────────────────────────────────

const DashboardCell: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  controls?: React.ReactNode;
}> = ({ title, icon, children, className, controls }) => (
  <div className={cn("flex flex-col border border-slate-800/60 bg-black/10 overflow-hidden", className)}>
    <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-slate-800/40 bg-black/20">
      <span className="text-slate-500">{icon}</span>
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex-1">
        {title}
      </span>
      {controls && <div className="flex items-center gap-2">{controls}</div>}
    </div>
    <div className="flex-1 p-4 min-h-0">
      {children}
    </div>
  </div>
);

const ProjectionEmptyState: React.FC = () => {
  const setFocusedBlock = useUIStore((s) => s.setFocusedBlock);
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="w-12 h-12 rounded-sm bg-amber-950/40 border border-amber-800/30 flex items-center justify-center">
        <TrendingUp size={20} className="text-amber-600" />
      </div>
      <div className="space-y-1">
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
          Projeção ainda não disponível
        </p>
        <p className="text-[9px] text-slate-700 max-w-[240px] leading-relaxed">
          Complete os blocos de Consumo, Módulos e Inversor para extrair as matrizes energéticas.
        </p>
      </div>
      <button
        onClick={() => setFocusedBlock('consumption')}
        className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-sky-400 border border-sky-500/30 hover:bg-sky-950/40 transition-colors"
      >
        ← Ir para Consumo
      </button>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN — ProjectionCanvasView
// ═════════════════════════════════════════════════════════════════════════════

export const ProjectionCanvasView: React.FC = () => {
  // ── Store ──────────────────────────────────────────────────────────────────
  const monthlyConsumption = useSolarStore((s) =>
    s.clientData.invoices[0]?.monthlyHistory || Array(12).fill(s.clientData.averageConsumption || 0)
  );
  const hsp            = useSolarStore((s) => s.clientData.monthlyIrradiation || Array(12).fill(0));
  const connectionType = useSolarStore((s) => s.clientData.connectionType);
  const tariffRate     = useSolarStore((s) => s.clientData.tariffRate || 0);
  const modules        = useSolarStore(selectModules);
  const placedModules  = useSolarStore((s) => s.project.placedModules);

  const techStrings             = useTechStore((s) => s.strings.entities);
  const getPerformanceRatio     = useTechStore((s) => s.getPerformanceRatio);
  const getAdditivePerformanceRatio = useTechStore((s) => s.getAdditivePerformanceRatio);
  const prCalculationMode       = useTechStore((s) => s.prCalculationMode);
  const cosip                   = useTechStore((s) => s.cosip);

  // ── Derived: PR ─────────────────────────────────────────────────────────────
  const prDecimal = prCalculationMode === 'additive'
    ? getAdditivePerformanceRatio()
    : getPerformanceRatio();

  // ── Derived: Potência Conectada (motor híbrido) ────────────────────────────
  const modulesById = useMemo(() => {
    const map: Record<string, any> = {};
    modules.forEach((m) => { map[m.id] = m; });
    return map;
  }, [modules]);

  const totalPowerKw = useMemo(() => {
    let totalW = 0;
    const handled = new Set<string>();

    Object.values(techStrings).forEach((str) => {
      str.moduleIds.forEach((mid) => {
        const pm = placedModules.find((p) => p.id === mid);
        if (pm) {
          const spec = modulesById[pm.moduleSpecId];
          if (spec) { totalW += spec.power; handled.add(pm.id); }
        } else if (modulesById[mid]) {
          totalW += modulesById[mid].power;
        }
      });
    });

    placedModules.forEach((pm) => {
      if (pm.stringData && !handled.has(pm.id)) {
        const spec = modulesById[pm.moduleSpecId];
        if (spec) { totalW += spec.power; handled.add(pm.id); }
      }
    });

    if (totalW === 0 && placedModules.length > 0) {
      placedModules.forEach((pm) => {
        const spec = modulesById[pm.moduleSpecId];
        if (spec) totalW += spec.power;
      });
    }

    if (totalW === 0) {
      totalW = modules.reduce((acc, m) => acc + m.power, 0);
    }

    return totalW / 1000;
  }, [techStrings, placedModules, modulesById, modules]);

  // ── Gate: dados suficientes? ────────────────────────────────────────────────
  const hasData = totalPowerKw > 0 && hsp.some((v: number) => v > 0);


  // ── UI State ─────────────────────────────────────────────────────────────────
  const [dailyMonth, setDailyMonth] = useState(-1);
  const [withNoise, setWithNoise] = useState(false);

  const avgHsp = useMemo(() => hsp.reduce((a: number, b: number) => a + b, 0) / 12, [hsp]);
  const currentHsp = dailyMonth === -1 ? avgHsp : hsp[dailyMonth];

  // Recalcular perfil de geração para o gráfico (96 pts)
  const dailyData = useMemo(() => {
    const genProfile = getDailyProfile(totalPowerKw, currentHsp || 0, prDecimal, withNoise);
    return HOUR_LABELS.map((label, i) => ({
      hora: label,
      'Geração (kWh)': +genProfile[i].toFixed(3),
    }));
  }, [totalPowerKw, currentHsp, prDecimal, withNoise]);

  // ── Derived para Header ───────────────────────────────────────────────────────
  const prPct = (prDecimal * 100).toFixed(1);

  // ── BI Engine (Passando flag de ruído, perfil de carga e balanço opcional) ────
  const stats = useMemo(() => {
    if (!hasData) return null;
    return calculateProjectionStats({
      totalPowerKw,
      hsp,
      monthlyConsumption,
      prDecimal,
      connectionType,
      tariffRate,
      cosip
    });
  }, [hasData, totalPowerKw, hsp, monthlyConsumption, prDecimal, connectionType, tariffRate, cosip]);

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════

  return (
    <div className="w-full h-full flex bg-slate-950 overflow-hidden">
      
      {/* ── Main Viewport (Central) ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">


      {/* ══════════════════════════════════════════════════════════════════
          HEADER HUD — Barra fixa de identidade e métricas vitais
      ══════════════════════════════════════════════════════════════════ */}
      <div className="shrink-0 flex items-center gap-0 border-b border-amber-900/40 bg-gradient-to-r from-amber-950/40 to-slate-950 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-5 py-3 border-r border-amber-900/30">
          <div className="w-6 h-6 rounded-sm flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <TrendingUp size={13} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest leading-none">
              Cockpit de Projeção
            </span>
            {stats && (
              <span className="text-[9px] text-amber-700 font-bold uppercase tracking-tight mt-0.5">
                {stats.totalGen.toLocaleString('pt-BR')} kWh/ano estimados
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center divide-x divide-slate-800/60 ml-auto">
          
          {/* Toggles de Visão (Ruído vs Teórica) */}
          <div className="flex items-center px-4 gap-1">
            <button
              onClick={() => setWithNoise(false)}
              className={cn(
                "px-2 py-1 text-[8px] font-black uppercase tracking-widest transition-all border",
                !withNoise 
                  ? "bg-sky-500/20 border-sky-500/40 text-sky-400" 
                  : "bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-400"
              )}
            >
              Curva Teórica
            </button>
            <button
              onClick={() => setWithNoise(true)}
              className={cn(
                "px-2 py-1 text-[8px] font-black uppercase tracking-widest transition-all border",
                withNoise 
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]" 
                  : "bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-400"
              )}
            >
              Simulação Realista
            </button>
          </div>

          <button
            onClick={() => useUIStore.getState().toggleLossSidebar()}
            className={cn(
              "flex flex-col items-end px-5 py-2 transition-all group relative border-l border-slate-800/60",
              useUIStore((s) => s.isLossSidebarOpen)
                ? "bg-amber-500/10"
                : "hover:bg-amber-500/5"
            )}
          >
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[9px] font-black text-slate-600 group-hover:text-amber-500/70 uppercase tracking-widest transition-colors">
                Decomposição PR
              </span>
              <Sliders size={8} className={cn(
                "transition-colors",
                useUIStore((s) => s.isLossSidebarOpen) ? "text-amber-400" : "text-slate-700 group-hover:text-amber-500/60"
              )} />
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={cn(
                "text-[14px] font-black font-mono tabular-nums leading-none transition-transform origin-right group-active:scale-95",
                useUIStore((s) => s.isLossSidebarOpen) ? "text-amber-300" : "text-amber-400 group-hover:text-amber-300"
              )}>
                {prPct}%
              </span>
              <span className="text-[8px] font-bold text-slate-700 group-hover:text-amber-600/70 uppercase">PR</span>
            </div>
          </button>

          {stats && (
            <div className="flex flex-col items-end px-5 py-2">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Cobertura</span>
              <span className={cn(
                'text-[14px] font-black font-mono tabular-nums leading-none',
                stats.coverage >= 100 ? 'text-emerald-400' : 'text-rose-400'
              )}>
                {Math.round(stats.coverage)}%
              </span>
            </div>
          )}

          <div className="flex flex-col items-end px-5 py-2">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Potência CC</span>
            <span className="text-[14px] font-black font-mono tabular-nums text-slate-300 leading-none">
              {totalPowerKw.toFixed(2)} kWp
            </span>
          </div>


        </div>
      </div>



      {!hasData ? (
        <ProjectionEmptyState />
      ) : (
        <div className="flex flex-col gap-4 p-5">
          {/* ══════════════════════════════════════════════════════════════════
              PAINEL 2 — KPIs de Engenharia
          ══════════════════════════════════════════════════════════════════ */}
          <ProjectionMetrics
            totalGen={stats!.totalGen}
            totalCons={stats!.totalCons}
            coverage={stats!.coverage}
            economiaAno={stats!.economiaAno}
            totalPowerKw={totalPowerKw}
            tariffRate={tariffRate}
            moduleCount={modules.length}
          />

          {/* ══════════════════════════════════════════════════════════════════
              DASHBOARD GRID (High-Density Tiled)
          ══════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
            
            {/* LINHA 1: O BIG PICTURE (BALANÇO MENSAL + ROI) */}
            <DashboardCell
              title="Matriz Energética Mensal"
              icon={<BarChart2 size={10} />}
              className="lg:col-span-2 2xl:col-span-2"
            >
              <div style={{ height: 320 }}>
                <GenerationConsumptionChart data={stats!.barData} />
              </div>
            </DashboardCell>

            <DashboardCell
              title="Fluxo de Caixa Acumulado (ROI)"
              icon={<TrendingUp size={10} />}
              className="lg:col-span-1"
            >
              <div style={{ height: 320 }}>
                <CumulativeROIChart data={stats!.roiData} />
              </div>
            </DashboardCell>

            {/* LINHA 2: O DETALHE TÉCNICO (CURVA 24H + PERDAS) */}
            <DashboardCell
              title="Perfil de Geração vs Carga (24h)"
              icon={<Clock size={10} />}
              className="lg:col-span-2 2xl:col-span-2"
              controls={
                <div className="flex items-center gap-3">
                  <select
                    className="bg-slate-900 border border-slate-800 px-2 py-0.5 text-[8px] font-black uppercase text-amber-400 outline-none cursor-pointer rounded-sm"
                    value={dailyMonth}
                    onChange={(e) => setDailyMonth(parseInt(e.target.value))}
                  >
                    <option value="-1">Média Anual</option>
                    {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                  </select>
                  <span className="text-[8px] text-slate-500 font-bold tabular-nums">
                    HSP: <span className="text-amber-500">{currentHsp?.toFixed(2)}</span>
                  </span>
                </div>
              }
            >
              <div style={{ height: 320 }}>
                <DailyGenerationChart 
                  data={dailyData} 
                />
              </div>
            </DashboardCell>

            <DashboardCell
              title="Decomposição de Perdas (Waterfall)"
              icon={<Layers size={10} />}
              className="lg:col-span-1 2xl:col-span-1"
            >
              <div style={{ height: 320 }}>
                <LossWaterfallChart />
              </div>
            </DashboardCell>

            {/* LINHA 3: O FECHAMENTO (CRÉDITOS + TRANSPARÊNCIA + TABELA) */}
            <DashboardCell
              title="Saldo de Créditos ANEEL"
              icon={<ChevronDown size={10} />}
              className="lg:col-span-1 2xl:col-span-1"
            >
              <div style={{ height: 280 }}>
                <CreditBankChart data={stats!.bankData} />
              </div>
            </DashboardCell>

            <DashboardCell
              title="Impacto Financeiro Mensal"
              icon={<Zap size={10} />}
              className="lg:col-span-1 2xl:col-span-1"
            >
              <div style={{ height: 280 }}>
                <FinancialBalanceChart data={stats!.waterfallData} />
              </div>
            </DashboardCell>

            <DashboardCell
              title="Detalhamento Técnico Mensal"
              icon={<Table2 size={10} />}
              className="lg:col-span-2 2xl:col-span-1"
            >
              <div style={{ height: 280 }}>
                <AnalyticsTable
                  data={stats!.barData}
                  totalGen={stats!.totalGen}
                  totalCons={stats!.totalCons}
                  economiaAno={stats!.economiaAno}
                  tariffRate={tariffRate}
                />
              </div>
            </DashboardCell>

          </div>
        </div>
      )}
      </div>

      {/* ── Sidebar (Direita) ─────────────────────────────────────────────── */}
      <ProjectionLossSidebar />
      
    </div>
  );
};
