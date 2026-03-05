import React, { useState } from 'react';
import { X, MapPin, Zap, MessageSquare, Plus, User, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/mock-components';

interface Lead {
  id: string;
  name: string;
  status: string;
  city?: string;
  state?: string;
  engagementScore: number;
  source?: string;
  phone?: string;
  email?: string;
  academyOrigin?: string;
  interactions?: { id: string; content: string; createdAt: string }[];
}

interface LeadDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onAddInteraction: (type: string, content: string) => void;
}

export const LeadDrawer: React.FC<LeadDrawerProps> = ({ lead, isOpen, onClose, onAddInteraction }) => {
  const [noteContent, setNoteContent] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'tech'>('overview');

  if (!isOpen || !lead) return null;

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    onAddInteraction('NOTE', noteContent);
    setNoteContent('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>

      {/* Drawer */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">{lead.name}</h2>
              {lead.engagementScore > 50 && (
                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                  <Zap size={12} fill="currentColor" /> RISING STAR
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              {lead.city && (
                <span className="flex items-center gap-1"><MapPin size={14} /> {lead.city}/{lead.state}</span>
              )}
              {lead.source && (
                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium uppercase">{lead.source}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* Tabs Content */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950">
          <div className="border-b border-slate-100 px-6 flex gap-6 text-sm font-medium text-slate-500 sticky top-0 bg-white z-10 pt-4">
            <button 
                onClick={() => setActiveTab('overview')}
                className={`pb-3 border-b-2 transition-colors ${activeTab === 'overview' ? 'border-purple-600 text-purple-600' : 'border-transparent hover:text-slate-800'}`}
            >Visão Geral</button>
            <button 
                onClick={() => setActiveTab('timeline')}
                className={`pb-3 border-b-2 transition-colors ${activeTab === 'timeline' ? 'border-purple-600 text-purple-600' : 'border-transparent hover:text-slate-800'}`}
            >Linha do Tempo</button>
            <button 
                onClick={() => setActiveTab('tech')}
                className={`pb-3 border-b-2 transition-colors ${activeTab === 'tech' ? 'border-purple-600 text-purple-600' : 'border-transparent hover:text-slate-800'}`}
            >Perfil Técnico</button>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Contato</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <Phone size={16} className="text-slate-400" />
                        <span className="font-mono text-slate-700">{lead.phone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail size={16} className="text-slate-400" />
                        <span className="text-slate-700">{lead.email || 'Não informado'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Métricas</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-2xl font-black text-slate-800">{lead.engagementScore || 0}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Engajamento</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-slate-800">0</p>
                        <p className="text-[10px] text-slate-500 uppercase">Propostas</p>
                      </div>
                    </div>
                  </div>
                </div>

                {lead.academyOrigin && (
                  <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-xl">
                    <h4 className="font-bold text-purple-900 flex items-center gap-2">
                      <User size={16} /> Aluno Academy
                    </h4>
                    <p className="text-sm text-purple-700 mt-1">Originário da Masterclass: <strong>{lead.academyOrigin}</strong></p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <form onSubmit={handleSubmitNote} className="flex gap-2 mb-8">
                  <input 
                    type="text" 
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Adicionar nota rápida..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <Button type="submit" size="sm"><Plus size={16} /></Button>
                </form>

                <div className="space-y-6 relative before:absolute before:left-[19px] before:top-0 before:bottom-0 before:w-[2px] before:bg-slate-100">
                  {lead.interactions?.map((item: { id: string; content: string; createdAt: string }) => (
                    <div key={item.id} className="relative pl-12">
                      <div className="absolute left-0 top-0 w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-sm z-10">
                        <MessageSquare size={16} className="text-slate-400" />
                      </div>
                      <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                        <p className="text-sm text-slate-700">{item.content}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-wider">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )) || <p className="text-slate-400 text-sm text-center italic">Nenhuma interação registrada.</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-4">
           {/* Link to Solar Wizard if available */}
           <Button className="w-full bg-purple-600 hover:bg-purple-700">Nova Proposta</Button>
           <Button variant="outline" className="w-full">Agendar Visita</Button>
        </div>
      </div>
    </div>
  );
};
