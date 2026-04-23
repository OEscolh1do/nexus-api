import React from 'react';

interface Props {
  clientData: any;
  totalPowerKwp: number;
  monthlyGenAvg: number;
  [key: string]: any;
}

/**
 * PÁGINA 1 — CAPA
 * Fiel ao template: fundo roxo escuro, tipografia display, linha decorativa com terminadores.
 * REMOVIDOS os badges de kWp/kWh (não existem no template original).
 */
export const ProposalPageCover: React.FC<Props> = ({ clientData, totalPowerKwp, monthlyGenAvg, isExportingPdf }) => {
  const now = new Date();
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long' });
  const monthFormatted = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const year = now.getFullYear();

  // Template usa sobrenome apenas
  const clientFullName = clientData.clientName || 'Cliente Final';
  const clientLastName = clientFullName.split(' ').slice(-1)[0]?.toUpperCase() || clientFullName.toUpperCase();

  return (
    <div
      className="w-full min-h-[1123px] relative flex flex-col font-sans overflow-hidden"
      style={{ backgroundColor: '#2D0A4E' }}
    >
      {/* Triângulos decorativos — canto inferior direito */}
      {!isExportingPdf && (
        <>
          <div
            className="absolute bottom-0 right-0 w-[380px] h-[380px]"
            style={{
              background: 'linear-gradient(135deg, transparent 50%, #3A1166 50%)',
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-[260px] h-[260px]"
            style={{
              background: 'linear-gradient(135deg, transparent 50%, #451480 50%)',
            }}
          />
        </>
      )}
      {/* Triângulo menor — borda (oculto durante export: html2canvas falha com color-stop duplo em 50%) */}
      {!isExportingPdf && (
        <div
          className="absolute bottom-0 right-0 w-[160px] h-[160px]"
          style={{
            background: 'linear-gradient(135deg, transparent 50%, #2D0A4E 50%)',
            borderTop: '2px solid rgba(255,255,255,0.08)',
            borderLeft: '2px solid rgba(255,255,255,0.08)',
          }}
        />
      )}

      {/* Mês/Ano + Linha decorativa */}
      <div className="pt-[56px] px-[56px] flex items-center gap-0 relative z-10">
        <div className="flex flex-col shrink-0 mr-6">
          {/* Mês com peso tipográfico fiel ao template — medium, não black */}
          <span
            className="text-white leading-tight"
            style={{ fontSize: '22px', fontWeight: 500 }}
          >
            {monthFormatted} / {year}
          </span>
          <span
            className="text-white/40 mt-0.5"
            style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '0.25em' }}
          >
            FV{year}---
          </span>
        </div>

        {/* Linha decorativa com terminadores circulares */}
        <div className="flex-1 flex items-center relative">
          {/* Ponto esquerdo */}
          <div className="w-2.5 h-2.5 rounded-full bg-white/60 shrink-0" />
          {/* Linha */}
          <div className="flex-1 h-[1.5px] bg-white/50" />
          {/* Ponto direito */}
          <div className="w-2.5 h-2.5 rounded-full bg-white/60 shrink-0" />
        </div>
      </div>

      {/* Título principal — ocupa região central */}
      <div className="flex-1 flex flex-col justify-center px-[56px] relative z-10">
        <div className="flex flex-col gap-0 mb-10">
          <h1
            className="text-white leading-[0.88] tracking-[-0.02em] uppercase"
            style={{ fontSize: '80px', fontWeight: 900 }}
          >
            PROPOSTA
          </h1>
          <h1
            className="text-white leading-[0.88] tracking-[-0.02em] uppercase"
            style={{ fontSize: '80px', fontWeight: 900 }}
          >
            COMERCIAL
          </h1>
        </div>

        <div className="flex flex-col gap-1">
          <span
            className="text-white uppercase"
            style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '0.05em' }}
          >
            {clientLastName}
          </span>
          <span
            className="text-white/50 uppercase"
            style={{ fontSize: '12px', fontWeight: 400, letterSpacing: '0.18em' }}
          >
            {clientData.installationType || 'RESIDENCIAL'}
          </span>
        </div>
      </div>

      {/* Características do sistema — parte inferior da capa (Refined Engineering Aesthetic) */}
      <div className="relative z-10 px-[56px] pb-[56px]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-1.5 bg-[#10B981]" />
          <span
            className="text-white/50 uppercase font-bold tracking-[0.3em]"
            style={{ fontSize: '10px' }}
          >
            Sistema Fotovoltaico On-Grid
          </span>
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>

        <div className="flex gap-0 group">
          {/* Potência */}
          <div
            className="flex relative"
            style={{ 
              border: '1px solid rgba(255,255,255,0.15)',
              backgroundColor: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(4px)'
            }}
          >
            {/* Hairline inner border for premium look */}
            <div className="absolute inset-[1px] border border-white/5 pointer-events-none" />
            
            {/* Corner Ticks (Engineering feel) */}
            <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-white/30" />
            <div className="absolute top-0 right-0 w-1 h-1 border-t border-r border-white/30" />
            <div className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-white/30" />
            <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-white/30" />

            {/* Label lateral vertical */}
            <div
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                transform: 'rotate(180deg)',
                backgroundColor: '#10B981',
                color: '#064E3B', // Deep contrast text
                fontSize: '10px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                padding: '12px 6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Projeto
            </div>

            <div className="px-10 py-6 flex flex-col justify-center min-w-[200px]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1 h-1 bg-[#10B981]/60" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Potência Nominal
                </span>
              </div>
              <span className="font-mono tabular-nums leading-none flex items-baseline gap-2" style={{ fontSize: '32px', fontWeight: 900, color: 'white' }}>
                {totalPowerKwp.toFixed(2)}
                <span className="font-sans" style={{ fontSize: '16px', fontWeight: 600, color: '#10B981' }}>kWp</span>
              </span>
            </div>
          </div>

          {/* Geração */}
          <div
            className="flex relative"
            style={{ 
              border: '1px solid rgba(255,255,255,0.15)',
              borderLeft: 'none',
              backgroundColor: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <div className="absolute inset-[1px] border border-white/5 pointer-events-none" />
            
            {/* Corner Ticks */}
            <div className="absolute top-0 right-0 w-1 h-1 border-t border-r border-white/30" />
            <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-white/30" />

            <div className="px-10 py-6 flex flex-col justify-center min-w-[200px]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1 h-1 bg-[#10B981]/60" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Geração Estimada
                </span>
              </div>
              <span className="font-mono tabular-nums leading-none flex items-baseline gap-2" style={{ fontSize: '32px', fontWeight: 900, color: 'white' }}>
                {monthlyGenAvg.toLocaleString('pt-BR')}
                <span className="font-sans" style={{ fontSize: '16px', fontWeight: 600, color: '#10B981' }}>kWh/mês</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
