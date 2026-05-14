import React, { useCallback, useRef, useState } from 'react';
import { X, Image as ImageIcon, Palette, Blend } from 'lucide-react';
import type { CanvasPage } from './types';
import { parseBackgroundImageUrl } from './types';

type BgMode = 'color' | 'gradient' | 'image';

interface Props {
  page: CanvasPage;
  onUpdate: (bg: CanvasPage['background']) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0',
  '#0f172a', '#1e293b', '#334155', '#475569',
  '#eff6ff', '#dbeafe', '#bfdbfe', '#2563eb',
  '#f0fdf4', '#dcfce7', '#bbf7d0', '#16a34a',
  '#fdf4ff', '#fae8ff', '#e879f9', '#a21caf',
  '#fff7ed', '#ffedd5', '#fed7aa', '#ea580c',
];

const PRESET_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(160deg, #0093E9 0%, #80D0C7 100%)',
  'linear-gradient(135deg, #2D0A4E 0%, #10B981 100%)',
  'linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%)',
  'linear-gradient(180deg, #0f172a 0%, #1e3a5f 100%)',
];

export function PageBackgroundPanel({ page, onUpdate, onClose }: Props) {
  const [mode, setMode] = useState<BgMode>(
    page.background.gradient ? 'gradient' :
    page.background.imageUrl ? 'image' : 'color'
  );
  const [customGradient, setCustomGradient] = useState(
    page.background.gradient ?? 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgLoading, setImgLoading] = useState(false);

  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 500,
    border: 'none', borderRadius: 6, cursor: 'pointer',
    background: active ? '#6366f1' : 'none',
    color: active ? '#fff' : '#94a3b8',
    transition: 'background 0.15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  });

  const handleImageFile = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) { alert('Limite: 10 MB'); return; }
    setImgLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      onUpdate({ imageUrl: e.target?.result as string });
      setImgLoading(false);
    };
    reader.readAsDataURL(file);
  }, [onUpdate]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#1e293b', borderRadius: 12, width: 360,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Palette size={15} color="#818cf8" />
          <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 13, flex: 1 }}>Fundo da página</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}><X size={15} /></button>
        </div>

        <div style={{ padding: 18 }}>
          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#0f172a', borderRadius: 8, padding: 3 }}>
            <button style={TAB_STYLE(mode === 'color')}    onClick={() => setMode('color')}>    <Palette size={12} /> Cor sólida </button>
            <button style={TAB_STYLE(mode === 'gradient')} onClick={() => setMode('gradient')}> <Blend   size={12} /> Gradiente  </button>
            <button style={TAB_STYLE(mode === 'image')}    onClick={() => setMode('image')}>    <ImageIcon size={12}/> Imagem     </button>
          </div>

          {/* Live preview strip */}
          <div style={{
            height: 56, borderRadius: 8, marginBottom: 14, overflow: 'hidden',
            background:
              mode === 'gradient' ? (customGradient) :
              mode === 'image'    ? (page.background.imageUrl ? `url(${page.background.imageUrl}) center/cover` : '#0f172a') :
              (page.background.color ?? '#ffffff'),
            border: '1px solid #334155',
          }} />

          {/* Color mode */}
          {mode === 'color' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 5, marginBottom: 10 }}>
                {PRESET_COLORS.map((c) => (
                  <button key={c} onClick={() => onUpdate({ color: c })}
                    style={{
                      width: '100%', aspectRatio: '1', borderRadius: 5, border: page.background.color === c ? '2px solid #6366f1' : '2px solid transparent',
                      background: c, cursor: 'pointer', padding: 0,
                    }}
                    title={c}
                  />
                ))}
              </div>
              <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Cor personalizada</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={page.background.color ?? '#ffffff'}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                  style={{ width: 36, height: 32, border: 'none', borderRadius: 5, cursor: 'pointer', padding: 0 }}
                  aria-label="Cor do fundo" />
                <input type="text" value={page.background.color ?? '#ffffff'}
                  onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onUpdate({ color: e.target.value }); }}
                  style={{ flex: 1, fontSize: 12, padding: '5px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0' }}
                />
              </div>
            </>
          )}

          {/* Gradient mode */}
          {mode === 'gradient' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 12 }}>
                {PRESET_GRADIENTS.map((g) => (
                  <button key={g} onClick={() => { setCustomGradient(g); onUpdate({ gradient: g }); }}
                    style={{
                      height: 40, borderRadius: 7, border: page.background.gradient === g ? '2px solid #6366f1' : '2px solid transparent',
                      background: g, cursor: 'pointer', padding: 0,
                    }}
                    title={g}
                  />
                ))}
              </div>
              <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>CSS personalizado</label>
              <input type="text" value={customGradient}
                onChange={(e) => { setCustomGradient(e.target.value); onUpdate({ gradient: e.target.value }); }}
                placeholder="linear-gradient(135deg, #6366f1 0%, #818cf8 100%)"
                style={{ width: '100%', fontSize: 11, padding: '6px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', boxSizing: 'border-box' }}
              />
            </>
          )}

          {/* Image mode */}
          {mode === 'image' && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px dashed #334155', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}
              >
                <ImageIcon size={16} /> {imgLoading ? 'Carregando...' : (page.background.imageUrl ? 'Trocar imagem de fundo' : 'Selecionar imagem de fundo')}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />

              {page.background.imageUrl && (
                <>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Tamanho e posição</div>
                  {(['cover', 'contain', 'fill'] as const).map((fit) => (
                    <label key={fit} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8', cursor: 'pointer', marginBottom: 4 }}>
                      <input type="radio" name="bgfit" value={fit}
                        checked={(page.background.imageUrl ?? '').endsWith(`|${fit}`) || (!['cover','contain','fill'].some(f => (page.background.imageUrl ?? '').endsWith(`|${f}`)) && fit === 'cover')}
                        onChange={() => {
                          const { url: base } = parseBackgroundImageUrl(page.background.imageUrl ?? '');
                          onUpdate({ imageUrl: `${base}|${fit}` });
                        }}
                      />
                      {fit === 'cover' ? 'Preencher (cover)' : fit === 'contain' ? 'Ajustar (contain)' : 'Esticar (fill)'}
                    </label>
                  ))}
                  <button
                    onClick={() => onUpdate({ color: '#ffffff' })}
                    style={{ fontSize: 11, marginTop: 8, padding: '4px 10px', borderRadius: 5, border: '1px solid #334155', background: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    Remover imagem de fundo
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
