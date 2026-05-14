import { useState, useCallback } from 'react';
import { History, RotateCcw, Save, X } from 'lucide-react';
import { loadVersions, AutosaveVersion } from './useAutosave';
import type { ProposalTemplate } from './types';

interface Props {
  onRestore: (layout: ProposalTemplate) => void;
  onClose: () => void;
  onSaveManual: () => void;
}

export function VersionHistoryPanel({ onRestore, onClose, onSaveManual }: Props) {
  const [versions, setVersions] = useState<AutosaveVersion[]>(() =>
    loadVersions().slice(0, 30)
  );
  const [confirming, setConfirming] = useState<string | null>(null);

  const handleRefresh = useCallback(() => {
    setVersions(loadVersions().slice(0, 30));
  }, []);

  const handleRestore = useCallback((v: AutosaveVersion) => {
    if (confirming === v.id) {
      onRestore(v.layout);
      setConfirming(null);
    } else {
      setConfirming(v.id);
    }
  }, [confirming, onRestore]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#1e293b', borderRadius: 12, width: 420, maxHeight: '70vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 10 }}>
          <History size={16} color="#818cf8" />
          <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 14, flex: 1 }}>Histórico de versões</span>
          <button
            onClick={() => { onSaveManual(); handleRefresh(); }}
            style={{ fontSize: 11, color: '#818cf8', background: 'none', border: '1px solid #4338ca', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Save size={12} /> Salvar agora
          </button>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {versions.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
              Nenhuma versao salva ainda.<br />O autosalvo ocorre a cada 30 segundos.
            </div>
          ) : versions.map((v) => (
            <div
              key={v.id}
              style={{
                padding: '12px 20px', borderBottom: '1px solid #1e293b',
                display: 'flex', alignItems: 'center', gap: 12,
                background: confirming === v.id ? 'rgba(99,102,241,0.1)' : 'transparent',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: '#f1f5f9', fontWeight: v.isManual ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {v.label}
                  {v.isManual && (
                    <span style={{ marginLeft: 6, fontSize: 10, background: '#4338ca', color: '#c7d2fe', borderRadius: 4, padding: '1px 5px' }}>
                      Manual
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                  {new Date(v.savedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {' · '}{v.layout.pages.length} pagina{v.layout.pages.length !== 1 ? 's' : ''}
                </div>
              </div>
              <button
                onClick={() => handleRestore(v)}
                style={{
                  fontSize: 11, padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                  background: confirming === v.id ? '#4338ca' : 'none',
                  border: `1px solid ${confirming === v.id ? '#6366f1' : '#334155'}`,
                  color: confirming === v.id ? '#e0e7ff' : '#94a3b8',
                  display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                }}
              >
                <RotateCcw size={11} />
                {confirming === v.id ? 'Confirmar?' : 'Restaurar'}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#475569' }}>Autosalvo a cada 30 s &bull; Max. 10 automaticos + 20 manuais</span>
          <button
            onClick={handleRefresh}
            style={{ fontSize: 11, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Atualizar
          </button>
        </div>
      </div>
    </div>
  );
}
