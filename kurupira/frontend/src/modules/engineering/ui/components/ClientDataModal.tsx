import React from 'react';
import { X } from 'lucide-react';
import { CustomerTab } from '../../tabs/CustomerTab';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ClientDataModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] flex flex-col bg-slate-50 rounded-2xl shadow-2xl overflow-hidden mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">Dados do Cliente & Localização</h2>
            <p className="text-xs text-slate-400 mt-0.5">Confirme a localização para carregar dados climáticos e calcular a geração estimada.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body — CustomerTab already handles its own layout */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <CustomerTab onConfirm={onClose} />
        </div>
      </div>
    </div>
  );
};
