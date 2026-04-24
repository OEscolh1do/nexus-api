import React from 'react';
import {
  XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
  AreaChart, Area,
  ResponsiveContainer,
} from 'recharts';
import { MapPin } from 'lucide-react';
import type { ProposalData } from '@/core/state/slices/proposalSlice';
import type { ProjectionStats } from '@/modules/engineering/utils/projectionMath';

interface Props {
  clientData: any;
  proposalData: ProposalData;
  totalPowerKwp: number;
  totalModules: number;
  firstModule: any;
  firstInverter: any;
  inverterIds: string[];
  stats: ProjectionStats;
  [key: string]: any;
}

// ── Design Tokens ────────────────────────────────────────────────────────────
const GREEN       = '#2D6A4F';
const GREEN_LIGHT = '#4CAF50';
const GREEN_DARK  = '#1a3d2b';
const PURPLE      = '#2D0A4E';
const ORANGE      = '#F97316'; // Geração
const BLUE        = '#3B82F6'; // Consumo Base
const VIOLET      = '#8B5CF6'; // Carga Adicional

// Bullets padrão (Garantias e Serviços)
const DEFAULT_BULLETS = [
  { title: 'Inversores Solares', desc: '7 anos de garantia contra defeitos de fabricação.' },
  { title: 'Módulos Fotovoltaicos', desc: '25 anos de garantia de geração (mín. 80% de eficiência).' },
  { title: 'String Box e Estrutura', desc: '12 meses contra defeitos de fabricação.' },
  { title: 'Engenharia', desc: '6 meses de garantia técnica sobre o projeto.' },
  { title: 'Assistência Técnica', desc: '6 meses de consultoria e suporte especializado.' },
];

/**
 * PÁGINA 2 — DIMENSIONAMENTO E VIABILIDADE DO PROJETO
 * Redesign fiel à referência: header branco, KPI dominante, painel de
 * equipamentos com label vertical e thumbnails.
 */
export const ProposalPageTechnical: React.FC<Props> = ({
  clientData,
  proposalData,
  totalPowerKwp,
  totalModules,
  firstModule,
  firstInverter,
  inverterIds,
  stats,
}) => {
  // ── Cálculos derivados ─────────────────────────────────────────────────────
  const dateFormatted = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(new Date()).toUpperCase();

  const hspValues = (clientData.monthlyIrradiation || []) as number[];
  const avgHspRaw = hspValues.length > 0 
    ? hspValues.reduce((a, b) => a + b, 0) / hspValues.length
    : (stats.totalGen > 0 && totalPowerKwp > 0 ? (stats.totalGen / 365 / totalPowerKwp / 0.75) : 0); // Fallback aproximado se não houver HSP bruto

  const avgHsp = avgHspRaw > 0
    ? avgHspRaw.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0,00';

  // Formatter de eixo Y: abrevia valores (ex: 1200 → 1,2k)
  const yTickFormatter = (v: number) =>
    v >= 1000 ? `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k` : String(v);

  const coveragePct = stats.coverage.toFixed(0);

  // Bullets: parseia texto customizado (se existir) para formato objeto ou usa defaults
  const bullets = proposalData.customText
    ? proposalData.customText.split('\n').filter(Boolean).map(text => {
        const parts = text.split(':');
        if (parts.length > 1) {
          return { title: parts[0].trim(), desc: parts.slice(1).join(':').trim() };
        }
        return { desc: text.trim() };
      })
    : DEFAULT_BULLETS;

  return (
    <div className="w-full min-h-[1123px] bg-white text-slate-800 flex flex-col font-sans relative overflow-hidden">

      {/* Marcas de canto (Refined Engineering Ticks - Semi-Cross) */}
      <div className="absolute top-0 left-0 w-24 h-24 z-50 pointer-events-none" style={{ margin: '16px' }}>
        <div className="absolute top-0 left-[-12px] w-full h-[2px] bg-slate-300" />
        <div className="absolute left-0 top-[-12px] w-[2px] h-full bg-slate-300" />
        <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-[#4CAF50] rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(76,175,80,0.5)]" />
      </div>
      <div className="absolute top-0 right-0 w-24 h-24 z-50 pointer-events-none" style={{ margin: '16px' }}>
        <div className="absolute top-0 right-[-12px] w-full h-[2px] bg-slate-300" />
        <div className="absolute right-0 top-[-12px] w-[2px] h-full bg-slate-300" />
        <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#4CAF50] rounded-full translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(76,175,80,0.5)]" />
      </div>
      <div className="absolute bottom-0 left-0 w-24 h-24 z-50 pointer-events-none" style={{ margin: '16px' }}>
        <div className="absolute bottom-0 left-[-12px] w-full h-[2px] bg-slate-300" />
        <div className="absolute left-0 bottom-[-12px] w-[2px] h-full bg-slate-300" />
        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-[#4CAF50] rounded-full -translate-x-1/2 translate-y-1/2 shadow-[0_0_8px_rgba(76,175,80,0.5)]" />
      </div>
      <div className="absolute bottom-0 right-0 w-24 h-24 z-50 pointer-events-none" style={{ margin: '16px' }}>
        <div className="absolute bottom-0 right-[-12px] w-full h-[2px] bg-slate-300" />
        <div className="absolute right-0 bottom-[-12px] w-[2px] h-full bg-slate-300" />
        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-[#4CAF50] rounded-full translate-x-1/2 translate-y-1/2 shadow-[0_0_8px_rgba(76,175,80,0.5)]" />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          HEADER — Fundo branco, título preto display, data sup. direita
          ══════════════════════════════════════════════════════════════════ */}
      <div
        className="relative flex items-start justify-between"
        style={{
          borderTop: `6px solid ${GREEN_DARK}`,
          padding: '32px 48px 24px 48px',
          backgroundColor: 'white',
        }}
      >
        {/* Coluna esquerda: título + subtexto contrato */}
        <div className="flex flex-col gap-3 max-w-[480px]">
          <h1
            className="uppercase leading-[0.88]"
            style={{ fontSize: '36px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}
          >
            DIMENSIONAMENTO E<br />VIABILIDADE DO PROJETO
          </h1>
          <p style={{ fontSize: '10.5px', color: '#64748B', lineHeight: '1.55', maxWidth: '420px' }}>
            No momento da contratação é estabelecido um contrato formal de prestação de serviços
            com a NEONORTE, responsável pelo faturamento e emissão de Nota Fiscal de Serviço.
          </p>
        </div>

        {/* Coluna direita: data + logo circular */}
        <div className="flex flex-col items-end gap-3 shrink-0">
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {dateFormatted}
          </span>
          {/* Logo circular verde — padrão da referência */}
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: GREEN_LIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <img
              src="/logos/simbolo-branco.png"
              alt="Neonorte"
              style={{ width: '36px', height: '36px', objectFit: 'contain' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      </div>

      {/* Linha divisória header/corpo */}
      <div style={{ height: '1px', backgroundColor: '#E2E8F0', marginBottom: '0' }} />

      {/* ══════════════════════════════════════════════════════════════════
          CORPO — grid assimétrico 55% esq / 45% dir
          ══════════════════════════════════════════════════════════════════ */}
      <div
        className="flex-1 flex gap-0 relative"
        style={{ padding: '0' }}
      >
        {/* Marca d'água */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.025] pointer-events-none z-0">
          <img src="/logos/simbolo-verde.png" alt="" style={{ width: '480px', height: 'auto' }} />
        </div>

        {/* Blueprint Grid Sutil */}
        <div 
          className="absolute inset-0 pointer-events-none z-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #CBD5E1 1px, transparent 1px),
              linear-gradient(to bottom, #CBD5E1 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />

        {/* ── COL. ESQUERDA ─────────────────────────────────────────────── */}
        <div
          className="flex flex-col gap-5 relative z-10"
          style={{ width: '50%', padding: '20px 24px 24px 48px', borderRight: '1px solid #E2E8F0' }}
        >
          {/* ── Nome cliente + badges de capacidade (Refined Engineering Badge) ── */}
          <div className="flex flex-col gap-2">
            <span style={{ fontSize: '15px', fontWeight: 900, color: GREEN, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              {clientData.clientName || 'Cliente'}
            </span>
            
            <div 
              className="relative"
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'auto 140px 140px',
                border: '1px solid #CBD5E1',
                backgroundColor: 'white',
                width: 'fit-content',
                overflow: 'visible' // Garante que as cruzes não sejam cortadas
              }}
            >
              {/* Corner Ticks (Semi-Cross) - Elevados para sobrepor a tabela */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '20px', height: '20px', pointerEvents: 'none', zIndex: 50 }}>
                <div style={{ position: 'absolute', top: 0, left: '-8px', width: '100%', height: '2px', backgroundColor: GREEN_DARK }} />
                <div style={{ position: 'absolute', left: 0, top: '-8px', width: '2px', height: '100%', backgroundColor: GREEN_DARK }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '4px', backgroundColor: '#4CAF50', borderRadius: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0 0 4px rgba(76,175,80,0.5)' }} />
              </div>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '20px', height: '20px', pointerEvents: 'none', zIndex: 50 }}>
                <div style={{ position: 'absolute', top: 0, right: '-8px', width: '100%', height: '2px', backgroundColor: GREEN_DARK }} />
                <div style={{ position: 'absolute', right: 0, top: '-8px', width: '2px', height: '100%', backgroundColor: GREEN_DARK }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '4px', backgroundColor: '#4CAF50', borderRadius: '50%', transform: 'translate(50%, -50%)', boxShadow: '0 0 4px rgba(76,175,80,0.5)' }} />
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '20px', height: '20px', pointerEvents: 'none', zIndex: 50 }}>
                <div style={{ position: 'absolute', bottom: 0, left: '-8px', width: '100%', height: '2px', backgroundColor: GREEN_DARK }} />
                <div style={{ position: 'absolute', left: 0, bottom: '-8px', width: '2px', height: '100%', backgroundColor: GREEN_DARK }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '4px', height: '4px', backgroundColor: '#4CAF50', borderRadius: '50%', transform: 'translate(-50%, 50%)', boxShadow: '0 0 4px rgba(76,175,80,0.5)' }} />
              </div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '20px', height: '20px', pointerEvents: 'none', zIndex: 50 }}>
                <div style={{ position: 'absolute', bottom: 0, right: '-8px', width: '100%', height: '2px', backgroundColor: GREEN_DARK }} />
                <div style={{ position: 'absolute', right: 0, bottom: '-8px', width: '2px', height: '100%', backgroundColor: GREEN_DARK }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '4px', height: '4px', backgroundColor: '#4CAF50', borderRadius: '50%', transform: 'translate(50%, 50%)', boxShadow: '0 0 4px rgba(76,175,80,0.5)' }} />
              </div>

              {/* Label Vertical */}
              <div style={{
                writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)',
                backgroundColor: GREEN_LIGHT, color: '#064E3B',
                fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em',
                padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gridRow: '1 / span 1'
              }}>
                Projeto
              </div>

              {/* Coluna Potência */}
              <div style={{ 
                padding: '24px 22px', 
                backgroundColor: GREEN, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center',
                borderRight: '1px solid rgba(255,255,255,0.2)' 
              }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '6px', textAlign: 'center' }}>Potência Nominal</span>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '3px', width: '100%' }}>
                  <span className="font-mono tabular-nums" style={{ fontSize: '24px', fontWeight: 900, color: 'white', lineHeight: 1 }}>
                    {totalPowerKwp.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'white' }}>kWp</span>
                </div>
              </div>

              {/* Coluna Geração */}
              <div style={{ 
                padding: '24px 22px', 
                backgroundColor: GREEN_LIGHT, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center' 
              }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#064E3B', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '6px', textAlign: 'center' }}>Geração Mensal</span>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '3px', width: '100%' }}>
                  <span className="font-mono tabular-nums" style={{ fontSize: '24px', fontWeight: 900, color: '#064E3B', lineHeight: 1 }}>
                    {Math.round(stats.totalGen / 12).toLocaleString('pt-BR')}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#064E3B' }}>kWh</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Padrão Neonorte ───────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div style={{ width: '3px', height: '12px', backgroundColor: GREEN_LIGHT, borderRadius: '1px' }} />
              <h3 style={{ fontSize: '12px', fontWeight: 900, color: PURPLE, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Padrão Neonorte
              </h3>
            </div>
            <p style={{ fontSize: '10.5px', color: '#334155', lineHeight: '1.55', marginBottom: '10px', textAlign: 'justify' }}>
              A elaboração do orçamento e avaliações técnicas são feitas sem qualquer compromisso ou custo.
            </p>
            <div className="flex flex-col gap-2.5 pl-3 mt-2 py-1" style={{ borderLeft: `2px solid ${GREEN_LIGHT}40` }}>
              {bullets.map((item, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <div style={{ width: '4px', height: '4px', backgroundColor: GREEN_LIGHT, marginTop: '6px', flexShrink: 0 }} />
                  <span style={{ fontSize: '10px', color: '#475569', lineHeight: '1.6' }}>
                    {item.title && <strong style={{ color: '#1E293B', fontWeight: 800 }}>{item.title}: </strong>}
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Perfil de Consumo Projetado ──────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div style={{ width: '3px', height: '10px', backgroundColor: GREEN_LIGHT, borderRadius: '1px' }} />
              <h4 style={{ fontSize: '11px', fontWeight: 900, color: PURPLE, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Perfil de Carga Anual
              </h4>
            </div>
            <div className="flex items-center justify-between mb-[6px]">
              <span style={{ fontSize: '9px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: BLUE }} />
                  Carga Base
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: VIOLET }} />
                  Carga Adicional
                </span>
              </span>
              {stats.totalAddedLoad > 0 && (
                <span style={{ fontSize: '8px', fontWeight: 900, color: VIOLET, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  + {Math.round(stats.totalAddedLoad / 12).toLocaleString('pt-BR')} kWh/mês
                </span>
              )}
            </div>
            <div style={{ height: '110px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '2px', position: 'relative' }}>
              {/* Crosshairs decorativos */}
              <div style={{ position: 'absolute', top: '-3px', left: '-3px', width: '5px', height: '5px', borderTop: '1px solid #94A3B8', borderLeft: '1px solid #94A3B8', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: '-3px', right: '-3px', width: '5px', height: '5px', borderTop: '1px solid #94A3B8', borderRight: '1px solid #94A3B8', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-3px', left: '-3px', width: '5px', height: '5px', borderBottom: '1px solid #94A3B8', borderLeft: '1px solid #94A3B8', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-3px', right: '-3px', width: '5px', height: '5px', borderBottom: '1px solid #94A3B8', borderRight: '1px solid #94A3B8', pointerEvents: 'none' }} />
              <ResponsiveContainer width="100%" height={110}>
                <AreaChart data={stats.barData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" fontSize={7} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8' }} />
                  <YAxis fontSize={7} axisLine={false} tickLine={false} tick={{ fill: '#CBD5E1' }} tickFormatter={yTickFormatter} width={28} />
                  <Area type="monotone" dataKey="baseCons" stackId="1" stroke={BLUE} fill={BLUE} fillOpacity={0.2} strokeWidth={1.5} isAnimationActive={false} />
                  <Area type="monotone" dataKey="addedLoad" stackId="1" stroke={VIOLET} fill={VIOLET} fillOpacity={0.4} strokeWidth={1.5} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>


        </div>

        {/* ── COL. DIREITA ──────────────────────────────────────────────── */}
        <div
          className="flex flex-col gap-4 relative z-10"
          style={{ width: '50%', padding: '20px 48px 24px 24px' }}
        >
          {/* ── Foto Satélite — Sensor Frame ────────────────────────── */}
          <div className="relative" style={{ padding: '6px' }}>
            {/* Cantos L-shaped (Sensor Frame) */}
            {/* NW */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '20px', height: '20px', borderTop: '3px solid #4CAF50', borderLeft: '3px solid #4CAF50', zIndex: 10, pointerEvents: 'none' }} />
            {/* NE */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: '20px', height: '20px', borderTop: '3px solid #4CAF50', borderRight: '3px solid #4CAF50', zIndex: 10, pointerEvents: 'none' }} />
            {/* SW */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '20px', height: '20px', borderBottom: '3px solid #4CAF50', borderLeft: '3px solid #4CAF50', zIndex: 10, pointerEvents: 'none' }} />
            {/* SE */}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '20px', height: '20px', borderBottom: '3px solid #4CAF50', borderRight: '3px solid #4CAF50', zIndex: 10, pointerEvents: 'none' }} />
            {/* Metadados — canto inferior esquerdo */}
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', zIndex: 20, pointerEvents: 'none' }}>
              <span className="font-mono" style={{ fontSize: '6px', fontWeight: 900, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase', backgroundColor: 'rgba(0,0,0,0.35)', padding: '1px 4px' }}>
                {clientData.lat ? `${Number(clientData.lat).toFixed(4)}°N` : 'LAT: --'}
                {' / '}
                {clientData.lng ? `${Number(clientData.lng).toFixed(4)}°W` : 'LNG: --'}
              </span>
            </div>
            {/* Metadados — canto inferior direito */}
            <div style={{ position: 'absolute', bottom: '8px', right: '8px', zIndex: 20, pointerEvents: 'none' }}>
              <span className="font-mono" style={{ fontSize: '6px', fontWeight: 900, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase', backgroundColor: 'rgba(0,0,0,0.35)', padding: '1px 4px' }}>
                ZOOM: 20
              </span>
            </div>

            {/* Imagem do mapa */}
            <div
              className="relative overflow-hidden rounded-sm"
              style={{ height: '170px', border: '1px solid #CBD5E1', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
            >
            {clientData.lat && clientData.lng ? (
              <img
                src={`https://maps.googleapis.com/maps/api/staticmap?center=${clientData.lat},${clientData.lng}&zoom=20&size=600x400&maptype=satellite&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}`}
                alt="Localização"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center flex-col gap-2">
                <MapPin size={22} className="text-slate-300" />
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Vista Aérea Indisponível</span>
              </div>
            )}

            {/* ── Marcador Neonorte Personalizado (Refined) ── */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              {/* Badge com logo */}
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  background: 'radial-gradient(circle at 30% 30%, #2D6A4F, #1B4332)',
                  border: '2px solid #fff',
                  borderRadius: '50% 50% 50% 0',
                  transform: 'rotate(-45deg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 1.5px #4CAF50, 0 8px 16px rgba(0,0,0,0.4), inset 0 0 8px rgba(0,0,0,0.2)',
                  overflow: 'hidden',
                  marginBottom: '-1px'
                }}
              >
                <img
                  src="/logos/simbolo-branco.png"
                  alt="Neonorte"
                  style={{
                    width: '22px',
                    height: '22px',
                    objectFit: 'contain',
                    transform: 'rotate(45deg)',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                  }}
                />
              </div>
              
              {/* Alvo de Precisão (Ancoragem) */}
              <div className="flex items-center justify-center relative" style={{ height: '14px', width: '14px' }}>
                {/* Anel Externo (Transparente) */}
                <div style={{ position: 'absolute', width: '14px', height: '14px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.5)', backgroundColor: 'rgba(76,175,80,0.2)' }} />
                {/* Haste Vertical (Crosshair) */}
                <div style={{ position: 'absolute', width: '1px', height: '100%', backgroundColor: 'rgba(255,255,255,0.4)' }} />
                {/* Haste Horizontal (Crosshair) */}
                <div style={{ position: 'absolute', width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.4)' }} />
                {/* Ponto Central */}
                <div
                  style={{
                    width: '5px',
                    height: '5px',
                    backgroundColor: '#4CAF50',
                    borderRadius: '50%',
                    border: '1.5px solid #fff',
                    boxShadow: '0 0 8px rgba(76,175,80,1)',
                    zIndex: 2
                  }}
                />
              </div>
            </div>

            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                backgroundColor: 'rgba(45, 10, 78, 0.85)',
                backdropFilter: 'blur(4px)',
                color: 'white',
                fontSize: '8px',
                fontWeight: 900,
                letterSpacing: '0.04em',
                padding: '3px 8px',
                textTransform: 'uppercase',
              }}
            >
              FV{new Date().getFullYear()} — {clientData.clientName?.split(' ')[0] || ''}
            </div>
            </div>{/* Fecha inner map div */}
          </div>{/* Fecha sensor frame wrapper */}

          {/* ── KPIs: Irradiação + Cobertura (dominante) ──────────────── */}
          <div className="grid grid-cols-2 gap-3">
            {/* Irradiação */}
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#F8FAFC',
                borderLeft: `4px solid ${GREEN_LIGHT}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <span style={{ fontSize: '7.5px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Irradiação Local (CRESESB)
              </span>
              <span style={{ fontSize: '26px', fontWeight: 900, color: PURPLE, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {avgHsp}
              </span>
              <span style={{ fontSize: '8px', color: '#94A3B8', fontWeight: 700 }}>Wh/m²/dia</span>
            </div>

            {/* Cobertura % — elemento dominante */}
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#F0FDF4',
                borderLeft: `4px solid ${GREEN}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <span style={{ fontSize: '7.5px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Média de Geração
              </span>
              <span style={{ fontSize: '36px', fontWeight: 900, color: GREEN_LIGHT, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {coveragePct}%
              </span>
              <span style={{ fontSize: '8px', color: '#94A3B8', fontWeight: 700 }}>Geração × Consumo</span>
            </div>
          </div>

          {/* ── Painel Equipamentos ───────────────────────────────────── */}
          <div
            style={{
              border: '1px solid #CBD5E1',
              borderRadius: '2px',
              overflow: 'hidden',
              display: 'flex',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            {/* Label vertical rotacionada */}
            <div
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                transform: 'rotate(180deg)',
                backgroundColor: GREEN,
                color: 'white',
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
                    <span style={{ fontSize: '8px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Módulos: {totalModules}
                    </span>
                    <span style={{ fontSize: '10.5px', fontWeight: 900, color: '#1E293B' }}>
                      {firstModule?.manufacturer || 'DMEGC'}
                    </span>
                    <span style={{ fontSize: '9px', color: '#64748B' }}>
                      Potência: {(firstModule?.power || 550).toLocaleString('pt-BR')} Wp
                    </span>
                    <span style={{ fontSize: '9px', color: '#64748B' }}>
                      Instalação: {clientData.installationType || 'Residencial Telhado'}
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
                    <span style={{ fontSize: '8px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Inversor(es): {inverterIds.length || 1}
                    </span>
                    <span style={{ fontSize: '10.5px', fontWeight: 900, color: '#1E293B' }}>
                      {firstInverter?.snapshot?.manufacturer || 'PHB'}
                    </span>
                    <span style={{ fontSize: '9px', color: '#64748B' }}>
                      Potência: {firstInverter?.snapshot?.nominalPower
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

          {/* ── Geração × Consumo (BarChart) ──────────── */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2">
              <div style={{ width: '3px', height: '10px', backgroundColor: GREEN_LIGHT, borderRadius: '1px' }} />
              <h4 style={{ fontSize: '11px', fontWeight: 900, color: PURPLE, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Projeção de Desempenho
              </h4>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '2px', backgroundColor: ORANGE, border: '1px solid rgba(0,0,0,0.05)' }} />
                Geração
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '2px', backgroundColor: BLUE, border: '1px solid rgba(0,0,0,0.05)' }} />
                Base
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '2px', backgroundColor: VIOLET, border: '1px solid rgba(0,0,0,0.05)' }} />
                Adicional
              </span>
            </span>
            <div style={{ height: '140px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '10px 4px 4px 4px', position: 'relative' }}>
              {/* Crosshairs decorativos */}
              <div style={{ position: 'absolute', top: '-3px', left: '-3px', width: '5px', height: '5px', borderTop: '1px solid #94A3B8', borderLeft: '1px solid #94A3B8', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: '-3px', right: '-3px', width: '5px', height: '5px', borderTop: '1px solid #94A3B8', borderRight: '1px solid #94A3B8', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-3px', left: '-3px', width: '5px', height: '5px', borderBottom: '1px solid #94A3B8', borderLeft: '1px solid #94A3B8', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-3px', right: '-3px', width: '5px', height: '5px', borderBottom: '1px solid #94A3B8', borderRight: '1px solid #94A3B8', pointerEvents: 'none' }} />
              <ResponsiveContainer width="100%" height={126}>
                <BarChart data={stats.barData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" fontSize={8.5} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontWeight: 700 }} />
                  <YAxis fontSize={8.5} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontWeight: 600 }} tickFormatter={yTickFormatter} width={32} />
                  <Bar dataKey="gen"  fill={ORANGE} radius={[2,2,0,0]} barSize={10} isAnimationActive={false} />
                  <Bar dataKey="baseCons" stackId="cons" fill={BLUE} radius={[0,0,0,0]} barSize={10} isAnimationActive={false} />
                  <Bar dataKey="addedLoad" stackId="cons" fill={VIOLET} radius={[2,2,0,0]} barSize={10} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Rodapé ──────────────────────────────────────────────────────── */}
      <div style={{ height: '6px', backgroundColor: GREEN_LIGHT }} />
    </div>
  );
};
