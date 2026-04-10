import React from 'react';
import { MapPin } from 'lucide-react';

export const SiteCanvasView: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[60vh] p-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
      <div className="p-4 rounded-full bg-emerald-500/10 mb-4 border border-emerald-500/20">
        <MapPin size={32} className="text-emerald-400" />
      </div>
      <h2 className="text-2xl font-black text-slate-300 tracking-tight">Dossiê Técnico de Instalação</h2>
      <p className="text-slate-500 mt-2 max-w-md text-center">
        Em construção (Fase 2). Este painel abrigará dados aprofundados da infraestrutura física do cliente, climatologia premium e metadados de vistoria.
      </p>
    </div>
  );
};
