---
id: SPEC-001
epic: UX-004 Center Canvas Promotions
description: Infraestrutura de Roteamento e Scaffolding Polimórfico
---

# SPEC-001: Roteamento Polimórfico e Scaffolding

## 1. O Quê (Specify)
**Problema**: O `CenterCanvas.tsx` atualmente reaproveita o mesmo componente gerado pelo `RightInspector` importando-o de `GROUP_REGISTRY`. Precisamos cortar essa herança para que a área expandida possua seus próprios componentes do zero.

**Objetivo**: Construir a espinha dorsal mecânica. Sem implementar lógica de engenharia ainda, criaremos os 3 componentes Skeletons (Views Vazias) e faremos o setup do roteador de componente para invocá-los na transição.

**DoD (Definition of Done)**:
- 3 componentes em branco com cabeçalhos estruturais renderizados com sucesso no Sítio Central do layout sem desmontar a instância WebGL sob o pano.
- `GROUP_REGISTRY` removido do `CenterCanvas.tsx`.

## 2. O Como (Plan)
1. **Criar Scaffolds**:
   - `src/modules/engineering/ui/panels/canvas-views/SiteCanvasView.tsx`
   - `src/modules/engineering/ui/panels/canvas-views/SimulationCanvasView.tsx`
   - `src/modules/engineering/ui/panels/canvas-views/ElectricalCanvasView.tsx`
   *(Todos retornando um div simples no estilo premium com o título "Canvas View")*

2. **Refatorar PromotedPanelView**:
   - Criar `CANVAS_VIEWS_REGISTRY`.
   - Mapear a desintegração visual impedindo a recarga do hook do Leaflet.
