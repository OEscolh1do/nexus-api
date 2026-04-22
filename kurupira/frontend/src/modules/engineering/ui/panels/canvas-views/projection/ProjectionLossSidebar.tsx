/** 
 * =============================================================================
 * PROJECTION LOSS SIDEBAR — Decomposição do PR (Versão Vertical/N-Panel)
 * =============================================================================
 * Estilo: Blender-inspired Sidebar (N-Panel).
 * Posicionamento: Lateral Direita.
 *
 * Acento: Amber (Semântica de Geração)
 * =============================================================================
 */

import React from 'react';
import { X, RotateCcw, Info } from 'lucide-react';
import { useTechStore, LossProfile } from '../../../../store/useTechStore';
import { LOSS_CONFIG } from '../../../../constants/lossConfig';
import { useUIStore } from '@/core/state/uiStore';
import { cn } from '@/lib/utils';

// ─── SUB-COMPONENTES INTERNOS ────────────────────────────────────────────────

const SegmentedProgress: React.FC<{
  value: number;
  max: number;
  color: string;
}> = ({ value, max, color }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="flex-1 h-[4px] bg-slate-900 overflow-hidden relative border border-slate-800/50">
      <div 
        className="absolute inset-0 w-full h-full opacity-10"
        style={{
          backgroundImage: 'linear-gradient(90deg, #000 2px, transparent 0)',
          backgroundSize: '4px 100%'
        }}
      />
      <div 
        className="h-full transition-all duration-700 ease-out"
        style={{
          width: `${percentage}%`,
          backgroundColor: color,
          backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 0)',
          backgroundSize: '3px 100%'
        }}
      />
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────

export const ProjectionLossSidebar: React.FC = () => {
  const isOpen = useUIStore((s) => s.isLossSidebarOpen);
  const closeSidebar = useUIStore((s) => s.closeLossSidebar);

  const lossProfile             = useTechStore((s) => s.lossProfile);
  const updateLoss              = useTechStore((s) => s.updateLoss);
  const resetLosses             = useTechStore((s) => s.resetLosses);
  const getPerformanceRatio     = useTechStore((s) => s.getPerformanceRatio);
  const getAdditivePerformanceRatio = useTechStore((s) => s.getAdditivePerformanceRatio);
  const prCalculationMode       = useTechStore((s) => s.prCalculationMode);
  const cosip                   = useTechStore((s) => s.cosip);
  const setCosip               = useTechStore((s) => s.setCosip);

  const prDecimal =
    prCalculationMode === 'additive'
      ? getAdditivePerformanceRatio()
      : getPerformanceRatio();

  const prPct = (prDecimal * 100).toFixed(1);

  if (!isOpen) return null;

  const handleChange = (
    key: keyof LossProfile,
    rawValue: string,
    type: 'loss' | 'efficiency'
  ) => {
    const parsed = parseFloat(rawValue);
    if (isNaN(parsed)) return;
    const clamped = type === 'efficiency'
      ? Math.min(100, Math.max(50, +parsed.toFixed(1)))
      : Math.min(30, Math.max(0,  +parsed.toFixed(1)));
    updateLoss(key, clamped);
  };

  return (
    <>
      {/* Overlay para Mobile/Tablet */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={closeSidebar}
        />
      )}

      <div className={cn(
        "fixed inset-y-0 right-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-2xl border-l border-amber-900/20 shadow-2xl transition-all duration-300 ease-out",
        "w-full sm:w-[400px] lg:w-80",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] bg-amber-500/5 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">
              Decomposição do PR
            </span>
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Premissas de Perda
            </span>
          </div>
          <button 
            onClick={closeSidebar}
            className="p-2 -mr-2 hover:bg-white/10 text-slate-500 hover:text-white transition-colors rounded-full"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Content ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-8 gap-y-6">
            {LOSS_CONFIG.map((cfg) => {
              const rawVal = lossProfile[cfg.key];
              const displayLoss = cfg.type === 'efficiency'
                ? +(100 - rawVal).toFixed(1)
                : rawVal;

              const barColor =
                displayLoss >= 5 ? '#f43f5e' :
                displayLoss >= 3 ? '#fbbf24' :
                '#475569';

              return (
                <div key={cfg.key} className="space-y-2 group/row">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider group-hover/row:text-amber-400 transition-colors">
                        {cfg.label}
                      </span>
                      <div className="opacity-100 lg:opacity-0 lg:group-hover/row:opacity-100 transition-opacity cursor-help" title={cfg.description}>
                        <Info size={10} className="text-slate-600" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step={0.1}
                        value={rawVal}
                        onChange={(e) => handleChange(cfg.key, e.target.value, cfg.type)}
                        className="w-12 bg-slate-900 border border-slate-800 text-[10px] font-mono font-black text-right px-1.5 py-1
                                outline-none tabular-nums text-slate-300 focus:border-amber-500/50 focus:text-amber-400 focus:bg-amber-500/5 transition-all"
                      />
                      <span className="text-[8px] font-bold text-slate-700">%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <SegmentedProgress value={displayLoss} max={15} color={barColor} />
                    <span className="text-[8px] font-black font-mono tabular-nums text-slate-600 w-8 text-right">
                      -{displayLoss.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Premissas de Fatura ───────────────────────────────────────────── */}
          <div className="mt-10 pt-8 border-t border-white/[0.05] space-y-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">
                Premissas de Fatura
              </span>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                Custos Inelimináveis
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
              <div className="space-y-3 group/row">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider group-hover/row:text-amber-400 transition-colors">
                      Iluminação Pública
                    </span>
                    <div className="cursor-help" title="Valor fixo mensal cobrado pela prefeitura (COSIP)">
                      <Info size={10} className="text-slate-600" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-bold text-slate-700">R$</span>
                    <input
                      type="number"
                      step={1}
                      value={cosip}
                      onChange={(e) => setCosip(parseFloat(e.target.value) || 0)}
                      className="w-16 bg-slate-900 border border-slate-800 text-[10px] font-mono font-black text-right px-1.5 py-1
                              outline-none tabular-nums text-slate-300 focus:border-amber-500/50 focus:text-amber-400 focus:bg-amber-500/5 transition-all"
                    />
                  </div>
                </div>
                <p className="text-[8px] text-slate-600 leading-tight italic">
                  Este valor será somado à taxa mínima no gráfico de decomposição financeira.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <div className="p-6 bg-black/60 border-t border-white/[0.05] space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">PR Final Estimado</span>
              <span className="text-2xl font-mono font-black text-amber-400 tabular-nums leading-none mt-1">
                {prPct}%
              </span>
            </div>
            
            <button
              onClick={resetLosses}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-800 text-[9px] font-black uppercase tracking-wider
                        text-slate-500 hover:text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </div>

          <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-sm">
            <p className="text-[8px] text-slate-500 leading-relaxed">
              As perdas são calculadas de forma <span className="text-amber-600 font-bold">{prCalculationMode === 'additive' ? 'Aditiva' : 'Composta'}</span>. 
              Este valor impacta diretamente toda a projeção anual e o ROI.
            </p>
          </div>
        </div>

      </div>
    </>
  );
};
