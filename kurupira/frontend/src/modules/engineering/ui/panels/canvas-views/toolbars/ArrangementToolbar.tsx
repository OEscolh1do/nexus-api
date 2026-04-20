import React from 'react';
import { 
  Square, 
  Minus, 
  MoveVertical, 
  MoveHorizontal,
  Settings,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/core/state/uiStore';
import { useSolarStore } from '@/core/state/solarStore';
import { ToolbarButton, RibbonSection } from '../PhysicalCanvasView';

// =============================================================================
// ARRANGEMENT TOOLBAR
// =============================================================================
//
// D1: absorve SurfaceSelector e Auto-Layout que estavam no ribbon local da
// PhysicalCanvasView. Seguindo o padrão Blender N-Panel: propriedades do 
// contexto ativo ficam na sidebar, não num ribbon separado.
//
// Estrutura:
// [Ferramentas CAD] → Área / Corredor Técnico
// [Orientação do Módulo] → Retrato / Paisagem
// [Superfície] → Cerâmica / Metálico / Fibrocimento / Laje (D1)
// [Auto-Layout] → dispara preenchimento automático (D1)
// [Ajustar] → parâmetros finos de afastamento
// =============================================================================

// Mini-seletor de superfície encaixado na sidebar — 2 colunas compactas
const SurfaceSelectorInline: React.FC = () => {
  const clientData = useSolarStore(s => s.clientData);
  const updateClientData = useSolarStore(s => s.updateClientData);
  
  const TYPES = [
    { value: 'ceramica', label: 'Cerâmica', short: 'C' },
    { value: 'metalico', label: 'Metálico', short: 'M' },
    { value: 'fibrocimento', label: 'Fibro', short: 'F' },
    { value: 'laje', label: 'Laje', short: 'L' }
  ] as const;

  return (
    <div className="px-1 flex flex-col gap-1 items-center">
      <div className="grid grid-cols-2 gap-1 w-full">
        {TYPES.map(type => {
          const isActive = clientData.roofType === type.value || (!clientData.roofType && type.value === 'ceramica');
          return (
            <button
              key={type.value}
              onClick={() => updateClientData({ roofType: type.value })}
              title={`${type.label} (Superfície)`}
              className={cn(
                "w-full h-4 text-[8px] font-black uppercase rounded-[2px] transition-all flex items-center justify-center border",
                isActive
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_8px_rgba(79,70,229,0.3)]"
                  : "bg-slate-900 text-slate-600 border-slate-800 hover:border-slate-700 hover:text-slate-300"
              )}
            >
              {type.short}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const ArrangementToolbar: React.FC = () => {
  const activeTool = useUIStore(s => s.activeTool);
  const setActiveTool = useUIStore(s => s.setActiveTool);
  const installationAreas = useSolarStore(s => s.project.installationAreas) || [];
  const selectedEntityId = useUIStore(s => s.selectedEntity.id);
  const autoLayoutArea = useSolarStore(s => s.autoLayoutArea);
  const isLayout0 = installationAreas.length === 0;

  return (
    <>
      {/* Ferramentas CAD: Área e Corredor Técnico */}
      <RibbonSection>
        <ToolbarButton 
          icon={Square} 
          label="Área (Polygon)" 
          active={activeTool === 'POLYGON'} 
          onClick={() => setActiveTool('POLYGON')}
          shortcut="P"
        />
        <ToolbarButton 
          icon={Minus} 
          label="Corredor Técnico (Subtract)" 
          active={activeTool === 'SUBTRACT'} 
          onClick={() => setActiveTool('SUBTRACT')} 
          disabled={isLayout0}
          shortcut="S"
        />
      </RibbonSection>

      {/* Orientação do Módulo */}
      <RibbonSection disabled={isLayout0}>
        <ToolbarButton 
          icon={MoveVertical} 
          label="Retrato (Portrait)" 
          active={true} 
          onClick={() => {}} 
          disabled={isLayout0}
        />
        <ToolbarButton 
          icon={MoveHorizontal} 
          label="Paisagem (Landscape)" 
          active={false} 
          onClick={() => {}} 
          disabled={isLayout0}
        />
      </RibbonSection>

      {/* D1: Seletor de Superfície — migrado do ribbon local */}
      <SurfaceSelectorInline />

      {/* D1: Auto-Layout — migrado do ribbon local */}
      <RibbonSection>
        <ToolbarButton 
          icon={Lock} 
          label="Auto-Layout (preencher área)" 
          active={false}
          disabled={!selectedEntityId}
          onClick={() => selectedEntityId && autoLayoutArea(selectedEntityId)}
        />
      </RibbonSection>

      {/* Ajuste fino de afastamentos */}
      {!isLayout0 && (
        <RibbonSection>
          <ToolbarButton 
            icon={Settings} 
            label="Ajustar Afastamentos" 
            active={false} 
            onClick={() => {}} 
          />
        </RibbonSection>
      )}
    </>
  );
};
