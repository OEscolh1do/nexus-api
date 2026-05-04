import React from 'react';
import { Lock, Unlock, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import type { CanvasElement } from './types';
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
      <FieldRow label="Tamanho">
        <NumInput value={Number(p.fontSize ?? 16)} onChange={(v) => update('fontSize', v)} min={8} />
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
      <ColorPropRow label="Cor" value={String(p.color ?? '#1a1a1a')} onChange={(v) => update('color', v)} />
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
            {element.type === 'text'      && <TextElementProps element={element} onUpdate={onUpdate} />}
            {element.type === 'watermark' && <WatermarkProps element={element} onUpdate={onUpdate} />}
            {element.type === 'divider'   && <DividerProps element={element} onUpdate={onUpdate} />}
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
