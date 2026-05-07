/**
 * LegacyElements.tsx
 * Implementações dos 6 tipos de elementos que existiam como stubs
 * no template clássico original (kpi-box, chart-generation,
 * chart-financial, payment-table, schedule-timeline, map-static).
 */
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';
import { MapPin } from 'lucide-react';
import { useProposalPageData } from '../useProposalPageData';
import { useSolarStore } from '@/core/state/solarStore';
import { formatBRL } from '@/modules/engineering/utils/formatters';
import type { CanvasElement } from '../types';

// ─── Shared ────────────────────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#020617',
    borderColor: '#1e293b',
    borderRadius: '4px',
    color: '#f8fafc',
    fontSize: '10px',
  },
  cursor: { fill: '#1e293b', opacity: 0.4 },
};

function ShellBox({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {title && (
        <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 4, flexShrink: 0 }}>
          {title}
        </p>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

// ─── KPI Box ──────────────────────────────────────────────────────────────────

export function KpiBoxElement({ element }: { element: CanvasElement }) {
  const { stats, totalPowerKwp, monthlyGenAvg } = useProposalPageData();
  const p  = element.props as Record<string, unknown>;
  const metric    = String(p.metric    ?? 'power');
  const bgColor   = String(p.bgColor   ?? '#f0fdf4');
  const textColor = String(p.textColor ?? '#166534');

  const data: Record<string, { label: string; value: string; unit: string }> = {
    power:      { label: String(p.label ?? 'Potência do Sistema'),  value: totalPowerKwp.toFixed(2),                                   unit: String(p.unit ?? 'kWp')     },
    generation: { label: String(p.label ?? 'Geração Média Mensal'), value: monthlyGenAvg.toLocaleString('pt-BR'),                      unit: String(p.unit ?? 'kWh/mês') },
    savings:    { label: String(p.label ?? 'Economia Anual'),        value: formatBRL(stats.economiaAno),                              unit: String(p.unit ?? '/ano')    },
    coverage:   { label: String(p.label ?? 'Cobertura Solar'),       value: `${Math.round(stats.coverage || 0)}`,                     unit: String(p.unit ?? '%')       },
    bill:       { label: String(p.label ?? 'Nova Fatura Média'),     value: formatBRL(stats.faturaNovaMedia),                         unit: String(p.unit ?? '/mês')    },
  };

  const meta = data[metric] ?? data.power;

  return (
    <div style={{
      width: '100%', height: '100%', backgroundColor: bgColor,
      borderRadius: 8, padding: '12px 16px',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2,
    }}>
      <span style={{ fontSize: 9, fontWeight: 800, color: textColor, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {meta.label}
      </span>
      <span style={{ fontSize: 26, fontWeight: 900, color: textColor, lineHeight: 1.1 }}>
        {meta.value}
      </span>
      <span style={{ fontSize: 10, color: textColor, opacity: 0.55 }}>
        {meta.unit}
      </span>
    </div>
  );
}

// ─── Chart Generation (monthly bar) ───────────────────────────────────────────

export function ChartGenerationElement({ element }: { element: CanvasElement }) {
  const { stats } = useProposalPageData();
  const p     = element.props as Record<string, unknown>;
  const color = String(p.color ?? '#10b981');
  const title = p.title ? String(p.title) : undefined;
  const showLegend = Boolean(p.showLegend ?? false);

  return (
    <ShellBox title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stats.barData} margin={{ top: 2, right: 4, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
          <XAxis dataKey="month" tick={{ fontSize: 7, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 7, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(v: number | undefined) => [`${(v ?? 0).toLocaleString('pt-BR')} kWh`, 'Geração']} />
          {showLegend && <Legend wrapperStyle={{ fontSize: 8 }} />}
          <Bar dataKey="gen" name="Geração (kWh)" fill={color} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ShellBox>
  );
}

// ─── Chart Financial (ROI line) ────────────────────────────────────────────────

export function ChartFinancialElement({ element }: { element: CanvasElement }) {
  const { stats } = useProposalPageData();
  const p         = element.props as Record<string, unknown>;
  const color     = String(p.color ?? '#6366f1');
  const title     = p.title ? String(p.title) : undefined;
  const showLegend = Boolean(p.showLegend ?? false);

  return (
    <ShellBox title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={stats.roiData} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
          <XAxis dataKey="year" tick={{ fontSize: 7, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 7, fill: '#94a3b8' }} axisLine={false} tickLine={false}
            tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(v: number | undefined) => [formatBRL(v ?? 0), 'Acumulado']} />
          {showLegend && <Legend wrapperStyle={{ fontSize: 8 }} />}
          <Line type="monotone" dataKey="cumulative" name="Retorno acumulado" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ShellBox>
  );
}

// ─── Payment Table ─────────────────────────────────────────────────────────────

export function PaymentTableElement({ element }: { element: CanvasElement }) {
  const proposalData = useSolarStore((s) => s.proposalData);
  const p       = element.props as Record<string, unknown>;
  const showTotal = Boolean(p.showTotal ?? true);
  const stages  = proposalData.paymentStages ?? [];
  const total   = stages.reduce((s, st) => s + (st.percentage ?? 0), 0);

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto', fontSize: 10, fontFamily: 'system-ui, sans-serif' }}>
      {stages.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 11 }}>
          Condições de pagamento não definidas
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left',   padding: '6px 8px', fontWeight: 700, color: '#475569', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Etapa</th>
              <th style={{ textAlign: 'center', padding: '6px 8px', fontWeight: 700, color: '#475569', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>%</th>
              <th style={{ textAlign: 'right',  padding: '6px 8px', fontWeight: 700, color: '#475569', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((stage, i) => (
              <tr key={stage.id ?? i} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                <td style={{ padding: '5px 8px', color: '#1e293b', fontWeight: 600 }}>{stage.label}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center', color: '#10b981', fontWeight: 700 }}>{stage.percentage ?? 0}%</td>
                <td style={{ padding: '5px 8px', textAlign: 'right', color: '#64748b', fontSize: 9 }}>{formatBRL(stage.value)}</td>
              </tr>
            ))}
          </tbody>
          {showTotal && (
            <tfoot>
              <tr style={{ backgroundColor: '#f0fdf4', borderTop: '2px solid #10b981' }}>
                <td style={{ padding: '6px 8px', fontWeight: 800, color: '#064e3b', fontSize: 10 }}>TOTAL</td>
                <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800, color: total === 100 ? '#10b981' : '#ef4444', fontSize: 10 }}>{total}%</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      )}
    </div>
  );
}

// ─── Schedule Timeline ─────────────────────────────────────────────────────────

export function ScheduleTimelineElement({ element }: { element: CanvasElement }) {
  const proposalData = useSolarStore((s) => s.proposalData);
  const p       = element.props as Record<string, unknown>;
  const compact = Boolean(p.compact ?? false);
  const stages  = proposalData.executionSchedule ?? [];

  if (stages.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 11 }}>
        Cronograma não definido
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto', padding: '4px 0', display: 'flex', flexDirection: 'column', gap: compact ? 4 : 8 }}>
      {stages.map((stage, i) => (
        <div key={stage.id ?? i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          {/* Step indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              backgroundColor: '#6366f1', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 900, flexShrink: 0,
            }}>
              {i + 1}
            </div>
            {i < stages.length - 1 && (
              <div style={{ width: 1, flex: 1, minHeight: compact ? 8 : 16, backgroundColor: '#e2e8f0', marginTop: 2 }} />
            )}
          </div>
          {/* Content */}
          <div style={{ flex: 1, paddingBottom: compact ? 0 : 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: compact ? 9 : 10, fontWeight: 800, color: '#1e293b' }}>{stage.label}</span>
              {stage.durationText && (
                <span style={{ fontSize: 8, color: '#6366f1', fontWeight: 700, backgroundColor: '#eef2ff', borderRadius: 3, padding: '1px 5px' }}>
                  {stage.durationText}
                </span>
              )}
            </div>
            {stage.sublabel && (
              <span style={{ fontSize: 8, color: '#64748b', display: 'block' }}>{stage.sublabel}</span>
            )}
            {!compact && stage.description && (
              <p style={{ fontSize: 8, color: '#94a3b8', margin: '2px 0 0', lineHeight: 1.4 }}>{stage.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Map Static ────────────────────────────────────────────────────────────────

export function MapStaticElement({ element }: { element: CanvasElement }) {
  const clientData = useSolarStore((s) => s.clientData);
  const p          = element.props as Record<string, unknown>;
  const showMarker = Boolean(p.showMarker ?? true);

  const lat = (clientData as Record<string, unknown>).lat ?? (clientData as Record<string, unknown>).latitude;
  const lng = (clientData as Record<string, unknown>).lng ?? (clientData as Record<string, unknown>).longitude;
  const hasCoords = lat !== undefined && lng !== undefined;

  // If Google Maps Static API key is configured, use it; otherwise show styled placeholder
  const apiKey = (p.googleMapsKey as string) || '';
  const zoom   = Number(p.zoom ?? 17);

  if (apiKey && hasCoords) {
    const src = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=640x480&scale=2&maptype=satellite${showMarker ? `&markers=color:red|${lat},${lng}` : ''}&key=${apiKey}`;
    return <img src={src} alt="Mapa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />;
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 6, color: '#64748b',
    }}>
      <MapPin size={28} color="#6366f1" />
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', margin: 0 }}>Localização do Projeto</p>
        {hasCoords ? (
          <p style={{ fontSize: 9, color: '#94a3b8', margin: '2px 0 0', fontFamily: 'monospace' }}>
            {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
          </p>
        ) : (
          <p style={{ fontSize: 9, color: '#94a3b8', margin: '2px 0 0' }}>Coordenadas não definidas</p>
        )}
      </div>
      {!apiKey && (
        <p style={{ fontSize: 8, color: '#cbd5e1', margin: 0, textAlign: 'center', maxWidth: 120 }}>
          Configure a chave Google Maps Static API nas props para ativar o mapa real
        </p>
      )}
    </div>
  );
}
