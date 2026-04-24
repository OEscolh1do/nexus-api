import React from 'react';
import type { ProposalData } from '@/core/state/slices/proposalSlice';

interface Props {
  proposalData: ProposalData;
  [key: string]: any;
}

/**
 * PÁGINA 4 — CRONOGRAMA
 * Fiel ao template: cabeçalho Broken Grid (unificado), corpo branco técnico,
 * resumo de etapas à esquerda e timeline detalhada à direita.
 */
export const ProposalPageSchedule: React.FC<Props> = ({ proposalData }) => {
  const stages = proposalData.executionSchedule || [];

  // Cores unificadas
  const GREEN = '#2D6A4F';
  const GREEN_LIGHT = '#4CAF50';
  const GREEN_MENTA = '#B7E4C7';
  const GREEN_DARK = '#1a3d2b';
  const PURPLE = '#2D0A4E';
  const PURPLE_MID = '#6A1B9A';

  const dateFormatted = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(new Date()).toUpperCase();

  // Cálculo Dinâmico de Prazo (Min - Max)
  const totalDays = stages.reduce((acc, stage) => {
    if (stage.durationText.toUpperCase().includes('CONTÍNUO')) return acc;
    const matches = stage.durationText.match(/\d+/g);
    if (!matches) return acc;
    
    const min = parseInt(matches[0]);
    const max = matches[1] ? parseInt(matches[1]) : min;
    
    return {
      min: acc.min + min,
      max: acc.max + max
    };
  }, { min: 0, max: 0 });

  const totalText = totalDays.min === totalDays.max
    ? `${totalDays.min} DIAS`
    : `${totalDays.min} - ${totalDays.max} DIAS`;

  return (
    <div className="w-full min-h-[1123px] bg-white relative flex flex-col font-sans overflow-hidden">
      

      
      {/* ── HEADER PADRONIZADO (BROKEN GRID) ────────────────────────────── */}
      <div
        className="relative flex"
        style={{ 
          background: `linear-gradient(to right, ${GREEN} 0%, ${GREEN_LIGHT} 50%, ${GREEN_MENTA} 100%)`, 
          minHeight: '280px',
          borderTop: `6px solid ${GREEN_DARK}`,
          marginBottom: '80px'
        }}
      >
        <div className="flex-1 p-[48px] flex flex-col gap-4 z-10">
          <div style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }}>
            <img
              src="/logos/logo-branco.png"
              alt="Neonorte"
              className="h-12 w-auto object-contain object-left"
              style={{ maxWidth: '220px' }}
            />
          </div>
          
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 800, 
            color: '#FFFFFF', 
            letterSpacing: '0.05em', 
            marginTop: '4px',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)' 
          }}>
            {dateFormatted}
          </span>

          <div className="mt-6 flex flex-col gap-3">
            <p style={{ fontSize: '12px', fontWeight: 800, color: 'white', lineHeight: '1.4', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
              SISTEMA EXECUTADO CONFORME PROJETO,<br />
              VALIDADO EM TODAS AS NORMAS TÉCNICAS.
            </p>
            <div className="flex gap-4">
              <span className="px-2 py-0.5 bg-white/20 rounded-sm text-[10px] font-black text-white border border-white/30">
                ZERO VISAGEM
              </span>
              <span className="px-2 py-0.5 bg-white/20 rounded-sm text-[10px] font-black text-white border border-white/30">
                1ª VISTORIA
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center relative z-20" style={{ paddingRight: '56px' }}>
          <div
            style={{ 
              backgroundColor: 'white', 
              border: '4px solid #111', 
              padding: '56px 48px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transform: 'translateY(100px)',
              boxShadow: '0 25px 35px -5px rgba(0, 0, 0, 0.12)'
            }}
          >
            <h2 className="uppercase leading-[0.82]" style={{ fontSize: '68px', fontWeight: 900, color: PURPLE, letterSpacing: '-0.03em' }}>
              CRONO
            </h2>
            <h2 className="uppercase leading-[0.82]" style={{ fontSize: '68px', fontWeight: 900, color: PURPLE, letterSpacing: '-0.03em' }}>
              GRAMA
            </h2>
          </div>
        </div>
      </div>

      {/* ── CORPO BRANCO TÉCNICO ───────────────────────────────────────── */}
      <div className="flex-1 p-[16px_48px_32px_48px] flex flex-col gap-6 relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <img src="/logos/simbolo-verde.png" alt="" className="w-[600px] h-auto" />
        </div>

        <div className="relative z-10 flex gap-10 flex-1">
          {/* ESQUERDA — Resumo de Etapas */}
          <div className="flex flex-col gap-2" style={{ width: '260px' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-0.5 h-3 bg-[#2D6A4F]" />
              <span style={{ fontSize: '9px', fontWeight: 900, color: GREEN_DARK, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Resumo de Execução
              </span>
            </div>
            {stages.map((stage) => (
              <div
                key={stage.id}
                className="flex items-stretch border border-slate-200 rounded-sm overflow-hidden bg-white/50 shadow-sm"
              >
                <div
                  className="flex flex-col items-center justify-center p-2"
                  style={{ backgroundColor: GREEN, minWidth: '110px' }}
                >
                  <span style={{ fontSize: '10px', fontWeight: 900, color: 'white', textTransform: 'uppercase', lineHeight: '1.1' }}>
                    {stage.label}
                  </span>
                  <span style={{ fontSize: '7px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', marginTop: '1px' }}>
                    {stage.sublabel}
                  </span>
                </div>
                <div className="flex-1 flex items-center px-4">
                  <span style={{ fontSize: '10px', fontWeight: 800, color: PURPLE, textTransform: 'uppercase' }}>
                    {stage.durationText}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* DIREITA — Timeline Detalhada */}
          <div className="flex-1 relative flex flex-col pl-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-0.5 h-3 bg-[#6A1B9A]" />
              <span style={{ fontSize: '9px', fontWeight: 900, color: PURPLE, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Detalhamento das Etapas
              </span>
            </div>

            {/* Linha vertical da timeline */}
            <div
              style={{
                position: 'absolute',
                left: '42px',
                top: '50px',
                bottom: '80px',
                width: '1px',
                borderLeft: `2px dashed ${GREEN}44`,
              }}
            />

            {stages.map((stage) => (
              <div key={stage.id} className="flex items-start gap-6 mb-6 relative">
                {/* Marker */}
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    border: `3px solid ${PURPLE_MID}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    zIndex: 1,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: GREEN }} />
                </div>

                <div className="flex flex-col gap-1 flex-1 pt-1">
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: '12px', fontWeight: 900, color: PURPLE, textTransform: 'uppercase' }}>
                      {stage.label} — {stage.sublabel}
                    </span>
                    <span
                      style={{
                        fontSize: '8px',
                        fontWeight: 900,
                        color: 'white',
                        backgroundColor: PURPLE_MID,
                        padding: '2px 8px',
                        borderRadius: '2px',
                        textTransform: 'uppercase'
                      }}
                    >
                      {stage.durationText}
                    </span>
                  </div>
                  <p style={{ fontSize: '10px', color: '#475569', lineHeight: '1.5', textAlign: 'justify', maxWidth: '420px' }}>
                    {stage.description}
                  </p>
                </div>
              </div>
            ))}

            {/* Rodapé Dinâmico */}
            <div className="mt-auto flex justify-end">
              <div
                className="px-8 py-3"
                style={{ backgroundColor: PURPLE, borderLeft: `6px solid ${GREEN_LIGHT}` }}
              >
                <div className="flex flex-col">
                  <span style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Prazo Total Estimado
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    TOTAL: {totalText}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Rodapé decorativo */}
      <div style={{ height: '6px', backgroundColor: GREEN_LIGHT }} />
    </div>
  );
};
