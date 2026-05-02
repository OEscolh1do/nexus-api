import { useState } from 'react';
import { Database, Package, Zap } from 'lucide-react';
import ModulesDataGrid from '@/components/catalog/ModulesDataGrid';
import InvertersDataGrid from '@/components/catalog/InvertersDataGrid';
import EquipmentUploadZone from '@/components/catalog/EquipmentUploadZone';

type Tab = 'modules' | 'inverters';

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState<Tab>('modules');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-200">
            <Database className="h-5 w-5 text-slate-500" />
            Catálogo Global
          </h1>
          <p className="text-xs text-slate-500">
            Gestão de módulos fotovoltaicos e inversores para a plataforma
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('modules')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'modules'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="h-4 w-4" />
          Módulos FV
        </button>
        <button
          onClick={() => setActiveTab('inverters')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'inverters'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="h-4 w-4" />
          Inversores
        </button>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 gap-6 min-h-0">
        {/* Left Col: Upload Zone */}
        <div className="w-72 shrink-0 flex flex-col gap-4">
          <div className="rounded-sm border border-slate-800 bg-slate-900 p-4">
            <h2 className="mb-3 text-sm font-medium text-slate-200">Adicionar Equipamento</h2>
            <EquipmentUploadZone
              type={activeTab === 'modules' ? 'module' : 'inverter'}
              onSuccess={handleUploadSuccess}
            />
            <div className="mt-4 text-[10px] text-slate-500 space-y-1">
              <p>O arquivo será processado e adicionado automaticamente ao catálogo após validação no Kurupira.</p>
              <p>Somente arquivos <span className="font-mono text-slate-400">.pan</span> para módulos e <span className="font-mono text-slate-400">.ond</span> para inversores.</p>
            </div>
          </div>
        </div>

        {/* Right Col: DataGrid */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeTab === 'modules' && <ModulesDataGrid refreshTrigger={refreshTrigger} />}
          {activeTab === 'inverters' && <InvertersDataGrid refreshTrigger={refreshTrigger} />}
        </div>
      </div>
    </div>
  );
}
