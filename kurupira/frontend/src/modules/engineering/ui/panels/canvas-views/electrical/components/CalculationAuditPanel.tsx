import React from 'react';
import { cn } from '@/lib/utils';
import { MPPTConfig } from '../../../../../store/useTechStore';

interface MPPTMiniMetrics {
  vocFrio: number;
  vmpCalor: number;
  iscTotal: number;
  impTotal: number;
  powerKwp: number;
  hasMismatch?: boolean;
}

interface CalculationAuditPanelProps {
  mpptConfigs: MPPTConfig[];
  mpptMetrics: Record<number, MPPTMiniMetrics>;
  dashboardData: any;
  activeInverterSnapshot: any;
  moduleSpecs: any;
  fdi: number;
  totalKwpCC: number;
  totalKwCA: number;
  tmin: number;
  tambMax: number;
}

export const CalculationAuditPanel: React.FC<CalculationAuditPanelProps> = ({
  mpptConfigs,
  mpptMetrics,
  dashboardData,
  activeInverterSnapshot,
  moduleSpecs,
  fdi,
  totalKwpCC,
  totalKwCA,
  tmin,
  tambMax,
}) => {
  if (!dashboardData || !activeInverterSnapshot || !moduleSpecs) return null;

  const tcelulaMax = tambMax + (moduleSpecs.noct - 20);

  return (
    <div className="w-full flex flex-col gap-6 text-slate-300">
      
      {/* Header e Premissas */}
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500">
            Memorial de Cálculo Elétrico — NBR 16690
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">
            Auditoria paramétrica aberta para responsabilidade técnica (ART). As equações abaixo demonstram o comportamento do sistema nos limites climáticos do local.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-900/50 p-3 rounded border border-slate-800">
          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Temp. Mín Histórica (Voc)</div>
            <div className="font-mono text-xs text-sky-400">{tmin.toFixed(1)} °C</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Temp. Máx Célula (Vmp)</div>
            <div className="font-mono text-xs text-amber-500">{tcelulaMax.toFixed(1)} °C</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Coeficiente Térmico β (Voc)</div>
            <div className="font-mono text-xs text-slate-300">{moduleSpecs.tempCoeffVoc.toFixed(2)} %/°C</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Módulo Fotovoltaico</div>
            <div className="font-mono text-xs text-slate-300">{moduleSpecs.pmax}W {moduleSpecs.isBifacial ? '(Bifacial)' : '(Monofacial)'}</div>
          </div>
        </div>
      </div>

      {/* Grid de Tabelas */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Tabela de Inversor e Limites Globais */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-md overflow-hidden">
          <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 text-[11px] font-black uppercase tracking-widest text-slate-400">
            1. Parâmetros Globais do Inversor
          </div>
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/30">
                <th className="py-2 px-4 font-bold text-slate-500 w-1/4">Verificação</th>
                <th className="py-2 px-4 font-bold text-slate-500 w-[40%]">Memorial (Fórmula Resolvida)</th>
                <th className="py-2 px-4 font-bold text-slate-500">Limite / Recomendado</th>
                <th className="py-2 px-4 font-bold text-slate-500">Diagnóstico</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-800/50 hover:bg-white/[0.02]">
                <td className="py-2 px-4">
                  <div className="font-mono text-emerald-400">FDI (Taxa CC/CA)</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Oversizing</div>
                </td>
                <td className="py-2 px-4 font-mono text-slate-400 leading-relaxed text-[10px]">
                  {totalKwpCC.toFixed(2)} kWp ÷ {totalKwCA.toFixed(2)} kW <br/>
                  <span className="text-white text-xs font-bold">= {fdi.toFixed(2)}</span>
                </td>
                <td className="py-2 px-4 font-mono text-slate-500">1.05 - 1.35</td>
                <td className="py-2 px-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase tracking-wider",
                    fdi > 1.5 ? "bg-amber-500/20 text-amber-400" : fdi < 1.05 ? "bg-slate-500/20 text-slate-400" : "bg-emerald-500/20 text-emerald-400"
                  )}>
                    {fdi > 1.5 ? 'Clipping Severo' : fdi < 1.05 ? 'Subdimensionado' : 'Adequado'}
                  </span>
                </td>
              </tr>
              <tr className="border-b border-slate-800/50 hover:bg-white/[0.02]">
                <td className="py-2 px-4">
                  <div className="font-mono text-slate-400">Tensão Máx Entrada</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Hardware</div>
                </td>
                <td className="py-2 px-4 font-mono text-slate-400 leading-relaxed text-[10px]">
                  Vmax Inversor (Datasheet) <br/>
                  <span className="text-white text-xs font-bold">= {activeInverterSnapshot.maxInputVoltage} V</span>
                </td>
                <td className="py-2 px-4 font-mono text-slate-500">-</td>
                <td className="py-2 px-4">
                  <span className="px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase tracking-wider bg-slate-800 text-slate-400">Fixo</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tabelas por MPPT */}
        {mpptConfigs.map((mppt) => {
          const metrics = mpptMetrics[mppt.mpptId];
          if (!metrics || metrics.powerKwp === 0) return null;

          const n_serie = mppt.modulesPerString;
          const n_paralelo = mppt.stringsCount;
          const limitVmaxSafety = dashboardData.limitInverterVMax * 0.95;

          const vocSafety = metrics.vocFrio <= dashboardData.limitInverterVMax;
          const voc95Safety = metrics.vocFrio <= limitVmaxSafety;
          const vmpSafety = metrics.vmpCalor >= dashboardData.limitMpptVMin;
          const iscLimit = dashboardData.limitIscMaxMppt;
          const iscFatorSafety = metrics.iscTotal <= iscLimit;
          const impClipping = metrics.impTotal > iscLimit; // Clipping = Operacional excede MPPT, mas Hardware aguenta

          // Fórmula explícitas
          const formulaVoc = `${n_serie} × ${moduleSpecs.voc.toFixed(1)}V × [1 + (${moduleSpecs.tempCoeffVoc}% × (${tmin}°C - 25°C))]`;
          const formulaVmp = `${n_serie} × ${moduleSpecs.vmp.toFixed(1)}V × [1 + (${moduleSpecs.tempCoeffVmp}% × (${tcelulaMax.toFixed(0)}°C - 25°C))]`;
          const formulaIsc = `${n_paralelo} × ${moduleSpecs.isc.toFixed(2)}A × 1.25 (NBR)`;
          const formulaImp = `${n_paralelo} × ${moduleSpecs.imp.toFixed(2)}A`;

          return (
            <div key={mppt.mpptId} className="bg-slate-900/50 border border-slate-800 rounded-md overflow-hidden">
              <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  MPPT {mppt.mpptId} — Strings: {n_paralelo} × {n_serie} Módulos
                </span>
                {n_paralelo >= 3 && (
                  <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase tracking-wider">
                    Fusíveis CC Obrigatórios (NBR 16690 §7.4)
                  </span>
                )}
              </div>
              
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/30">
                    <th className="py-2 px-4 font-bold text-slate-500 w-1/4">Verificação</th>
                    <th className="py-2 px-4 font-bold text-slate-500 w-[40%]">Memorial (Fórmula Resolvida)</th>
                    <th className="py-2 px-4 font-bold text-slate-500">Limite Inversor</th>
                    <th className="py-2 px-4 font-bold text-slate-500">Diagnóstico</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Voc Frio */}
                  <tr className="border-b border-slate-800/50 hover:bg-white/[0.02]">
                    <td className="py-2 px-4">
                      <div className="font-mono text-sky-400">Voc (Frio Extremo)</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">Teto Térmico</div>
                    </td>
                    <td className="py-2 px-4 font-mono text-slate-400 leading-relaxed text-[10px]">
                      {formulaVoc} <br/>
                      <span className="text-white text-xs font-bold">= {metrics.vocFrio.toFixed(1)} V</span>
                    </td>
                    <td className="py-2 px-4 font-mono text-slate-500">
                      {'<'} {limitVmaxSafety.toFixed(0)}V (95%)
                    </td>
                    <td className="py-2 px-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase tracking-wider",
                        !vocSafety ? "bg-red-500/20 text-red-400" : !voc95Safety ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                      )}>
                        {!vocSafety ? 'Risco de Queima' : !voc95Safety ? 'Atenção: Margem < 5%' : 'Seguro'}
                      </span>
                    </td>
                  </tr>

                  {/* Vmp Calor */}
                  <tr className="border-b border-slate-800/50 hover:bg-white/[0.02]">
                    <td className="py-2 px-4">
                      <div className="font-mono text-amber-500">Vmp (Calor Extremo)</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">Piso MPPT</div>
                    </td>
                    <td className="py-2 px-4 font-mono text-slate-400 leading-relaxed text-[10px]">
                      {formulaVmp} <br/>
                      <span className="text-white text-xs font-bold">= {metrics.vmpCalor.toFixed(1)} V</span>
                    </td>
                    <td className="py-2 px-4 font-mono text-slate-500">
                      {'>'} {dashboardData.limitMpptVMin} V
                    </td>
                    <td className="py-2 px-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase tracking-wider",
                        vmpSafety ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                      )}>
                        {vmpSafety ? 'Na Janela MPPT' : 'Perda de Eficiência'}
                      </span>
                    </td>
                  </tr>

                  {/* Isc Hardware */}
                  <tr className="border-b border-slate-800/50 hover:bg-white/[0.02]">
                    <td className="py-2 px-4">
                      <div className="font-mono text-rose-400">Isc (Corrente de Falta)</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">Hardware Inversor</div>
                    </td>
                    <td className="py-2 px-4 font-mono text-slate-400 leading-relaxed text-[10px]">
                      {formulaIsc} <br/>
                      <span className="text-white text-xs font-bold">= {metrics.iscTotal.toFixed(1)} A</span>
                    </td>
                    <td className="py-2 px-4 font-mono text-slate-500">
                      {'<'} {iscLimit} A
                    </td>
                    <td className="py-2 px-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase tracking-wider",
                        iscFatorSafety ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                      )}>
                        {iscFatorSafety ? 'Dentro do Limite' : 'Violação de Hardware'}
                      </span>
                    </td>
                  </tr>

                  {/* Imp Operacional (Clipping) */}
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2 px-4">
                      <div className="font-mono text-indigo-400">Imp (Corrente Max.)</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">Operação / Clipping</div>
                    </td>
                    <td className="py-2 px-4 font-mono text-slate-400 leading-relaxed text-[10px]">
                      {formulaImp} {moduleSpecs.isBifacial && '× (Ganho Traseiro)'} <br/>
                      <span className="text-white text-xs font-bold">= {metrics.impTotal.toFixed(1)} A</span>
                    </td>
                    <td className="py-2 px-4 font-mono text-slate-500">
                      {'<'} {iscLimit} A
                    </td>
                    <td className="py-2 px-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase tracking-wider",
                        !impClipping ? "bg-emerald-500/20 text-emerald-400" : "bg-indigo-500/20 text-indigo-400"
                      )}>
                        {!impClipping ? 'Sem Restrição' : 'Ocorre Clipping'}
                      </span>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          );
        })}
        
      </div>
    </div>
  );
};
