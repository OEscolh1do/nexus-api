
import React from 'react';
import { User } from 'lucide-react';
import { DenseCard, DenseFormGrid, DenseInput } from '@/components/ui/dense-form';
import { useSolarStore } from '@/core/state/solarStore';

export const CustomerIdentity: React.FC = () => {
  const clientData = useSolarStore(state => state.clientData);
  const updateClientData = useSolarStore(state => state.updateClientData);

  const handleChange = (field: keyof typeof clientData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    updateClientData({ [field]: e.target.value });
  };

  return (
    <DenseCard className="h-full">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <User size={12} className="text-neonorte-purple" />
        Identificação do Cliente
      </h4>
      <DenseFormGrid>
        <DenseInput
          label="Nome / Razão Social"
          value={clientData.clientName}
          onChange={handleChange('clientName')}
          placeholder="Nome completo do cliente"
          colSpan={12}
          required
        />
        {/* Placeholder para futuros campos de contato se necessario */}
        {/* 
        <DenseInput
          label="Email"
          value={clientData.email || ''}
          onChange={handleChange('email')} 
          colSpan={6}
          icon={<Mail size={12}/>}
        /> 
        */}
      </DenseFormGrid>
    </DenseCard>
  );
};
