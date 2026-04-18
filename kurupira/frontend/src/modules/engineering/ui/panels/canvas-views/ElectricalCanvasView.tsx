import React, { useMemo } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '../../../store/useTechStore';
import { useTechKPIs } from '../../../hooks/useTechKPIs';
import { useElectricalValidation } from '../../../hooks/useElectricalValidation';
import { toArray } from '@/core/types/normalized.types';
import { CheckCircle, AlertTriangle, ArrowRight, ZapOff } from 'lucide-react';
import { useUIStore } from '@/core/state/uiStore';
import { usePanelStore } from '../../../store/panelStore';
import { calculateStringMetrics } from '../../../utils/electricalMath';

// Componentes extraídos
import { VoltageRangeChart, type MpptThermalProfile } from './electrical/VoltageRangeChart';
import { MPPTTopologyManager } from './electrical/MPPTTopologyManager';
import { ElectricalDiagnosticPanel } from './electrical/ElectricalDiagnosticPanel';
import { AlertDescriptor } from './electrical/components/DiagnosticAlertsList';

export const ElectricalCanvasView: React.FC = () => {
  const settings = useSolarStore(state => state.settings);
  const modules = useSolarStore(selectModules);
  const invertersNorm = useTechStore(state => state.inverters);
  const updateMPPTConfig = useTechStore(state => state.updateMPPTConfig);
  
  const setFocusedBlock = useUIStore(s => s.setFocusedBlock);
  const restoreMap = usePanelStore(s => s.restoreMap);

  const { kpi } = useTechKPIs();
  const { electrical, globalHealth } = useElectricalValidation();

  const techInverters = useMemo(() => toArray(invertersNorm), [invertersNorm]);
  const activeInverter = techInverters[0]; // Assumindo suporte unifilar primário

  const repModule = modules[0] ?? null;
  const moduleSpecs = repModule ? {
    voc: repModule.voc,
    vmp: repModule.vmp ?? repModule.voc * 0.82,
    isc: repModule.isc ?? 0,
    tempCoeffVoc: repModule.tempCoeff || -0.29,
  } : null;

  // Calculo Derivado Geral (Memoizado)
  const dashboardData = useMemo(() => {
    if (!activeInverter || !moduleSpecs) return null;

    let totalVocMax = 0;
    let totalIscMax = 0;
    let limitVmpMinGlobal = 9999;
    let limitVmpMaxGlobal = 0;
    const limitInverterVMax = activeInverter.snapshot?.maxInputVoltage ?? 1000;
    const limitMpptVMinGlobal = activeInverter.snapshot?.minMpptVoltage ?? 150;
    const limitMpptVMaxGlobal = activeInverter.snapshot?.maxMpptVoltage ?? 800;
    const limitIscMaxMppt = activeInverter.snapshot?.maxCurrentPerMPPT ?? 22;

    // Iterar MPPTs para construir perfis térmicos individuais
    const mpptProfiles: MpptThermalProfile[] = [];

    activeInverter.mpptConfigs.forEach(mppt => {
      const mods = mppt.modulesPerString || 0;
      const strCount = mppt.stringsCount || 0;

      if (mods > 0 && strCount > 0) {
        const metrics = calculateStringMetrics(moduleSpecs, mods, settings.minHistoricalTemp);
        
        if (metrics.vocMax > totalVocMax) totalVocMax = metrics.vocMax;
        
        const iscmppt = moduleSpecs.isc * strCount;
        if (iscmppt > totalIscMax) totalIscMax = iscmppt;

        if (metrics.vmpMax > limitVmpMaxGlobal) limitVmpMaxGlobal = metrics.vmpMax;
        if (metrics.vmpMin < limitVmpMinGlobal) limitVmpMinGlobal = metrics.vmpMin;

        mpptProfiles.push({
          mpptId: mppt.mpptId,
          vocMax: metrics.vocMax,
          vmpMin: metrics.vmpMin,
          vmpMax: metrics.vmpMax,
        });
      }
    });

    if (totalVocMax === 0) {
      limitVmpMinGlobal = 0;
      limitVmpMaxGlobal = 0;
    }

    // Parsing das mensagens do EV
    const alerts: AlertDescriptor[] = [];
    if (electrical?.entries) {
       electrical.entries.forEach(entry => {
         entry.messages.forEach((msg, idx) => {
             alerts.push({
               id: `${entry.mpptId}-${idx}`,
               mpptId: entry.mpptId.toString(),
               severity: entry.status === 'error' ? 'error' : 'warning',
               message: msg
             });
         });
       });
    }

    return {
      totalVocMax,
      totalIscMax,
      limitVmpMinGlobal,
      limitVmpMaxGlobal,
      limitInverterVMax,
      limitMpptVMinGlobal,
      limitMpptVMaxGlobal,
      limitIscMaxMppt,
      mpptProfiles,
      alerts
    };
  }, [activeInverter, moduleSpecs, settings.minHistoricalTemp, electrical]);


  // Handlers Finais
  const handleGoToSimulation = () => {
    setFocusedBlock('simulation');
    restoreMap();
  };

  const handleOpenCatalog = () => {
    // Integração com catálogo (usando UI store para forçar left outliner modal ou overlay)
    // Para simplificar, focamos no block inverter
    setFocusedBlock('inverter');
  };

  if (!activeInverter || !repModule || !dashboardData) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6 text-slate-500">
        <ZapOff size={48} className="mb-4 opacity-50" />
        <p className="text-sm font-medium text-slate-300">Inventário Incompleto</p>
        <p className="text-xs max-w-sm text-center mt-2">
          Adicione um inversor e módulos no fluxo do sistema para habilitar a visualização e cálculo da topologia elétrica.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 p-4 gap-4 overflow-hidden">
      
      {/* GRID PRINCIPAL 75/25 */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-4 flex-1 min-h-0 items-start">
        
        {/* Painel A — Esquerda (3fr) */}
        <div className="flex flex-col gap-4 h-full overflow-y-auto pr-2 custom-scrollbar">
           
           <VoltageRangeChart 
              mpptProfiles={dashboardData.mpptProfiles}
              limitInversorVMax={dashboardData.limitInverterVMax}
              limitMpptVMin={dashboardData.limitMpptVMinGlobal}
              limitMpptVMax={dashboardData.limitMpptVMaxGlobal}
           />

           <div className="flex flex-col gap-3">
             <span className="text-[11px] text-slate-500 uppercase tracking-widest font-bold ml-1 mt-2">
               Configuração e Topologia (Por MPPT)
             </span>
             {activeInverter.mpptConfigs.map(mppt => {
               const mods = mppt.modulesPerString || 0;
               const strCount = mppt.stringsCount || 0;
               const mpptMetrics = moduleSpecs ? calculateStringMetrics(moduleSpecs, mods, settings.minHistoricalTemp) : { vocMax: 0, vmpMin: 0, vmpMax: 0, vmpNominal: 0 };
               const localIsc = moduleSpecs ? moduleSpecs.isc : 0;
               const localVoc = moduleSpecs ? moduleSpecs.voc : 0;

               return (
                 <MPPTTopologyManager 
                   key={mppt.mpptId}
                   inverterId={activeInverter.id}
                   mpptConfig={mppt}
                   updateMPPT={updateMPPTConfig}
                   vocCalculado={mpptMetrics.vocMax}
                   iscCalculado={localIsc * strCount}
                   potenciaMppt={(localVoc * 0.8 * localIsc * 0.9 * mods * strCount) / 1000} // Estimativa kWp DC
                   vMaxInversor={dashboardData.limitInverterVMax}
                   iscMaxMppt={dashboardData.limitIscMaxMppt} 
                 />
               );
             })}
           </div>

        </div>

        {/* Painel B — Direita (1fr) */}
        <div className="h-full overflow-hidden">
          <ElectricalDiagnosticPanel 
            inverterState={activeInverter}
            fdi={kpi.dcAcRatio}
            vocMaxGlobal={dashboardData.totalVocMax}
            iscMaxGlobal={dashboardData.totalIscMax}
            vocGlobalStatus={dashboardData.totalVocMax > dashboardData.limitInverterVMax ? 'error' : dashboardData.totalVocMax > dashboardData.limitInverterVMax * 0.9 ? 'warning' : 'ok'}
            iscGlobalStatus={dashboardData.totalIscMax > dashboardData.limitIscMaxMppt ? 'error' : dashboardData.totalIscMax > dashboardData.limitIscMaxMppt * 0.9 ? 'warning' : 'ok'}
            alerts={dashboardData.alerts}
            abrirCatalogo={handleOpenCatalog}
          />
        </div>

      </div>

      {/* FAIXA CTTA */}
      <div className="mt-auto pt-3 border-t border-slate-800 shrink-0">
        {globalHealth !== 'error' ? (
          <div className="flex items-center justify-between px-4 py-3 bg-emerald-900/10 border border-emerald-500/20 rounded-sm">
             <span className="text-sm font-medium text-emerald-400 flex items-center gap-2">
               <CheckCircle size={16} /> Dimensionamento Elétrico Termodinâmico Válido
             </span>
             <button 
               onClick={handleGoToSimulation}
               className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-sm font-bold rounded-sm shadow-lg transition-all focus:ring-2 focus:ring-emerald-400 focus:outline-none"
             >
               Prosseguir para Simulação Energética
               <ArrowRight size={16} />
             </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-950/20 border border-red-900/40 rounded-sm">
             <AlertTriangle size={18} className="text-red-500 shrink-0" />
             <span className="text-sm text-red-300">
               Existem restrições térmicas impeditivas. Revise as strings e limites de tensão/corrente nos MPPTs para prosseguir com a simulação.
             </span>
          </div>
        )}
      </div>

    </div>
  );
};
