/**
 * TechnicalElements.tsx
 * Decomposed elements from ProposalPageTechnical — allows users to edit
 * individual sections of the technical page independently.
 */
import { Sparkles, Zap, Shield, ClipboardCheck, Wrench } from 'lucide-react';
import { useProposalPageData } from '../useProposalPageData';
import type { CanvasElement } from '../types';

const GREEN       = '#2D6A4F';
const GREEN_LIGHT = '#4CAF50';
const GREEN_DARK  = '#1a3d2b';

// ────────────────────────────────────────────────────────────────────────────────
// 1. SectionHeaderElement
// ────────────────────────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  element: CanvasElement;
}

export function SectionHeaderElement({ element }: SectionHeaderProps) {
  const p = element.props as Record<string, unknown>;
  const title = String(p.title ?? 'DIMENSIONAMENTO E\nVIABILIDADE DO PROJETO');
  const subtitle = String(p.subtitle ?? '');
  const borderColor = String(p.borderColor ?? GREEN_DARK);
  const titleColor = String(p.titleColor ?? '#0F172A');
  const subtitleColor = String(p.subtitleColor ?? '#64748B');

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderTop: `4px solid ${borderColor}`,
        padding: '32px 48px 24px 48px',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <h1
        className="uppercase leading-[0.88]"
        style={{
          fontSize: '28px',
          fontWeight: 900,
          color: titleColor,
          letterSpacing: '-0.02em',
          whiteSpace: 'pre-line',
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: '10.5px',
          color: subtitleColor,
          lineHeight: '1.55',
          maxWidth: '420px',
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// 2. KpiCapacityBadgeElement
// ────────────────────────────────────────────────────────────────────────────────

interface KpiCapacityBadgeProps {
  element: CanvasElement;
}

export function KpiCapacityBadgeElement({ element }: KpiCapacityBadgeProps) {
  const { clientData, totalPowerKwp, stats } = useProposalPageData();
  const p = element.props as Record<string, unknown>;

  const colorPower = String(p.colorPower ?? GREEN);
  const colorGen = String(p.colorGen ?? GREEN_LIGHT);
  const labelColor = String(p.labelColor ?? '#064E3B');
  const showClientName = p.showClientName !== false;

  const monthlyGen = Math.round(stats.totalGen / 12);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {showClientName && (
        <span
          style={{
            fontSize: '15px',
            fontWeight: 900,
            color: GREEN,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'block',
          }}
        >
          {clientData.clientName || 'Cliente'}
        </span>
      )}

      <div
        className="relative rounded-md overflow-hidden shadow-md"
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 140px 140px',
          border: '1px solid #E2E8F0',
          backgroundColor: 'white',
          width: 'fit-content',
        }}
      >
        {/* Label Vertical */}
        <div
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            backgroundColor: GREEN_LIGHT,
            color: labelColor,
            fontSize: '8px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            padding: '0 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gridRow: '1 / span 1',
          }}
        >
          Projeto
        </div>

        {/* Coluna Potência */}
        <div
          style={{
            padding: '24px 22px',
            backgroundColor: colorPower,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <span
            style={{
              fontSize: '9px',
              fontWeight: 800,
              color: '#FFFFFF',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginBottom: '6px',
              textAlign: 'center',
            }}
          >
            Potência Nominal
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              gap: '3px',
              width: '100%',
            }}
          >
            <span
              className="font-mono tabular-nums"
              style={{ fontSize: '24px', fontWeight: 900, color: 'white', lineHeight: 1 }}
            >
              {totalPowerKwp.toFixed(2)}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'white' }}>kWp</span>
          </div>
        </div>

        {/* Coluna Geração */}
        <div
          style={{
            padding: '24px 22px',
            backgroundColor: colorGen,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: '9px',
              fontWeight: 800,
              color: '#064E3B',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginBottom: '6px',
              textAlign: 'center',
            }}
          >
            Geração Mensal
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              gap: '3px',
              width: '100%',
            }}
          >
            <span
              className="font-mono tabular-nums"
              style={{ fontSize: '24px', fontWeight: 900, color: '#064E3B', lineHeight: 1 }}
            >
              {monthlyGen.toLocaleString('pt-BR')}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#064E3B' }}>kWh</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// 3. GuaranteesListElement
// ────────────────────────────────────────────────────────────────────────────────

const DEFAULT_BULLETS = [
  { title: 'Inversores Solares', desc: '7 anos de garantia contra defeitos de fabricação.' },
  { title: 'Módulos Fotovoltaicos', desc: '25 anos de garantia de geração (mín. 80% de eficiência).' },
  { title: 'String Box e Estrutura', desc: '12 meses contra defeitos de fabricação.' },
  { title: 'Engenharia', desc: '6 meses de garantia técnica sobre o projeto.' },
  { title: 'Assistência Técnica', desc: '6 meses de consultoria e suporte especializado.' },
];

interface GuaranteesListProps {
  element: CanvasElement;
}

export function GuaranteesListElement({ element }: GuaranteesListProps) {
  const p = element.props as Record<string, unknown>;
  const accentColor = String(p.accentColor ?? GREEN_LIGHT);
  const headingColor = String(p.headingColor ?? '#2D0A4E');
  const customBullets = String(p.customBullets ?? '');

  let bullets: Array<{ title?: string; desc: string }> = DEFAULT_BULLETS;

  if (customBullets.trim()) {
    bullets = customBullets.split('\n').filter(Boolean).map((text) => {
      const parts = text.split(':');
      if (parts.length > 1) {
        return { title: parts[0].trim(), desc: parts.slice(1).join(':').trim() };
      }
      return { desc: text.trim() };
    });
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="flex items-center gap-2 mb-2.5">
        <div style={{ width: '3px', height: '12px', backgroundColor: accentColor, borderRadius: '1px' }} />
        <h3
          style={{
            fontSize: '12px',
            fontWeight: 900,
            color: headingColor,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Padrão Neonorte
        </h3>
      </div>
      <p
        style={{
          fontSize: '10.5px',
          color: '#334155',
          lineHeight: '1.55',
          marginBottom: '10px',
          textAlign: 'justify',
        }}
      >
        A elaboração do orçamento e avaliações técnicas são feitas sem qualquer compromisso ou custo.
      </p>
      <div className="flex flex-col gap-3 mt-3">
        {bullets.map((item, i) => {
          let Icon = Sparkles;
          if (item.title?.includes('Inversor')) Icon = Zap;
          if (item.title?.includes('Módulo')) Icon = Shield;
          if (item.title?.includes('Engenharia')) Icon = ClipboardCheck;
          if (item.title?.includes('Assistência')) Icon = Wrench;

          return (
            <div key={i} className="flex gap-3 items-start p-2 rounded-md hover:bg-slate-50 transition-colors">
              <div className="p-1.5 rounded-md bg-green-50 text-green-600">
                <Icon size={14} />
              </div>
              <span style={{ fontSize: '10px', color: '#475569', lineHeight: '1.4' }}>
                {item.title && (
                  <strong
                    style={{
                      color: '#1E293B',
                      fontWeight: 800,
                      display: 'block',
                      marginBottom: '2px',
                    }}
                  >
                    {item.title}
                  </strong>
                )}
                {item.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// 4. EquipmentPanelElement
// ────────────────────────────────────────────────────────────────────────────────

interface EquipmentPanelProps {
  element: CanvasElement;
}

export function EquipmentPanelElement({ element }: EquipmentPanelProps) {
  const { clientData, totalModules, firstModule, firstInverter, inverterIds } = useProposalPageData();
  const p = element.props as Record<string, unknown>;

  const labelBgColor = String(p.labelBgColor ?? GREEN);
  const labelColor = String(p.labelColor ?? '#ffffff');

  return (
    <div
      className="rounded-lg shadow-lg"
      style={{
        width: '100%',
        height: '100%',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        display: 'flex',
        backgroundColor: 'white',
      }}
    >
      {/* Label vertical rotacionada */}
      <div
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          transform: 'rotate(180deg)',
          backgroundColor: labelBgColor,
          color: labelColor,
          fontSize: '9px',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          padding: '16px 7px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        EQUIPAMENTOS
      </div>

      {/* Conteúdo do painel */}
      <div className="flex flex-col flex-1 divide-y divide-slate-100">
        {/* Módulos */}
        <div style={{ padding: '10px 12px', backgroundColor: 'white' }}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5 flex-1">
              <span
                style={{
                  fontSize: '8px',
                  fontWeight: 900,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Módulos: {totalModules}
              </span>
              <span style={{ fontSize: '10.5px', fontWeight: 900, color: '#1E293B' }}>
                {firstModule?.manufacturer || 'DMEGC'}
              </span>
              <span style={{ fontSize: '9px', color: '#64748B' }}>
                Potência: {(firstModule?.power || 550).toLocaleString('pt-BR')} Wp
              </span>
              <span style={{ fontSize: '9px', color: '#64748B' }}>
                Instalação: {(clientData as any).installationType || 'Residencial'}
              </span>
              <span style={{ fontSize: '9px', color: '#64748B' }}>
                Telhado: {(clientData as any).roofType || 'Cerâmico'}
              </span>
            </div>
            {/* Thumbnail módulo — ícone SVG */}
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '2px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <img
                src="/assets/thumbnail-modulo.png"
                alt="Módulo FV"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = 'none';
                  if (el.parentElement) {
                    el.parentElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="1"/><line x1="2" y1="8" x2="22" y2="8"/><line x1="2" y1="13" x2="22" y2="13"/><line x1="7" y1="3" x2="7" y2="17"/><line x1="12" y1="3" x2="12" y2="17"/><line x1="17" y1="3" x2="17" y2="17"/></svg>`;
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Inversor */}
        <div style={{ padding: '10px 12px', backgroundColor: '#FAFAFA' }}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5 flex-1">
              <span
                style={{
                  fontSize: '8px',
                  fontWeight: 900,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Inversor(es): {inverterIds.length || 1}
              </span>
              <span style={{ fontSize: '10.5px', fontWeight: 900, color: '#1E293B' }}>
                {(firstInverter?.snapshot as any)?.manufacturer || 'PHB'}
              </span>
              <span style={{ fontSize: '9px', color: '#64748B' }}>
                Potência:{' '}
                {firstInverter?.snapshot?.nominalPower
                  ? `${(firstInverter.snapshot.nominalPower * 1000).toLocaleString('pt-BR')} W`
                  : '8.000 W'}
              </span>
            </div>
            {/* Thumbnail inversor — ícone SVG */}
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '2px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <img
                src="/assets/thumbnail-inversor.png"
                alt="Inversor"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = 'none';
                  if (el.parentElement) {
                    el.parentElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><circle cx="12" cy="16" r="2"/></svg>`;
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
