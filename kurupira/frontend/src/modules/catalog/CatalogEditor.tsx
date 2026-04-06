import React, { useState, useEffect } from 'react';
import { Settings, Plus, Cpu, Sun, CheckCircle, Search, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { ThumbnailDropzone } from './components/ThumbnailDropzone';
import { KurupiraClient, API_URL } from '@/services/NexusClient';

// Minimal types for forms
type ActiveTab = 'modules' | 'inverters';

export const CatalogEditor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('modules');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = activeTab === 'modules' 
        ? await KurupiraClient.catalog.modules() 
        : await KurupiraClient.catalog.inverters();
      setItems(data || []);
    } catch (e) {
      console.error("Failed to load catalog", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
            <Settings className="text-neonorte-purple" />
            Editor da Biblioteca
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie módulos, inversores e adicione thumbnails reais.</p>
        </div>
        
        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
          <button 
            onClick={() => { setActiveTab('modules'); setEditingItem(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'modules' ? 'bg-neonorte-purple text-white shadow' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sun size={16} /> Módulos PV
          </button>
          <button 
            onClick={() => { setActiveTab('inverters'); setEditingItem(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'inverters' ? 'bg-neonorte-purple text-white shadow' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Cpu size={16} /> Inversores
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* LISTING PANE */}
        <div className="w-1/2 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar modelo..." 
                className="w-full pl-9 pr-4 py-1.5 text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-neonorte-purple/20 focus:border-neonorte-purple"
              />
            </div>
            <button 
              onClick={() => setEditingItem({})} // Empty object triggers creation mode
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg shadow flex items-center gap-1 transition-colors"
            >
              <Plus size={16}/> Novo
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Carregando catálogo...</div>
            ) : items.map(item => (
              <button
                key={item.id}
                onClick={() => setEditingItem(item)}
                className={`w-full text-left p-3 rounded-lg flex items-center gap-4 transition-colors ${
                  editingItem?.id === item.id ? 'bg-neonorte-purple/10 border border-neonorte-purple/30' : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="w-12 h-12 bg-slate-100 rounded border border-slate-200 flex-shrink-0 overflow-hidden">
                   <img src={item.imageUrl ? (item.imageUrl.startsWith('http') ? item.imageUrl : `${API_URL}${item.imageUrl}`) : '/assets/images/solar-module.png'} alt={item.model} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item.manufacturer}</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{item.model}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* EDITOR PANE */}
        <div className="w-1/2 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">
          {!editingItem ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <Cpu size={48} className="mb-4 opacity-20" />
              <p>Selecione um item para editar ou crie um novo.</p>
            </div>
          ) : (
             <ComponentForm 
                type={activeTab} 
                initialData={editingItem} 
                onSaved={() => { fetchItems(); setEditingItem(null); }} 
                onCancel={() => setEditingItem(null)} 
             />
          )}
        </div>
      </div>
    </div>
  );
};

// =========================================================
// Inner Form Component
// =========================================================

const ComponentForm: React.FC<{ type: ActiveTab, initialData: any, onSaved: () => void, onCancel: () => void }> = ({ type, initialData, onSaved, onCancel }) => {
  const isNew = !initialData.id;
  const { register, handleSubmit, reset } = useForm({ defaultValues: initialData });
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    reset(initialData);
    setImageBlob(null);
  }, [initialData, reset]);

  const onSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      // Numbers parsing
      data.powerWp = Number(data.powerWp || 0);
      data.nominalPowerW = Number(data.nominalPowerW || 0);
      data.efficiency = Number(data.efficiency || 0);

      let savedItem;
      if (type === 'modules') {
        savedItem = isNew ? await KurupiraClient.catalog.createModule(data) : await KurupiraClient.catalog.updateModule(data.id, data);
        if (imageBlob && savedItem?.id) {
          await KurupiraClient.catalog.uploadModuleImage(savedItem.id, imageBlob);
        }
      } else {
        savedItem = isNew ? await KurupiraClient.catalog.createInverter(data) : await KurupiraClient.catalog.updateInverter(data.id, data);
        if (imageBlob && savedItem?.id) {
          await KurupiraClient.catalog.uploadInverterImage(savedItem.id, imageBlob);
        }
      }
      onSaved();
    } catch (e) {
      console.error("Save error:", e);
      alert("Erro ao salvar componente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h2 className="font-bold text-lg text-slate-800">
          {isNew ? `Novo ${type === 'modules' ? 'Módulo' : 'Inversor'}` : 'Editar Componente'}
        </h2>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-700"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Identificação</h3>
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fabricante</label>
                <input {...register('manufacturer')} className="w-full text-sm border-slate-200 rounded-lg p-2 bg-slate-50" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Modelo</label>
                <input {...register('model')} className="w-full text-sm border-slate-200 rounded-lg p-2 bg-slate-50" required />
              </div>
           </div>
        </div>

        <div>
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Técnico</h3>
           <div className="grid grid-cols-2 gap-4">
              {type === 'modules' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Potência (Wp)</label>
                    <input type="number" step="0.1" {...register('powerWp')} className="w-full text-sm border-slate-200 rounded-lg p-2 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Eficiência (%)</label>
                    <input type="number" step="0.01" {...register('efficiency')} className="w-full text-sm border-slate-200 rounded-lg p-2 bg-slate-50" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Potência Nominal (W)</label>
                    <input type="number" step="1" {...register('nominalPowerW')} className="w-full text-sm border-slate-200 rounded-lg p-2 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">MPPT Count</label>
                    <input type="number" step="1" {...register('mpptCount')} className="w-full text-sm border-slate-200 rounded-lg p-2 bg-slate-50" />
                  </div>
                </>
              )}
           </div>
        </div>

        <div>
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Foto / Thumbnail</h3>
           <ThumbnailDropzone 
             currentImageUrl={initialData.imageUrl ? (initialData.imageUrl.startsWith('http') ? initialData.imageUrl : `${API_URL}${initialData.imageUrl}`) : undefined} 
             onFileProcessed={(blob) => setImageBlob(blob)} 
           />
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
        <button type="submit" disabled={isSaving} className="px-5 py-2 bg-neonorte-purple hover:bg-neonorte-lightPurple text-white text-sm font-bold rounded-lg shadow transition-colors flex items-center gap-2 disabled:opacity-50">
          {isSaving ? 'Salvando...' : <><CheckCircle size={16}/> Salvar Componente</>}
        </button>
      </div>
    </form>
  )
};
