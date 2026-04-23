import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, BarChart, Bar,
} from 'recharts';
import { MapPin, EyeOff } from 'lucide-react';
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

const GREEN       = '#2D6A4F';
const GREEN_LIGHT = '#4CAF50';
const PURPLE      = '#2D0A4E';

/**
 * PÁGINA 3 — DIMENSIONAMENTO TÉCNICO
 * Fiel ao template: logo circular verde top-right, borda roxa no topo,
 * cards de irradiação em verde-bold, foto aérea, equipamentos com layout tabela vertical.
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
  isExportingPdf,
}) => {
  const dateFormatted = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(new Date()).toUpperCase();

  const avgHsp = stats.totalGen > 0 && totalPowerKwp > 0
    ? (stats.totalGen / 365 / totalPowerKwp).toFixed(2)
    : '0.00';

  return (
    <div className="w-full min-h-[1123px] bg-white text-slate-800 flex flex-col font-sans relative overflow-hidden">
      {/* Borda roxa topo — detalhe do template */}
      <div style={{ height: '4px', backgroundColor: PURPLE }} />

      <div className="flex-1 p-[40px] flex flex-col gap-6">
        {/* Header */}
        <header className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h1
              className="uppercase leading-tight"
              style={{ fontSize: '22px', fontWeight: 900, color: PURPLE, letterSpacing: '0.01em' }}
            >
              Dimensionamento e<br />Viabilidade do Projeto
            </h1>
            <p style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', maxWidth: '420px', lineHeight: '1.4' }}>
              No momento da contratação é estabelecido um contrato formal de prestação de serviços
              com a NEONORTE, responsável pelo faturamento e emissão de Nota Fiscal de Serviço.
            </p>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.12em' }}>
              {dateFormatted}
            </span>
          </div>

          {/* Logo circular verde — badge do template */}
          <div
            className="flex items-center justify-center rounded-full overflow-hidden"
            style={{ width: '72px', height: '72px', backgroundColor: GREEN_LIGHT, flexShrink: 0 }}
          >
            <img
              src="/logos/simbolo-branco.png"
              alt="Neonorte"
              className="w-12 h-12 object-contain"
            />
          </div>
        </header>

        {/* Client + Project Summary */}
        <section className="flex gap-4 items-start">
          <div className="flex flex-col">
            <span style={{ fontSize: '10px', color: PURPLE, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '2px' }}>
              {clientData.clientName || 'Cliente'}
            </span>
            {/* Cards de potência + geração — estilo verde do template */}
            <div className="flex gap-0 mt-1">
              <div
                className="px-5 py-3 flex flex-col"
                style={{ backgroundColor: GREEN, color: 'white' }}
              >
                <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.7 }}>
                  PROJETO
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span style={{ fontSize: '18px', fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
                    {totalPowerKwp.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.8 }}>kWp</span>
                </div>
              </div>
              <div
                className="px-5 py-3 flex flex-col"
                style={{ backgroundColor: GREEN_LIGHT, color: 'white' }}
              >
                <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.8 }}>
                  GERAÇÃO
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span style={{ fontSize: '18px', fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round(stats.totalGen / 12).toLocaleString('pt-BR')}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.8 }}>kWh</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-6 flex-1">
          {/* Coluna Esquerda: Texto + Gráficos */}
          <div className="flex flex-col gap-5">
            {/* Padrão Neonorte */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 900, color: PURPLE, marginBottom: '8px' }}>
                Padrão Neonorte
              </h3>
              {proposalData.customText ? (
                <p style={{ fontSize: '11px', color: '#475569', lineHeight: '1.6', textAlign: 'justify' }}>
                  {proposalData.customText}
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {[
                    'Inversores solares: 7 anos contra defeitos de fabricação.',
                    'Módulos FV: 25 anos na geração de energia (80% de eficiência).',
                    'String Box e Estrutura: 12 meses de garantia contra defeitos de fabricação.',
                    'Engenharia: 6 meses.',
                    'Assistência e Consultoria Técnica do projeto: 6 meses.',
                  ].map((item, i) => (
                    <li key={i} style={{ fontSize: '10px', color: '#475569', display: 'flex', gap: '6px', lineHeight: '1.4' }}>
                      <span style={{ color: GREEN_LIGHT, fontWeight: 900, flexShrink: 0 }}>•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Histórico de Consumo */}
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 800, color: PURPLE, marginBottom: '8px' }}>
                Histórico de consumo
              </h4>
              <div style={{ height: '110px', width: '100%' }}>
                <AreaChart data={stats.barData} width={349} height={110}>
                  {!isExportingPdf && (
                    <defs>
                      <linearGradient id="colorConsTechV2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={PURPLE} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={PURPLE} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  )}
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" fontSize={8} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                  <YAxis hide />
                  <Area 
                    type="monotone" 
                    dataKey="cons" 
                    stroke={PURPLE} 
                    strokeWidth={2} 
                    fillOpacity={isExportingPdf ? 0.2 : 1} 
                    fill={isExportingPdf ? PURPLE : "url(#colorConsTechV2)"}
                    dot={{ r: 2, fill: PURPLE }} 
                    isAnimationActive={false} 
                  />
                </AreaChart>
              </div>
            </div>

            {/* Geração × Consumo */}
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 800, color: PURPLE, marginBottom: '8px' }}>
                Geração × Consumo
              </h4>
              <div style={{ height: '110px', width: '100%' }}>
                <BarChart data={stats.barData} width={349} height={110} margin={{top:0,right:0,left:-28,bottom:0}}>
                  <XAxis dataKey="month" fontSize={8} axisLine={false} tickLine={false} />
                  <YAxis fontSize={8} axisLine={false} tickLine={false} />
                  <Bar dataKey="gen" fill={GREEN_LIGHT} radius={[2,2,0,0]} barSize={7} isAnimationActive={false} />
                  <Bar dataKey="cons" fill={PURPLE} radius={[2,2,0,0]} barSize={7} isAnimationActive={false} />
                </BarChart>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Foto + Métricas + Equipamentos */}
          <div className="flex flex-col gap-4">
            {/* Foto aérea ou placeholder */}
            <div className="relative">
              {clientData.lat && clientData.lng ? (
                <div style={{ height: '140px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${clientData.lat},${clientData.lng}&zoom=19&size=600x300&maptype=satellite&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}`}
                    alt="Localização"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div style={{ position: 'absolute', bottom: '6px', left: '6px', backgroundColor: 'rgba(45,10,78,0.75)', color: 'white', padding: '2px 6px', fontSize: '8px', fontWeight: 700 }}>
                    {`FV${new Date().getFullYear()}--- · ${clientData.clientName || ''}`}
                  </div>
                </div>
              ) : (
                <div style={{ height: '140px', backgroundColor: '#f1f5f9', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '6px', border: '1px dashed #cbd5e1' }}>
                  <MapPin size={16} style={{ color: '#94a3b8' }} />
                  <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Imagem Aérea</span>
                </div>
              )}
              {!proposalData.showMap && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#e2e8f0', borderRadius: '20px', padding: '4px 10px' }}>
                    <EyeOff size={10} style={{ color: '#64748b' }} />
                    <span style={{ fontSize: '8px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Oculto no PDF</span>
                  </div>
                </div>
              )}
            </div>

            {/* Cards de métricas — verde bold fiel ao template */}
            <div
              className="flex items-center justify-between p-4"
              style={{ backgroundColor: GREEN_LIGHT, borderRadius: '2px' }}
            >
              <div className="flex flex-col">
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                  Irradiação do Local
                </span>
                <span style={{ fontSize: '32px', fontWeight: 900, color: 'white', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {avgHsp}
                </span>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  Wh/m².dia
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span style={{ fontSize: '40px', fontWeight: 900, color: 'white', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {stats.coverage.toFixed(0)}%
                </span>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                  Média de Geração
                </span>
                <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.6)' }}>
                  (Geração × Consumo)
                </span>
              </div>
            </div>

            {/* Equipamentos — tabela vertical fiel ao template */}
            <div
              className="flex overflow-hidden"
              style={{ border: '1px solid #e2e8f0' }}
            >
              {/* Label vertical lateral */}
              <div
                style={{
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                  transform: 'rotate(180deg)',
                  backgroundColor: GREEN,
                  color: 'white',
                  fontSize: '9px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  padding: '12px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Equipamentos
              </div>
              {/* Dados */}
              <div className="flex-1 flex flex-col">
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, color: '#1e293b' }}>
                    Módulos: {totalModules} un.
                  </p>
                  <p style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                    Fabricante: {firstModule?.manufacturer || 'Fabricante'} &nbsp;·&nbsp; Potência: {firstModule?.power || 550} Wp
                  </p>
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: 'white' }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, color: '#1e293b' }}>
                    Inversor(es): {inverterIds.length} un.
                  </p>
                  <p style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                    Fabricante: {firstInverter?.snapshot?.manufacturer || 'PHB'} &nbsp;·&nbsp; Potência: {firstInverter ? ((firstInverter.snapshot?.nominalPower || 0) / 1000).toFixed(1) : '0'} kW
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de rodapé verde */}
      <div style={{ height: '4px', backgroundColor: GREEN_LIGHT }} />
    </div>
  );
};
