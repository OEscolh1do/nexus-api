import React from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import { SectionHeader, PropRowEditable } from './shared';
import { Square, Grid3X3 } from 'lucide-react';

interface RoofPropertiesProps {
  entity: { id: string | null };
}

export const RoofProperties: React.FC<RoofPropertiesProps> = ({ entity }) => {
  const installationAreas = useSolarStore(s => s.project.installationAreas);
  const resizeArea = useSolarStore(s => s.resizeArea);
  const updateArea = useSolarStore(s => s.updateArea);
  const autoLayoutArea = useSolarStore(s => s.autoLayoutArea);

  const roof = installationAreas.find(r => r.id === entity.id);
  
  const getBounds = (vertices: {x:number, y:number}[]) => {
     let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
     for (const v of vertices) {
       if (v.x < minX) minX = v.x;
       if (v.x > maxX) maxX = v.x;
       if (v.y < minY) minY = v.y;
       if (v.y > maxY) maxY = v.y;
     }
     return { w: maxX - minX, h: maxY - minY };
  };

  if (!roof) {
      return (
        <div className="p-3">
          <p className="text-xs text-slate-500 text-center">Telhado não encontrado.</p>
        </div>
      );
  }

  const bounds = getBounds(roof.localVertices);

  return (
    <div className="p-3 space-y-4">
      {/* Detalhes do Telhado */}
      <section>
        <SectionHeader icon={<Square size={10} />} label="Geometria Paramétrica" />
        <div className="mt-2 space-y-1.5 flex flex-col gap-1">
          <PropRowEditable 
            label="Largura (X em Metros)" 
            value={bounds.w.toFixed(2)} 
            type="number"
            onCommit={(val) => {
               const widthM = parseFloat(val);
               if (widthM > 0) resizeArea(roof.id, widthM, bounds.h);
               return widthM > 0;
            }}
          />
          <PropRowEditable 
            label="Altura (Y em Metros)" 
            value={bounds.h.toFixed(2)} 
            type="number"
            onCommit={(val) => {
               const heightM = parseFloat(val);
               if (heightM > 0) resizeArea(roof.id, bounds.w, heightM);
               return heightM > 0;
            }}
          />
          <PropRowEditable 
            label="Azimute (Rotação °)" 
            value={roof.azimuth.toFixed(1)} 
            type="number"
            onCommit={(val) => {
               const azimuth = parseFloat(val);
               if (!isNaN(azimuth)) updateArea(roof.id, { azimuth });
               return !isNaN(azimuth);
            }}
          />
          <PropRowEditable 
            label="Inclinação (°)" 
            value={roof.pitch.toFixed(1)} 
            type="number"
            onCommit={(val) => {
               const pitch = parseFloat(val);
               if (!isNaN(pitch)) updateArea(roof.id, { pitch });
               return !isNaN(pitch);
            }}
          />
        </div>
      </section>

      {/* Constraints & Fill Action */}
      <section>
         <SectionHeader icon={<Grid3X3 size={10} />} label="Ferramentas Constraints" />
         <button
            onClick={() => autoLayoutArea(roof.id)}
            className="mt-2 w-full flex justify-center items-center py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 text-xs font-bold rounded shadow-md transition-colors"
            title="Preencher toda a área editada com módulos fotovoltaicos"
         >
            Preenchimento Automático
         </button>
      </section>
    </div>
  );
};
