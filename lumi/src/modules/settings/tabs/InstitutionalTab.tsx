import React from 'react';
import { HardHat } from 'lucide-react';
import { DenseCard } from '@/components/ui/dense-form';
import { EngineeringSettings } from '@/core/types';

interface InstitutionalTabProps {
  settings: EngineeringSettings;
  onChange: (path: string, value: number | string) => void;
}

export const InstitutionalTab: React.FC<InstitutionalTabProps> = ({ settings, onChange }) => {
  return (
    <>
      <DenseCard>
        <h3 className="text-xs font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
          <HardHat size={14} className="text-orange-500" />
          Engenheiro Responsável
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome Completo</label>
            <input type="text" value={settings.engineerName} onChange={e => onChange('engineerName', e.target.value)} className="w-full bg-slate-50 border rounded px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CREA</label>
              <input type="text" value={settings.creaNumber} onChange={e => onChange('creaNumber', e.target.value)} className="w-full bg-slate-50 border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CNPJ</label>
              <input type="text" value={settings.companyCnpj} onChange={e => onChange('companyCnpj', e.target.value)} className="w-full bg-slate-50 border rounded px-3 py-2 text-sm" />
            </div>
          </div>
        </div>
      </DenseCard>
    </>
  );
};
