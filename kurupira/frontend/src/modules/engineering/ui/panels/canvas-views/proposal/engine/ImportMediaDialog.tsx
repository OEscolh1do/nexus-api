import React, { useCallback, useRef, useState } from 'react';
import { Upload, X, FileImage, Loader2, CheckSquare, Square } from 'lucide-react';
import { renderPdfThumbnails, renderPdfPageFull, PdfPagePreview } from './importPdfAsImage';

export interface PdfPageResult {
  dataUrl: string;
  pageNumber: number;
}

interface Props {
  /** Chamado ao confirmar uma imagem ou uma única página de PDF como elemento */
  onConfirmElement: (dataUrl: string) => void;
  /** Chamado ao confirmar uma ou mais páginas de PDF como páginas de fundo */
  onConfirmPages: (pages: PdfPageResult[]) => void;
  onClose: () => void;
}

type Mode = 'pick' | 'pdf-pages' | 'loading';

const BTN_BASE: React.CSSProperties = {
  fontSize: 13, padding: '7px 16px', borderRadius: 7,
  cursor: 'pointer', fontWeight: 500, transition: 'opacity .15s',
};

export function ImportMediaDialog({ onConfirmElement, onConfirmPages, onClose }: Props) {
  const [mode, setMode]         = useState<Mode>('pick');
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [pages, setPages]       = useState<PdfPagePreview[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loadingMsg, setLoadingMsg] = useState('Processando...');
  const [error, setError]       = useState<string | null>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  // ── Toggle individual page ─────────────────────────────────────────────────
  const togglePage = useCallback((n: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  }, []);

  const selectAll   = useCallback(() => setSelected(new Set(pages.map((p) => p.pageNumber))), [pages]);
  const clearAll    = useCallback(() => setSelected(new Set()), []);

  // ── File handler ───────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    setError(null);

    if (file.size > 30 * 1024 * 1024) {
      setError('Arquivo muito grande. Limite: 30 MB');
      return;
    }

    if (file.type.startsWith('image/')) {
      setLoadingMsg('Carregando imagem...');
      setMode('loading');
      const reader = new FileReader();
      reader.onload = (e) => onConfirmElement(e.target?.result as string);
      reader.readAsDataURL(file);
      return;
    }

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      setLoadingMsg('Carregando PDF…');
      setMode('loading');
      try {
        const buffer = await file.arrayBuffer();
        const thumbs = await renderPdfThumbnails(buffer, 0.25);
        setPdfBuffer(buffer);
        setPages(thumbs);
        setSelected(new Set(thumbs.map((p) => p.pageNumber))); // seleciona tudo por padrão
        setMode('pdf-pages');
      } catch {
        setError('Erro ao processar PDF. Verifique se o arquivo não está protegido.');
        setMode('pick');
      }
      return;
    }

    setError('Formato não suportado. Use imagem (JPG, PNG, WEBP) ou PDF.');
  }, [onConfirmElement]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ── Confirm: como elemento (apenas 1ª selecionada) ─────────────────────────
  const handleConfirmElement = useCallback(async () => {
    if (!pdfBuffer || selected.size === 0) return;
    const pageNum = Math.min(...selected);
    setLoadingMsg('Renderizando página…');
    setMode('loading');
    try {
      const dataUrl = await renderPdfPageFull(pdfBuffer, pageNum, 2);
      onConfirmElement(dataUrl);
    } catch {
      setError('Erro ao renderizar página.');
      setMode('pdf-pages');
    }
  }, [pdfBuffer, selected, onConfirmElement]);

  // ── Confirm: como páginas de fundo ─────────────────────────────────────────
  const handleConfirmPages = useCallback(async () => {
    if (!pdfBuffer || selected.size === 0) return;
    const sorted = [...selected].sort((a, b) => a - b);
    setLoadingMsg(`Renderizando ${sorted.length} página${sorted.length !== 1 ? 's' : ''}…`);
    setMode('loading');
    try {
      const results: PdfPageResult[] = [];
      for (const pageNum of sorted) {
        const dataUrl = await renderPdfPageFull(pdfBuffer, pageNum, 2);
        results.push({ dataUrl, pageNumber: pageNum });
      }
      onConfirmPages(results);
    } catch {
      setError('Erro ao renderizar páginas.');
      setMode('pdf-pages');
    }
  }, [pdfBuffer, selected, onConfirmPages]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#1e293b', borderRadius: 14, width: 540,
        maxHeight: '82vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.55)',
        border: '1px solid #334155',
      }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileImage size={16} color="#818cf8" />
          <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 14, flex: 1 }}>
            {mode === 'pdf-pages' ? `PDF — ${pages.length} página${pages.length !== 1 ? 's' : ''}` : 'Importar arquivo'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

          {/* Loading */}
          {mode === 'loading' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, minHeight: 180, color: '#94a3b8' }}>
              <Loader2 size={36} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{loadingMsg}</span>
            </div>
          )}

          {/* Drop zone */}
          {mode === 'pick' && (
            <>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                style={{
                  border: '2px dashed #334155', borderRadius: 12, padding: '44px 24px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                  cursor: 'pointer', transition: 'border-color .15s, background .15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = 'rgba(99,102,241,0.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.background = ''; }}
              >
                <Upload size={34} color="#475569" />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: 0 }}>
                    Clique ou arraste um arquivo aqui
                  </p>
                  <p style={{ fontSize: 12, margin: '6px 0 0', color: '#64748b' }}>
                    Imagens (JPG, PNG, WEBP, GIF) · PDF · Máx. 30 MB
                  </p>
                </div>
              </div>
              <input
                ref={inputRef} type="file" accept="image/*,.pdf"
                style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              {error && (
                <p style={{ marginTop: 12, fontSize: 12, color: '#f87171', textAlign: 'center' }}>{error}</p>
              )}
            </>
          )}

          {/* PDF page grid */}
          {mode === 'pdf-pages' && (
            <>
              {/* Controls row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                  <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{selected.size}</span>
                  {' '}de {pages.length} página{pages.length !== 1 ? 's' : ''} selecionada{selected.size !== 1 ? 's' : ''}
                </p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={selectAll}
                    style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5, border: '1px solid #334155', background: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    Todas
                  </button>
                  <button
                    onClick={clearAll}
                    style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5, border: '1px solid #334155', background: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    Nenhuma
                  </button>
                </div>
              </div>

              {/* Thumbnails grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))', gap: 10 }}>
                {pages.map((p) => {
                  const isSelected = selected.has(p.pageNumber);
                  return (
                    <div
                      key={p.pageNumber}
                      onClick={() => togglePage(p.pageNumber)}
                      style={{
                        border: isSelected ? '2px solid #6366f1' : '2px solid #334155',
                        borderRadius: 9, overflow: 'hidden', cursor: 'pointer',
                        background: isSelected ? 'rgba(99,102,241,0.08)' : '#0f172a',
                        transition: 'border-color .15s, background .15s',
                        position: 'relative',
                      }}
                    >
                      <img
                        src={p.dataUrl}
                        alt={`Página ${p.pageNumber}`}
                        style={{ width: '100%', display: 'block' }}
                        draggable={false}
                      />
                      {/* Checkbox overlay */}
                      <div style={{
                        position: 'absolute', top: 5, right: 5,
                        color: isSelected ? '#818cf8' : '#475569',
                        background: '#0f172a', borderRadius: 4,
                        lineHeight: 0, padding: 1,
                      }}>
                        {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                      </div>
                      <div style={{
                        fontSize: 10, textAlign: 'center', padding: '5px 0',
                        color: isSelected ? '#818cf8' : '#64748b',
                        fontWeight: isSelected ? 600 : 400,
                      }}>
                        Pág. {p.pageNumber}
                      </div>
                    </div>
                  );
                })}
              </div>

              {error && <p style={{ marginTop: 12, fontSize: 12, color: '#f87171' }}>{error}</p>}
            </>
          )}
        </div>

        {/* Footer */}
        {mode === 'pdf-pages' && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            {/* Hint */}
            <p style={{ fontSize: 11, color: '#475569', margin: 0, flex: 1 }}>
              "Como páginas" cria uma página de fundo por PDF selecionado.
            </p>

            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                onClick={onClose}
                style={{ ...BTN_BASE, border: '1px solid #334155', background: 'none', color: '#94a3b8' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmElement}
                disabled={selected.size === 0}
                title="Importa a 1ª página selecionada como elemento de imagem no canvas"
                style={{
                  ...BTN_BASE,
                  border: '1px solid #334155', background: 'none',
                  color: selected.size === 0 ? '#475569' : '#94a3b8',
                  cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Como imagem
              </button>
              <button
                onClick={handleConfirmPages}
                disabled={selected.size === 0}
                style={{
                  ...BTN_BASE,
                  border: 'none',
                  background: selected.size === 0 ? '#1e3a5f' : '#6366f1',
                  color: selected.size === 0 ? '#475569' : '#fff',
                  cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Como página{selected.size !== 1 ? 's' : ''} ({selected.size})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
