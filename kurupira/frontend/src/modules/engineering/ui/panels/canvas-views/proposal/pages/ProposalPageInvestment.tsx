import React from 'react';
import { EyeOff, Check, X } from 'lucide-react';
import type { ProposalData } from '@/core/state/slices/proposalSlice';

interface Props {
  proposalData: ProposalData;
  [key: string]: any;
}

/**
 * PÁGINA 2 — INVESTIMENTO
 * Fiel ao template: fundo verde topo, logo real, timeline horizontal de pagamento,
 * tabela com alternância de cor, título branco sobre fundo escuro.
 */
export const ProposalPageInvestment: React.FC<Props> = ({ proposalData }) => {
  const dateFormatted = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(new Date()).toUpperCase();

  const lineItemsTotal = (proposalData.lineItems || []).reduce((s, i) => s + (i.value ?? 0), 0);
  const stagesTotal = (proposalData.paymentStages || []).reduce((s, p) => s + (p.value || 0), 0);

  const HiddenOverlay: React.FC<{ visible: boolean; children: React.ReactNode }> = ({ visible, children }) => (
    <div className="relative">
      {children}
      {!visible && (
        <div className="absolute inset-0 bg-white/85 backdrop-blur-[2px] flex items-center justify-center z-10 rounded">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 rounded-full">
            <EyeOff size={12} className="text-slate-500" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Oculto no PDF</span>
          </div>
        </div>
      )}
    </div>
  );

  // Cores do template
  const GREEN = '#2D6A4F';
  const GREEN_LIGHT = '#4CAF50';
  const GREEN_MENTA = '#B7E4C7';
  const GREEN_DARK = '#1a3d2b';
  const PURPLE = '#2D0A4E';

  return (
    <div className="w-full min-h-[1123px] bg-white relative flex flex-col font-sans overflow-hidden">


      {/* ── TOPO VERDE (GRADIENTE) ─────────────────────────────────────── */}
      <div
        className="relative flex"
        style={{ 
          background: `linear-gradient(to right, ${GREEN} 0%, ${GREEN_LIGHT} 50%, ${GREEN_MENTA} 100%)`, 
          minHeight: '280px',
          borderTop: `6px solid ${GREEN_DARK}`,
          marginBottom: '80px' // Espaço ajustado para descê-lo levemente
        }}
      >
        {/* Coluna esquerda: logo + data + condições */}
        <div className="flex-1 p-[48px] flex flex-col gap-4 z-10">
          {/* Logo real - Branco com sombra sutil para suavizar */}
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

          <div className="mt-6 max-w-[320px]">
            <p style={{ 
              fontSize: '13px', 
              fontWeight: 800, 
              color: '#FFFFFF', 
              marginBottom: '8px', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}>
              Condições Comerciais:
            </p>
            <ol className="flex flex-col gap-1.5">
              {(proposalData.paymentTerms || []).filter(Boolean).map((term, i) => (
                <li key={i} style={{ 
                  fontSize: '11px', 
                  color: 'rgba(255,255,255,0.95)', 
                  fontWeight: 700, 
                  display: 'flex', 
                  gap: '8px', 
                  lineHeight: '1.3',
                  textShadow: '0 1px 2px rgba(0,0,0,0.15)'
                }}>
                  <span style={{ color: '#FFFFFF', fontWeight: 900 }}>{i + 1}.</span>
                  {term}
                </li>
              ))}
              {(!proposalData.paymentTerms || proposalData.paymentTerms.length === 0) && (
                <>
                  <li style={{ fontSize: '11px', color: 'rgba(255,255,255,0.95)', fontWeight: 700, display: 'flex', gap: '8px', textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
                    <span style={{ color: '#FFFFFF', fontWeight: 900 }}>1.</span> Aceitamos todas formas de Pagamento.
                  </li>
                  <li style={{ fontSize: '11px', color: 'rgba(255,255,255,0.95)', fontWeight: 700, display: 'flex', gap: '8px', textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
                    <span style={{ color: '#FFFFFF', fontWeight: 900 }}>2.</span> Condições Flexíveis para pagamento.
                  </li>
                  <li style={{ fontSize: '11px', color: 'rgba(255,255,255,0.95)', fontWeight: 700, display: 'flex', gap: '8px', textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
                    <span style={{ color: '#FFFFFF', fontWeight: 900 }}>3.</span> A proposta tem validade de 15 dias.
                  </li>
                </>
              )}
            </ol>
          </div>
        </div>

        {/* Coluna direita: título INVESTIMENTO — fundo branco, borda preta grossa, OVERLAP APROFUNDADO */}
        <div
          className="flex items-center justify-center relative z-20"
          style={{ paddingRight: '56px' }}
        >
          <div
            style={{ 
              backgroundColor: 'white', 
              border: '4px solid #111', 
              padding: '56px 48px', // Altura aumentada
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transform: 'translateY(100px)', // Overlap aprofundado
              boxShadow: '0 25px 35px -5px rgba(0, 0, 0, 0.12), 0 15px 15px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <h2
              className="uppercase leading-[0.82]"
              style={{
                fontSize: '68px',
                fontWeight: 900,
                color: PURPLE,
                letterSpacing: '-0.03em',
              }}
            >
              INVESTI
            </h2>
            <h2
              className="uppercase leading-[0.82]"
              style={{
                fontSize: '68px',
                fontWeight: 900,
                color: PURPLE,
                letterSpacing: '-0.03em',
              }}
            >
              MENTO
            </h2>
          </div>
        </div>
      </div>

      {/* ── CORPO BRANCO (ESTÉTICA DE ENGENHARIA) ───────────────────────── */}
      <div className="flex-1 p-[16px_48px_32px_48px] flex flex-col gap-4 relative">
        {/* Marca d'água Neonorte no fundo */}
        <div 
          className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <img src="/logos/simbolo-verde.png" alt="" className="w-[600px] h-auto" />
        </div>

        <HiddenOverlay visible={proposalData.showPricing}>
          <div className="relative z-10 flex gap-8">
            {/* TABELA DE INVESTIMENTO (ESQUERDA) */}
            <div className="flex-[1.4] flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-0.5 h-3 bg-[#2D6A4F]" />
                <span style={{ fontSize: '9px', fontWeight: 900, color: GREEN_DARK, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  Equipamentos, Instalação e Demais Serviços (Total)
                </span>
              </div>
              
              <div className="flex h-10 mb-1">
                <div className="flex-1 flex items-center px-5" style={{ backgroundColor: GREEN }}>
                  <span style={{ fontSize: '10px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Descrição</span>
                </div>
                <div className="w-[140px] flex items-center justify-end px-5 border-l border-white/10" style={{ backgroundColor: PURPLE }}>
                  <span style={{ fontSize: '10px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Valor</span>
                </div>
              </div>

              <div className="flex flex-col">
                {(proposalData.lineItems || []).map((item, i) => {
                  const parts = item.description.split('(');
                  const title = parts[0].trim();
                  const sub = parts[1] ? `(${parts[1]}` : null;

                  return (
                    <div 
                      key={item.id} 
                      className="flex min-h-[34px] py-1 border-b border-slate-100"
                      style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(76,175,80,0.02)' }}
                    >
                      <div className="flex-1 flex items-center px-5 gap-3">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: GREEN_LIGHT }} />
                        <div className="flex flex-col py-0.5">
                          <span style={{ fontSize: '11px', color: '#111', fontWeight: 800, textTransform: 'uppercase', lineHeight: '1.2' }}>
                            {title}
                          </span>
                          {sub && (
                            <span style={{ fontSize: '8px', color: '#666', fontWeight: 700, textTransform: 'uppercase', marginTop: '1px' }}>
                              {sub}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-[140px] flex items-center justify-end px-5 border-l border-slate-100">
                        <span style={{ fontSize: '11px', color: '#111', fontWeight: 900, fontVariantNumeric: 'tabular-nums', textTransform: 'uppercase' }}>
                          {item.value !== null
                            ? `R$ ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : (item.valueText || '—')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex min-h-[48px] py-2 mt-1" style={{ backgroundColor: PURPLE }}>
                <div className="flex-1 flex items-center px-5">
                  <span style={{ fontSize: '11px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Total Investimento</span>
                </div>
                <div className="w-[160px] flex items-center justify-end px-5 border-l border-white/10">
                  <span style={{ fontSize: '14px', fontWeight: 900, color: 'white', fontVariantNumeric: 'tabular-nums' }}>
                    R$ {lineItemsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-w-[300px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-0.5 h-3 bg-[#2D6A4F]" />
                <span style={{ fontSize: '9px', fontWeight: 900, color: GREEN_DARK, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  Cronograma de Pagamento
                </span>
              </div>
              <div className="flex h-10 mb-1" style={{ backgroundColor: GREEN }}>
                <div className="flex-1 flex items-center px-5">
                  <span style={{ fontSize: '10px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Engenharia</span>
                </div>
                <div className="w-[140px] flex items-center justify-end px-5 border-l border-white/10">
                  <span style={{ fontSize: '10px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Valor</span>
                </div>
              </div>

              <div className="flex flex-col">
                {(proposalData.paymentStages || []).map((stage, i) => (
                  <div 
                    key={stage.id} 
                    className="flex min-h-[34px] py-1 border-b border-slate-100"
                    style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(76,175,80,0.02)' }}
                  >
                    <div className="flex-1 flex items-center px-5">
                      <span style={{ fontSize: '10px', color: '#111', fontWeight: 800, textTransform: 'uppercase' }}>{stage.label} ({stage.percentage}%)</span>
                    </div>
                    <div className="w-[140px] flex items-center justify-end px-5 border-l border-slate-100">
                      <span style={{ fontSize: '11px', color: '#111', fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
                        R$ {stage.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex min-h-[48px] py-2 mt-1" style={{ backgroundColor: GREEN }}>
                <div className="flex-1 flex items-center px-5">
                  <span style={{ fontSize: '11px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Total</span>
                </div>
                <div className="w-[180px] flex items-center justify-end px-5 gap-4 border-l border-white/10">
                  <span style={{ fontSize: '14px', fontWeight: 900, color: 'white', fontVariantNumeric: 'tabular-nums' }}>
                    R$ {stagesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 900, color: 'white' }}>
                    100%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </HiddenOverlay>

        <HiddenOverlay visible={proposalData.showComparativePlans}>
          <div className="grid grid-cols-2 gap-12 mt-4 relative z-10">
            {(proposalData.plans || []).map((plan) => (
              <div key={plan.id} className="flex flex-col gap-8">
                {/* Título Box com Frame de Seleção (CAD/Figma Style) */}
                <div className="relative">
                  {/* Moldura de Seleção Verde */}
                  <div 
                    className="absolute -inset-2 border border-[#4CAF50] pointer-events-none"
                    style={{ opacity: plan.highlighted ? 1 : 0.4 }}
                  >
                    {/* Nós de redimensionamento */}
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#4CAF50] border border-white" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#4CAF50] border border-white" />
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#4CAF50] border border-white" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#4CAF50] border border-white" />
                    
                    {/* Cursor de precisão (apenas no destacado ou simulando interação) */}
                    <div className="absolute -bottom-6 -right-4 text-[#4CAF50]" style={{ transform: 'rotate(-10deg)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5.64 2l-.6 18.04 4.8-4.43 3.32 7.03 3.24-1.53-3.32-7.03 6.12.23L5.64 2z" />
                      </svg>
                    </div>
                  </div>

                  {/* Box de Título Real */}
                  <div 
                    className="h-16 flex items-center justify-center rounded-sm"
                    style={{ 
                      backgroundColor: '#0a0412', // Roxo ultra-escuro 
                      boxShadow: plan.highlighted ? `0 0 30px ${GREEN_LIGHT}22` : 'none'
                    }}
                  >
                    <h3 style={{ 
                      fontSize: plan.name === 'NEONORTE' ? '28px' : '24px', 
                      fontWeight: 900, 
                      color: 'white', 
                      textTransform: 'uppercase', 
                      letterSpacing: plan.name === 'NEONORTE' ? '0.1em' : '0.15em',
                      fontFamily: 'inherit'
                    }}>
                      {plan.name === 'NEONORTE' ? (
                        <>
                          <span style={{ color: GREEN_LIGHT }}>N</span>EONORTE
                        </>
                      ) : plan.name}
                    </h3>
                  </div>
                </div>

                {/* Lista de Diferenciais com Linhas Horizontais e Sub-labels */}
                <div className="flex flex-col">
                  {(() => {
                    // FORÇA O CONTEÚDO CORRETO (ANTI-CACHE/EXTRA ITEMS)
                    // Se for um dos planos padrão, ignoramos o que vier do estado e usamos a spec de 4 itens
                    const itemsToRender = (plan.id === 'plan-basico' || plan.id === 'plan-neonorte')
                      ? [
                          { description: 'KIT GERADOR FV', included: true },
                          { description: 'ENGENHARIA', included: true },
                          { description: 'PÓS-VENDA INTELIGENTE (6 MESES)', included: plan.id === 'plan-neonorte' },
                          { description: 'CONSULTORIA EQUATORIAL (6 MESES)', included: plan.id === 'plan-neonorte' },
                        ]
                      : plan.items;

                    return itemsToRender.map((item, idx) => {
                      const parts = item.description.split('(');
                      const title = parts[0].trim();
                      const sublabel = parts[1] ? `(${parts[1]}` : null;
                      
                      return (
                        <div key={idx} className="flex items-start py-3 border-b border-slate-400">
                          <div className="w-10 flex justify-center pt-1">
                            {item.included ? (
                              <Check size={20} className="text-[#4CAF50] stroke-[2.5]" />
                            ) : (
                              <X size={20} className="text-[#FF5252] stroke-[5]" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 900, 
                              color: item.included ? '#0a0412' : '#cbd5e1', 
                              textTransform: 'uppercase',
                              letterSpacing: '0.02em',
                              lineHeight: '1.1'
                            }}>
                              {title}
                            </span>
                            {sublabel && (
                              <span style={{ 
                                fontSize: '9px', 
                                fontWeight: 700, 
                                color: item.included ? '#0a0412' : '#cbd5e1',
                                textTransform: 'uppercase',
                                marginTop: '2px',
                                opacity: item.included ? 0.8 : 0.4
                              }}>
                                {sublabel}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Preço em Tag Verde Flutuante - Escala diferenciada para destaque */}
                {plan.totalPrice > 0 && (
                  <div className="flex justify-center -mt-5">
                    <div 
                      className="px-10 py-3 rounded-none relative overflow-hidden"
                      style={{ 
                        backgroundColor: GREEN_LIGHT, 
                        boxShadow: '10px 10px 0px rgba(0,0,0,0.05)',
                        transform: plan.highlighted ? 'scale(1.15)' : 'scale(1)',
                        zIndex: 20
                      }}
                    >
                      {/* Detalhe de precisão na tag */}
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-[#0a0412]/20" />
                      <span style={{ 
                        fontSize: plan.highlighted ? '24px' : '20px', 
                        fontWeight: 900, 
                        color: '#0a0412', 
                        fontVariantNumeric: 'tabular-nums' 
                      }}>
                        R$ {plan.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </HiddenOverlay>
      </div>

      {/* Rodapé decorativo verde */}
      <div style={{ height: '6px', backgroundColor: GREEN_LIGHT }} />
    </div>
  );
};
