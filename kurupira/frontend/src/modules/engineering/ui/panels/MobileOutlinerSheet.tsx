/**
 * =============================================================================
 * MOBILE OUTLINER SHEET — Bottom Sheet Pattern para Mobile
 * =============================================================================
 *
 * Substitui o LeftOutliner lateral em viewports < 768px.
 * Apresenta a pilha de blocos dentro de um drawer deslizável de baixo para cima.
 *
 * Estados:
 * - FECHADO: Barra de resumo de 52px no rodapé (cidade, consumo médio, status).
 * - ABERTO: Sheet cobre ~75% da tela com scroll interno da pilha de blocos.
 *
 * Comportamento:
 * - Backdrop semitransparente fecha o sheet ao tocar.
 * - Drag handle sutil no topo da sheet.
 * - z-[60] para sobrepor WorkspaceTabs (z-40).
 * =============================================================================
 */

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Zap, MapPin } from 'lucide-react';
import { useSolarStore } from '@/core/state/solarStore';
import { LeftOutliner } from './LeftOutliner';
import { cn } from '@/lib/utils';

// =============================================================================
// COMPONENT
// =============================================================================

export const MobileOutlinerSheet: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    const clientData = useSolarStore(s => s.clientData);
    const kWpAlvo = useSolarStore(s => s.kWpAlvo);

    const city = clientData?.city || '';
    const state = clientData?.state || '';
    const consumption = clientData?.averageConsumption ?? 0;
    const hasLocation = city !== '' && state !== '';

    return (
        <>
            {/* ── BACKDROP (só quando aberto) ── */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[55] bg-slate-950/60 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* ── BOTTOM SHEET CONTAINER ── */}
            <div
                className={cn(
                    'fixed bottom-0 left-0 right-0 z-[60] flex flex-col transition-transform duration-300 ease-out',
                    isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-52px)]'
                )}
                style={{ height: '78vh' }}
            >
                {/* ── HANDLE + SUMMARY STRIP (sempre visível) ── */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex-shrink-0 h-[52px] bg-slate-900 border-t border-slate-700/80 flex items-center px-4 gap-3 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
                >
                    {/* Drag Handle */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-slate-700 rounded-full" />

                    {/* Summary Info */}
                    <div className="flex-1 flex items-center gap-3 pt-1">
                        {/* Localização */}
                        <div className="flex items-center gap-1.5">
                            <MapPin size={10} className={hasLocation ? 'text-indigo-400' : 'text-slate-700'} />
                            <span className={cn(
                                'text-[9px] font-black uppercase tracking-widest',
                                hasLocation ? 'text-indigo-400' : 'text-slate-600'
                            )}>
                                {hasLocation ? `${city} / ${state}` : 'Localização Pendente'}
                            </span>
                        </div>

                        {/* Divisor */}
                        <div className="w-px h-3 bg-slate-700" />

                        {/* Consumo / kWp */}
                        <div className="flex items-center gap-1">
                            <Zap size={10} className={consumption > 0 ? 'text-sky-400' : 'text-slate-700'} />
                            {consumption > 0 ? (
                                <span className="text-[9px] font-black text-sky-400 tabular-nums font-mono">
                                    {Math.round(consumption).toLocaleString('pt-BR')} kWh
                                </span>
                            ) : (
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                    Consumo Pendente
                                </span>
                            )}
                        </div>

                        {/* kWp Alvo (se disponível) */}
                        {kWpAlvo !== null && kWpAlvo > 0 && (
                            <>
                                <div className="w-px h-3 bg-slate-700" />
                                <span className="text-[9px] font-black text-emerald-400 tabular-nums font-mono">
                                    {kWpAlvo.toFixed(2)} kWp
                                </span>
                            </>
                        )}
                    </div>

                    {/* Chevron indicador */}
                    <div className="shrink-0 text-slate-500">
                        {isOpen
                            ? <ChevronDown size={14} />
                            : <ChevronUp size={14} />
                        }
                    </div>
                </button>

                {/* ── SHEET CONTENT (pilha de blocos reutilizando LeftOutliner) ── */}
                <div className="flex-1 overflow-hidden bg-slate-950 border-t border-slate-800">
                    <LeftOutliner hideHeader={true} />
                </div>
            </div>
        </>
    );
};
