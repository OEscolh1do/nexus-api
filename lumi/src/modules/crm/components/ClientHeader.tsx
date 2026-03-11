import React from 'react';
import { User, MapPin, Edit2 } from 'lucide-react';
import { useSolarStore } from '@/core/state/solarStore';

export const ClientHeader: React.FC = () => {
  const clientData = useSolarStore(state => state.clientData);
  const updateClientData = useSolarStore(state => state.updateClientData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateClientData({ clientName: e.target.value });
  };

  return (
    <div className="w-full h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20 relative shadow-sm">
      {/* Identity Section */}
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 rounded-full bg-neonorte-purple/10 flex items-center justify-center text-neonorte-purple border border-neonorte-purple/20">
            <User size={20} />
        </div>
        
        <div className="flex flex-col">
            <div className="flex items-center gap-2 group">
                <input 
                    className="text-lg font-bold text-slate-800 bg-transparent border-none p-0 focus:ring-0 focus:bg-slate-50 hover:bg-slate-50 rounded px-1 transition-colors pl-0 cursor-pointer placeholder:text-slate-300 w-auto min-w-[200px]"
                    value={clientData.clientName}
                    onChange={handleChange}
                    placeholder="Nome do Cliente"
                />
                <Edit2 size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                    <MapPin size={10} />
                    {clientData.city || 'Cidade'} - {clientData.state || 'UF'}
                </span>
                {/* Placeholder for phone if added to store later */}
                {/* <span className="flex items-center gap-1">
                    <Phone size={10} />
                    (00) 00000-0000
                </span> */}
            </div>
        </div>
      </div>

      {/* Status / Meta Section */}
      <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wide border border-blue-100">
              Novo Lead
          </div>
          {/* Future actions can go here */}
      </div>
    </div>
  );
};
