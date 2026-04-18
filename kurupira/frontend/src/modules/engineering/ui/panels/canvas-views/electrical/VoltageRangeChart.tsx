import React from 'react';

export interface MpptThermalProfile {
  mpptId: string | number;
  vocMax: number;
  vmpMin: number;
  vmpMax: number;
}

interface VoltageRangeChartProps {
  mpptProfiles: MpptThermalProfile[];
  limitInversorVMax: number;
  limitMpptVMin: number;
  limitMpptVMax: number;
}

export const VoltageRangeChart: React.FC<VoltageRangeChartProps> = ({
  mpptProfiles,
  limitInversorVMax,
  limitMpptVMin,
  limitMpptVMax,
}) => {
  // Find absolute maximum bound to compute safe axis width
  let overallVocMax = 0;
  mpptProfiles.forEach(p => {
      if (p.vocMax > overallVocMax) overallVocMax = p.vocMax;
  });
  
  // Chart goes up to 1.15x of the inverter limit to provide visual breathing room
  const maxAxis = Math.max(limitInversorVMax * 1.15, overallVocMax * 1.05, 100);
  const getPercent = (value: number) => `${Math.min(100, Math.max(0, (value / maxAxis) * 100))}%`;

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 relative flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
         <span className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">Análise Termodinâmica Multi-MPPT</span>
      </div>

      <div className="relative w-full border-l border-slate-700/50 min-h-[64px] flex flex-col justify-center gap-3 py-2">
        
        {/* Fundo: Zona MPPT Ótima (Vmin até Vmax Mppt) */}
        <div 
          className="absolute top-0 bottom-0 bg-emerald-500/10 border-x border-emerald-500/20 z-0"
          style={{ 
            left: getPercent(limitMpptVMin), 
            width: getPercent(limitMpptVMax - limitMpptVMin) 
          }}
        >
           <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] text-emerald-500/60 uppercase tracking-widest whitespace-nowrap">
             Faixa MPPT
           </div>
        </div>

        {/* Linha Fundo: Limite do Inversor (Vermelha) */}
        <div 
          className="absolute top-0 bottom-0 w-px bg-red-500/80 z-0"
          style={{ left: getPercent(limitInversorVMax) }}
        >
          <div className="absolute -top-3 left-1 text-[11px] text-red-500 uppercase font-bold whitespace-nowrap">
             Max Inv {limitInversorVMax.toFixed(2)}V
          </div>
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-r from-red-500/10 to-transparent pointer-events-none" />
        </div>

        {/* Iteração de Barras por MPPT */}
        {mpptProfiles.map((p) => {
           if (p.vmpMin === 0 && p.vmpMax === 0 && p.vocMax === 0) return null; // Ignora MPPTs vazios

           return (
             <div key={p.mpptId} className="relative h-4 w-full z-10 group">
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 font-mono">
                   M{p.mpptId}
                </div>
                
                {/* Eixo central da string */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700/30 -translate-y-1/2" />
                
                {/* Barra Range Operacional VMP */}
                <div 
                   className="absolute h-3 bg-amber-500/90 rounded-sm top-1/2 -translate-y-1/2 shadow-sm border-x-2 border-amber-400 opacity-90 group-hover:opacity-100 transition-opacity"
                   title={`Vmp Range: ${p.vmpMin.toFixed(2)}V a ${p.vmpMax.toFixed(2)}V`}
                   style={{ 
                     left: getPercent(p.vmpMin), 
                     width: getPercent(p.vmpMax - p.vmpMin) 
                   }}
                />

                {/* Marcador Voc Max */}
                <div 
                   className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-4 bg-sky-400 z-20 shadow-[0_0_8px_rgba(56,189,248,0.5)] ${p.vocMax > limitInversorVMax ? 'bg-red-500 shadow-red-500/50' : ''}`}
                   title={`Voc Máximo: ${p.vocMax.toFixed(2)}V`}
                   style={{ left: getPercent(p.vocMax) }}
                >
                   {/* Tooltip flutuante no Hover */}
                   <div className="hidden group-hover:flex absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 px-2 py-1 rounded text-[11px] font-mono text-slate-300 shadow-xl whitespace-nowrap z-50">
                      Voc: <span className={p.vocMax > limitInversorVMax ? 'text-red-400 ml-1 font-bold' : 'text-sky-400 ml-1 font-bold'}>{p.vocMax.toFixed(2)}V</span>
                   </div>
                </div>
             </div>
           );
        })}

        {mpptProfiles.filter(p => p.vmpMin > 0 || p.vocMax > 0).length === 0 && (
           <div className="text-xs text-slate-600 text-center relative z-10 w-full font-mono py-2">
             Sem strings conectadas
           </div>
        )}

      </div>

      <div className="flex flex-wrap gap-4 items-center justify-center mt-3 text-[11px] text-slate-500 uppercase tracking-wider">
         <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-amber-500" /> Vmp Operacional</span>
         <span className="flex items-center gap-1.5"><span className="w-1.5 h-3 bg-sky-400 shadow-sm shadow-sky-500/50" /> Voc (Aberto T. Mín)</span>
         <span className="flex items-center gap-1.5"><span className="w-3 h-2 border border-emerald-500/50 bg-emerald-500/20" /> Range Inversor</span>
      </div>
    </div>
  );
};
