import React, { useState, useEffect, useRef } from 'react';
import { X, User, LayoutGrid, AlertCircle, TerminalSquare } from 'lucide-react';
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

  // Refs for focus management
  const clientInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  // Reset on open
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setClientName('');
    setProjectName('');
    
    // Auto-focus first field
    setTimeout(() => {
      clientInputRef.current?.focus();
    }, 50);
  }, [isOpen]);

  // Handle global keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!saving) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

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

  const handleClientKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      projectInputRef.current?.focus();
    }
  };

  const handleProjectKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitBtnRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px]"
        onClick={() => !saving && onClose()}
      />

      {/* Modal / Command Dialog */}
      <div 
        className="relative bg-[#0B0D13] border border-slate-800 w-full max-w-[420px] sm:rounded-none shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in fade-in zoom-in-[0.98] duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Loading Progress Bar */}
        {saving && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-800 z-50 overflow-hidden">
             <div className="h-full bg-indigo-500 animate-[progress_1.5s_ease-in-out_infinite]" style={{ width: '30%', animationName: 'pulse-slide' }} />
          </div>
        )}
        <style>{`
          @keyframes pulse-slide {
            0% { transform: translateX(-100%); width: 30%; }
            50% { width: 50%; }
            100% { transform: translateX(400%); width: 30%; }
          }
        `}</style>

        {/* ── HEADER (Terminal Style) ── */}
        <div className="flex items-center justify-between px-4 py-3.5 sm:py-3 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-2.5 text-slate-300">
            <TerminalSquare size={14} className="text-indigo-400" />
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-100">Inicializar Workspace</h2>
          </div>
          <button 
            onClick={onClose} 
            disabled={saving} 
            className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 rounded-none transition-colors active:scale-90"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="p-5 flex-1 space-y-5 bg-[#0B0D13]">
          {error && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-red-400">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <p className="text-[11px] font-bold uppercase tracking-widest leading-relaxed">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Field: Client Name */}
            <div className="group space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User size={10} className="text-indigo-400/70" /> Cliente Associado <span className="text-indigo-400">*</span>
                </span>
              </label>
              <div className="relative">
                <input 
                  ref={clientInputRef}
                  type="text" 
                  value={clientName} 
                  onChange={e => setClientName(e.target.value)} 
                  onKeyDown={handleClientKeyDown}
                  disabled={saving}
                  placeholder="EX: SUPERMERCADO CENTRAL"
                  className="w-full bg-slate-950/50 border border-slate-700 px-3 py-2 h-11 sm:h-9 text-[11px] font-mono font-medium text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:bg-slate-900 transition-all uppercase tracking-wider rounded-none"
                  autoComplete="off"
                  spellCheck="false"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none flex items-center gap-1">
                  <kbd className="hidden sm:inline-flex h-4 px-1 rounded-sm bg-slate-800/80 border border-slate-700 text-[8px] font-mono text-slate-200 font-bold items-center">↵</kbd>
                </div>
              </div>
            </div>
            
            {/* Field: Project Name */}
            <div className="group space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <LayoutGrid size={10} className="text-slate-500" /> Título do Projeto (Opcional)
                </span>
              </label>
              <div className="relative">
                <input 
                  ref={projectInputRef}
                  type="text" 
                  value={projectName} 
                  onChange={e => setProjectName(e.target.value)} 
                  onKeyDown={handleProjectKeyDown}
                  disabled={saving}
                  placeholder="EX: MATRIZ - FASE 1"
                  className="w-full bg-slate-950/50 border border-slate-700 px-3 py-2 h-11 sm:h-9 text-[11px] font-mono font-medium text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:bg-slate-900 transition-all uppercase tracking-wider rounded-none"
                  autoComplete="off"
                  spellCheck="false"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none flex items-center gap-1">
                  <kbd className="hidden sm:inline-flex h-4 px-1 rounded-sm bg-slate-800/80 border border-slate-700 text-[8px] font-mono text-slate-200 font-bold items-center">↵</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="px-5 py-4 border-t border-slate-800/80 bg-slate-900/30 flex items-center justify-between shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-1"><kbd className="h-4 px-1 rounded-sm border border-slate-800 bg-slate-950 text-slate-200">ESC</kbd> Cancelar</span>
          </div>

          <button 
            ref={submitBtnRef}
            onClick={handleSave} 
            disabled={saving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 h-11 sm:h-8 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-indigo-600 hover:bg-indigo-500 active:scale-[0.95] outline-none focus:ring-2 focus:ring-indigo-500/30 rounded-none"
          >
            {saving ? 'Aprovisionando...' : 'Criar Workspace'}
          </button>
        </div>
      </div>
    </div>
  );
};
