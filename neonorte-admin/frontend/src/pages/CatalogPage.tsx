import { Package } from 'lucide-react';

export default function CatalogPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-200">Catálogo FV</h1>
          <p className="text-xs text-slate-500">Módulos fotovoltaicos e inversores do catálogo global</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex h-80 items-center justify-center rounded-sm border border-dashed border-slate-800 bg-slate-900/50">
          <div className="flex flex-col items-center gap-3 text-center">
            <Package className="h-8 w-8 text-amber-500/30" />
            <p className="text-sm text-slate-500">Módulos FV — em desenvolvimento</p>
            <p className="text-xs text-slate-600">Upload .pan, listagem, ativar/desativar</p>
          </div>
        </div>

        <div className="flex h-80 items-center justify-center rounded-sm border border-dashed border-slate-800 bg-slate-900/50">
          <div className="flex flex-col items-center gap-3 text-center">
            <Package className="h-8 w-8 text-sky-500/30" />
            <p className="text-sm text-slate-500">Inversores — em desenvolvimento</p>
            <p className="text-xs text-slate-600">Upload .ond, listagem, ativar/desativar</p>
          </div>
        </div>
      </div>
    </div>
  );
}
