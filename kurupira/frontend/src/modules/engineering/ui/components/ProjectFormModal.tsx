/**
 * =============================================================================
 * MODAL DE PROJETO — Início Rápido (CRIAÇÃO APENAS)
 * =============================================================================
 *
 * Modal minimalista para criar um novo projeto a partir do Hub.
 * Coleta apenas Cliente e Título. O resto (Endereço, Mapa, Consumo)
 * deve ser inserido diretamente nas telas de Engenharia (Local / Consumo)
 * adotando o fluxo "Visual-First".
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { X, Play, Loader2, User, LayoutGrid, AlertCircle } from 'lucide-react';
import { ProjectService } from '@/services/ProjectService';
import { useSolarStore } from '@/core/state/solarStore';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
}) => {
  const setActiveModule = useSolarStore(s => s.setActiveModule);

  // States
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fields
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');

  // Reset on open
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setClientName('');
    setProjectName('');
  }, [isOpen]);

  // Validation
  const validate = () => {
    if (!clientName.trim()) return 'Nome do Cliente é obrigatório.';
    return null;
  };

  // Save / Initialize
  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setSaving(true);
    setError(null);

    try {
      const newId = await ProjectService.createStandaloneProject({
        projectName: projectName || `Projeto ${clientName}`,
        clientName,
      });

      if (newId) {
        onSaveSuccess();
        onClose();
        setActiveModule('engineering');
      } else {
        setError('Ocorreu um erro na criação do projeto via API.');
      }
    } catch (e) {
      console.error(e);
      setError('Falha de conexão com os servidores do Kurupira.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Decorative Industrial Corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-500/20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-500/20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-500/20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-500/20 pointer-events-none" />

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/30 shrink-0 relative overflow-hidden">
          {/* HUD scanline effect */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />
          
          <div className="flex items-center gap-3 relative z-20">
            <div className="p-2.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Play size={16} className="fill-current" />
            </div>
            <div>
              <h2 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">Novo Projeto</h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Inicialização de Workspace</p>
            </div>
          </div>
          <button onClick={onClose} disabled={saving} className="p-2 rounded-sm hover:bg-slate-800 text-slate-500 hover:text-white transition-colors relative z-20">
            <X size={16} />
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="p-6 flex-1 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-sm flex items-start gap-3 text-red-400">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <p className="text-[10px] font-black uppercase tracking-wider">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <User size={12} className="text-emerald-500/50" /> Cliente Associado <span className="text-emerald-500">*</span>
              </label>
              <input 
                type="text" 
                value={clientName} 
                onChange={e => setClientName(e.target.value)} 
                placeholder="Ex: Supermercado Central"
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 rounded-sm px-4 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/50 focus:bg-slate-900/50 transition-all font-medium"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <LayoutGrid size={12} className="text-slate-600" /> Título do Projeto (Opcional)
              </label>
              <input 
                type="text" 
                value={projectName} 
                onChange={e => setProjectName(e.target.value)} 
                placeholder="Ex: Matriz - Fase 1"
                className="w-full bg-slate-950 border border-slate-800 rounded-sm px-4 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/50 focus:bg-slate-900/50 transition-all font-medium"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="px-6 py-5 border-t border-slate-800 bg-slate-900 flex flex-col gap-3 shrink-0">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 text-white rounded-sm text-xs font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(5,150,105,0.2)] active:scale-[0.98]"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Play size={14} className="fill-current" />}
            {saving ? 'Inicializando...' : 'Iniciar Workspace'}
          </button>
          
          <button 
            onClick={onClose} 
            disabled={saving} 
            className="w-full px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
