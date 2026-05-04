import { useState } from 'react';
import { LayoutTemplate, Plus, Pencil, Trash2, Star, CheckCircle2 } from 'lucide-react';
import { useSolarStore } from '@/core/state/solarStore';
import { BUILT_IN_TEMPLATES } from './engine/templates/classicTemplate';
import type { ProposalTemplate } from './engine/types';
import { cn } from '@/lib/utils';

interface Props {
  onUseTemplate: () => void;
}

function TemplateCard({
  template,
  isActive,
  onUse,
  onDelete,
  onRename,
}: {
  template: ProposalTemplate;
  isActive: boolean;
  onUse: () => void;
  onDelete?: () => void;
  onRename?: () => void;
}) {
  const pageCount = template.pages.length;
  const createdAt = template.isBuiltIn
    ? 'Padrão do sistema'
    : new Date(template.createdAt).toLocaleDateString('pt-BR');

  return (
    <div
      className={cn(
        'relative border-2 rounded-xl overflow-hidden bg-white group transition-all',
        isActive ? 'border-blue-500 shadow-blue-100 shadow-lg' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      )}
    >
      {/* Preview area */}
      <div
        className="h-36 flex items-center justify-center relative overflow-hidden"
        style={{ background: template.theme.primaryColor }}
      >
        <div className="flex gap-1.5 items-end">
          {template.pages.slice(0, 5).map((page, i) => (
            <div
              key={page.id}
              className="rounded-sm shadow"
              style={{
                width: 24 + i * 2,
                height: 34 + i * 2,
                background: i === 0 ? template.theme.primaryColor : '#ffffff',
                border: '1px solid rgba(255,255,255,0.3)',
                opacity: 0.7 + i * 0.06,
              }}
            />
          ))}
        </div>

        {isActive && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-0.5">
            <CheckCircle2 size={14} />
          </div>
        )}
        {template.isBuiltIn && (
          <div className="absolute top-2 left-2 bg-black/30 text-white rounded-full px-2 py-0.5 text-[10px] flex items-center gap-1">
            <Star size={9} />
            Padrão
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-3">
        <p className="text-sm font-semibold text-slate-800 truncate">{template.name}</p>
        {template.description && (
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{template.description}</p>
        )}
        <p className="text-[10px] text-slate-400 mt-1">{pageCount} {pageCount === 1 ? 'página' : 'páginas'} · {createdAt}</p>
      </div>

      {/* Actions */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <button
          onClick={onUse}
          className={cn(
            'flex-1 text-xs font-medium rounded-lg py-1.5 transition-colors',
            isActive
              ? 'bg-blue-50 text-blue-600 border border-blue-200'
              : 'bg-slate-800 text-white hover:bg-slate-700'
          )}
        >
          {isActive ? 'Em uso' : 'Usar template'}
        </button>
        {onRename && (
          <button onClick={onRename} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <Pencil size={13} />
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

export function ProposalTemplateGallery({ onUseTemplate }: Props) {
  const activeTemplateId  = useSolarStore((s) => s.proposalData.activeTemplateId);
  const customTemplates   = useSolarStore((s) => s.proposalData.customTemplates);
  const applyTemplate     = useSolarStore((s) => s.applyTemplate);
  const deleteCustomTemplate = useSolarStore((s) => s.deleteCustomTemplate);
  const updateProposalData   = useSolarStore((s) => s.updateProposalData);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const allTemplates: ProposalTemplate[] = [...BUILT_IN_TEMPLATES, ...customTemplates];

  const handleUse = (template: ProposalTemplate) => {
    applyTemplate(template);
    onUseTemplate();
  };

  const handleRename = (template: ProposalTemplate) => {
    setRenamingId(template.id);
    setRenameValue(template.name);
  };

  const confirmRename = () => {
    if (!renamingId || !renameValue.trim()) return;
    const updated = customTemplates.map((t) =>
      t.id === renamingId ? { ...t, name: renameValue.trim() } : t
    );
    updateProposalData({ customTemplates: updated });
    setRenamingId(null);
  };

  const handleCreateBlank = () => {
    const blank: ProposalTemplate = {
      id: `custom-${Date.now()}`,
      name: 'Novo template',
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
      theme: { primaryColor: '#1e293b', accentColor: '#10b981', fontFamily: 'system' },
      pages: [{
        id: `p-${Date.now()}`,
        label: 'Página 1',
        background: { color: '#ffffff' },
        elements: [],
      }],
    };
    updateProposalData({ customTemplates: [...customTemplates, blank] });
    handleUse(blank);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Templates de Proposta</h3>
            <p className="text-xs text-slate-500 mt-0.5">Escolha um template ou crie do zero</p>
          </div>
          <button
            onClick={handleCreateBlank}
            className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Plus size={13} />
            Criar do zero
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {renamingId && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <LayoutTemplate size={14} className="text-blue-500 shrink-0" />
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenamingId(null); }}
              autoFocus
              className="flex-1 text-sm border border-blue-300 rounded px-2 py-1 focus:outline-none"
              placeholder="Nome do template"
            />
            <button onClick={confirmRename} className="text-xs font-medium text-blue-600 hover:underline">Salvar</button>
            <button onClick={() => setRenamingId(null)} className="text-xs text-slate-400 hover:underline">Cancelar</button>
          </div>
        )}

        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {allTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isActive={activeTemplateId === template.id}
              onUse={() => handleUse(template)}
              onRename={!template.isBuiltIn ? () => handleRename(template) : undefined}
              onDelete={!template.isBuiltIn ? () => deleteCustomTemplate(template.id) : undefined}
            />
          ))}
        </div>

        {customTemplates.length === 0 && (
          <div className="mt-6 text-center text-sm text-slate-400">
            <LayoutTemplate size={28} className="mx-auto mb-2 opacity-30" />
            <p>Seus templates salvos aparecerão aqui.</p>
            <p className="text-xs mt-1">Use "Salvar como template" no editor para criar um.</p>
          </div>
        )}
      </div>
    </div>
  );
}
