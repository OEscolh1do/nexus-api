import React from 'react';
import { RefreshCw } from 'lucide-react';
import { InverterState } from '../../../../store/useTechStore';
import { ValidationChip } from './components/ValidationChip';
import { ValidationChipMini } from './components/ValidationChipMini';
import { DiagnosticAlertsList, AlertDescriptor } from './components/DiagnosticAlertsList';

interface ElectricalDiagnosticPanelProps {
  inverterState: InverterState;
  fdi: number;
  vocMaxGlobal: number;
  iscMaxGlobal: number;
  vocGlobalStatus: 'ok' | 'warning' | 'error';
  iscGlobalStatus: 'ok' | 'warning' | 'error';
  alerts: AlertDescriptor[];
  abrirCatalogo: () => void;
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
}) => {


  let fdiSeverity: 'ok' | 'warn' | 'error' = 'ok';
  if (fdi < 0.8 || fdi > 1.35) fdiSeverity = 'error';
  else if (fdi < 0.85 || fdi > 1.25) fdiSeverity = 'warn';

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* 1. Visão Geral do Inversor */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 flex flex-col gap-2 shrink-0">
        <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Equipamento Selecionado</p>
        <h3 className="text-sm font-medium text-slate-200">
          Inversor Principal
        </h3>
        <h4 
          className="text-xs text-emerald-400 font-mono truncate"
          title={inverterState.snapshot.model}
        >
          {inverterState.snapshot.model}
        </h4>
        
        <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-2 text-[11px] text-slate-400">
          <span className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Potência</span>
            <span className="text-slate-300 font-mono">{inverterState.snapshot.nominalPower.toFixed(2)} kW</span>
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Qtd MPPTs</span>
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

      {/* 2. Chips Rápidos de Status (Global) */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-3 flex flex-col gap-3 shrink-0">
        <p className="text-[11px] text-slate-500 uppercase tracking-wider">Métricas de Dimensionamento</p>
        
        <ValidationChip 
          label="FDI Global" 
          value={`${(fdi * 100).toFixed(2)}%`} 
          severity={fdiSeverity} 
          subtitle="Recomendado: 80% - 135%"
          size="normal"
        />

        <div className="grid grid-cols-2 gap-2">
          <ValidationChipMini 
            label="Voc Máx" 
            value={vocMaxGlobal > 0 ? `${vocMaxGlobal.toFixed(2)} V` : '--- V'} 
            severity={vocGlobalStatus} 
          />
          <ValidationChipMini 
            label="Isc Máx" 
            value={iscMaxGlobal > 0 ? `${iscMaxGlobal.toFixed(2)} A` : '--- A'} 
            severity={iscGlobalStatus} 
          />
        </div>
      </div>

      {/* 3. Lista de Diagnósticos */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-3 overflow-hidden flex flex-col min-h-0 flex-1">
        <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-3 shrink-0">Diagnósticos Ativos</p>
        <div className="overflow-y-auto pr-1 flex-1">
          <DiagnosticAlertsList alerts={alerts} />
        </div>
      </div>
    </div>
  );
};
