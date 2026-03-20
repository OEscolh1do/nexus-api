/**
 * =============================================================================
 * LEAD CONTEXT PANEL — Painel de Contexto Comercial (M2M)
 * =============================================================================
 * 
 * Exibe dados do Lead injetados via API do Kurupira (que consome do Iaçã).
 * Se indisponível, exibe badge de fallback sem bloquear o engenheiro.
 * 
 * =============================================================================
 */

import React from 'react';
import { User, Phone, MapPin, Zap, AlertTriangle } from 'lucide-react';

export interface LeadContext {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  energyBillUrl?: string;
  unavailable?: boolean;
  message?: string;
}

interface LeadContextPanelProps {
  leadContext: LeadContext | null;
  loading?: boolean;
}

export const LeadContextPanel: React.FC<LeadContextPanelProps> = ({ leadContext, loading }) => {
  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
        <div className="h-3 bg-slate-700 rounded w-1/2" />
      </div>
    );
  }

  if (!leadContext || leadContext.unavailable) {
    return (
      <div className="bg-amber-900/20 backdrop-blur-sm rounded-lg p-3 border border-amber-700/30">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertTriangle size={14} />
          <span className="text-xs font-semibold">Contexto Comercial Indisponível</span>
        </div>
        <p className="text-[10px] text-amber-400/60 mt-1">
          {leadContext?.message || 'A tentar reconectar ao Iaçã...'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 bg-emerald-500/20 rounded-full flex items-center justify-center">
          <User size={14} className="text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">{leadContext.name}</p>
          <p className="text-[10px] text-slate-400">Cliente</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {leadContext.phone && (
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Phone size={11} className="text-slate-500 shrink-0" />
            <span className="truncate">{leadContext.phone}</span>
          </div>
        )}
        {(leadContext.city || leadContext.state) && (
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <MapPin size={11} className="text-slate-500 shrink-0" />
            <span className="truncate">
              {[leadContext.city, leadContext.state].filter(Boolean).join(', ')}
            </span>
          </div>
        )}
        {leadContext.energyBillUrl && (
          <a
            href={leadContext.energyBillUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Zap size={11} className="shrink-0" />
            <span>Ver fatura de energia</span>
          </a>
        )}
      </div>
    </div>
  );
};
