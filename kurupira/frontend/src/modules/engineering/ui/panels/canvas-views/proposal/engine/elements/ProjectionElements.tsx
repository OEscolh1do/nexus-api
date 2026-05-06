/**
 * ProjectionElements.tsx
 * Canvas element renderers that wrap projection-view charts/KPIs/tables.
 * Each component reads data via useProposalPageData() and accepts color
 * overrides from element.props for palette customisation.
 */
import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, ComposedChart, Cell,
} from 'recharts';
import { LossWaterfallChart } from '../../../projection/LossWaterfallChart';
import { AnalyticsTable } from '../../../projection/AnalyticsTable';
import { useProposalPageData } from '../useProposalPageData';
import { formatBRL } from '@/modules/engineering/utils/formatters';
import type { CanvasElement } from '../types';
import { DAYS_IN_MONTH } from '@/modules/engineering/utils/projectionMath';

// ─── Shared helpers ────────────────────────────────────────────────────────────

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

function ChartShell({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {title && (
        <p style={{ fontSize: 10, fontWeight: 600, color: '#64748b', padding: '4px 8px 0', flexShrink: 0 }}>
          {title}
        </p>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

// ─── Geração vs Consumo ────────────────────────────────────────────────────────

interface GenConsProps { element: CanvasElement }

export function ChartGenConsumptionElement({ element }: GenConsProps) {
  const { stats } = useProposalPageData();
  const p = element.props as Record<string, unknown>;

  // We render the existing chart but can't easily pass color overrides into it,
  // so we render a custom version that respects our palette props.
  const colorGen  = String(p.colorGen  ?? '#0ea5e9');
  const colorCons = String(p.colorCons ?? '#f59e0b');
  const showLegend = p.showLegend !== false;
  const title = p.title ? String(p.title) : undefined;

  return (
    <ChartShell title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stats.barData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
          <XAxis dataKey="month" tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP_STYLE} />
          {showLegend && <Legend wrapperStyle={{ fontSize: 9, paddingTop: 2 }} />}
          <Bar dataKey="gen"  name="Geração (kWh)"  fill={colorGen}  radius={[2,2,0,0]} />
          <Bar dataKey="cons" name="Consumo (kWh)"  fill={colorCons} radius={[2,2,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ─── ROI Acumulado ─────────────────────────────────────────────────────────────

interface ROIProps { element: CanvasElement }

export function ChartROIElement({ element }: ROIProps) {
  const { stats } = useProposalPageData();
  const p = element.props as Record<string, unknown>;
  const colorArea = String(p.colorArea ?? '#10b981');
  const title = p.title ? String(p.title) : undefined;

  return (
    <ChartShell title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={stats.roiData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-roi-${element.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={colorArea} stopOpacity={0.3} />
              <stop offset="95%" stopColor={colorArea} stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
          <XAxis dataKey="year" tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false}
            tickFormatter={(v: number) => `R$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
          />
          <Tooltip {...TOOLTIP_STYLE}
            formatter={(v: number | undefined) => [`R$ ${(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, '']}
          />
          <Area
            type="monotone" dataKey="cumulative" name="Retorno acumulado"
            stroke={colorArea} strokeWidth={2}
            fill={`url(#grad-roi-${element.id})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ─── Balanço Financeiro (Waterfall) ───────────────────────────────────────────

interface FinBalProps { element: CanvasElement }

const COLOR_MAP_DEFAULT: Record<string, string> = {
  base:      '#64748b',
  addition:  '#f59e0b',
  reduction: '#10b981',
  result:    '#6366f1',
};

export function ChartFinancialBalanceElement({ element }: FinBalProps) {
  const { stats } = useProposalPageData();
  const p = element.props as Record<string, unknown>;
  const title = p.title ? String(p.title) : undefined;

  const colorMap: Record<string, string> = {
    base:      String(p.colorBase      ?? COLOR_MAP_DEFAULT.base),
    addition:  String(p.colorAddition  ?? COLOR_MAP_DEFAULT.addition),
    reduction: String(p.colorReduction ?? COLOR_MAP_DEFAULT.reduction),
    result:    String(p.colorResult    ?? COLOR_MAP_DEFAULT.result),
  };

  return (
    <ChartShell title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stats.waterfallData} margin={{ top: 4, right: 8, left: -10, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 7, fill: '#94a3b8' }} axisLine={false} tickLine={false}
            angle={-30} textAnchor="end" interval={0}
          />
          <YAxis tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false}
            tickFormatter={(v: number) => `R$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toFixed(0)}`}
          />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(v: number | undefined, _: string | undefined, props: { payload?: { type?: string } }) => [
              formatBRL(v ?? 0),
              props?.payload?.type ?? '',
            ]}
          />
          <Bar dataKey="display" radius={[3, 3, 0, 0]}>
            {stats.waterfallData.map((entry, i) => (
              <Cell key={i} fill={colorMap[entry.type] ?? '#94a3b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ─── Banco de Créditos ─────────────────────────────────────────────────────────

interface CreditBankProps { element: CanvasElement }

export function ChartCreditBankElement({ element }: CreditBankProps) {
  const { stats } = useProposalPageData();
  const p = element.props as Record<string, unknown>;
  const colorDeposit  = String(p.colorDeposit  ?? '#22c55e');
  const colorWithdraw = String(p.colorWithdraw ?? '#f87171');
  const colorBalance  = String(p.colorBalance  ?? '#0ea5e9');
  const title = p.title ? String(p.title) : undefined;

  return (
    <ChartShell title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={stats.bankData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
          <XAxis dataKey="month" tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Bar dataKey="deposito" name="Depósito (kWh)" fill={colorDeposit} radius={[2,2,0,0]} />
          <Bar dataKey="saque"    name="Saque (kWh)"    fill={colorWithdraw} radius={[2,2,0,0]} />
          <Area
            type="monotone" dataKey="saldo" name="Saldo (kWh)"
            stroke={colorBalance} fill={colorBalance} fillOpacity={0.1} strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ─── Geração Diária Estimada ───────────────────────────────────────────────────

interface DailyProps { element: CanvasElement }

export function ChartDailyElement({ element }: DailyProps) {
  const { stats } = useProposalPageData();
  const p = element.props as Record<string, unknown>;
  const colorArea = String(p.colorArea ?? '#6366f1');
  const title = p.title ? String(p.title) : undefined;

  // Build daily profile for month with average HSP-based generation
  const avgBarEntry = stats.barData[0]; // representative: Jan
  const hoursInDay = DAYS_IN_MONTH[0];
  const avgGenPerDay = avgBarEntry ? avgBarEntry.gen / hoursInDay : 0;

  const dailyData = useMemo(() => {
    // Synthetic hourly profile based on bell curve (solar peak around noon)
    return Array.from({ length: 24 }, (_, hour) => {
      const sunriseHour = 6, sunsetHour = 18;
      let factor = 0;
      if (hour >= sunriseHour && hour <= sunsetHour) {
        const t = (hour - sunriseHour) / (sunsetHour - sunriseHour);
        factor = Math.sin(Math.PI * t);
      }
      return { hour: `${String(hour).padStart(2,'0')}h`, gen: +(avgGenPerDay * factor / 6).toFixed(2) };
    });
  }, [avgGenPerDay]);

  return (
    <ChartShell title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dailyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-daily-${element.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={colorArea} stopOpacity={0.4} />
              <stop offset="95%" stopColor={colorArea} stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
          <XAxis dataKey="hour" tick={{ fontSize: 7, fill: '#94a3b8' }} axisLine={false} tickLine={false}
            interval={3}
          />
          <YAxis tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP_STYLE}
            formatter={(v: number | undefined) => [`${v ?? 0} kWh`, 'Geração']}
          />
          <Area
            type="monotone" dataKey="gen" name="Geração (kWh)"
            stroke={colorArea} strokeWidth={2} fill={`url(#grad-daily-${element.id})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ─── Análise de Perdas ─────────────────────────────────────────────────────────

interface LossProps { element: CanvasElement }

export function ChartLossWaterfallElement({ element }: LossProps) {
  const p = element.props as Record<string, unknown>;
  const title = p.title ? String(p.title) : undefined;

  return (
    <ChartShell title={title}>
      <LossWaterfallChart />
    </ChartShell>
  );
}

// ─── KPI de Projeção ───────────────────────────────────────────────────────────

type KpiMetric =
  | 'totalGen' | 'totalCons' | 'coverage' | 'economiaAno'
  | 'totalPowerKwp' | 'monthlyGenAvg';

const KPI_CONFIG: Record<KpiMetric, { label: string; unit: string; fmt: (v: number) => string }> = {
  totalGen:      { label: 'Geração Anual',   unit: 'kWh/ano', fmt: (v) => v.toLocaleString('pt-BR') },
  totalCons:     { label: 'Consumo Anual',   unit: 'kWh/ano', fmt: (v) => v.toLocaleString('pt-BR') },
  coverage:      { label: 'Cobertura Solar', unit: '%',       fmt: (v) => `${v.toFixed(1)}%` },
  economiaAno:   { label: 'Economia Anual',  unit: 'R$/ano',  fmt: (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
  totalPowerKwp: { label: 'Potência Total',  unit: 'kWp',     fmt: (v) => `${v.toFixed(2)} kWp` },
  monthlyGenAvg: { label: 'Média Mensal',    unit: 'kWh/mês', fmt: (v) => `${v.toLocaleString('pt-BR')} kWh` },
};

interface KpiProjectionProps { element: CanvasElement }

export function KpiProjectionElement({ element }: KpiProjectionProps) {
  const { stats, totalPowerKwp, monthlyGenAvg } = useProposalPageData();
  const p = element.props as Record<string, unknown>;
  const metric = (p.metric as KpiMetric) ?? 'totalGen';
  const bgColor    = String(p.bgColor    ?? '#f0fdf4');
  const textColor  = String(p.textColor  ?? '#166534');
  const accentColor = String(p.accentColor ?? '#10b981');

  const dataMap: Record<KpiMetric, number> = {
    totalGen:      stats.totalGen,
    totalCons:     stats.totalCons,
    coverage:      stats.coverage,
    economiaAno:   stats.economiaAno,
    totalPowerKwp,
    monthlyGenAvg,
  };

  const config = KPI_CONFIG[metric] ?? KPI_CONFIG.totalGen;
  const value  = dataMap[metric] ?? 0;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: bgColor,
      borderRadius: 8,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '8px 12px',
      overflow: 'hidden',
      borderLeft: `3px solid ${accentColor}`,
    }}>
      <span style={{ fontSize: 9, fontWeight: 600, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        {config.label}
      </span>
      <span style={{ fontSize: 20, fontWeight: 700, color: textColor, lineHeight: 1.1 }}>
        {config.fmt(value)}
      </span>
      <span style={{ fontSize: 8, color: textColor, opacity: 0.6, marginTop: 2 }}>
        {config.unit}
      </span>
    </div>
  );
}

// ─── Tabela Analítica ──────────────────────────────────────────────────────────

interface TableAnalyticsProps { element: CanvasElement }

export function TableAnalyticsElement({ element }: TableAnalyticsProps) {
  const { stats, clientData } = useProposalPageData();
  const p = element.props as Record<string, unknown>;
  const title = p.title ? String(p.title) : undefined;

  return (
    <ChartShell title={title}>
      <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
        <AnalyticsTable
          data={stats.barData}
          totalGen={stats.totalGen}
          totalCons={stats.totalCons}
          economiaAno={stats.economiaAno}
          tariffRate={clientData.tariffRate || 0.92}
        />
      </div>
    </ChartShell>
  );
}
