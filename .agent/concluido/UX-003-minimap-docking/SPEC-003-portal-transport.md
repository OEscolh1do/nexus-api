# SPEC-003 — Portal Transport (Engine Core)

**Épico**: UX-003 Minimap Docking  
**Fase**: 3 (Integração e Troca Física no React)  

## Problema
Trocar árvores pesadas de lugar (React Nodes) costuma gerar o recálculo do Zero (Lifecycle unmount and mount). Leaflet e R3F webGL explodirão e os mapas ficarão cinzas.

## Escopo Técnico

A mágica toda corre no `CenterCanvas.tsx`. Em vez de omitir pela regra `display: none` estabelecida na UX-002, usaremos Portal API, mas de maneira segura contra concorrência assíncrona.

### `CenterCanvas.tsx`

1. Construir uma referência de montagem para o portal via `useEffect` ou query limpa (certificando que o slot foi montado primeiro pelo render de `RightInspector`).

```tsx
import { createPortal } from 'react-dom';
import { useLayoutEffect, useState } from 'react';

const CenterCanvasInner: React.FC = () => {
    const centerContent = useCenterContent();
    const isMinimap = centerContent !== 'map';
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    // O slot de doca no layout demora um ciclo para vir à luz depois que isMinimap é invocado.
    useLayoutEffect(() => {
        if (isMinimap) {
            // Em React vivo em DOM limpo num app SPA local, uma query logo após layout costuma estar disponível. Se não, mutações resolvem.
            const target = document.getElementById('minimap-portal-target');
            if (target) setPortalTarget(target);
        } else {
            setPortalTarget(null);
        }
    }, [isMinimap, centerContent]); // refiring on content swap
```

2. Aplicar bifurcação de montagem no Virtual DOM.
Se não é minimapa, ele renderiza padrão.
Se é minimapa, usa portal. MAS atente-se: React Portals precisam que o componente retorne no Render Pass.

```tsx
    const MapPayload = (
        <React.Fragment>
             <MapLayer activeTool={activeTool} />
             {/* Componente Overlay da SPEC-001 entra aqui magicamente */}
             {isMinimap && <MinimapLockedOverlay />}
        </React.Fragment>
    );

    return (
        <div className="absolute inset-0 w-full h-full bg-slate-950">
           
           {/* PORTAL GATING */}
           {!isMinimap ? (
               <div className="absolute inset-0 z-0">
                  {MapPayload}
                  {/* ... HUDs */}
               </div>
           ) : portalTarget ? (
               createPortal(MapPayload, portalTarget)
           ) : (
               // Estado de Fallback hiper-rápido enquanto o target não é capturado pelo layoutEffect
               <div className="hidden">{MapPayload}</div> 
           )}

           {/* Painel Central Promovido do UX-002 */}
           {isMinimap && <PromotedPanelView groupId={centerContent} />}
        </div>
    );
```

**Benefício Crítico**: Observe o gatilho "hidden" de fallback. Se houver atraso na ponte do Portal, não deixamos o `<MapLayer/>` sofrer retorno NULL ou "Unmount". Nós injetamos ele em div fake provisória `hidden` até o próximo ciclo. Isso impede o reinício violento das engines!
