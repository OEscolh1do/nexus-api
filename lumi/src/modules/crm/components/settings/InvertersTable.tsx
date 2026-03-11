import React, { useState } from 'react';
import { useEquipmentStore, Inverter } from '../../store/useEquipmentStore';
import { Edit, Trash2, Plus, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/simple-dialog';
import { DenseButton, DenseInput, DenseSelect } from '@/components/ui/dense-form';

export const InvertersTable: React.FC = () => {
    const { inverters, addInverter, updateInverter, deleteInverter } = useEquipmentStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingInverter, setEditingInverter] = useState<Partial<Inverter> | null>(null);

    const handleEdit = (inv: Inverter) => {
        setEditingInverter(inv);
        setIsDialogOpen(true);
    };

    const handleAddNew = () => {
        setEditingInverter({
            id: `custom-inverter-${Date.now()}`,
            manufacturer: '',
            model: '',
            nominalPower: 0,
            maxInputVoltage: 0,
            minInputVoltage: 0,
            maxInputCurrent: 0,
            maxOutputCurrent: 0,
            outputVoltage: 220,
            outputFrequency: 60,
            maxEfficiency: 97,
            connectionType: 'MONOFÁSICO',
            weight: 0
        });
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (!editingInverter || !editingInverter.id) return;
        
        const invToSave = { ...editingInverter } as Inverter;

        const existing = inverters.find(i => i.id === editingInverter.id);
        if (existing) {
            updateInverter(editingInverter.id, invToSave);
        } else {
            addInverter(invToSave);
        }
        setIsDialogOpen(false);
        setEditingInverter(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este inversor?')) {
            deleteInverter(id);
        }
    };

    const updateField = (field: keyof Inverter, value: any) => {
         setEditingInverter(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    return (
        <div className="space-y-4">
             <div className="flex justify-end">
                <DenseButton onClick={handleAddNew} variant="primary" size="sm" icon={<Plus size={14} />}>
                    Novo Inversor
                </DenseButton>
            </div>

            <div className="rounded-md border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Fabricante / Modelo</th>
                            <th className="px-4 py-3">Potência</th>
                            <th className="px-4 py-3">Tensão Saída</th>
                            <th className="px-4 py-3">MPPTs</th>
                            <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {inverters.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3">
                                    <div className="font-bold text-slate-700">{inv.manufacturer}</div>
                                    <div className="text-xs text-slate-400">{inv.model}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="inline-flex items-center gap-1 font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded text-xs">
                                        <Zap size={10} />
                                        {inv.nominalPower} kW
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600">{inv.outputVoltage} V ({inv.connectionType})</td>
                                 <td className="px-4 py-3 text-xs text-slate-400">
                                    - {/* TODO: Add MPPT quantity to schema if needed */}
                                </td>
                                <td className="px-4 py-3 text-right space-x-2">
                                    <button onClick={() => handleEdit(inv)} className="text-slate-400 hover:text-blue-500 transition-colors">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(inv.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingInverter?.id?.startsWith('custom') ? 'Adicionar Inversor' : 'Editar Inversor'}</DialogTitle>
                        <DialogDescription>
                            Preencha os dados técnicos do inversor.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {editingInverter && (
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2 col-span-2">
                                <h4 className="text-sm font-bold text-slate-900 border-b pb-1">Identificação</h4>
                            </div>
                            <DenseInput label="Fabricante" value={editingInverter.manufacturer || ''} onChange={(e) => updateField('manufacturer', e.target.value)} colSpan={6} />
                            <DenseInput label="Modelo" value={editingInverter.model || ''} onChange={(e) => updateField('model', e.target.value)} colSpan={6} />
                            <DenseSelect 
                                label="Ligação" 
                                value={editingInverter.connectionType || 'MONOFÁSICO'} 
                                onChange={(e) => updateField('connectionType', e.target.value)}
                                options={[
                                    { value: 'MONOFÁSICO', label: 'Monofásico' },
                                    { value: 'BIFÁSICO', label: 'Bifásico' },
                                    { value: 'TRIFÁSICO', label: 'Trifásico' }
                                ]}
                                colSpan={6} 
                            />
                             <DenseInput label="Peso (kg)" type="number" value={editingInverter.weight || 0} onChange={(e) => updateField('weight', Number(e.target.value))} colSpan={6} />

                             <div className="space-y-2 col-span-2 mt-4">
                                <h4 className="text-sm font-bold text-slate-900 border-b pb-1">Elétrica (Entrada DC)</h4>
                            </div>
                            <DenseInput label="Potência Nominal [kW]" type="number" value={editingInverter.nominalPower || 0} onChange={(e) => updateField('nominalPower', Number(e.target.value))} colSpan={6} />
                            <DenseInput label="Eficiência Máx [%]" type="number" value={editingInverter.maxEfficiency || 0} onChange={(e) => updateField('maxEfficiency', Number(e.target.value))} colSpan={6} />
                            <DenseInput label="Tensão Máx Entrada [V]" type="number" value={editingInverter.maxInputVoltage || 0} onChange={(e) => updateField('maxInputVoltage', Number(e.target.value))} colSpan={6} />
                            <DenseInput label="Tensão Min Entrada [V]" type="number" value={editingInverter.minInputVoltage || 0} onChange={(e) => updateField('minInputVoltage', Number(e.target.value))} colSpan={6} />
                            <DenseInput label="Corrente Máx Entrada [A]" type="number" value={editingInverter.maxInputCurrent || 0} onChange={(e) => updateField('maxInputCurrent', Number(e.target.value))} colSpan={6} />

                             <div className="space-y-2 col-span-2 mt-4">
                                <h4 className="text-sm font-bold text-slate-900 border-b pb-1">Elétrica (Saída AC)</h4>
                            </div>
                            <DenseInput label="Tensão Saída [V]" type="number" value={editingInverter.outputVoltage || 0} onChange={(e) => updateField('outputVoltage', Number(e.target.value))} colSpan={6} />
                            <DenseInput label="Corrente Máx Saída [A]" type="number" value={editingInverter.maxOutputCurrent || 0} onChange={(e) => updateField('maxOutputCurrent', Number(e.target.value))} colSpan={6} />
                             <DenseInput label="Frequência [Hz]" type="number" value={editingInverter.outputFrequency || 0} onChange={(e) => updateField('outputFrequency', Number(e.target.value))} colSpan={12} />
                        </div>
                    )}

                    <DialogFooter>
                        <DenseButton variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</DenseButton>
                        <DenseButton onClick={handleSave}>Salvar Equipamento</DenseButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
