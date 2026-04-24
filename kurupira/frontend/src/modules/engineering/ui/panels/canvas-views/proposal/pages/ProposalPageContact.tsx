import React from 'react';
import type { ProposalData } from '@/core/state/slices/proposalSlice';

interface Props {
  proposalData: ProposalData;
  [key: string]: any;
}

const GREEN = '#4CAF50';
const GREEN_DARK = '#2D6A4F';

/**
 * PÁGINA 5 — ENCERRAMENTO
 * Fiel ao template: foto de parede/ambiente, logo real Neonorte, "FALE COM A GENTE" em verde,
 * contato do engenheiro e dados de redes sociais.
 */
export const ProposalPageContact: React.FC<Props> = ({ proposalData, isExportingPdf }) => {
  return (
    <div className="w-full min-h-[1123px] relative flex flex-col font-sans overflow-hidden">
      {/* Background: gradiente simulando parede/ambiente */}

      <div
        className="absolute inset-0"
        style={{
          background: isExportingPdf ? '#78909c' : `linear-gradient(160deg, 
            #b0bec5 0%,
            #90a4ae 30%,
            #78909c 60%,
            #607d8b 100%)`,
        }}
      />
      {/* Textura sutil */}
      {!isExportingPdf && (
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 4px,
              rgba(255,255,255,0.15) 4px,
              rgba(255,255,255,0.15) 5px
            )`,
          }}
        />
      )}

      <div className="relative z-10 flex flex-col min-h-full p-[50px]">

        {/* Grid principal: coluna direita com CTA + logo, coluna esquerda com fotos */}
        <div className="flex gap-8 flex-1">

          {/* Esquerda — Placeholders de fotos de instalação */}
          <div className="flex flex-col gap-4 flex-1">
            {/* Foto 1 */}
            <div
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #546e7a, #37474f)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
              }}
            >
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                Foto Instalação
              </span>
            </div>
            {/* Foto 2 */}
            <div
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #455a64, #263238)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
              }}
            >
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                Foto Equipamento
              </span>
            </div>
          </div>

          {/* Direita — Logo + CTA + Contato */}
          <div className="flex flex-col gap-6" style={{ width: '340px' }}>
            {/* Logo real */}
            <div>
              <img
                src="/logos/logo-verde.png"
                alt="Neonorte"
                className="object-contain object-left"
                style={{ height: '56px', maxWidth: '220px' }}
              />
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '4px' }}>
                ENGENHARIA
              </p>
            </div>

            {/* Box verde: FALE COM A GENTE */}
            <div
              style={{
                backgroundColor: GREEN_DARK,
                padding: '28px 32px',
              }}
            >
              <h2
                className="uppercase leading-[0.85]"
                style={{
                  fontSize: '52px',
                  fontWeight: 900,
                  color: 'white',
                  letterSpacing: '-0.02em',
                }}
              >
                FALE
              </h2>
              <h2
                className="uppercase leading-[0.85]"
                style={{
                  fontSize: '52px',
                  fontWeight: 900,
                  color: 'white',
                  letterSpacing: '-0.02em',
                }}
              >
                COM A
              </h2>
              <h2
                className="uppercase leading-[0.85]"
                style={{
                  fontSize: '52px',
                  fontWeight: 900,
                  color: 'white',
                  letterSpacing: '-0.02em',
                }}
              >
                GENTE
              </h2>
            </div>

            {/* Texto de agradecimento */}
            <div
              style={{
                backgroundColor: GREEN,
                padding: '16px 20px',
              }}
            >
              <p style={{ fontSize: '11px', color: 'white', lineHeight: '1.6' }}>
                A NEONORTE agradece a atenção em receber a nossa proposta. Ficamos à disposição para esclarecimentos.
              </p>
            </div>

            {/* Dados de contato */}
            <div className="flex flex-col gap-3 mt-auto">
              {proposalData.engineerName && (
                <div style={{ borderLeft: `3px solid ${GREEN}`, paddingLeft: '12px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 900, color: 'white' }}>{proposalData.engineerName}</p>
                  <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {proposalData.engineerTitle}
                  </p>
                  {proposalData.engineerCrea && (
                    <p style={{ fontSize: '9px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                      {proposalData.engineerCrea}
                    </p>
                  )}
                </div>
              )}

              {proposalData.contactPhone && (
                <div className="flex items-center gap-3">
                  <div
                    style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    <span style={{ color: 'white', fontSize: '14px' }}>📱</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{proposalData.contactPhone}</span>
                </div>
              )}

              {proposalData.contactInstagram && (
                <div className="flex items-center gap-3">
                  <div
                    style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    <span style={{ color: 'white', fontSize: '14px' }}>📷</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{proposalData.contactInstagram}</span>
                </div>
              )}

              {!proposalData.engineerName && !proposalData.contactPhone && (
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                  Configure os dados de contato no painel esquerdo → Encerramento
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
