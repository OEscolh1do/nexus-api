import React from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import { SectionHeader, PropRowEditable } from './shared';
import { Square, Grid3X3 } from 'lucide-react';

interface RoofPropertiesProps {
  entity: { id: string | null };
}

export const RoofProperties: React.FC<RoofPropertiesProps> = ({ entity }) => {
  const roofAreas = useSolarStore(s => s.project.roofAreas);
  const updateRoofArea = useSolarStore(s => s.updateRoofArea);
  const autoLayoutRoof = useSolarStore(s => s.autoLayoutRoof);

  const roof = roofAreas.find(r => r.id === entity.id);
  
  if (!roof) {
      return (
        <div className="p-3">
          <p className="text-xs text-slate-500 text-center">Telhado não encontrado.</p>
        </div>
      );
  }

  return (
    <div className="p-3 space-y-4">
      {/* Detalhes do Telhado */}
      <section>
        <SectionHeader icon={<Square size={10} />} label="Geometria Paramétrica" />
        <div className="mt-2 space-y-1.5 flex flex-col gap-1">
          <PropRowEditable 
            label="Largura (X em Metros)" 
            value={roof.widthM.toFixed(2)} 
            type="number"
            onCommit={(val) => {
               const widthM = parseFloat(val);
               if (widthM > 0) updateRoofArea(roof.id, { widthM });
               return widthM > 0;
            }}
          />
          <PropRowEditable 
            label="Altura (Y em Metros)" 
            value={roof.heightM.toFixed(2)} 
            type="number"
            onCommit={(val) => {
               const heightM = parseFloat(val);
               if (heightM > 0) updateRoofArea(roof.id, { heightM });
               return heightM > 0;
            }}
          />
          <PropRowEditable 
            label="Azimute (Rotação °)" 
            value={roof.azimuth.toFixed(1)} 
            type="number"
            onCommit={(val) => {
               const azimuth = parseFloat(val);
               if (!isNaN(azimuth)) updateRoofArea(roof.id, { azimuth });
               return !isNaN(azimuth);
            }}
          />
          <PropRowEditable 
            label="Inclinação (°)" 
            value={roof.pitch.toFixed(1)} 
            type="number"
            onCommit={(val) => {
               const pitch = parseFloat(val);
               if (!isNaN(pitch)) updateRoofArea(roof.id, { pitch });
               return !isNaN(pitch);
            }}
          />
        </div>
      </section>

      {/* Constraints & Fill Action */}
      <section>
         <SectionHeader icon={<Grid3X3 size={10} />} label="Ferramentas Constraints" />
         <button
            onClick={() => autoLayoutRoof(roof.id)}
            className="mt-2 w-full flex justify-center items-center py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 text-xs font-bold rounded shadow-md transition-colors"
            title="Preencher toda a área editada com módulos fotovoltaicos"
         >
            Preenchimento Automático
         </button>
      </section>
    </div>
  );
};
