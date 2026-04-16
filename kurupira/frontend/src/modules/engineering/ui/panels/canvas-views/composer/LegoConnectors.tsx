import React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// LEGO TAB — Conector puzzle Scratch-style na base de um bloco
//
// Forma visual (de cima para baixo):
//   ████████████████████████████████  ← "ombros" (4px, full-width)
//   ████████  ╭──────────╮  ████████
//             │  label   │           ← "bump" (12px, centralizado)
//             ╰──────────╯
// =============================================================================

// SemanticColor — extende conforme context.md §Color Coding Semântico Estrito
export type SemanticColor =
    | 'amber'   // Consumo / Demanda
    | 'sky'     // Geração / Equipamentos
    | 'emerald' // Métricas / Fatores
    | 'red'     // Perdas / Alertas / Falhas
    | 'pink'    // Temperatura ambiente/célula
    | 'rose'    // Temperatura (variante mais saturada)
    | 'yellow'  // Irradiância / GHI / DNI
    | 'lime'    // Irradiância (variante fria)
    | 'indigo'  // Umidade / Atmosfera / Precipitação
    | 'slate';  // Dado auxiliar (vento, contexto)

interface LegoTabProps {
    label: string;
    color: SemanticColor;
    dashed?: boolean;
}

const TAB_COLORS: Record<SemanticColor, { fill: string; stroke: string; text: string }> = {
    amber:   { fill: 'fill-amber-900',   stroke: 'stroke-amber-600/40',   text: 'text-amber-300/90' },
    sky:     { fill: 'fill-sky-900',     stroke: 'stroke-sky-600/40',     text: 'text-sky-300/90' },
    emerald: { fill: 'fill-emerald-900', stroke: 'stroke-emerald-600/40', text: 'text-emerald-300/90' },
    red:     { fill: 'fill-red-900',     stroke: 'stroke-red-600/40',     text: 'text-red-400/90' },
    pink:    { fill: 'fill-pink-900',    stroke: 'stroke-pink-500/40',    text: 'text-pink-300/90' },
    rose:    { fill: 'fill-rose-900',    stroke: 'stroke-rose-500/40',    text: 'text-rose-300/90' },
    yellow:  { fill: 'fill-yellow-900',  stroke: 'stroke-yellow-500/40',  text: 'text-yellow-300/90' },
    lime:    { fill: 'fill-lime-900',    stroke: 'stroke-lime-600/40',    text: 'text-lime-300/90' },
    indigo:  { fill: 'fill-indigo-900',  stroke: 'stroke-indigo-500/40',  text: 'text-indigo-300/90' },
    slate:   { fill: 'fill-slate-800',   stroke: 'stroke-slate-600/30',   text: 'text-slate-500' },
};

export const LegoTab: React.FC<LegoTabProps> = ({ label, color, dashed }) => {
    const c = TAB_COLORS[color];

    // SVG path: ombros de 4px no topo (full-width), bump central de 12px
    // Dimensões: viewBox 80×16
    return (
        <div className="absolute -bottom-[16px] left-1/2 -translate-x-1/2 z-30 w-[80px] h-[16px]">
            <svg viewBox="0 0 80 16" className="w-full h-full block" preserveAspectRatio="none">
                <path
                    d="M0,0 L80,0 L80,4 L58,4 C55,4 54,6 54,8 L54,12 C54,14.5 52,16 50,16 L30,16 C28,16 26,14.5 26,12 L26,8 C26,6 25,4 22,4 L0,4 Z"
                    className={cn(c.fill, c.stroke)}
                    strokeWidth="0.8"
                    strokeDasharray={dashed ? "3,2" : "none"}
                />
            </svg>
            {/* Label centralizada no bump */}
            <span className={cn(
                "absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center justify-center",
                "w-[28px] h-[12px] text-[7px] font-extrabold uppercase tracking-[0.2em] leading-none",
                c.text
            )}>
                {label}
            </span>
        </div>
    );
};

// =============================================================================
// LEGO NOTCH — Encaixe puzzle no topo de um bloco (recebe o tab de cima)
//
// Forma visual: recorte invertido preenchido com bg do painel (slate-950)
//             ╭──────────╮
//             │ (vazio)  │           ← Cria ilusão de "corte" no bloco
//   ████████  ╰──────────╯  ████████
//   ████████████████████████████████
// =============================================================================

interface LegoNotchProps {
    color: SemanticColor;
    dashed?: boolean;
}

const NOTCH_STROKES: Record<SemanticColor, { stroke: string }> = {
    amber:   { stroke: 'stroke-amber-600/20' },
    sky:     { stroke: 'stroke-sky-600/20' },
    emerald: { stroke: 'stroke-emerald-600/20' },
    red:     { stroke: 'stroke-red-600/20' },
    pink:    { stroke: 'stroke-pink-500/20' },
    rose:    { stroke: 'stroke-rose-500/20' },
    yellow:  { stroke: 'stroke-yellow-500/20' },
    lime:    { stroke: 'stroke-lime-600/20' },
    indigo:  { stroke: 'stroke-indigo-500/20' },
    slate:   { stroke: 'stroke-slate-700/40' },
};

export const LegoNotch: React.FC<LegoNotchProps> = ({ color, dashed }) => {
    const c = NOTCH_STROKES[color];

    // Espelha a forma do tab, preenchido com bg do painel
    return (
        <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 z-30 w-[80px] h-[16px]">
            <svg viewBox="0 0 80 16" className="w-full h-full block" preserveAspectRatio="none">
                <path
                    d="M0,0 L80,0 L80,4 L58,4 C55,4 54,6 54,8 L54,12 C54,14.5 52,16 50,16 L30,16 C28,16 26,14.5 26,12 L26,8 C26,6 25,4 22,4 L0,4 Z"
                    className={cn("fill-slate-950", c.stroke)}
                    strokeWidth="0.5"
                    strokeDasharray={dashed ? "3,2" : "none"}
                />
            </svg>
        </div>
    );
};
