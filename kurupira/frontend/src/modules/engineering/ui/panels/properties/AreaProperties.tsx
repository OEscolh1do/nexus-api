import React from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import { SectionHeader, PropRowEditable } from './shared';
import { Square, Grid3X3, MapPin, Copy, Trash2 } from 'lucide-react';
import type { SurfaceType } from '@/core/state/slices/projectSlice';

interface AreaPropertiesProps {
  entity: { id: string | null };
}

const SURFACE_LABELS: Record<SurfaceType, string> = {
  roof: 'Telhado',
  ground: 'Solo',
  carport: 'Carport',
  slab: 'Laje',
  other: 'Outro',
};

function computePolygonArea(vertices: { x: number; y: number }[]): number {
  let area = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(area) / 2;
}

function computeBoundsLocally(vertices: { x: number; y: number }[]) {
  if (!vertices || vertices.length === 0) return { widthM: 0, heightM: 0 };
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const v of vertices) {
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
  }
  return { widthM: maxX - minX, heightM: maxY - minY };
}

export const AreaProperties: React.FC<AreaPropertiesProps> = ({ entity }) => {
  const installationAreas = useSolarStore(s => s.project.installationAreas);
  const updateArea = useSolarStore(s => s.updateArea);
  const resizeArea = useSolarStore(s => s.resizeArea);
  const autoLayoutArea = useSolarStore(s => s.autoLayoutArea);
  const duplicateArea = useSolarStore(s => s.duplicateArea);

  const area = installationAreas.find(a => a.id === entity.id);
  
  if (!area) {
      return (
        <div className="p-3">
          <p className="text-xs text-slate-500 text-center">Área de instalação não encontrada.</p>
        </div>
      );
  }

  const polygonArea = computePolygonArea(area.localVertices);

  return (
    <div className="p-3 space-y-4">
      {/* Tipo de Superfície */}
      <section>
        <SectionHeader icon={<Square size={10} />} label="Tipo de Superfície" />
        <div className="mt-2">
          <select
            value={area.surfaceType}
            onChange={(e) => updateArea(area.id, { surfaceType: e.target.value as SurfaceType })}
            className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 focus:border-indigo-500 focus:outline-none"
          >
            {Object.entries(SURFACE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Geometria */}
      <section>
        <SectionHeader icon={<Square size={10} />} label="Geometria Paramétrica" />
        <div className="mt-2 space-y-1.5 flex flex-col gap-1">
          <PropRowEditable 
            label="Azimute (Rotação °)" 
            value={area.azimuth.toFixed(1)} 
            type="number"
            onCommit={(val) => {
               const azimuth = parseFloat(val);
               if (!isNaN(azimuth)) updateArea(area.id, { azimuth });
               return !isNaN(azimuth);
            }}
          />
          <PropRowEditable 
            label="Inclinação (°)" 
            value={area.pitch.toFixed(1)} 
            type="number"
            onCommit={(val) => {
               const pitch = parseFloat(val);
               if (!isNaN(pitch)) updateArea(area.id, { pitch });
               return !isNaN(pitch);
            }}
          />

          {/* Dimensões */}
          <div className="pt-1 mt-1 border-t border-slate-800/50">
            <PropRowEditable 
              label="Largura (m)" 
              value={computeBoundsLocally(area.localVertices).widthM.toFixed(2)} 
              type="number"
              onCommit={(val) => {
                 const w = parseFloat(val);
                 if (!isNaN(w) && w >= 0.1) resizeArea(area.id, w, computeBoundsLocally(area.localVertices).heightM);
                 return !isNaN(w) && w >= 0.1;
              }}
            />
            <PropRowEditable 
              label="Altura (m)" 
              value={computeBoundsLocally(area.localVertices).heightM.toFixed(2)} 
              type="number"
              onCommit={(val) => {
                 const h = parseFloat(val);
                 if (!isNaN(h) && h >= 0.1) resizeArea(area.id, computeBoundsLocally(area.localVertices).widthM, h);
                 return !isNaN(h) && h >= 0.1;
              }}
            />
          </div>

          {/* Informações calculadas */}
          <div className="pt-1 mt-1 border-t border-slate-800/50 block">
            <div className="flex justify-between items-center px-1 py-0.5">
              <span className="text-[10px] text-slate-500">Vértices</span>
              <span className="text-[10px] font-mono text-slate-300">{area.localVertices.length}</span>
            </div>
            <div className="flex justify-between items-center px-1 py-0.5">
              <span className="text-[10px] text-slate-500">Área Total</span>
              <span className="text-[10px] font-mono text-slate-300">{polygonArea.toFixed(2)} m²</span>
            </div>
          </div>
        </div>
      </section>

      {/* Coordenadas GPS */}
      <section>
        <SectionHeader icon={<MapPin size={10} />} label="Coordenadas GPS (Centro)" />
        <div className="mt-2 space-y-1.5 flex flex-col gap-1">
          <PropRowEditable 
            label="Latitude" 
            value={area.center[0].toFixed(8)} 
            type="number"
            onCommit={(val) => {
               const lat = parseFloat(val);
               if (!isNaN(lat)) updateArea(area.id, { center: [lat, area.center[1]] });
               return !isNaN(lat);
            }}
          />
          <PropRowEditable 
            label="Longitude" 
            value={area.center[1].toFixed(8)} 
            type="number"
            onCommit={(val) => {
               const lng = parseFloat(val);
               if (!isNaN(lng)) updateArea(area.id, { center: [area.center[0], lng] });
               return !isNaN(lng);
            }}
          />
        </div>
      </section>

      {/* Ações */}
      <section>
         <SectionHeader icon={<Grid3X3 size={10} />} label="Ferramentas" />
         <div className="mt-2 space-y-2">
           <button
              onClick={() => autoLayoutArea(area.id)}
              className="w-full flex justify-center items-center py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 text-xs font-bold rounded shadow-md transition-colors"
              title="Preencher toda a área com módulos fotovoltaicos"
           >
              Preenchimento Automático
           </button>
           <div className="flex gap-2">
             <button
                onClick={() => duplicateArea(area.id)}
                className="flex-1 flex justify-center items-center gap-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 text-[10px] font-bold rounded transition-colors"
                title="Duplicar área (Ctrl+D)"
             >
                <Copy size={10} /> Duplicar
             </button>
             <button
                onClick={() => {
                  /* Clear just the modules of this area */
                  const store = useSolarStore.getState();
                  const mods = store.project.placedModules.filter(m => m.areaId === area.id);
                  mods.forEach(m => store.removePlacedModule(m.id));
                }}
                className="flex-1 flex justify-center items-center gap-1 py-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/30 text-[10px] font-bold rounded transition-colors"
                title="Limpar módulos desta área"
             >
                <Trash2 size={10} /> Limpar Módulos
             </button>
           </div>
         </div>
      </section>
    </div>
  );
};
