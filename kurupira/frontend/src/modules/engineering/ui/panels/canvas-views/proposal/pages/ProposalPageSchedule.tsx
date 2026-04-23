import React from 'react';
import type { ProposalData } from '@/core/state/slices/proposalSlice';

interface Props {
  proposalData: ProposalData;
  [key: string]: any;
}

const GREEN       = '#4CAF50';
const GREEN_DARK  = '#2D6A4F';
const PURPLE      = '#2D0A4E';
const PURPLE_MID  = '#6A1B9A';

/**
 * PÁGINA 4 — CRONOGRAMA
 * Fiel ao template: foto de instalação solar como background, paleta verde/roxo,
 * cards com bordas arredondadas verdes, timeline com bolinhas roxas + linha pontilhada verde.
 */
export const ProposalPageSchedule: React.FC<Props> = ({ proposalData, isExportingPdf }) => {
  const stages = proposalData.executionSchedule || [];

  return (
    <div className="w-full min-h-[1123px] relative flex flex-col font-sans overflow-hidden">

      {/* Background: gradiente simulando foto de painéis solares + overlay verde */}
      <div
        className="absolute inset-0"
        style={{
          background: isExportingPdf 
            ? GREEN_DARK 
            : `linear-gradient(135deg, 
                rgba(76,175,80,0.92) 0%, 
                rgba(45,106,79,0.88) 35%, 
                rgba(76,175,80,0.70) 65%, 
                rgba(200,230,201,0.85) 100%)`,
        }}
      />
      {/* Textura simulando telhado com painéis */}
      {!isExportingPdf && (
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent, transparent 30px,
              rgba(0,0,0,0.1) 30px, rgba(0,0,0,0.1) 32px
            ), repeating-linear-gradient(
              -45deg,
              transparent, transparent 30px,
              rgba(0,0,0,0.05) 30px, rgba(0,0,0,0.05) 32px
            )`,
          }}
        />
      )}

      <div className="relative z-10 flex flex-col h-full p-[40px]">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div />
          <div className="flex flex-col items-end gap-1">
            {/* Logo circular verde */}
            <div
              className="flex items-center justify-center rounded-full overflow-hidden"
              style={{ width: '60px', height: '60px', backgroundColor: GREEN }}
            >
              <img
                src="/logos/simbolo-branco.png"
                alt="Neonorte"
                className="w-10 h-10 object-contain"
              />
            </div>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '0.15em' }}>
              {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Título + Diferenciais — sobre foto */}
        <div className="flex gap-6 mb-6">
          {/* Box branco com CRONOGRAMA */}
          <div
            className="flex flex-col justify-center"
            style={{ backgroundColor: 'white', padding: '28px 36px', minWidth: '260px' }}
          >
            <h2
              className="uppercase leading-[0.85]"
              style={{ fontSize: '52px', fontWeight: 900, color: PURPLE, letterSpacing: '-0.02em' }}
            >
              CRONO
            </h2>
            <h2
              className="uppercase leading-[0.85]"
              style={{ fontSize: '52px', fontWeight: 900, color: PURPLE, letterSpacing: '-0.02em' }}
            >
              GRAMA
            </h2>
          </div>

          {/* Texto de diferenciais sobre a foto */}
          <div className="flex flex-col justify-center gap-3 flex-1">
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'white', lineHeight: '1.5' }}>
              Sistema executado conforme projeto, validado em todas as Normas Técnicas, pronto para operação -{' '}
              <strong style={{ color: 'white', fontWeight: 900 }}>ZERO VISAGEM</strong>
            </p>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'white', lineHeight: '1.5' }}>
              Obra Aprovada pela EQUATORIAL, na{' '}
              <strong style={{ color: 'white', fontWeight: 900 }}>PRIMEIRA VISTORIA</strong>
            </p>
          </div>
        </div>

        {/* Conteúdo: Etapas (esquerda) + Timeline (direita) */}
        <div className="flex gap-6 flex-1">
          {/* ESQUERDA — Cards de etapas estilo template (bordas verdes arredondadas) */}
          <div className="flex flex-col gap-2" style={{ width: '240px' }}>
            {stages.map((stage) => (
              <div
                key={stage.id}
                className="flex items-center gap-0 overflow-hidden"
                style={{
                  border: `2px solid ${GREEN}`,
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255,255,255,0.12)',
                }}
              >
                {/* Label principal */}
                <div
                  className="flex flex-col items-center justify-center"
                  style={{
                    backgroundColor: GREEN,
                    padding: '8px 14px',
                    minWidth: '100px',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 900, color: 'white', textTransform: 'uppercase', lineHeight: '1.1' }}>
                    {stage.label}
                  </span>
                  <span style={{ fontSize: '8px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', lineHeight: '1.2', marginTop: '2px' }}>
                    {stage.sublabel}
                  </span>
                </div>
                {/* Duração */}
                <div className="flex-1 px-3 py-1.5">
                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {stage.durationText}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* DIREITA — Timeline vertical com bolinhas roxas + linha pontilhada verde */}
          <div className="flex-1 relative flex flex-col">
            {/* Linha vertical pontilhada */}
            <div
              style={{
                position: 'absolute',
                left: '12px',
                top: '14px',
                bottom: '14px',
                width: '2px',
                borderLeft: `2px dashed ${GREEN}`,
              }}
            />

            {stages.map((stage) => (
              <div key={stage.id} className="flex items-start gap-4 mb-5 relative">
                {/* Bolinha roxa */}
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: PURPLE_MID,
                    border: `2px solid ${GREEN}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    position: 'relative',
                    zIndex: 1,
                  }}
                />

                {/* Conteúdo */}
                <div className="flex flex-col gap-0.5 flex-1">
                  {/* Badge de duração */}
                  <span
                    style={{
                      fontSize: '8px',
                      fontWeight: 900,
                      color: 'white',
                      backgroundColor: PURPLE_MID,
                      padding: '1px 6px',
                      borderRadius: '10px',
                      display: 'inline-block',
                      width: 'fit-content',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {stage.durationText}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {stage.label} — {stage.sublabel}
                  </span>
                  <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>
                    {stage.description}
                  </p>
                </div>
              </div>
            ))}

            {/* Total */}
            <div
              style={{
                marginTop: 'auto',
                padding: '8px 14px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: `1px solid ${GREEN}`,
                borderRadius: '4px',
                display: 'inline-block',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                TOTAL: 37 - 40 DIAS
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
