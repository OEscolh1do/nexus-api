import React from 'react';
import { cn } from '@/lib/utils';

interface TechnicalDiagramProps {
  voc: number;
  isc: number;
  vmp: number;
  imp: number;
  className?: string;
}

export const TechnicalDiagram: React.FC<TechnicalDiagramProps> = ({
  voc,
  isc,
  vmp,
  imp,
  className
}) => {
  // Coordenadas normalizadas (0-100)
  // Curva de diodo simples aproximada: I = Isc * (1 - exp(V/Vt))
  // Aqui faremos um SVG de 200x120
  
  const width = 200;
  const height = 120;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Pontos da curva (aproximada para visualização de engenharia)
  const points = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const v_norm = i / steps;
    // Curva PV característica (joelho no Vmp/Imp)
    // Usamos uma função que passe por (0, Isc), (Vmp, Imp) e (Voc, 0)
    let i_norm;
    if (v_norm < (vmp / voc)) {
        // Regra de corrente quase constante
        i_norm = 1 - (1 - (imp / isc)) * Math.pow(v_norm / (vmp / voc), 4);
    } else {
        // Queda rápida após o Vmp
        i_norm = (imp / isc) * (1 - Math.pow((v_norm - (vmp / voc)) / (1 - (vmp / voc)), 2));
    }
    
    const x = padding + v_norm * chartWidth;
    const y = padding + (1 - Math.max(0, i_norm)) * chartHeight;
    points.push(`${x},${y}`);
  }

  const pathData = `M ${points.join(' L ')}`;
  const mppX = padding + (vmp / voc) * chartWidth;
  const mppY = padding + (1 - (imp / isc)) * chartHeight;

  return (
    <div className={cn("bg-slate-950/60 border border-slate-800 p-3 rounded-none relative overflow-hidden", className)}>
      <div className="absolute top-2 left-3 text-[7px] text-slate-600 font-black uppercase tracking-widest">Curva Característica I-V (STC)</div>
      
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="mt-2">
        {/* Eixos */}
        <line x1={padding} y1={height - padding} x2={width - padding/2} y2={height - padding} stroke="#334155" strokeWidth="1" />
        <line x1={padding} y1={padding/2} x2={padding} y2={height - padding} stroke="#334155" strokeWidth="1" />
        
        {/* Grid lines sutis */}
        <line x1={padding} y1={padding + chartHeight/2} x2={width - padding} y2={padding + chartHeight/2} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1={padding + chartWidth/2} y1={padding} x2={padding + chartWidth/2} y2={height - padding} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />

        {/* Curva Principal */}
        <path 
          d={pathData} 
          fill="none" 
          stroke="url(#ivGradient)" 
          strokeWidth="2" 
          strokeLinecap="round" 
          className="drop-shadow-[0_0_3px_rgba(251,191,36,0.4)]"
        />
        
        {/* Ponto MPP */}
        <circle cx={mppX} cy={mppY} r="3" fill="#fbbf24" />
        <circle cx={mppX} cy={mppY} r="6" fill="transparent" stroke="#fbbf24" strokeWidth="0.5" className="animate-ping" />
        
        {/* Labels de Eixo */}
        <text x={width - padding} y={height - 5} fill="#475569" fontSize="6" textAnchor="end" fontStyle="italic">V (Volts)</text>
        <text x={5} y={padding} fill="#475569" fontSize="6" transform={`rotate(-90 5,${padding})`} fontStyle="italic">I (Amperes)</text>

        {/* Valores Chave */}
        <text x={padding} y={padding + 10} fill="#94a3b8" fontSize="6" fontStyle="mono">{isc}A</text>
        <text x={width - padding} y={height - padding - 5} fill="#94a3b8" fontSize="6" textAnchor="end" fontStyle="mono">{voc}V</text>

        <defs>
          <linearGradient id="ivGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="70%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>
      </svg>
      
      <div className="flex justify-between mt-1 px-1">
         <div className="flex flex-col">
            <span className="text-[6px] text-slate-600 uppercase font-bold">Fill Factor</span>
            <span className="text-[8px] text-amber-500 font-mono font-bold">{((vmp * imp) / (voc * isc) * 100).toFixed(1)}%</span>
         </div>
         <div className="flex flex-col items-end">
            <span className="text-[6px] text-slate-600 uppercase font-bold">Ponto MPP</span>
            <span className="text-[8px] text-slate-400 font-mono font-bold">{vmp}V / {imp}A</span>
         </div>
      </div>
    </div>
  );
};
