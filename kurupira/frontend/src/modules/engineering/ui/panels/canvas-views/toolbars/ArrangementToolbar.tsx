import React from 'react';
import {
  Square,
  Minus,
  MoveVertical,
  MoveHorizontal,
  Settings,
  LayoutGrid,
  Grid3x3,
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
  const { 
    engineeringData, 
    updateEngineeringData, 
    project, 
    autoLayoutArea 
  } = useSolarStore();

  const installationAreas = project.installationAreas || [];
  const selectedEntityId = useUIStore(s => s.selectedEntity.id);
  const isLayout0 = installationAreas.length === 0;

  return (
    <>
      {/* Item 6a: Label de seção ÁREA */}
      <div className="w-full px-1">
        <span className="text-[7px] font-black text-slate-700 uppercase tracking-widest block text-center">Área</span>
      </div>
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
          shortcut="B"
        />
      </RibbonSection>

      {/* Item 6a: Label de seção MÓDULO */}
      <div className="w-full px-1 mt-2">
        <span className="text-[7px] font-black text-slate-700 uppercase tracking-widest block text-center">Módulo</span>
      </div>
      <RibbonSection disabled={isLayout0}>
        <ToolbarButton
          icon={MoveVertical}
          label="Retrato (Portrait)"
          active={engineeringData.moduleOrientation === 'portrait'}
          onClick={() => updateEngineeringData({ moduleOrientation: 'portrait' })}
          disabled={isLayout0}
        />
        <ToolbarButton
          icon={MoveHorizontal}
          label="Paisagem (Landscape)"
          active={engineeringData.moduleOrientation === 'landscape'}
          onClick={() => updateEngineeringData({ moduleOrientation: 'landscape' })}
          disabled={isLayout0}
        />
        <ToolbarButton
          icon={Grid3x3}
          label="Preencher Área (PLACE_MODULE)"
          active={activeTool === 'PLACE_MODULE'}
          disabled={isLayout0}
          onClick={() => setActiveTool('PLACE_MODULE')}
          shortcut="F"
        />
      </RibbonSection>

      {/* Item 6a: Label de seção TIPO */}
      <div className="w-full px-1 mt-2">
        <span className="text-[7px] font-black text-slate-700 uppercase tracking-widest block text-center">Tipo</span>
      </div>
      <SurfaceSelectorInline />

      {/* Item 6a: Label de seção AÇÕES */}
      <div className="w-full px-1 mt-2">
        <span className="text-[7px] font-black text-slate-700 uppercase tracking-widest block text-center">Ações</span>
      </div>
      <RibbonSection>
        <ToolbarButton
          icon={LayoutGrid}
          label="Auto-Layout (área selecionada)"
          active={false}
          disabled={!selectedEntityId}
          onClick={() => selectedEntityId && autoLayoutArea(selectedEntityId)}
        />
        <ToolbarButton
          icon={Settings}
          label="Afastamentos (em breve)"
          active={false}
          disabled={true}
          onClick={() => {}}
        />
      </RibbonSection>
    </>
  );
};
