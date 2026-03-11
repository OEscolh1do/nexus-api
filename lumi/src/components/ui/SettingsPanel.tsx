
import React, { useState } from 'react';
import { EngineeringSettings } from '@/core/types';
import {
  X,
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  HardHat,
  DollarSign,
  Activity,
  Percent,
  Building2,
  Wrench
} from 'lucide-react';

interface Props {
  settings: EngineeringSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newSettings: EngineeringSettings) => void;
}

type TabType = 'performance' | 'comercial' | 'institucional';

export const SettingsPanel: React.FC<Props> = ({ settings, isOpen, onClose, onSave }) => {
  const [localSettings, setLocalSettings] = useState<EngineeringSettings>(settings);
  const [activeTab, setActiveTab] = useState<TabType>('performance');

  if (!isOpen) return null;

  const handleChange = (path: string, value: any) => {
    const parts = path.split('.');
    if (parts.length === 2) {
      setLocalSettings(prev => ({
        ...prev,
        [parts[0]]: {
          ...(prev as any)[parts[0]],
          [parts[1]]: value
        }
      }));
    } else {
      setLocalSettings(prev => ({ ...prev, [path]: value }));
    }
  };

  const TabButton: React.FC<{ id: TabType; label: string; icon: React.ReactNode }> = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex flex-col items-center gap-2 py-3 px-4 border-b-2 transition-all flex-1 ${activeTab === id
          ? 'border-orange-500 text-orange-500 bg-orange-500/5'
          : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
        }`}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-xl h-full bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-white/10">

        {/* Header */}
        <div className="p-8 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/20 p-2 rounded-xl">
              <SettingsIcon size={24} className="text-orange-500" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Configurações Mestres</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={28} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/5">
          <TabButton id="performance" label="Performance" icon={<Activity size={18} />} />
          <TabButton id="comercial" label="Precificação" icon={<DollarSign size={18} />} />
          <TabButton id="institucional" label="Institucional" icon={<Building2 size={18} />} />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

          {activeTab === 'performance' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <section className="space-y-6">
                <div className="flex items-center gap-2 text-orange-500">
                  <Activity size={18} />
                  <h3 className="text-xs font-black uppercase tracking-widest">Física & Rendimento</h3>
                </div>

                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6">
                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Performance Ratio Global (PR)</label>
                      <span className="text-xs font-bold text-orange-400">{(localSettings.performanceRatio * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range" min="0.5" max="0.9" step="0.01"
                      value={localSettings.performanceRatio}
                      onChange={(e) => handleChange('performanceRatio', parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Inflação Energética (a.a.)</label>
                      <span className="text-xs font-bold text-orange-400">{(localSettings.energyInflationRate * 100).toFixed(1)}%</span>
                    </div>
                    <input
                      type="range" min="0.0" max="0.15" step="0.001"
                      value={localSettings.energyInflationRate}
                      onChange={(e) => handleChange('energyInflationRate', parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(localSettings.orientationFactors).map(([key, val]) => (
                      <div key={key}>
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Fator: {key}</label>
                        <input
                          type="number" step="0.01"
                          value={val}
                          onChange={(e) => handleChange(`orientationFactors.${key}`, parseFloat(e.target.value))}
                          className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'comercial' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">

              {/* SERVICE SECTION */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 text-blue-500">
                  <Wrench size={18} />
                  <h3 className="text-xs font-black uppercase tracking-widest">Precificação do Serviço</h3>
                </div>

                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Montagem Telhado (Por Módulo)</label>
                      <input type="number" step="0.01" value={localSettings.serviceUnitModule} onChange={e => handleChange('serviceUnitModule', parseFloat(e.target.value))} className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Estrutura (Por Par)</label>
                      <input type="number" step="0.01" value={localSettings.serviceUnitStructure} onChange={e => handleChange('serviceUnitStructure', parseFloat(e.target.value))} className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Instalação Inversor</label>
                      <input type="number" step="0.01" value={localSettings.serviceUnitInverter} onChange={e => handleChange('serviceUnitInverter', parseFloat(e.target.value))} className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Projeto, Regularização e ART</label>
                      <div className="flex gap-2">
                        <input type="number" value={localSettings.serviceProjectBase} onChange={e => handleChange('serviceProjectBase', parseFloat(e.target.value))} className="flex-1 bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Base" />
                        <input type="number" step="0.01" value={localSettings.serviceProjectPercent} onChange={e => handleChange('serviceProjectPercent', parseFloat(e.target.value))} className="w-24 bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-orange-400 outline-none focus:ring-2 focus:ring-orange-500" placeholder="%" />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Adm e Despesas Gerais</label>
                      <div className="flex gap-2">
                        <input type="number" value={localSettings.serviceAdminBase} onChange={e => handleChange('serviceAdminBase', parseFloat(e.target.value))} className="flex-1 bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Base" />
                        <input type="number" step="0.01" value={localSettings.serviceAdminPercent} onChange={e => handleChange('serviceAdminPercent', parseFloat(e.target.value))} className="w-24 bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-orange-400 outline-none focus:ring-2 focus:ring-orange-500" placeholder="%" />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Materiais (% sobre soma serviços)</label>
                      <input type="number" step="0.01" value={localSettings.serviceMaterialsPercent} onChange={e => handleChange('serviceMaterialsPercent', parseFloat(e.target.value))} className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-orange-400 outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                  </div>
                </div>
              </section>

              {/* MARGINS SECTION */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 text-purple-500">
                  <Percent size={18} />
                  <h3 className="text-xs font-black uppercase tracking-widest">Margens de Operação</h3>
                </div>

                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Lucro</label>
                    <input
                      type="number" step="0.01"
                      value={localSettings.marginPercentage}
                      onChange={(e) => handleChange('marginPercentage', parseFloat(e.target.value))}
                      className="w-full bg-slate-800 border border-white/5 rounded-xl px-2 py-3 text-center text-xs font-bold text-white outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="text-center">
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Comissão</label>
                    <input
                      type="number" step="0.01"
                      value={localSettings.commissionPercentage}
                      onChange={(e) => handleChange('commissionPercentage', parseFloat(e.target.value))}
                      className="w-full bg-slate-800 border border-white/5 rounded-xl px-2 py-3 text-center text-xs font-bold text-white outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="text-center">
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Impostos</label>
                    <input
                      type="number" step="0.01"
                      value={localSettings.taxPercentage}
                      onChange={(e) => handleChange('taxPercentage', parseFloat(e.target.value))}
                      className="w-full bg-slate-800 border border-white/5 rounded-xl px-2 py-3 text-center text-xs font-bold text-white outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'institucional' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <section className="space-y-6">
                <div className="flex items-center gap-2 text-purple-500">
                  <HardHat size={18} />
                  <h3 className="text-xs font-black uppercase tracking-widest">Engenheiro Responsável</h3>
                </div>

                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Nome Completo</label>
                    <input
                      type="text"
                      value={localSettings.engineerName}
                      onChange={(e) => handleChange('engineerName', e.target.value)}
                      className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">CREA/CONFEA</label>
                      <input
                        type="text"
                        value={localSettings.creaNumber}
                        onChange={(e) => handleChange('creaNumber', e.target.value)}
                        className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">CNPJ Corporativo</label>
                      <input
                        type="text"
                        value={localSettings.companyCnpj}
                        onChange={(e) => handleChange('companyCnpj', e.target.value)}
                        className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-white/10 bg-slate-900/50 flex gap-4">
          <button
            onClick={() => onSave(localSettings)}
            className="flex-1 bg-orange-600 hover:bg-orange-500 py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-2 uppercase tracking-widest transition-all active:scale-95"
          >
            <Save size={20} /> Salvar Parâmetros
          </button>
          <button
            onClick={() => {
              if (window.confirm("Deseja resetar para os valores iniciais?")) {
                setLocalSettings(settings);
              }
            }}
            className="px-6 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 transition-colors"
            title="Resetar"
          >
            <RefreshCw size={20} />
          </button>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};
