import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, BarChart, Bar,
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

/**
 * PÁGINA 2 — DIMENSIONAMENTO TÉCNICO (Standardized)
 * Cabeçalho Broken Grid, corpo branco técnico, métricas e equipamentos.
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
  const dateFormatted = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(new Date()).toUpperCase();

  const avgHsp = stats.totalGen > 0 && totalPowerKwp > 0
    ? (stats.totalGen / 365 / totalPowerKwp).toFixed(2)
    : '0.00';

  // Cores unificadas
  const GREEN = '#2D6A4F';
  const GREEN_LIGHT = '#4CAF50';
  const GREEN_MENTA = '#B7E4C7';
  const GREEN_DARK = '#1a3d2b';
  const PURPLE = '#2D0A4E';

  return (
    <div className="w-full min-h-[1123px] bg-white text-slate-800 flex flex-col font-sans relative overflow-hidden">
      
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

          <div className="mt-6 flex flex-col gap-2 max-w-[420px]">
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'white', lineHeight: '1.4', textShadow: '0 1px 2px rgba(0,0,0,0.2)', opacity: 0.9 }}>
              No momento da contratação é estabelecido um contrato formal de prestação de serviços
              com a NEONORTE, responsável pelo faturamento e emissão de Nota Fiscal de Serviço.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center relative z-20" style={{ paddingRight: '56px' }}>
          <div
            style={{ 
              backgroundColor: 'white', 
              border: '4px solid #111', 
              padding: '44px 40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transform: 'translateY(100px)',
              boxShadow: '0 25px 35px -5px rgba(0, 0, 0, 0.12)'
            }}
          >
            <h2 className="uppercase leading-[0.82]" style={{ fontSize: '58px', fontWeight: 900, color: PURPLE, letterSpacing: '-0.03em' }}>
              DIMENSIO
            </h2>
            <h2 className="uppercase leading-[0.82]" style={{ fontSize: '58px', fontWeight: 900, color: PURPLE, letterSpacing: '-0.03em' }}>
              NAMENTO
            </h2>
          </div>
        </div>
      </div>

      {/* ── CORPO BRANCO TÉCNICO ───────────────────────────────────────── */}
      <div className="flex-1 p-[16px_48px_32px_48px] flex flex-col gap-6 relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <img src="/logos/simbolo-verde.png" alt="" className="w-[600px] h-auto" />
        </div>

        <section className="relative z-10 flex gap-4 items-center">
          <div className="w-0.5 h-6 bg-[#2D6A4F]" />
          <div className="flex flex-col">
            <span style={{ fontSize: '12px', color: PURPLE, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {clientData.clientName || 'Cliente'}
            </span>
            <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Resumo de Capacidade e Performance</span>
          </div>
          
          <div className="flex gap-0 ml-auto border border-slate-200 overflow-hidden rounded-sm shadow-sm">
            <div className="px-5 py-2 flex flex-col items-center" style={{ backgroundColor: GREEN }}>
              <span style={{ fontSize: '7px', fontWeight: 900, color: 'white', opacity: 0.8, textTransform: 'uppercase' }}>Projeto</span>
              <span style={{ fontSize: '14px', fontWeight: 900, color: 'white' }}>{totalPowerKwp.toFixed(2)} kWp</span>
            </div>
            <div className="px-5 py-2 flex flex-col items-center" style={{ backgroundColor: GREEN_LIGHT }}>
              <span style={{ fontSize: '7px', fontWeight: 900, color: 'white', opacity: 0.9, textTransform: 'uppercase' }}>Geração Média</span>
              <span style={{ fontSize: '14px', fontWeight: 900, color: 'white' }}>{Math.round(stats.totalGen / 12).toLocaleString('pt-BR')} kWh</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-8 relative z-10 flex-1">
          {/* Coluna Esquerda: Texto + Gráficos */}
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-3 bg-[#4CAF50]" />
                <h3 style={{ fontSize: '13px', fontWeight: 900, color: PURPLE, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Padrão de Qualidade Neonorte
                </h3>
              </div>
              {proposalData.customText ? (
                <p style={{ fontSize: '10.5px', color: '#334155', lineHeight: '1.6', textAlign: 'justify' }}>
                  {proposalData.customText}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {[
                    'Inversores solares: 7 anos contra defeitos de fabricação.',
                    'Módulos FV: 25 anos na geração de energia (80% de eficiência).',
                    'Engenharia e Consultoria: 6 meses de suporte dedicado.',
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3 items-center p-2 bg-slate-50 border-l-2 border-slate-200">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GREEN_LIGHT }} />
                      <span style={{ fontSize: '10px', color: '#475569', fontWeight: 700 }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'block' }}>Histórico de Consumo Estimado</span>
                <div style={{ height: '110px', width: '100%' }} className="bg-slate-50/50 p-2 rounded-sm border border-slate-100">
                  <AreaChart data={stats.barData} width={340} height={100}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" fontSize={8} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                    <YAxis hide />
                    <Area type="monotone" dataKey="cons" stroke={PURPLE} strokeWidth={2} fill={PURPLE} fillOpacity={0.1} isAnimationActive={false} />
                  </AreaChart>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'block' }}>Geração × Consumo (Mensal)</span>
                <div style={{ height: '110px', width: '100%' }} className="bg-slate-50/50 p-2 rounded-sm border border-slate-100">
                  <BarChart data={stats.barData} width={340} height={100} margin={{left: -20}}>
                    <XAxis dataKey="month" fontSize={8} axisLine={false} tickLine={false} />
                    <YAxis fontSize={8} axisLine={false} tickLine={false} />
                    <Bar dataKey="gen" fill={GREEN_LIGHT} radius={[1,1,0,0]} barSize={8} isAnimationActive={false} />
                    <Bar dataKey="cons" fill={PURPLE} radius={[1,1,0,0]} barSize={8} isAnimationActive={false} />
                  </BarChart>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Foto + Métricas + Equipamentos */}
          <div className="flex flex-col gap-6">
            <div className="relative border-4 border-slate-100 shadow-lg overflow-hidden rounded-sm" style={{ height: '180px' }}>
              {clientData.lat && clientData.lng ? (
                <img
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${clientData.lat},${clientData.lng}&zoom=19&size=600x400&maptype=satellite&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}`}
                  alt="Localização"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center flex-col gap-2">
                  <MapPin size={24} className="text-slate-300" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Vista Aérea Indisponível</span>
                </div>
              )}
              <div className="absolute top-4 left-4 px-3 py-1 bg-purple-900/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-tighter">
                FV{new Date().getFullYear()} — {clientData.clientName?.split(' ')[0] || ''}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 flex flex-col justify-center border-l-4 border-[#4CAF50] bg-slate-50">
                <span style={{ fontSize: '8px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Irradiação Local</span>
                <span style={{ fontSize: '24px', fontWeight: 900, color: PURPLE }}>{avgHsp} <small style={{ fontSize: '10px' }}>Wh/m²</small></span>
              </div>
              <div className="p-4 flex flex-col justify-center border-l-4 border-[#2D6A4F] bg-slate-50">
                <span style={{ fontSize: '8px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Cobertura Média</span>
                <span style={{ fontSize: '24px', fontWeight: 900, color: PURPLE }}>{stats.coverage.toFixed(0)}%</span>
              </div>
            </div>

            {/* Tabela de Equipamentos — Engineering Aesthetic */}
            <div className="border border-slate-200 rounded-sm overflow-hidden shadow-sm">
              <div className="bg-slate-900 px-4 py-2 flex items-center justify-between">
                <span style={{ fontSize: '9px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Especificação de Equipamentos</span>
                <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50] animate-pulse" />
              </div>
              
              <div className="flex flex-col">
                <div className="p-3 border-b border-slate-100 bg-white">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 bg-[#4CAF50]" />
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#1e293b' }}>Módulos Fotovoltaicos ({totalModules} un.)</span>
                  </div>
                  <p style={{ fontSize: '9px', color: '#64748b', marginLeft: '14px' }}>
                    {firstModule?.manufacturer || 'Fabricante'} · {firstModule?.power || 550}Wp · Tecnologia de Alta Eficiência
                  </p>
                </div>
                
                <div className="p-3 bg-slate-50/50">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 bg-[#6A1B9A]" />
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#1e293b' }}>Inversor(es) de String ({inverterIds.length} un.)</span>
                  </div>
                  <p style={{ fontSize: '9px', color: '#64748b', marginLeft: '14px' }}>
                    {firstInverter?.snapshot?.manufacturer || 'PHB'} · {firstInverter ? ((firstInverter.snapshot?.nominalPower || 0) / 1000).toFixed(1) : '0'}kW · Monitoramento Integrado
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: '6px', backgroundColor: GREEN_LIGHT }} />
    </div>
  );
};
