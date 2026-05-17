import React from 'react';
import { Lock, Unlock, Eye, EyeOff, ChevronUp, ChevronDown, Edit3, FileText, Link2, Unlink } from 'lucide-react';
import { ICON_CATALOG } from './elements/IconElement';
import type { CanvasElement } from './types';
import { PLACEHOLDER_FIELDS, DEFAULT_PLACEHOLDER_FIELD } from './elements/PlaceholderElement';
import { cn } from '@/lib/utils';

interface Props {
  element: CanvasElement;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onDecompose?: () => void;
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-[10px] text-slate-400 w-16 shrink-0">{label}</span>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, min, 'aria-label': ariaLabel }: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  'aria-label'?: string;
}) {
  const [draft, setDraft] = React.useState(() => String(Math.round(value)));
  const isFocusedRef = React.useRef(false);

  // Sync from parent whenever the value changes externally (e.g. canvas drag update),
  // but only when the input is not actively being edited to avoid cursor-position jumps.
  React.useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(String(Math.round(value)));
    }
  }, [value]);

  const commit = () => {
    const n = Number(draft);
    if (!Number.isFinite(n)) {
      setDraft(String(Math.round(value))); // revert invalid input
      return;
    }
    const clamped = min !== undefined ? Math.max(min, n) : n;
    onChange(Math.round(clamped));
  };

  return (
    <input
      type="number"
      value={draft}
      min={min}
      aria-label={ariaLabel}
      onFocus={() => { isFocusedRef.current = true; }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { isFocusedRef.current = false; commit(); }}
      onKeyDown={(e) => { if (e.key === 'Enter') { commit(); (e.target as HTMLInputElement).blur(); } }}
      className="w-full text-xs border border-slate-800 rounded px-2 py-1 bg-slate-900 text-slate-200 focus:outline-none focus:border-indigo-500/50"
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
        className="flex-1 text-xs border border-slate-800 rounded px-2 py-1 bg-slate-900 text-slate-200 focus:outline-none focus:border-indigo-500/50"
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
          aria-label={label}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0 p-0"
        />
        <input
          type="text"
          value={value}
          aria-label={`${label} (hex)`}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-xs border border-slate-800 rounded px-2 py-1 bg-slate-900 text-slate-200 focus:outline-none focus:border-indigo-500/50"
        />
      </div>
    </FieldRow>
  );
}

function TextAreaPropRow({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <FieldRow label={label}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="flex-1 text-xs border border-slate-800 rounded px-2 py-1 bg-slate-900 text-slate-200 focus:outline-none focus:border-indigo-500/50 resize-none"
      />
    </FieldRow>
  );
}

function CheckboxRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <FieldRow label={label}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="cursor-pointer"
      />
    </FieldRow>
  );
}

// Shared text style controls — used by TextElementProps and PlaceholderProps.
interface TextStyleControlsProps {
  p: Record<string, unknown>;
  update: (key: string, val: unknown) => void;
  defaultFontSize?: number;
}

const TOGGLE_BTN_BASE: React.CSSProperties = {
  fontSize: 11,
  padding: '3px 7px',
  border: '1px solid #334155',
  borderRadius: 4,
  cursor: 'pointer',
  minWidth: 28,
  minHeight: 24,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

function TextStyleControls({ p, update, defaultFontSize = 16 }: TextStyleControlsProps) {
  return (
    <>
      <FieldRow label="Fonte">
        <select
          value={String(p.fontFamily ?? 'system')}
          onChange={(e) => update('fontFamily', e.target.value)}
          className="flex-1 text-xs border border-slate-800 rounded px-2 py-1 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500/50"
        >
          <option value="system">Sistema</option>
          <option value="inter">Inter</option>
          <option value="montserrat">Montserrat</option>
          <option value="roboto">Roboto</option>
          <option value="poppins">Poppins</option>
          <option value="lato">Lato</option>
        </select>
      </FieldRow>
      <FieldRow label="Tamanho">
        <NumInput value={Number(p.fontSize ?? defaultFontSize)} onChange={(v) => update('fontSize', v)} min={8} />
      </FieldRow>
      <FieldRow label="Peso">
        <select
          value={String(p.fontWeight ?? 400)}
          onChange={(e) => update('fontWeight', Number(e.target.value))}
          className="flex-1 text-xs border border-slate-800 rounded px-2 py-1 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500/50"
        >
          {[300, 400, 500, 600, 700, 800, 900].map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </FieldRow>
      <FieldRow label="Estilo">
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => update('italic', !Boolean(p.italic ?? false))}
            style={{
              ...TOGGLE_BTN_BASE,
              background: Boolean(p.italic) ? '#4f46e5' : '#1e293b',
              color: Boolean(p.italic) ? '#fff' : '#94a3b8',
              fontStyle: 'italic',
              fontWeight: 600,
            }}
            aria-label="Itálico"
            aria-pressed={Boolean(p.italic)}
            title="Itálico"
          >
            I
          </button>
          <button
            onClick={() => update('underline', !Boolean(p.underline ?? false))}
            style={{
              ...TOGGLE_BTN_BASE,
              background: Boolean(p.underline) ? '#4f46e5' : '#1e293b',
              color: Boolean(p.underline) ? '#fff' : '#94a3b8',
              textDecoration: 'underline',
              fontWeight: 600,
            }}
            aria-label="Sublinhado"
            aria-pressed={Boolean(p.underline)}
            title="Sublinhado"
          >
            U
          </button>
          <button
            onClick={() => update('strikethrough', !Boolean(p.strikethrough ?? false))}
            style={{
              ...TOGGLE_BTN_BASE,
              background: Boolean(p.strikethrough) ? '#4f46e5' : '#1e293b',
              color: Boolean(p.strikethrough) ? '#fff' : '#94a3b8',
              textDecoration: 'line-through',
              fontWeight: 600,
            }}
            aria-label="Tachado"
            aria-pressed={Boolean(p.strikethrough)}
            title="Tachado"
          >
            S
          </button>
        </div>
      </FieldRow>
      <FieldRow label="Alinhamento">
        <select
          value={String(p.textAlign ?? 'left')}
          onChange={(e) => update('textAlign', e.target.value)}
          className="flex-1 text-xs border border-slate-800 rounded px-2 py-1 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500/50"
        >
          <option value="left">Esquerda</option>
          <option value="center">Centro</option>
          <option value="right">Direita</option>
        </select>
      </FieldRow>
      <FieldRow label="Maiúsculas">
        <select
          value={String(p.textTransform ?? 'none')}
          onChange={(e) => update('textTransform', e.target.value)}
          className="flex-1 text-xs border border-slate-800 rounded px-2 py-1 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500/50"
        >
          <option value="none">Normal</option>
          <option value="uppercase">MAIÚSCULAS</option>
          <option value="lowercase">minúsculas</option>
          <option value="capitalize">Capitalizado</option>
        </select>
      </FieldRow>
      <TextPropRow label="Espaç. letras" value={String(p.letterSpacing ?? '')} onChange={(v) => update('letterSpacing', v)} />
      <TextPropRow label="Alt. linha" value={String(p.lineHeight ?? '')} onChange={(v) => update('lineHeight', v)} />
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
          className="flex-1 text-xs border border-slate-800 rounded px-2 py-1 bg-slate-900 text-slate-200 focus:outline-none focus:border-indigo-500/50 resize-none"
        />
      </FieldRow>
      <TextStyleControls p={p} update={update} defaultFontSize={16} />
    </>
  );
}

function BoxElementProps({ element, onUpdate }: Props) {
  const p = element.props as Record<string, unknown>;
  const update = (key: string, val: unknown) => onUpdate({ props: { ...p, [key]: val } });

  return (
    <>
      <ColorPropRow label="Fundo"        value={String(p.bgColor     ?? 'transparent')} onChange={(v) => update('bgColor', v)} />
      <TextPropRow  label="Gradiente"    value={String(p.gradient    ?? '')}            onChange={(v) => update('gradient', v)}
      />
      <TextPropRow  label="Borda"        value={String(p.border      ?? '')}            onChange={(v) => update('border', v)} />
      <TextPropRow  label="Borda topo"   value={String(p.borderTop   ?? '')}            onChange={(v) => update('borderTop', v)} />
      <TextPropRow  label="Borda dir."   value={String(p.borderRight  ?? '')}           onChange={(v) => update('borderRight', v)} />
      <TextPropRow  label="Borda baixo"  value={String(p.borderBottom ?? '')}           onChange={(v) => update('borderBottom', v)} />
      <TextPropRow  label="Borda esq."   value={String(p.borderLeft   ?? '')}           onChange={(v) => update('borderLeft', v)} />
      {/* borderRadius aceita px (número) ou string CSS direta (ex: "4px 0 0 4px", "50%") */}
      <TextPropRow  label="Arred."       value={String(p.borderRadius ?? '0')}          onChange={(v) => update('borderRadius', v)} />
      <FieldRow label="Overflow">
        <select
          value={String(p.overflow ?? 'visible')}
          onChange={(e) => update('overflow', e.target.value)}
          className="flex-1 text-xs border border-slate-800 rounded px-2 py-1 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500/50"
        >
          <option value="visible">Visível</option>
          <option value="hidden">Oculto (clip)</option>
        </select>
      </FieldRow>
      <FieldRow label="Opacidade">
        <input type="range" min={0} max={1} step={0.05} value={Number(p.opacity ?? 1)}
          onChange={(e) => update('opacity', Number(e.target.value))} className="flex-1" />
        <span className="text-xs text-slate-500 w-8 text-right">{Math.round(Number(p.opacity ?? 1) * 100)}%</span>
      </FieldRow>
      <FieldRow label="Sombra">
        <input type="checkbox" checked={Boolean(p.shadow ?? false)}
          onChange={(e) => update('shadow', e.target.checked)} className="cursor-pointer" />
      </FieldRow>
    </>
  );
}

function IconElementProps({ element, onUpdate }: Props) {
  const p = element.props as Record<string, unknown>;
  const update = (key: string, val: unknown) => onUpdate({ props: { ...p, [key]: val } });

  return (
    <>
      <FieldRow label="Ícone">
        <select
          value={String(p.name ?? 'Zap')}
          onChange={(e) => update('name', e.target.value)}
          className="flex-1 text-xs border border-slate-800 rounded px-2 py-1 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500/50"
        >
          {Object.keys(ICON_CATALOG).map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </FieldRow>
      <FieldRow label="Tamanho">
        <NumInput value={Number(p.size ?? 24)} onChange={(v) => update('size', v)} min={8} />
      </FieldRow>
      <ColorPropRow label="Cor"   value={String(p.color   ?? '#10b981')} onChange={(v) => update('color', v)} />
      <ColorPropRow label="Fundo" value={String(p.bgColor ?? '')}        onChange={(v) => update('bgColor', v)} />
      <FieldRow label="Arred.">
        <NumInput value={Number(p.bgRadius ?? 4)} onChange={(v) => update('bgRadius', v)} min={0} />
      </FieldRow>
    </>
  );
}

function LogoElementProps({ element, onUpdate }: Props) {
  const p = element.props as Record<string, unknown>;
  const update = (key: string, val: unknown) => onUpdate({ props: { ...p, [key]: val } });

  return (
    <>
      <FieldRow label="Variante">
        <select
          value={String(p.variant ?? 'verde')}
          onChange={(e) => update('variant', e.target.value)}
          className="flex-1 text-xs border border-slate-800 rounded px-2 py-1 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500/50"
        >
          <option value="verde">Logo verde</option>
          <option value="branco">Logo branco</option>
          <option value="simbolo">Símbolo branco</option>
          <option value="simbolo-circular">Símbolo circular</option>
        </select>
      </FieldRow>
      {String(p.variant) === 'simbolo-circular' && (
        <ColorPropRow label="Fundo circular" value={String(p.bgColor ?? '#4CAF50')} onChange={(v) => update('bgColor', v)} />
      )}
      <FieldRow label="Ajuste">
        <select
          value={String(p.objectFit ?? 'contain')}
          onChange={(e) => update('objectFit', e.target.value)}
          className="flex-1 text-xs border border-slate-800 rounded px-2 py-1 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500/50"
        >
          <option value="contain">Conter</option>
          <option value="cover">Preencher</option>
          <option value="fill">Esticar</option>
        </select>
      </FieldRow>
    </>
  );
}

function ImageElementProps({ element, onUpdate }: Props) {
  const p = element.props as Record<string, unknown>;
  const update = (key: string, val: unknown) => onUpdate({ props: { ...p, [key]: val } });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Imagem muito grande. Limite: 5 MB');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) update('url', dataUrl);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <FieldRow label="Arquivo">
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            flex: 1,
            fontSize: 11,
            padding: '4px 10px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 4,
            color: '#94a3b8',
            cursor: 'pointer',
            textAlign: 'center',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#334155')}
        >
          {p.url ? '🖼 Trocar imagem' : '📁 Selecionar imagem'}
        </button>
      </FieldRow>

      <TextPropRow label="ou URL" value={String(p.url ?? '')} onChange={(v) => update('url', v)} />

      <FieldRow label="Ajuste">
        <select
          value={String(p.objectFit ?? 'contain')}
          onChange={(e) => update('objectFit', e.target.value)}
          className="flex-1 text-xs border border-slate-800 rounded px-2 py-1 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500/50"
        >
          <option value="contain">Conter (contain)</option>
          <option value="cover">Preencher (cover)</option>
          <option value="fill">Esticar (fill)</option>
          <option value="none">Original (none)</option>
        </select>
      </FieldRow>

      <details style={{ marginTop: 8 }}>
        <summary
          style={{
            fontSize: 11,
            color: '#94a3b8',
            cursor: 'pointer',
            userSelect: 'none',
            marginBottom: 6,
            listStyle: 'none',
          }}
        >
          Corte e posicao
        </summary>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
          <label style={{ fontSize: 10, color: '#64748b' }}>
            Deslocamento X
            <input
              type="number"
              step={1}
              value={Number(p.cropX ?? 0)}
              onChange={(e) => update('cropX', Number(e.target.value))}
              className="w-full text-xs border border-slate-800 rounded px-2 py-1 bg-slate-900 text-slate-200 focus:outline-none focus:border-indigo-500/50"
              style={{ display: 'block', marginTop: 2 }}
            />
          </label>
          <label style={{ fontSize: 10, color: '#64748b' }}>
            Deslocamento Y
            <input
              type="number"
              step={1}
              value={Number(p.cropY ?? 0)}
              onChange={(e) => update('cropY', Number(e.target.value))}
              className="w-full text-xs border border-slate-800 rounded px-2 py-1 bg-slate-900 text-slate-200 focus:outline-none focus:border-indigo-500/50"
              style={{ display: 'block', marginTop: 2 }}
            />
          </label>
        </div>
        <label style={{ fontSize: 10, color: '#64748b', display: 'block', marginTop: 6 }}>
          Escala ({Math.round(Number(p.cropScale ?? 1) * 100)}%)
          <input
            type="range"
            min={100}
            max={400}
            step={5}
            value={Math.round(Number(p.cropScale ?? 1) * 100)}
            onChange={(e) => update('cropScale', Number(e.target.value) / 100)}
            aria-label="Escala de corte"
            style={{ width: '100%', marginTop: 2 }}
          />
        </label>
        <button
          onClick={() => onUpdate({ props: { ...p, cropX: 0, cropY: 0, cropScale: 1 } })}
          style={{
            fontSize: 10,
            marginTop: 6,
            padding: '3px 10px',
            borderRadius: 4,
            border: '1px solid #334155',
            background: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          Resetar corte
        </button>
      </details>

      {p.url && (
        <FieldRow label="">
          <button
            onClick={() => update('url', '')}
            style={{
              fontSize: 11,
              color: '#f87171',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 0',
            }}
          >
            ✕ Remover imagem
          </button>
        </FieldRow>
      )}
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
  'chart-daily':            { colors: [{ key: 'colorArea', label: 'Área', default: '#6366f1' }] },
  // Title-only chart types (no color customization beyond the title field)
  'chart-loss-waterfall':   { colors: [] },
  'chart-generation':       { colors: [], showLegendToggle: true },
  'chart-financial':        { colors: [], showLegendToggle: true },
  'table-analytics':        { colors: [] },
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
          className="flex-1 text-xs border border-slate-800 rounded px-2 py-1 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500/50"
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
          className="flex-1 text-xs border border-slate-800 rounded px-2 py-1 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500/50"
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
        <div className="text-[9px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-2 py-1 mb-1 leading-relaxed">
          <span className="font-bold">Ex:</span> {fieldDef.example}
        </div>
      )}

      <TextPropRow label="Prefixo" value={String(p.prefix ?? '')} onChange={(v) => update('prefix', v)} />
      <TextPropRow label="Sufixo"  value={String(p.suffix  ?? '')} onChange={(v) => update('suffix',  v)} />

      <div className="border-t border-slate-800 pt-2 mt-1">
        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Estilo</p>
        <TextStyleControls p={p} update={update} defaultFontSize={14} />
      </div>
    </>
  );
}

// ─── Technical Elements Props ──────────────────────────────────────────────────

function SectionHeaderProps({ element, onUpdate }: Props) {
  const p = element.props as Record<string, unknown>;
  const update = (key: string, val: unknown) => onUpdate({ props: { ...p, [key]: val } });

  return (
    <>
      <TextAreaPropRow label="Título" value={String(p.title ?? '')} onChange={(v) => update('title', v)} />
      <TextAreaPropRow label="Subtexto" value={String(p.subtitle ?? '')} onChange={(v) => update('subtitle', v)} />
      <ColorPropRow label="Borda" value={String(p.borderColor ?? '#1a3d2b')} onChange={(v) => update('borderColor', v)} />
      <ColorPropRow label="Cor do título" value={String(p.titleColor ?? '#0F172A')} onChange={(v) => update('titleColor', v)} />
      <ColorPropRow label="Cor do subtexto" value={String(p.subtitleColor ?? '#64748B')} onChange={(v) => update('subtitleColor', v)} />
    </>
  );
}

function KpiCapacityBadgeProps({ element, onUpdate }: Props) {
  const p = element.props as Record<string, unknown>;
  const update = (key: string, val: unknown) => onUpdate({ props: { ...p, [key]: val } });

  return (
    <>
      <CheckboxRow label="Mostrar cliente" value={Boolean(p.showClientName ?? true)} onChange={(v) => update('showClientName', v)} />
      <ColorPropRow label="Cor Potência" value={String(p.colorPower ?? '#2D6A4F')} onChange={(v) => update('colorPower', v)} />
      <ColorPropRow label="Cor Geração" value={String(p.colorGen ?? '#4CAF50')} onChange={(v) => update('colorGen', v)} />
      <ColorPropRow label="Cor label" value={String(p.labelColor ?? '#064E3B')} onChange={(v) => update('labelColor', v)} />
    </>
  );
}

function GuaranteesListProps({ element, onUpdate }: Props) {
  const p = element.props as Record<string, unknown>;
  const update = (key: string, val: unknown) => onUpdate({ props: { ...p, [key]: val } });

  return (
    <>
      <ColorPropRow label="Cor destaque" value={String(p.accentColor ?? '#4CAF50')} onChange={(v) => update('accentColor', v)} />
      <ColorPropRow label="Cor título" value={String(p.headingColor ?? '#2D0A4E')} onChange={(v) => update('headingColor', v)} />
      <TextAreaPropRow
        label="Bullets custom"
        value={String(p.customBullets ?? '')}
        onChange={(v) => update('customBullets', v)}
        placeholder="Título: Descrição&#10;Título2: Descrição2"
      />
    </>
  );
}

function EquipmentPanelProps({ element, onUpdate }: Props) {
  const p = element.props as Record<string, unknown>;
  const update = (key: string, val: unknown) => onUpdate({ props: { ...p, [key]: val } });

  return (
    <>
      <ColorPropRow label="Cor label lateral" value={String(p.labelBgColor ?? '#2D6A4F')} onChange={(v) => update('labelBgColor', v)} />
      <ColorPropRow label="Cor texto label" value={String(p.labelColor ?? '#ffffff')} onChange={(v) => update('labelColor', v)} />
    </>
  );
}

export function ElementPropertiesPanel({ element, onUpdate, onDecompose }: Props) {
  const isPageBlock = element.type.startsWith('page-');
  const [aspectRatioLocked, setAspectRatioLocked] = React.useState(false);

  const handleWidthChange = (v: number) => {
    if (aspectRatioLocked && element.width > 0) {
      const ratio = element.height / element.width;
      onUpdate({ width: v, height: Math.round(v * ratio) });
    } else {
      onUpdate({ width: v });
    }
  };

  const handleHeightChange = (v: number) => {
    if (aspectRatioLocked && element.height > 0) {
      const ratio = element.width / element.height;
      onUpdate({ height: v, width: Math.round(v * ratio) });
    } else {
      onUpdate({ height: v });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-950 border-r border-slate-800">
      <div className="px-4 py-3 border-b border-slate-800 shrink-0 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Propriedades</p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdate({ visible: !element.visible })}
            className={cn('p-1 rounded hover:bg-slate-800', !element.visible && 'text-slate-600')}
            title={element.visible ? 'Ocultar' : 'Mostrar'}
            aria-label={element.visible ? 'Ocultar elemento' : 'Mostrar elemento'}
          >
            {element.visible ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
          {!isPageBlock && (
            <button
              onClick={() => onUpdate({ locked: !element.locked })}
              className="p-1 rounded hover:bg-slate-800"
              title={element.locked ? 'Desbloquear' : 'Bloquear'}
              aria-label={element.locked ? 'Desbloquear elemento' : 'Bloquear elemento'}
            >
              {element.locked ? <Lock size={13} /> : <Unlock size={13} />}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 custom-scrollbar">
        {/* Position & size */}
        {!isPageBlock && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Posição e Tamanho</p>
            <div className="grid grid-cols-2 gap-x-2">
              <FieldRow label="X">
                <NumInput value={element.x} onChange={(v) => onUpdate({ x: v })} min={0} aria-label="Posição X" />
              </FieldRow>
              <FieldRow label="Y">
                <NumInput value={element.y} onChange={(v) => onUpdate({ y: v })} min={0} aria-label="Posição Y" />
              </FieldRow>
            </div>

            {/* Width / Height with aspect ratio lock */}
            <div className="flex items-center gap-1">
              <div className="flex-1">
                <FieldRow label="Largura">
                  <NumInput value={element.width} onChange={handleWidthChange} min={10} aria-label="Largura" />
                </FieldRow>
              </div>
              <button
                onClick={() => setAspectRatioLocked((v) => !v)}
                className={cn(
                  'p-1 rounded border mt-0.5 shrink-0 transition-colors',
                  aspectRatioLocked
                    ? 'border-indigo-500/60 bg-indigo-500/20 text-indigo-400'
                    : 'border-slate-800 hover:bg-slate-800 text-slate-500',
                )}
                aria-label={aspectRatioLocked ? 'Desbloquear proporção' : 'Travar proporção'}
                title={aspectRatioLocked ? 'Proporção travada' : 'Travar proporção'}
              >
                {aspectRatioLocked ? <Link2 size={11} /> : <Unlink size={11} />}
              </button>
              <div className="flex-1">
                <FieldRow label="Altura">
                  <NumInput value={element.height} onChange={handleHeightChange} min={10} aria-label="Altura" />
                </FieldRow>
              </div>
            </div>

            <FieldRow label="Z-index">
              <div className="flex items-center gap-1 flex-1">
                <NumInput value={element.zIndex} onChange={(v) => onUpdate({ zIndex: v })} min={0} />
                <button onClick={() => onUpdate({ zIndex: element.zIndex + 1 })} className="p-1 border border-slate-800 rounded hover:bg-slate-800">
                  <ChevronUp size={12} className="text-slate-500" />
                </button>
                <button onClick={() => onUpdate({ zIndex: Math.max(0, element.zIndex - 1) })} className="p-1 border border-slate-800 rounded hover:bg-slate-800">
                  <ChevronDown size={12} className="text-slate-500" />
                </button>
              </div>
            </FieldRow>

            {/* Rotation */}
            <FieldRow label="Rotação">
              <input
                type="number"
                min={0}
                max={360}
                step={1}
                value={element.rotation ?? 0}
                onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
                aria-label="Rotação em graus"
                className="w-full text-xs border border-slate-800 rounded px-2 py-1 bg-slate-900 text-slate-200 focus:outline-none focus:border-indigo-500/50"
              />
              <span className="text-[10px] text-slate-500 ml-1 shrink-0">°</span>
            </FieldRow>

            {/* Opacity */}
            <FieldRow label="Opacidade">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round((element.opacity ?? 1) * 100)}
                onChange={(e) => onUpdate({ opacity: Number(e.target.value) / 100 })}
                aria-label="Opacidade"
                className="flex-1"
              />
              <span className="text-[10px] text-slate-500 w-7 text-right shrink-0">
                {Math.round((element.opacity ?? 1) * 100)}%
              </span>
            </FieldRow>

            {/* Flip H/V */}
            <FieldRow label="Espelhar">
              <div className="flex gap-1.5">
                <button
                  onClick={() => onUpdate({ flipX: !element.flipX })}
                  className={cn(
                    'p-1 rounded border text-[10px] transition-colors flex items-center gap-0.5',
                    element.flipX
                      ? 'border-indigo-500/60 bg-indigo-500/20 text-indigo-400'
                      : 'border-slate-800 hover:bg-slate-800 text-slate-500',
                  )}
                  aria-label="Espelhar horizontal"
                  aria-pressed={element.flipX ?? false}
                  title="Espelhar horizontal"
                >
                  ↔ H
                </button>
                <button
                  onClick={() => onUpdate({ flipY: !element.flipY })}
                  className={cn(
                    'p-1 rounded border text-[10px] transition-colors flex items-center gap-0.5',
                    element.flipY
                      ? 'border-indigo-500/60 bg-indigo-500/20 text-indigo-400'
                      : 'border-slate-800 hover:bg-slate-800 text-slate-500',
                  )}
                  aria-label="Espelhar vertical"
                  aria-pressed={element.flipY ?? false}
                  title="Espelhar vertical"
                >
                  ↕ V
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
            {element.type === 'image'       && <ImageElementProps element={element} onUpdate={onUpdate} />}
            {element.type === 'box'         && <BoxElementProps element={element} onUpdate={onUpdate} />}
            {element.type === 'icon'        && <IconElementProps element={element} onUpdate={onUpdate} />}
            {element.type === 'logo'        && <LogoElementProps element={element} onUpdate={onUpdate} />}
            {element.type === 'watermark'   && <WatermarkProps element={element} onUpdate={onUpdate} />}
            {element.type === 'divider'     && <DividerProps element={element} onUpdate={onUpdate} />}
            {element.type === 'kpi-projection' && <KpiProjectionProps element={element} onUpdate={onUpdate} />}
            {element.type === 'placeholder' && <PlaceholderProps element={element} onUpdate={onUpdate} />}
            {element.type in CHART_PROPS_CONFIG && <ChartElementProps element={element} onUpdate={onUpdate} />}
            {/* Technical elements */}
            {element.type === 'section-header'    && <SectionHeaderProps element={element} onUpdate={onUpdate} />}
            {element.type === 'kpi-capacity-badge' && <KpiCapacityBadgeProps element={element} onUpdate={onUpdate} />}
            {element.type === 'guarantees-list'   && <GuaranteesListProps element={element} onUpdate={onUpdate} />}
            {element.type === 'equipment-panel'   && <EquipmentPanelProps element={element} onUpdate={onUpdate} />}
          </div>
        )}

        {isPageBlock && element.type === 'page-technical' && onDecompose && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
              <FileText size={16} className="text-slate-500" />
              <div>
                <p className="text-xs font-semibold">Template clássico (bloqueado)</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">Página técnica completa</p>
              </div>
            </div>
            <button
              onClick={onDecompose}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest rounded-sm transition-colors shadow-lg shadow-indigo-950/20"
            >
              <Edit3 size={13} />
              Editar esta página
            </button>
            <div className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-sm px-2 py-1.5 leading-relaxed">
              <strong>Atenção:</strong> Esta ação substituirá o bloco único por elementos individuais editáveis. Você poderá mover, redimensionar e personalizar cada seção.
            </div>
          </div>
        )}

        {isPageBlock && element.type !== 'page-technical' && (
          <div className="text-xs text-slate-400 leading-relaxed">
            Este bloco representa uma página completa do template clássico. O conteúdo é editado pelo painel lateral de dados da proposta.
          </div>
        )}
      </div>
    </div>
  );
}
