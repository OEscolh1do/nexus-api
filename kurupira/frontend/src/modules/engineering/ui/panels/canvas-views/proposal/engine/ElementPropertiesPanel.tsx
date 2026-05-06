import React from 'react';
import { Lock, Unlock, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import type { CanvasElement } from './types';
import { PLACEHOLDER_FIELDS, DEFAULT_PLACEHOLDER_FIELD } from './elements/PlaceholderElement';
import { cn } from '@/lib/utils';

interface Props {
  element: CanvasElement;
  onUpdate: (updates: Partial<CanvasElement>) => void;
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-[10px] text-slate-400 w-16 shrink-0">{label}</span>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, min }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <input
      type="number"
      value={Math.round(value)}
      min={min}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-blue-400"
    />
  );
}

function TextPropRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <FieldRow label={label}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-blue-400"
      />
    </FieldRow>
  );
}

function ColorPropRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <FieldRow label={label}>
      <div className="flex items-center gap-1.5 flex-1">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 rounded cursor-pointer border-0 p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-blue-400"
        />
      </div>
    </FieldRow>
  );
}

// Shared text style controls — used by TextElementProps and PlaceholderProps.
interface TextStyleControlsProps {
  p: Record<string, unknown>;
  update: (key: string, val: unknown) => void;
  defaultFontSize?: number;
  showItalic?: boolean;
}

function TextStyleControls({ p, update, defaultFontSize = 16, showItalic = false }: TextStyleControlsProps) {
  return (
    <>
      <FieldRow label="Tamanho">
        <NumInput value={Number(p.fontSize ?? defaultFontSize)} onChange={(v) => update('fontSize', v)} min={8} />
      </FieldRow>
      <FieldRow label="Peso">
        <select
          value={String(p.fontWeight ?? 400)}
          onChange={(e) => update('fontWeight', Number(e.target.value))}
          className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 bg-white"
        >
          {[300, 400, 500, 600, 700, 800, 900].map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </FieldRow>
      <FieldRow label="Alinhamento">
        <select
          value={String(p.textAlign ?? 'left')}
          onChange={(e) => update('textAlign', e.target.value)}
          className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 bg-white"
        >
          <option value="left">Esquerda</option>
          <option value="center">Centro</option>
          <option value="right">Direita</option>
        </select>
      </FieldRow>
      {showItalic && (
        <FieldRow label="Itálico">
          <input
            type="checkbox"
            checked={Boolean(p.italic ?? false)}
            onChange={(e) => update('italic', e.target.checked)}
            className="cursor-pointer"
          />
          <span className="text-xs text-slate-500 ml-1">Ativado</span>
        </FieldRow>
      )}
      <ColorPropRow label="Cor" value={String(p.color ?? '#1a1a1a')} onChange={(v) => update('color', v)} />
    </>
  );
}

function TextElementProps({ element, onUpdate }: Props) {
  const p = element.props as Record<string, unknown>;
  const update = (key: string, val: unknown) => onUpdate({ props: { ...p, [key]: val } });

  return (
    <>
      <FieldRow label="Conteúdo">
        <textarea
          value={String(p.content ?? '')}
          onChange={(e) => update('content', e.target.value)}
          rows={3}
          className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-blue-400 resize-none"
        />
      </FieldRow>
      <TextStyleControls p={p} update={update} defaultFontSize={16} />
    </>
  );
}

function WatermarkProps({ element, onUpdate }: Props) {
  const p = element.props as Record<string, unknown>;
  const update = (key: string, val: unknown) => onUpdate({ props: { ...p, [key]: val } });

  return (
    <>
      <TextPropRow label="Texto" value={String(p.text ?? 'CONFIDENCIAL')} onChange={(v) => update('text', v)} />
      <FieldRow label="Opacidade">
        <input type="range" min={0.01} max={0.5} step={0.01} value={Number(p.opacity ?? 0.08)}
          onChange={(e) => update('opacity', Number(e.target.value))}
          className="flex-1" />
        <span className="text-xs text-slate-500 w-8 text-right">{Math.round(Number(p.opacity ?? 0.08) * 100)}%</span>
      </FieldRow>
      <FieldRow label="Ângulo">
        <NumInput value={Number(p.angle ?? -45)} onChange={(v) => update('angle', v)} />
      </FieldRow>
      <FieldRow label="Tamanho">
        <NumInput value={Number(p.fontSize ?? 72)} onChange={(v) => update('fontSize', v)} min={12} />
      </FieldRow>
      <ColorPropRow label="Cor" value={String(p.color ?? '#000000')} onChange={(v) => update('color', v)} />
    </>
  );
}

function DividerProps({ element, onUpdate }: Props) {
  const p = element.props as Record<string, unknown>;
  const update = (key: string, val: unknown) => onUpdate({ props: { ...p, [key]: val } });

  return (
    <>
      <ColorPropRow label="Cor" value={String(p.color ?? '#e2e8f0')} onChange={(v) => update('color', v)} />
      <FieldRow label="Espessura">
        <NumInput value={Number(p.thickness ?? 1)} onChange={(v) => update('thickness', v)} min={1} />
      </FieldRow>
    </>
  );
}

// ─── Config-driven chart props ────────────────────────────────────────────────
// One component handles all chart types. Each type supplies a config array
// describing which color keys to expose and their defaults.

interface ColorField { key: string; label: string; default: string }

interface ChartPropsConfig {
  colors: ColorField[];
  showLegendToggle?: boolean;
}

const CHART_PROPS_CONFIG: Partial<Record<string, ChartPropsConfig>> = {
  'chart-gen-consumption': {
    colors: [
      { key: 'colorGen',  label: 'Geração',  default: '#0ea5e9' },
      { key: 'colorCons', label: 'Consumo',  default: '#f59e0b' },
    ],
    showLegendToggle: true,
  },
  'chart-roi': {
    colors: [{ key: 'colorArea', label: 'Área', default: '#10b981' }],
  },
  'chart-financial-balance': {
    colors: [
      { key: 'colorBase',      label: 'Base',      default: '#64748b' },
      { key: 'colorAddition',  label: 'Acréscimo', default: '#f59e0b' },
      { key: 'colorReduction', label: 'Redução',   default: '#10b981' },
      { key: 'colorResult',    label: 'Resultado', default: '#6366f1' },
    ],
  },
  'chart-credit-bank': {
    colors: [
      { key: 'colorDeposit',  label: 'Depósito', default: '#22c55e' },
      { key: 'colorWithdraw', label: 'Saque',    default: '#f87171' },
      { key: 'colorBalance',  label: 'Saldo',    default: '#0ea5e9' },
    ],
  },
  'chart-daily': {
    colors: [{ key: 'colorArea', label: 'Área', default: '#6366f1' }],
  },
};

function ChartElementProps({ element, onUpdate }: Props) {
  const p = element.props as Record<string, unknown>;
  const update = (key: string, val: unknown) => onUpdate({ props: { ...p, [key]: val } });
  const config = CHART_PROPS_CONFIG[element.type];

  return (
    <>
      <TextPropRow label="Título" value={String(p.title ?? '')} onChange={(v) => update('title', v)} />
      {config?.colors.map(({ key, label, default: def }) => (
        <ColorPropRow key={key} label={label} value={String(p[key] ?? def)} onChange={(v) => update(key, v)} />
      ))}
      {config?.showLegendToggle && (
        <FieldRow label="Legenda">
          <input type="checkbox" checked={p.showLegend !== false}
            onChange={(e) => update('showLegend', e.target.checked)} className="cursor-pointer" />
          <span className="text-xs text-slate-500 ml-1">Exibir</span>
        </FieldRow>
      )}
    </>
  );
}

// ── KPI Projeção ─────────────────────────────────────────────────────────────

const KPI_METRICS = [
  { value: 'totalGen',      label: 'Geração Anual'   },
  { value: 'totalCons',     label: 'Consumo Anual'   },
  { value: 'coverage',      label: 'Cobertura Solar' },
  { value: 'economiaAno',   label: 'Economia Anual'  },
  { value: 'totalPowerKwp', label: 'Potência Total'  },
  { value: 'monthlyGenAvg', label: 'Média Mensal'    },
];

function KpiProjectionProps({ element, onUpdate }: Props) {
  const p = element.props as Record<string, unknown>;
  const update = (key: string, val: unknown) => onUpdate({ props: { ...p, [key]: val } });
  return (
    <>
      <FieldRow label="Métrica">
        <select
          value={String(p.metric ?? 'totalGen')}
          onChange={(e) => update('metric', e.target.value)}
          className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 bg-white"
        >
          {KPI_METRICS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </FieldRow>
      <ColorPropRow label="Fundo"    value={String(p.bgColor     ?? '#f0fdf4')} onChange={(v) => update('bgColor', v)}     />
      <ColorPropRow label="Texto"    value={String(p.textColor   ?? '#166534')} onChange={(v) => update('textColor', v)}   />
      <ColorPropRow label="Destaque" value={String(p.accentColor ?? '#10b981')} onChange={(v) => update('accentColor', v)} />
    </>
  );
}

// ── Placeholder ──────────────────────────────────────────────────────────────

const PLACEHOLDER_GROUPS = PLACEHOLDER_FIELDS.reduce<Record<string, typeof PLACEHOLDER_FIELDS>>(
  (acc, f) => { (acc[f.group] ??= []).push(f); return acc; },
  {},
);

function PlaceholderProps({ element, onUpdate }: Props) {
  const p = element.props as Record<string, unknown>;
  const update = (key: string, val: unknown) => onUpdate({ props: { ...p, [key]: val } });
  const currentField = String(p.field ?? DEFAULT_PLACEHOLDER_FIELD);
  const fieldDef = PLACEHOLDER_FIELDS.find((f) => f.field === currentField);

  return (
    <>
      <FieldRow label="Campo">
        <select
          value={currentField}
          onChange={(e) => update('field', e.target.value)}
          className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-blue-400"
        >
          {Object.entries(PLACEHOLDER_GROUPS).map(([group, fields]) => (
            <optgroup key={group} label={group}>
              {fields.map((f) => (
                <option key={f.field} value={f.field}>{f.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </FieldRow>

      {fieldDef && (
        <div className="text-[9px] text-indigo-500 bg-indigo-50 border border-indigo-100 rounded px-2 py-1 mb-1 leading-relaxed">
          <span className="font-semibold">Ex:</span> {fieldDef.example}
        </div>
      )}

      <TextPropRow label="Prefixo" value={String(p.prefix ?? '')} onChange={(v) => update('prefix', v)} />
      <TextPropRow label="Sufixo"  value={String(p.suffix  ?? '')} onChange={(v) => update('suffix',  v)} />

      <div className="border-t border-slate-100 pt-2 mt-1">
        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Estilo</p>
        <TextStyleControls p={p} update={update} defaultFontSize={14} showItalic />
      </div>
    </>
  );
}

export function ElementPropertiesPanel({ element, onUpdate }: Props) {
  const isPageBlock = element.type.startsWith('page-');

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white border-r border-slate-200">
      <div className="px-4 py-3 border-b border-slate-200 shrink-0 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Propriedades</p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdate({ visible: !element.visible })}
            className={cn('p-1 rounded hover:bg-slate-100', !element.visible && 'text-slate-300')}
            title={element.visible ? 'Ocultar' : 'Mostrar'}
          >
            {element.visible ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
          {!isPageBlock && (
            <button
              onClick={() => onUpdate({ locked: !element.locked })}
              className="p-1 rounded hover:bg-slate-100"
              title={element.locked ? 'Desbloquear' : 'Bloquear'}
            >
              {element.locked ? <Lock size={13} /> : <Unlock size={13} />}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {/* Position & size */}
        {!isPageBlock && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Posição e Tamanho</p>
            <div className="grid grid-cols-2 gap-x-2">
              <FieldRow label="X">
                <NumInput value={element.x} onChange={(v) => onUpdate({ x: v })} min={0} />
              </FieldRow>
              <FieldRow label="Y">
                <NumInput value={element.y} onChange={(v) => onUpdate({ y: v })} min={0} />
              </FieldRow>
              <FieldRow label="Largura">
                <NumInput value={element.width} onChange={(v) => onUpdate({ width: v })} min={10} />
              </FieldRow>
              <FieldRow label="Altura">
                <NumInput value={element.height} onChange={(v) => onUpdate({ height: v })} min={10} />
              </FieldRow>
            </div>
            <FieldRow label="Z-index">
              <div className="flex items-center gap-1 flex-1">
                <NumInput value={element.zIndex} onChange={(v) => onUpdate({ zIndex: v })} min={0} />
                <button onClick={() => onUpdate({ zIndex: element.zIndex + 1 })} className="p-1 border border-slate-200 rounded hover:bg-slate-50">
                  <ChevronUp size={12} />
                </button>
                <button onClick={() => onUpdate({ zIndex: Math.max(0, element.zIndex - 1) })} className="p-1 border border-slate-200 rounded hover:bg-slate-50">
                  <ChevronDown size={12} />
                </button>
              </div>
            </FieldRow>
          </div>
        )}

        {/* Element-specific props */}
        {!isPageBlock && (
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Conteúdo</p>
            {element.type === 'text'        && <TextElementProps element={element} onUpdate={onUpdate} />}
            {element.type === 'watermark'   && <WatermarkProps element={element} onUpdate={onUpdate} />}
            {element.type === 'divider'     && <DividerProps element={element} onUpdate={onUpdate} />}
            {element.type === 'kpi-projection' && <KpiProjectionProps element={element} onUpdate={onUpdate} />}
            {element.type === 'placeholder' && <PlaceholderProps element={element} onUpdate={onUpdate} />}
            {element.type in CHART_PROPS_CONFIG && <ChartElementProps element={element} onUpdate={onUpdate} />}
            {(element.type === 'chart-loss-waterfall' || element.type === 'table-analytics') && (
              <ChartElementProps element={element} onUpdate={onUpdate} />
            )}
          </div>
        )}

        {isPageBlock && (
          <div className="text-xs text-slate-400 leading-relaxed">
            Este bloco representa uma página completa do template clássico. O conteúdo é editado pelo painel lateral de dados da proposta.
          </div>
        )}
      </div>
    </div>
  );
}
