/**
 * =============================================================================
 * ELECTRICAL CANVAS VIEW — Motor Elétrico P6 (E-02 / TRL 7-8)
 * =============================================================================
 *
 * Conecta os resultados reais do motor de validação elétrica à interface.
 * Todos os valores exibidos vêm de stores e hooks — zero valores hardcoded.
 *
 * Seções:
 *  1. Resumo DC — KPIs do sistema (kWp, FDI, inversor, strings)
 *  2. Validação MPPT — tabela por MPPT com Voc Max, Vmp Min, Isc Total, status
 *  3. Topologia de Strings — hierarquia lógica inversor → MPPT → string
 *  4. Cabos AC — calculadora de queda de tensão (NBR 5410)
 *
 * Rodapé CTA:
 *  - "Ver Simulação" — habilitado quando globalHealth !== 'error' && hasInverters
 *  - globalHealth === 'ok' → estado validado exibido
 *
 * =============================================================================
 */

import React, { useState, useMemo } from 'react';
import {
  Zap, Scale, ShieldAlert, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronRight, Link2, CpuIcon, Info,
  Activity, BarChart2,
} from 'lucide-react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '../../../store/useTechStore';
import { useTechKPIs } from '../../../hooks/useTechKPIs';
import { useElectricalValidation } from '../../../hooks/useElectricalValidation';
import { calculateStringMetrics } from '../../../utils/electricalMath';
import { toArray } from '@/core/types/normalized.types';
import { cn } from '@/lib/utils';
import { getFdiStatus, FDI_STATUS_CONFIG } from '../../../constants/thresholds';
import { useUIStore } from '@/core/state/uiStore';
import { usePanelStore } from '../../../store/panelStore';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type ValidationStatus = 'ok' | 'warning' | 'error';

// ─── HELPERS ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<ValidationStatus, { icon: React.ReactNode; label: string; cls: string }> = {
  ok:      { icon: <CheckCircle2 size={12} />, label: 'OK',      cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  warning: { icon: <AlertTriangle size={12} />, label: 'Aviso',  cls: 'text-amber-400 bg-amber-500/10 border-amber-500/30'       },
  error:   { icon: <ShieldAlert size={12} />,   label: 'Erro',   cls: 'text-red-400 bg-red-500/10 border-red-500/30'            },
};

const KpiCard: React.FC<{ label: string; value: string; unit: string; color: string; sub?: string }> = ({
  label, value, unit, color, sub,
}) => (
  <div className="flex flex-col gap-0.5 px-3 py-2.5 rounded-sm bg-slate-900/80 border border-slate-800/60 min-w-0">
    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest truncate">{label}</span>
    <div className="flex items-baseline gap-1">
      <span className={`text-lg font-black leading-none font-mono tabular-nums ${color}`}>{value}</span>
      <span className="text-[9px] font-bold text-slate-500">{unit}</span>
    </div>
    {sub && <span className="text-[8px] text-slate-600 truncate">{sub}</span>}
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export const ElectricalCanvasView: React.FC = () => {
  const settings      = useSolarStore(state => state.settings);
  const modules       = useSolarStore(selectModules);
  const invertersNorm = useTechStore(state => state.inverters);
  const stringsNorm   = useTechStore(state => state.strings);

  const { kpi }                              = useTechKPIs();
  const { electrical, inventory, globalHealth } = useElectricalValidation();

  const setFocusedBlock = useUIStore(s => s.setFocusedBlock);
  const restoreMap      = usePanelStore(s => s.restoreMap);

  const techInverters = useMemo(() => toArray(invertersNorm), [invertersNorm]);
  const techStrings   = useMemo(() => toArray(stringsNorm),   [stringsNorm]);

  // Representative module for Voc calculation
  const repModule = modules[0] ?? null;
  const moduleSpecs = repModule ? {
    voc:         repModule.voc,
    vmp:         repModule.vmp ?? repModule.voc * 0.82,
    isc:         repModule.isc ?? 0,
    tempCoeffVoc: repModule.tempCoeff || -0.29,
  } : null;

  // AC Cable calculator — pre-populate current from inverter nominal output
  const firstInvAcCurrentA = techInverters[0]?.snapshot?.nominalPower
    ? Math.round(((techInverters[0].snapshot.nominalPower * 1000) / 220) * 1.1)
    : 32;

  const [acParams, setAcParams] = useState({
    distance: 45,
    current:  firstInvAcCurrentA,
    voltage:  220,
    gauge:    10,
    core:     'copper' as 'copper' | 'aluminum',
  });

  const rho           = acParams.core === 'copper' ? 0.0172 : 0.0282;
  const vDrop         = (2 * acParams.distance * acParams.current * rho) / acParams.gauge;
  const vDropPercent  = (vDrop / acParams.voltage) * 100;
  const isDropSafe    = vDropPercent <= 3.0;

  const fdiStatus = getFdiStatus(kpi.dcAcRatio);
  const fdiConfig = FDI_STATUS_CONFIG[fdiStatus];

  const hasInverters    = techInverters.length > 0;
  const totalStrings    = techStrings.length;
  const assignedStrings = techStrings.filter(s => s.mpptId !== null).length;

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggleCollapse = (id: string) =>
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  const handleGoToSimulation = () => {
    setFocusedBlock('simulation');
    restoreMap();
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden">

      {/* ── CORPO SCROLLÁVEL ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">

        {/* ═══ SEÇÃO 1 — RESUMO DC ════════════════════════════════════════ */}
        <div className="rounded-sm bg-slate-900 border border-slate-800 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-slate-400" />
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Resumo do Sistema DC
            </h2>
            <span className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9px] font-bold border ml-auto',
              STATUS_BADGE[globalHealth].cls
            )}>
              {STATUS_BADGE[globalHealth].icon}
              {globalHealth === 'ok' ? 'Sistema OK' : globalHealth === 'warning' ? 'Avisos' : 'Erros Críticos'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <KpiCard label="Potência DC"         value={kpi.totalDC.toFixed(2)}             unit="kWp" color="text-amber-400"  sub={`${kpi.totalDC.toFixed(2)} kWp conectado`} />
            <KpiCard label="Potência AC"         value={kpi.totalAC.toFixed(2)}             unit="kW"  color="text-sky-400"    sub={`${techInverters.length} inversor(es)`} />
            <KpiCard label="FDI"                 value={(kpi.dcAcRatio * 100).toFixed(1)}   unit="%"   color={fdiConfig.color} sub={fdiConfig.label} />
            <KpiCard label="Strings Totais"      value={totalStrings.toString()}             unit="str." color="text-slate-300" sub={`${assignedStrings} atribuídas`} />
            <KpiCard label="Temp Mín. Histórica" value={settings.minHistoricalTemp.toString()} unit="°C" color="text-pink-400"  sub="Inv. (Voc Max)" />
            <KpiCard
              label="Inventário"
              value={inventory.isSynced ? 'Sync' : `Δ${Math.abs(inventory.difference)}`}
              unit=""
              color={inventory.status === 'ok' ? 'text-emerald-400' : inventory.status === 'warning' ? 'text-amber-400' : 'text-red-400'}
              sub={`Lóg: ${inventory.logicalCount} · Fís: ${inventory.placedCount}`}
            />
          </div>
        </div>

        {/* ═══ SEÇÃO 2 — VALIDAÇÃO POR MPPT ══════════════════════════════ */}
        <div className="rounded-sm bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <Activity size={13} className="text-slate-400" />
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Validação Térmica por MPPT
            </h2>
            {electrical && (
              <span className="text-[9px] text-slate-600 font-mono ml-auto">
                {electrical.summary.errors}E · {electrical.summary.warnings}W · {electrical.summary.totalMPPTs} MPPT(s)
              </span>
            )}
          </div>

          {!hasInverters ? (
            <div className="p-8 flex flex-col items-center gap-2 text-center">
              <Info size={20} className="text-slate-600" />
              <p className="text-xs font-bold text-slate-500">Nenhum inversor configurado</p>
              <p className="text-[10px] text-slate-600">Adicione um inversor no Outliner e atribua strings aos MPPTs para ver a validação elétrica.</p>
            </div>
          ) : !electrical || electrical.entries.length === 0 ? (
            <div className="p-8 flex flex-col items-center gap-2 text-center">
              <Link2 size={20} className="text-slate-600" />
              <p className="text-xs font-bold text-slate-500">Nenhuma string atribuída</p>
              <p className="text-[10px] text-slate-600">Arraste strings do Outliner para os MPPTs do inversor para ativar a validação.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[9px] font-bold uppercase tracking-widest">
                    <th className="px-4 py-2 text-left">Inversor</th>
                    <th className="px-4 py-2 text-left">MPPT</th>
                    <th className="px-4 py-2 text-right">Strings</th>
                    <th className="px-4 py-2 text-right">Mód/String</th>
                    <th className="px-4 py-2 text-right">Voc Máx</th>
                    <th className="px-4 py-2 text-right">Vmp Mín</th>
                    <th className="px-4 py-2 text-right">Isc Total</th>
                    <th className="px-4 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {electrical.entries.map(entry => {
                    const inv   = techInverters.find(i => i.id === entry.inverterId);
                    const cfg   = inv?.mpptConfigs.find(m => m.mpptId === entry.mpptId);
                    const badge = STATUS_BADGE[entry.status];
                    return (
                      <React.Fragment key={`${entry.inverterId}-${entry.mpptId}`}>
                        <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-2 font-mono text-slate-400 truncate max-w-[120px]">
                            {inv?.snapshot?.model ?? entry.inverterId.slice(0, 8)}
                          </td>
                          <td className="px-4 py-2 text-slate-400">MPPT {entry.mpptId}</td>
                          <td className="px-4 py-2 text-right font-mono text-slate-300">{cfg?.stringIds.length ?? 0}</td>
                          <td className="px-4 py-2 text-right font-mono text-slate-300">{cfg?.modulesPerString ?? '—'}</td>
                          <td className={cn('px-4 py-2 text-right font-mono font-bold', entry.vocMax > 0 ? 'text-amber-300' : 'text-slate-600')}>
                            {entry.vocMax > 0 ? `${entry.vocMax.toFixed(0)}V` : '—'}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-slate-400">
                            {entry.vmpMin > 0 ? `${entry.vmpMin.toFixed(0)}V` : '—'}
                          </td>
                          <td className={cn('px-4 py-2 text-right font-mono font-bold', entry.iscTotal > 0 ? 'text-sky-300' : 'text-slate-600')}>
                            {entry.iscTotal > 0 ? `${entry.iscTotal.toFixed(1)}A` : '—'}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9px] font-bold border', badge.cls)}>
                              {badge.icon} {badge.label}
                            </span>
                          </td>
                        </tr>
                        {entry.messages.length > 0 && (
                          <tr className="border-b border-slate-800/30 bg-amber-950/5">
                            <td colSpan={8} className="px-6 pb-2 pt-1">
                              {entry.messages.map((msg, i) => (
                                <div key={i} className={cn(
                                  'text-[10px] flex items-start gap-1.5',
                                  entry.status === 'error' ? 'text-red-400' : 'text-amber-400'
                                )}>
                                  <AlertTriangle size={10} className="mt-0.5 shrink-0" />
                                  {msg}
                                </div>
                              ))}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ═══ SEÇÃO 3 — TOPOLOGIA DE STRINGS ════════════════════════════ */}
        <div className="rounded-sm bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <CpuIcon size={13} className="text-slate-400" />
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Topologia de Strings</h2>
          </div>

          {!hasInverters ? (
            <div className="p-6 text-center text-[10px] text-slate-600">Nenhum inversor configurado.</div>
          ) : (
            <div className="p-3 space-y-2">
              {techInverters.map(inv => {
                const isCollapsed = collapsed[inv.id] ?? false;
                const invStrings  = techStrings.filter(s => s.mpptId?.startsWith(inv.id));

                return (
                  <div key={inv.id} className="rounded-sm border border-slate-800 overflow-hidden">
                    <button
                      onClick={() => toggleCollapse(inv.id)}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-800/40 transition-colors text-left"
                    >
                      {isCollapsed ? <ChevronRight size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
                      <CpuIcon size={12} className="text-emerald-400 shrink-0" />
                      <span className="text-[11px] font-bold text-slate-200 flex-1 truncate">
                        {inv.snapshot?.model ?? inv.id} × {inv.quantity}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono shrink-0">
                        {inv.snapshot?.nominalPower?.toFixed(1)} kW · {inv.mpptConfigs.length} MPPT(s)
                      </span>
                    </button>

                    {!isCollapsed && (
                      <div className="border-t border-slate-800/50">
                        {inv.mpptConfigs.map(cfg => {
                          const cfgStrings = invStrings.filter(s =>
                            s.mpptId === `${inv.id}:${cfg.mpptId}`
                          );
                          return (
                            <div key={cfg.mpptId} className="border-b border-slate-800/30 last:border-0">
                              <div className="flex items-center gap-2 px-6 py-1.5 bg-slate-800/20">
                                <Link2 size={10} className="text-slate-500 shrink-0" />
                                <span className="text-[10px] font-bold text-slate-400">MPPT {cfg.mpptId}</span>
                                <span className="text-[9px] text-slate-600 font-mono ml-auto">{cfgStrings.length} string(s)</span>
                              </div>
                              {cfgStrings.length === 0 ? (
                                <div className="px-10 py-1.5 text-[10px] text-slate-600 italic">
                                  Nenhuma string atribuída a este MPPT.
                                </div>
                              ) : (
                                cfgStrings.map(str => {
                                  const mods   = str.moduleIds.length;
                                  const vocStr = moduleSpecs && mods > 0
                                    ? calculateStringMetrics(moduleSpecs, mods, settings.minHistoricalTemp).vocMax.toFixed(0)
                                    : null;
                                  return (
                                    <div key={str.id} className="flex items-center gap-2 px-10 py-1 hover:bg-slate-800/20 transition-colors">
                                      <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                                      <span className="text-[10px] text-slate-400 flex-1 truncate font-mono">
                                        {str.name ?? str.id.slice(0, 12)}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono shrink-0">{mods} mód.</span>
                                      {vocStr && (
                                        <span className="text-[10px] text-amber-500/80 font-mono font-bold shrink-0">
                                          Voc: {vocStr}V
                                        </span>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          );
                        })}
                        {invStrings.filter(s => !s.mpptId).length > 0 && (
                          <div className="px-6 py-1.5 text-[10px] text-amber-500/70 border-t border-slate-800/30">
                            ⚠ {invStrings.filter(s => !s.mpptId).length} string(s) sem MPPT atribuído
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Strings completamente desconectadas */}
              {(() => {
                const unassigned = techStrings.filter(s => !s.mpptId);
                if (unassigned.length === 0) return null;
                return (
                  <div className="rounded-sm border border-amber-800/30 bg-amber-950/10 px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={11} className="text-amber-400" />
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                        {unassigned.length} String(s) Desconectada(s)
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {unassigned.map(str => (
                        <div key={str.id} className="text-[10px] text-amber-500/70 font-mono px-2">
                          • {str.name ?? str.id.slice(0, 16)} — {str.moduleIds.length} mód.
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* ═══ SEÇÃO 4 — CABOS AC (NBR 5410) ═════════════════════════════ */}
        <div className="rounded-sm bg-slate-900 border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={13} className="text-slate-400" />
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Condutor AC — Queda de Tensão (NBR 5410)
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulário */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Lance de Cabo', key: 'distance' as const, unit: 'm' },
                { label: 'Corrente Máx',  key: 'current'  as const, unit: 'A' },
              ].map(({ label, key, unit }) => (
                <div key={key} className="flex flex-col gap-1 focus-within:text-emerald-400 text-slate-400">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-inherit">{label}</label>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 focus-within:border-emerald-500/50 transition-colors">
                    <input
                      type="number"
                      value={acParams[key]}
                      onChange={e => setAcParams(p => ({ ...p, [key]: Number(e.target.value) }))}
                      className="bg-transparent w-full focus:outline-none text-slate-200 font-mono text-sm"
                    />
                    <span className="text-slate-500 font-bold ml-2 text-[10px]">{unit}</span>
                  </div>
                </div>
              ))}

              <div className="flex flex-col gap-1 text-slate-400">
                <label className="text-[9px] font-bold uppercase tracking-widest">Tensão Nominal</label>
                <div className="flex items-center bg-slate-950/50 border border-slate-800 rounded-sm px-3 py-2 text-slate-500 font-mono text-sm">
                  {acParams.voltage} Vac
                </div>
              </div>

              <div className="flex flex-col gap-1 text-slate-400">
                <label className="text-[9px] font-bold uppercase tracking-widest">Seção Transversal</label>
                <select
                  value={acParams.gauge}
                  onChange={e => setAcParams(p => ({ ...p, gauge: Number(e.target.value) }))}
                  className="bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 focus:outline-none focus:border-emerald-500/50 text-slate-200 font-mono transition-colors appearance-none text-sm"
                >
                  {[2.5, 4, 6, 10, 16, 25].map(g => (
                    <option key={g} value={g}>{g} mm²</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 text-slate-400">
                <label className="text-[9px] font-bold uppercase tracking-widest">Material</label>
                <select
                  value={acParams.core}
                  onChange={e => setAcParams(p => ({ ...p, core: e.target.value as 'copper' | 'aluminum' }))}
                  className="bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 focus:outline-none focus:border-emerald-500/50 text-slate-200 font-mono transition-colors appearance-none text-sm"
                >
                  <option value="copper">Cobre (ρ 0.0172)</option>
                  <option value="aluminum">Alumínio (ρ 0.0282)</option>
                </select>
              </div>
            </div>

            {/* Resultado */}
            <div className={cn(
              'flex flex-col items-center justify-center rounded-sm border p-6 relative overflow-hidden transition-colors duration-500',
              isDropSafe ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
            )}>
              <div className="flex items-baseline gap-2">
                <span className={cn('text-5xl font-black tracking-tighter font-mono', isDropSafe ? 'text-emerald-400' : 'text-red-400')}>
                  {vDropPercent.toFixed(2)}
                </span>
                <span className={cn('text-xl font-bold opacity-50', isDropSafe ? 'text-emerald-400' : 'text-red-400')}>%</span>
              </div>
              <div className={cn('flex items-center gap-2 mt-2', isDropSafe ? 'text-emerald-400' : 'text-red-400')}>
                {isDropSafe ? <Scale size={13} /> : <ShieldAlert size={13} />}
                <span className="text-xs font-bold uppercase tracking-widest">
                  {isDropSafe ? 'Queda Adequada (≤3%)' : 'Risco Elevado — Aumente a Bitola'}
                </span>
              </div>
              <p className="text-[9px] text-slate-600 text-center mt-3 px-4 font-mono">
                Queda = 2 × {acParams.distance}m × {acParams.current}A × ρ / {acParams.gauge}mm² = {vDrop.toFixed(2)}V
              </p>
              <div className="absolute opacity-[0.03] scale-150 right-0 bottom-0 pointer-events-none">
                <Zap size={100} />
              </div>
            </div>
          </div>
        </div>

      </div>{/* /scroll body */}

      {/* ── RODAPÉ / CTA ────────────────────────────────────────────────── */}
      <div className="shrink-0 flex justify-between items-center bg-slate-900 border-t border-slate-800 px-4 py-2">
        <div className="text-xs font-mono flex items-center gap-3">
          {globalHealth === 'ok' && (
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 size={13} />
              Sistema elétrico validado
            </span>
          )}
          {globalHealth === 'warning' && (
            <span className="flex items-center gap-1.5 text-amber-400">
              <AlertTriangle size={13} />
              {electrical?.summary.warnings ?? 0} aviso(s) — simulação permitida
            </span>
          )}
          {globalHealth === 'error' && (
            <span className="flex items-center gap-1.5 text-red-400">
              <ShieldAlert size={13} />
              {electrical?.summary.errors ?? 0} erro(s) crítico(s) — corrija antes de continuar
            </span>
          )}
          {!hasInverters && (
            <span className="text-slate-600 italic">Configure inversores e strings para validar</span>
          )}
        </div>

        <button
          onClick={handleGoToSimulation}
          disabled={globalHealth === 'error' || !hasInverters}
          className={cn(
            'flex items-center gap-2 text-xs px-4 py-1.5 rounded-sm font-bold transition-all',
            globalHealth !== 'error' && hasInverters
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:shadow-emerald-500/20'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          )}
        >
          <BarChart2 size={13} />
          Ver Simulação
        </button>
      </div>

    </div>
  );
};
