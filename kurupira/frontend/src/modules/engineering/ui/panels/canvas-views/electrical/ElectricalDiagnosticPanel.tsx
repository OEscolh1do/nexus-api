import React from 'react';
import { RefreshCw, ShieldAlert, Thermometer } from 'lucide-react';
import { InverterState } from '../../../../store/useTechStore';
import { ValidationChip } from './components/ValidationChip';
import { ValidationChipMini } from './components/ValidationChipMini';
import { DiagnosticAlertsList, AlertDescriptor } from './components/DiagnosticAlertsList';

// ─────────────────────────────────────────────────────────────────────────────
// T1-B: FDI — 5 faixas de semáforo (spec técnica PV 2026-04-25)
// T1-E: Chips AFCI/RSD (dados já existem no InverterCatalogItem via catalogId)
// T2-D: Chip Derating térmico
// ─────────────────────────────────────────────────────────────────────────────

type FdiSeverity = { sev: 'ok' | 'warn' | 'error'; label: string };

const getFdiSeverity = (fdi: number): FdiSeverity => {
  if (fdi <= 0)       return { sev: 'warn',  label: '—' };
  if (fdi < 1.00)     return { sev: 'warn',  label: 'Subdimensionado' };
  if (fdi <= 1.10)    return { sev: 'ok',    label: 'Conservador' };
  if (fdi <= 1.35)    return { sev: 'ok',    label: 'Ótimo' };
  if (fdi <= 1.50)    return { sev: 'warn',  label: 'Oversizing Mod.' };
  return               { sev: 'error', label: 'Oversizing Alto' };
};

interface ElectricalDiagnosticPanelProps {
  inverterState: InverterState;
  fdi: number;
  vocMaxGlobal: number;
  iscMaxGlobal: number;
  vocGlobalStatus: 'ok' | 'warning' | 'error';
  iscGlobalStatus: 'ok' | 'warning' | 'error';
  alerts: AlertDescriptor[];
  abrirCatalogo: () => void;
  // Novos campos normativos (já existem no catalog item)
  hasAfci?: boolean;
  hasRsd?: boolean;
  hasDeratingRisk?: boolean; // calculado pelo pai
  onAlertClick?: (mpptId: string) => void;
}

export const ElectricalDiagnosticPanel: React.FC<ElectricalDiagnosticPanelProps> = ({
  inverterState,
  fdi,
  vocMaxGlobal,
  iscMaxGlobal,
  vocGlobalStatus,
  iscGlobalStatus,
  alerts,
  abrirCatalogo,
  hasAfci = true,
  hasRsd = true,
  hasDeratingRisk = false,
  onAlertClick,
}) => {
  const fdiResult = getFdiSeverity(fdi);
  const fdiSeverity: 'ok' | 'warn' | 'error' = fdiResult.sev;

  // Contadores de alertas ativos
  const errorCount = alerts.filter(a => a.severity === 'error').length;
  const warnCount  = alerts.filter(a => a.severity === 'warning').length;
  const hasNormativeWarnings = !hasAfci || !hasRsd || hasDeratingRisk;

  return (
    <div className="flex flex-col gap-3 h-full">

      {/* 1. Equipamento */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 flex flex-col gap-2 shrink-0">
        <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Equipamento</p>
        <h3 className="text-sm font-medium text-slate-200 leading-tight">
          {inverterState.snapshot.model.split(' ')[0] ?? 'Inversor'}
        </h3>
        <h4 className="text-xs text-emerald-400 font-mono truncate" title={inverterState.snapshot.model}>
          {inverterState.snapshot.model}
        </h4>

        <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-2 text-[11px] text-slate-400">
          <span className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Potência</span>
            <span className="text-slate-300 font-mono">{inverterState.snapshot.nominalPower?.toFixed(2) ?? '—'} kW</span>
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">MPPTs</span>
            <span className="text-slate-300 font-mono">{inverterState.snapshot.mppts}</span>
          </span>
        </div>

        <button
          onClick={abrirCatalogo}
          className="mt-3 w-full py-2 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw size={12} />
          Trocar Inversor
        </button>
      </div>

      {/* 2. Métricas de Dimensionamento */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-3 flex flex-col gap-3 shrink-0">
        <p className="text-[11px] text-slate-500 uppercase tracking-wider">Métricas de Dimensionamento</p>

        {/* FDI com 5 faixas */}
        <ValidationChip
          label={`FDI — ${fdiResult.label}`}
          value={fdi > 0 ? `${(fdi * 100).toFixed(1)}%` : '—'}
          severity={fdiSeverity}
          subtitle={`CC/CA · Ideal: 110 – 135%`}
          size="normal"
        />

        <div className="grid grid-cols-2 gap-2">
          <ValidationChipMini
            label="Voc Máx"
            value={vocMaxGlobal > 0 ? `${vocMaxGlobal.toFixed(1)} V` : '--- V'}
            severity={vocGlobalStatus}
          />
          <ValidationChipMini
            label="Isc Total"
            value={iscMaxGlobal > 0 ? `${iscMaxGlobal.toFixed(1)} A` : '--- A'}
            severity={iscGlobalStatus}
          />
        </div>
      </div>

      {/* 3. Chips Normativos — só aparece quando falta algo */}
      {hasNormativeWarnings && (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-3 flex flex-col gap-2 shrink-0">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider">Conformidade Normativa</p>
          <div className="flex flex-col gap-2">
            {!hasAfci && (
              <div
                title="Portaria Inmetro 515/2023 exige AFCI para sistemas com tensão >120V e Isc >20A."
                className="flex items-center gap-2 px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded text-[11px] text-amber-400 font-bold cursor-default"
              >
                <ShieldAlert size={12} className="shrink-0" />
                <span>Sem AFCI — Portaria 515/2023</span>
              </div>
            )}
            {!hasRsd && (
              <div
                title="ABNT NBR 17193:2025 exige Desligamento Rápido (RSD) em instalações prediais."
                className="flex items-center gap-2 px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded text-[11px] text-amber-400 font-bold cursor-default"
              >
                <ShieldAlert size={12} className="shrink-0" />
                <span>Sem RSD — NBR 17193:2025</span>
              </div>
            )}
            {hasDeratingRisk && (
              <div
                title="Inversores com resfriamento passivo acima de 10kW em climas tropicais sofrem derating durante horas de pico."
                className="flex items-center gap-2 px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded text-[11px] text-amber-400 font-bold cursor-default"
              >
                <Thermometer size={12} className="shrink-0" />
                <span>Risco Derating Térmico</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Diagnósticos Ativos */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-3 overflow-hidden flex flex-col min-h-0 flex-1">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider">Diagnósticos Ativos</p>
          {(errorCount > 0 || warnCount > 0) && (
            <div className="flex items-center gap-1.5">
              {errorCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400 font-bold">
                  {errorCount} erro{errorCount > 1 ? 's' : ''}
                </span>
              )}
              {warnCount > 0 && (
                <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-400 font-bold">
                  {warnCount} aviso{warnCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="overflow-y-auto pr-1 flex-1 custom-scrollbar">
          <DiagnosticAlertsList alerts={alerts} onAlertClick={onAlertClick} />
        </div>
      </div>
    </div>
  );
};
