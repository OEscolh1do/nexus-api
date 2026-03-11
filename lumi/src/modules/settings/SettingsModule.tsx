/**
 * SETTINGS-MODULE.TSX - Wrapper para SettingsPanel (Inline Mode)
 * 
 * Adapta o SettingsPanel para uso inline no ProfileOrchestrator.
 * Gerencia EngineeringSettings via GLOBAL STORE (Zustand).
 */

import React, { useState } from 'react';
import { useSolarStore, selectSettings } from '@/core/state/solarStore';
import {
  Save,
  RotateCcw, // Reset icon
  Activity,
  DollarSign,
  Building2,
  Database,
  PiggyBank // Generic finance icon
} from 'lucide-react';
import { DenseButton } from '@/components/ui/dense-form';
import { SettingsService } from '@/services/SettingsService';

// Tabs Components
import { PerformanceTab } from './tabs/PerformanceTab';
import { PricingTab } from './tabs/PricingTab';
import { InstitutionalTab } from './tabs/InstitutionalTab';
import { FinanceTab } from './tabs/FinanceTab'; // New Tab
import { EquipmentDatabaseManager } from '../crm/components/settings/EquipmentDatabaseManager';

type TabType = 'performance' | 'comercial' | 'financeiro' | 'institucional' | 'equipamentos';

export const SettingsModule: React.FC = () => {
  const settings = useSolarStore(selectSettings);
  const updateSettings = useSolarStore(state => state.updateSettings);

  const [activeTab, setActiveTab] = useState<TabType>('performance');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Generic handler for all tabs
  const handleChange = (path: string, value: number | string) => {
    const parts = path.split('.');
    if (parts.length === 2) {
      // Handle nested objects like orientationFactors.norte
      // We need to construct the full nested object update
      // Current state slice update is shallow at top level often, 
      // but updateSettings expects partial<EngineeringSettings>.
      // So we need to merge with existing nested object.
      const parentKey = parts[0] as keyof typeof settings;
      const childKey = parts[1];

      const currentParent = settings[parentKey] as Record<string, number>;

      updateSettings({
        [parentKey]: {
          ...currentParent,
          [childKey]: value
        }
      } as any);
    } else {
      updateSettings({ [path]: value } as any);
    }
  };

  const handleReset = () => {
    if (window.confirm('Deseja restaurar as configurações padrão?')) {
      alert("Para restaurar os padrões, limpe os dados do navegador ou implemente a ação de reset na store.");
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      await SettingsService.saveSettingsToDB();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar settings", error);
      alert("Erro ao salvar as configurações no banco de dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const TabButton: React.FC<{ id: TabType; label: string; icon: React.ReactNode }> = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === id
          ? 'bg-purple-100 text-purple-700 shadow-sm border border-purple-200'
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
        }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header Standardized (h-12) with Integrated Tabs */}
      <header className="bg-white border-b border-slate-200 px-4 py-0 flex items-center justify-between shrink-0 h-12">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hidden md:block">PREMISSAS GERAIS</span>
          </div>

          {/* Tabs moved to header for compact layout */}
          <div className="flex bg-slate-100 p-1 rounded-lg items-center shrink-0">
            <TabButton id="performance" label="Engenharia" icon={<Activity size={12} />} />
            <TabButton id="equipamentos" label="Equipamentos" icon={<Database size={12} />} />
            <TabButton id="comercial" label="Preços" icon={<DollarSign size={12} />} />
            <TabButton id="financeiro" label="Financiamento" icon={<PiggyBank size={12} />} />
            <TabButton id="institucional" label="Empresa" icon={<Building2 size={12} />} />
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <DenseButton
            variant="ghost"
            size="sm"
            onClick={handleReset}
            icon={<RotateCcw size={14} className="text-slate-400" />}
            className="h-8 w-8 p-0"
            title="Restaurar Padrões"
          />
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm h-8 ${saveSuccess
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-neonorte-green hover:bg-neonorte-green/90 text-white'
              }`}
          >
            {isSaving ? (
              <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-3.5 h-3.5" />
            ) : saveSuccess ? (
              <span>✓ Salvo</span>
            ) : (
              <><Save size={14} /> Salvar Premissas</>
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6 h-full">

          {activeTab === 'performance' && (
            <PerformanceTab settings={settings} onChange={handleChange} />
          )}

          {activeTab === 'equipamentos' && (
            <EquipmentDatabaseManager />
          )}

          {activeTab === 'comercial' && (
            <PricingTab settings={settings} onChange={handleChange} />
          )}

          {activeTab === 'financeiro' && (
            <FinanceTab settings={settings} onChange={handleChange} />
          )}

          {activeTab === 'institucional' && (
            <InstitutionalTab settings={settings} onChange={handleChange} />
          )}

        </div>
      </main>
    </div>
  );
};
