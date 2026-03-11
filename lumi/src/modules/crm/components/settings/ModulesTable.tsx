import React, { useState } from 'react';
import { useEquipmentStore } from '../../store/useEquipmentStore';
import { PVModule } from '../../constants/pvModules';
import { Edit, Trash2, Plus, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/simple-dialog';
import { DenseButton, DenseInput } from '@/components/ui/dense-form';

export const ModulesTable: React.FC = () => {
    const { modules, addModule, updateModule, deleteModule } = useEquipmentStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<Partial<PVModule> | null>(null);

    const handleEdit = (module: PVModule) => {
        setEditingModule(module);
        setIsDialogOpen(true);
    };

    const handleAddNew = () => {
        setEditingModule({
            id: `custom-module-${Date.now()}`,
            type: 'Monocristalino',
            dimensions: { length: 0, width: 0, thickness: 30 },
            electrical: { pmax: 0, efficiency: 0, imp: 0, vmp: 0, isc: 0, voc: 0, maxFuse: 0 },
            temperature: { coeffPmax: -0.35 },
            weight: 0,
            area: 0,
            cells: 0
        });
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (!editingModule || !editingModule.id) return;
        
        const moduleToSave = {
            ...editingModule,
             dimensions: editingModule.dimensions || { length: 0, width: 0, thickness: 0 },
             electrical: editingModule.electrical || { pmax: 0, efficiency: 0, imp: 0, vmp: 0, isc: 0, voc: 0, maxFuse: 0 },
             temperature: editingModule.temperature || { coeffPmax: 0 },
        } as PVModule;
        
        if (moduleToSave.dimensions.length && moduleToSave.dimensions.width) {
            moduleToSave.area = (moduleToSave.dimensions.length * moduleToSave.dimensions.width) / 1000000;
        }

        const existing = modules.find(m => m.id === editingModule.id);
        if (existing) {
            updateModule(editingModule.id, moduleToSave);
        } else {
            addModule(moduleToSave);
        }
        setIsDialogOpen(false);
        setEditingModule(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este módulo?')) {
            deleteModule(id);
        }
    };

    const updateField = (path: string, value: any) => {
         setEditingModule(prev => {
            if (!prev) return null;
            const parts = path.split('.');
            if (parts.length === 2) {
                 return {
                    ...prev,
                    [parts[0]]: {
                        ...(prev as any)[parts[0]],
                        [parts[1]]: value
                    }
                };
            }
            return { ...prev, [path]: value };
        });
    };

    return (
        <div className="space-y-4">
             <div className="flex justify-end">
                <DenseButton onClick={handleAddNew} variant="primary" size="sm" icon={<Plus size={14} />}>
                    Novo Módulo
                </DenseButton>
            </div>

            <div className="rounded-md border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Fabricante / Modelo</th>
                            <th className="px-4 py-3">Potência</th>
                            <th className="px-4 py-3">Tecnologia</th>
                             <th className="px-4 py-3">Dimensões (mm)</th>
                            <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {modules.map(module => (
                            <tr key={module.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3">
                                    <div className="font-bold text-slate-700">{module.manufacturer}</div>
                                    <div className="text-xs text-slate-400">{module.model}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="inline-flex items-center gap-1 font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">
                                        <Zap size={10} />
                                        {module.electrical.pmax} W
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600">{module.type}</td>
                                 <td className="px-4 py-3 text-xs text-slate-400">
                                    {module.dimensions.length}x{module.dimensions.width}x{module.dimensions.thickness}
                                </td>
                                <td className="px-4 py-3 text-right space-x-2">
                                    <button onClick={() => handleEdit(module)} className="text-slate-400 hover:text-blue-500 transition-colors">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(module.id)} className="text-slate-400 hover:text-red-500 transition-colors">
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
                        <DialogTitle>{editingModule?.id?.startsWith('custom') ? 'Adicionar Módulo' : 'Editar Módulo'}</DialogTitle>
                        <DialogDescription>
                            Preencha os dados técnicos do módulo fotovoltaico.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {editingModule && (
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2 col-span-2">
                                <h4 className="text-sm font-bold text-slate-900 border-b pb-1">Identificação</h4>
                            </div>
                            <DenseInput label="Fabricante" value={editingModule.manufacturer || ''} onChange={(e) => updateField('manufacturer', e.target.value)} colSpan={6} />
                            <DenseInput label="Modelo" value={editingModule.model || ''} onChange={(e) => updateField('model', e.target.value)} colSpan={6} />
                            <DenseInput label="Tipo/Tecnologia" value={editingModule.type || ''} onChange={(e) => updateField('type', e.target.value)} colSpan={6} />
                            <DenseInput label="Fornecedor" value={editingModule.supplier || ''} onChange={(e) => updateField('supplier', e.target.value)} colSpan={6} />

                             <div className="space-y-2 col-span-2 mt-4">
                                <h4 className="text-sm font-bold text-slate-900 border-b pb-1">Elétrica (STC)</h4>
                            </div>
                            <DenseInput label="Potência Máx (Pmax) [W]" type="number" value={editingModule.electrical?.pmax || 0} onChange={(e) => updateField('electrical.pmax', Number(e.target.value))} colSpan={6} />
                            <DenseInput label="Eficiência [%]" type="number" value={editingModule.electrical?.efficiency || 0} onChange={(e) => updateField('electrical.efficiency', Number(e.target.value))} colSpan={6} />
                            <DenseInput label="Tensão Máx (Vmp) [V]" type="number" value={editingModule.electrical?.vmp || 0} onChange={(e) => updateField('electrical.vmp', Number(e.target.value))} colSpan={6} />
                            <DenseInput label="Corrente Máx (Imp) [A]" type="number" value={editingModule.electrical?.imp || 0} onChange={(e) => updateField('electrical.imp', Number(e.target.value))} colSpan={6} />
                            <DenseInput label="Tensão Circuito Aberto (Voc) [V]" type="number" value={editingModule.electrical?.voc || 0} onChange={(e) => updateField('electrical.voc', Number(e.target.value))} colSpan={6} />
                            <DenseInput label="Corrente Curto-Circuito (Isc) [A]" type="number" value={editingModule.electrical?.isc || 0} onChange={(e) => updateField('electrical.isc', Number(e.target.value))} colSpan={6} />

                             <div className="space-y-2 col-span-2 mt-4">
                                <h4 className="text-sm font-bold text-slate-900 border-b pb-1">Mecânica & Temperatura</h4>
                            </div>
                            <div className="grid grid-cols-3 gap-2 col-span-2">
                                <DenseInput label="Comprimento (mm)" type="number" value={editingModule.dimensions?.length || 0} onChange={(e) => updateField('dimensions.length', Number(e.target.value))} colSpan={4} />
                                <DenseInput label="Largura (mm)" type="number" value={editingModule.dimensions?.width || 0} onChange={(e) => updateField('dimensions.width', Number(e.target.value))} colSpan={4} />
                                <DenseInput label="Espessura (mm)" type="number" value={editingModule.dimensions?.thickness || 0} onChange={(e) => updateField('dimensions.thickness', Number(e.target.value))} colSpan={4} />
                            </div>
                            <DenseInput label="Peso (kg)" type="number" value={editingModule.weight || 0} onChange={(e) => updateField('weight', Number(e.target.value))} colSpan={6} />
                            <DenseInput label="Coef. Pmax (%/°C)" type="number" value={editingModule.temperature?.coeffPmax || 0} onChange={(e) => updateField('temperature.coeffPmax', Number(e.target.value))} colSpan={6} />
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
