# Épico UX-003 — Minimap Docking (Transição de Mapa)

## O Quê (Especificação e Problema de Negócio)

Durante o UX-002, quando um painel (ex: Simulação) é promovido ao Center Canvas, o mapa principal (Leaflet + WebGL) fica em estado `display: none`. O engenheiro visualiza apenas um *card de texto* no dock lateral dizendo "Mapa → Dock".

**O Problema**: A perda total da referência espacial enquanto o painel central foca em dados (gráficos) quebra o contexto situacional do engenheiro.
**O Objetivo do UX-003**: O card de texto ("Dock Map Indicator") deve ser completamente eliminado. No lugar dele, o **mapa real deve ser injetado no dock** funcionando como um minimapa situacional enquanto o painel de dados domina o centro.

---

## Restrições Críticas da Arquitetura Cânone

1. **Leaflet & WebGL não podem ser desmontados**: Se o React sofrer "unmount" na sub-árvore do `<MapCore />`, todos os tiles cacheados do Leaflet, buffers do R3F e cálculos do WASM são perdidos.
2. **GPU Overhead**: Renderizar geometria complexa num box de 300px no dock prejudica a fluidez da UI.

---

## Definição de Contextos e Formatos (O Como)

Para resolver a movimentação preservando o estado e a GPU, separaremos a renderização do mapa em dois **Formatos Comportamentais**, injetando o DOM através de um **React Portal** para evitar o *remount*.

### Formato 1: Center Canvas (Modo Primário)
- **Onde**: Área central do Workspace.
- **Quando**: Estado padrão (`panelStore.centerContent === 'map'`).
- **Leaflet**: Interativo (Pan, Zoom, Tools), Controles visíveis.
- **R3F WebGL**: Resolução total, frameloop em `"demand"`, shaders completos.
- **HUDs**: Toolbars e gráficos overlay ligados.

### Formato 2: Dock Minimap (Modo Secundário)
- **Onde**: Último slot (embaixo) do RightInspector no Dock.
- **Quando**: Algum painel foi promovido (`panelStore.centerContent !== 'map'`).
- **Portals**: A `div` do CenterCanvas teletransporta seus nodes reais para o `<div id="minimap-portal-target">` do dock.
- **Leaflet**: Bloqueado (`dragging.disable()`, `scrollWheelZoom.disable()`), zoom out aplicado para enquadrar todo o polígono.
- **R3F WebGL**: Overlay suspenso, exibindo apenas um snapshot de fallback ou as texturas simplificadas do telhado ("freeze state").
- **Overlay Visual**: Uma borda âmbar marcando o contêiner no dock, com um ícone over-the-top escuro dizendo "Clique para Restaurar".

---

## O Roadmap Sugerido de Modificações (SPECs subsequentes)

1. **`SPEC-001`**: Implementar o hook de formato/resolução espacial: Leaflet deve escutar o tamanho de sua `div` pai dinamicamente e desabilitar controles quando sua largura for `≤ 320px`.
2. **`SPEC-002`**: Substituir o atual `MapPlaceholderCard` no dock por um Portal Target (`<div id="dock-map-portal"></div>`).
3. **`SPEC-003`**: Modificar o `CenterCanvas` para, ao invés de aplicar `display: none`, envolver a subárvore do mapa num `<createPortal>` despachando fisicamente para o Target do Dock.
