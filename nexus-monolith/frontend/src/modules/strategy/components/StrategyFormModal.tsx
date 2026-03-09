import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, Input } from '../../../components/ui/mock-components'; // Adjusted path
import { X, Save } from 'lucide-react';
import type { Strategy } from '../types';
import { api } from '../../../lib/api'; // Needed to fetch users

const strategySchema = z.object({
  title: z.string().min(3, "Título obrigatório"),
  type: z.enum(['PILLAR', 'INITIATIVE', 'ACTION']),
  description: z.string().optional(),
  code: z.string().optional(),
  colorCode: z.string().optional(),
  ownerId: z.string().optional().nullable()
});

interface StrategyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Strategy>) => void;
  initialData?: Strategy | null;
  parentId?: string | null;
}

export const StrategyFormModal: React.FC<StrategyFormModalProps> = ({ isOpen, onClose, onSave, initialData, parentId }) => {
  const [users, setUsers] = React.useState<{ id: string, fullName: string }[]>([]);

  React.useEffect(() => {
    // Fetch users for the owner select
    api.get('/users').then(res => {
      setUsers(res.data?.data || []);
    }).catch(console.error);
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(strategySchema),
    defaultValues: initialData || { type: 'PILLAR', colorCode: '#6366f1' }
  });

  if (!isOpen) return null;

  const onSubmit = (data: Partial<Strategy>) => {
    onSave({
      ...data,
      parentId: parentId || undefined,
      startDate: new Date().toISOString(), // Mock dates for now
      endDate: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-lg">{initialData ? 'Editar Estratégia' : 'Nova Estratégia'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Tipo</label>
            <select {...register('type')} className="w-full border rounded p-2 bg-transparent">
              <option value="PILLAR">Pilar Estratégico</option>
              <option value="INITIATIVE">Iniciativa Tática</option>
              <option value="ACTION">Ação Operacional</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Responsável (Dono)</label>
            <select {...register('ownerId')} className="w-full border rounded p-2 bg-transparent text-slate-700 dark:text-slate-200">
              <option value="">Sem responsável</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Título</label>
            <Input {...register('title')} placeholder="Ex: Eficiência Operacional" />
            {errors.title && <span className="text-xs text-red-500">{String(errors.title.message)}</span>}
          </div>

          <div>
            <label className="text-sm font-medium">Código (Sigla)</label>
            <Input {...register('code')} placeholder="Ex: EO-26" />
          </div>

          <div>
            <label className="text-sm font-medium">Cor (Hex)</label>
            <div className="flex gap-2">
              <Input type="color" {...register('colorCode')} className="w-12 h-10 p-1" />
              <Input {...register('colorCode')} placeholder="#000000" className="flex-1" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Descrição</label>
            <Input {...register('description')} placeholder="Breve descrição da meta..." />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit"><Save size={16} className="mr-2" /> Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
