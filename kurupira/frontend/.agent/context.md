# CONTEXT.md — Kurupira (Engenharia Solar SaaS)

> **Última Atualização:** 2026-06-25
> **Arquiteto:** Antigravity AI
> **Versão do Módulo:** 0.9.4 (Arranjo Canvas — Sprint 6: L2/L3 Hardening)

---

## 📋 VISÃO GERAL

**Kurupira** é o coração técnico do ecossistema Ywara. É uma plataforma B2B SaaS especializada em engenharia fotovoltaica de alta precisão, permitindo que integradores e engenheiros projetem, simulem e gerem propostas comerciais completas.

O foco é a **Experiência do Engenheiro**: densidade de dados, precisão funcional e uma estética "Industrial Engineering" que transmite confiança e rigor técnico.

| Aspecto | Detalhe |
|---------|--------|
| **Papel** | Kurupira: O Motor de Engenharia / SaaS B2B |
| **Usuários** | Integradores, Engenheiros e Projetistas (Clientes da Neonorte) |
| **Porta Backend** | 3002 |
| **Porta Frontend** | 5174 (dev - variável conforme disponibilidade) |
| **IAM (Auth)** | Logto Cloud (OIDC) |

---

## 🏗️ STACK TÉCNICO

### Frontend
- **Framework**: Vite + React 19 + TypeScript
- **State Management**: 
  - **Global**: Zustand (com persistência e middleware Zundo para Undo/Redo)
  - **Server**: React Query (NexusClient)
- **Visualização**: 
  - **2D/Cartografia**: Leaflet 1.9.4 + Geoman (Polígonos)
  - **3D/Simulação**: Three.js + React Three Fiber (R3F)
- **UI System**: Vanilla CSS + Tailwind 3.4 (rounded-sm grid)
- **Auth SDK**: @logto/react

---

## 🧩 MÓDULOS & VISÕES

| Módulo | Responsabilidade |
|--------|-----------------|
| **Lobby de Entrada** | Portal de acesso com rastreamento solar em tempo real e estética industrial. |
| **Project Explorer** | Gestão de portfólio de projetos com metadados de engenharia. |
| **Consumption Canvas** | Modelagem de carga e análise de faturas de energia. |
| **Solar Canvas** | Desenho de arranjos, sombreamento e simulação de irradiância. |
| **Electrical Canvas** | Diagramas de bloco, dimensionamento de strings e inversores. |
| **Financial Engine** | Cálculo de ROI, Payback e Fluxo de Caixa (Lei 14.300). |

---

## 🎨 PADRÕES DE DESIGN (ENGINEERING UI)

1. **Estética Industrial**: Uso de cores sóbrias (`slate-900`, `emerald-500`), bordas afiadas (`rounded-sm`) e tipografia técnica.
2. **Performance-First**: Animações processadas via GPU (`transform`/`opacity`) para garantir fluidez em viewports de desenho pesado.
3. **Ghost Scrollbars**: Barras de rolagem de 6px ocultas por padrão, visíveis no hover (padrão global Ywara).
4. **Localização**: 100% PT-BR para toda a interface visível ao integrador. Termos técnicos em inglês apenas se forem padrão de mercado (kWp, MPPT, etc).

---

## 🏛️ DECISÕES ARQUITETURAIS RECENTES

### Lobby de Engenharia (Solar Tracker)
**Data**: 2026-05-10 | **Status**: ✅ Concluído
- **Conceito**: Transformação da página de login em uma "Sala de Espera de Engenharia".
- **Lógica Solar**: Implementação de um `Solar Tracking Node` que calcula a posição real do sol baseada na hora local do navegador.
- **Sky Engine**: Fundo dinâmico que altera as cores do céu (Amanhecer, Dia, Entardecer, Noite) automaticamente.
- **Normalização Logto**: Ajuste no `signOut` para garantir redirecionamento correto para o login via `postLogoutRedirectUri`.

---

## 🔄 CHANGELOG (Módulo Kurupira)

### v6.1.0 (2026-05-10) — Solar Lobby & Precision UI
- ✅ **Lobby Refactor**: Nova interface de entrada com estética de cockpit e rastreamento solar real.
- ✅ **Telemetry UI**: Adição de etiquetas de Elevação e Posição solar no background do login.
- ✅ **Auth Stabilization**: Correção de loops de redirecionamento no logout via `AuthProvider`.
- ✅ **PT-BR 100%**: Tradução completa de toda a interface de acesso, removendo jargões desnecessários em inglês.

### v6.0.0 (2026-05-07) — Engineering Cockpit 2.0
- ✅ **Layout Unificado**: Transição para layout de coluna única com indicadores laterais.
- ✅ **Performance Tuning**: Otimização de renderização do canvas de desenho.

---

## 🔄 CHANGELOG

### v0.9.4-audit (2026-06-25) — Auditoria de Rigor Matemático e Engenharia
- 🛡️ **Rigor Elétrico**: Condução de auditoria estrita em `electricalMath.ts` e `useElectricalValidation.ts`. Mapeados gaps de segurança físico-química de strings (NBR 16690).
- ⚠️ **Mapeamento de Gaps**: Identificados bugs críticos de orçamentação (Projeto/Admin zerados) e riscos de NaN no cálculo de cabos DC.
- 🧹 **Clean Up**: Descoberta de código morto em `server.js` (middleware duplicado).

### 0.9.4 (2026-06-02) — Arranjo Sprint 6: L2/L3 Hardening (14 Varreduras de Bugs)

#### Layer 2 — DiagramCanvasView / diagramLayout / useDiagramStore

**Correções críticas de funcionalidade:**
- ✅ **Fix wire drag** — Port IDs usavam `ch.mpptIndex` (catálogo) nos blocos mas `mppt.mpptId` nos fios; quando diferentes, fio apontava para porta inexistente → drag silenciosamente falhava. Unificado para `chIdx`.
- ✅ **Persistência completa** — `wireLabels`, `blockNotes`, `lockedBlockIds` agora persistidos no Zustand store, keyed por `inverterId`. Anteriormente perdidos em reload/troca de inversor.
- ✅ **Snapshots com anotações** — `DiagramSnapshot` estendido com `wireLabels?` e `blockNotes?`; save/restore preserva todas as anotações.
- ✅ **Export JSON completo** — `wireLabels`, `blockNotes`, `lockedBlockIds` incluídos no JSON exportado; import restaura os três.
- ✅ **Orphan wire UX** — Wire sem porta correspondente (layout rebuild) renderiza linha tracejada vermelha + "Fio órfão" + click para deletar, em vez de sumir silenciosamente.
- ✅ **Pan zoom scaling** — Delta de pan dividido por `zoom` (`dx / cz`) → velocidade invariante ao nível de zoom.
- ✅ **Blocos travados — wire creation** — `handlePortPointerDown` e `findNearestCompatiblePort` bloqueiam criação/snap de fios em blocos com `lockedBlockIds`.

**Correções de interação:**
- ✅ **`setPointerCapture`** — Adicionado em drag de fio e bloco; `releasePointerCapture` em `pointerup`. Drag não é mais perdido ao sair do SVG.
- ✅ **Rubber-band aditivo** — Shift+rubber-band adiciona à seleção (não substitui).
- ✅ **Multi-touch guard** — Guards em `handleBlockPointerDown` e `handleBgPointerDown` previnem corrida entre dois dedos simultâneos.
- ✅ **Delete multi-select** — Del/Backspace agora usa `selectedBlockIds` (não só `selectedBlockId`).
- ✅ **Ctrl+A** — Seleciona todos os blocos; `e.preventDefault()` bloqueia "selecionar texto" do browser.
- ✅ **Block drag OS cancel** — `handleBgPointerCancel` limpa `draggingBlock.current` e todos os estados de drag em interrupção de OS.
- ✅ **Rubber-band threshold** — Rect só aparece após 4px de movimento (evita rect 0×0 em click).
- ✅ **Click em bloco selecionado** — Em multi-select, click num bloco já selecionado troca para single-select (comportamento Figma/Miro).
- ✅ **Redo após position change** — `wireRedoStack` limpo ao completar drag de bloco.

**Correções de performance:**
- ✅ **BlockRenderer memo** — `React.memo` com comparador customizado eliminando re-renders O(n) por pointermove.
- ✅ **WireRenderer memo** — Idem.
- ✅ **O(n²) → O(n) overlap** — Detecção de sobreposição durante drag só verifica bloco arrastado vs demais.
- ✅ **PNG export DPR** — Canvas de export escala por `window.devicePixelRatio` (imagens nítidas em Retina/4K).

**Correções de precisão:**
- ✅ **History `structuredClone`** — `pushToHistory` usa deep copy; cópia rasa corromperia histórico em mutations posteriores.
- ✅ **`blockPositionsRef` sync** — Ref atualizado dentro do `setBlockPositions` updater (não via `useEffect`) → leitura correta no mesmo frame de evento.
- ✅ **Wire label Bézier midpoint** — `P(0.5) = (P0 + 3P1 + 3P2 + P3) / 8` em vez de média linear.
- ✅ **Same-side wire routing** — `right→right`, `bottom→bottom`, `left→left`, `top→top` produzem loops exteriores (não S-curves que se cruzam).
- ✅ **Inverter centering math** — `invY = 24 + (totalStringsHeight - invH) / 2` (offset inicial restaurado).
- ✅ **blockNotes callout clipping** — `Math.max(4, pos.y - 20)` evita callout acima do viewport.
- ✅ **Export `try/finally`** — PNG/SVG/Copy restauram seleção mesmo em erro de export.
- ✅ **Window blur handler** — Alt-tab com Shift pressionado não deixa rubber-band "preso".

#### Layer 3 — UnifilarSchematicCanvas / unifilarLayout / unifilarSymbols / unifilarDetailCards

**Correções de norma (NBR 16690 / IEC 60617):**
- ✅ **AC vs DC distinção visual** — Fios AC: `strokeDasharray="6 4"`; CC: sólido; Terra: `"4 3"`. Legenda atualizada.
- ✅ **ΔV fórmula** — Corrigido para `ΔV = ρ₈₀ × 2L × Imp / S` com `V_sys = Vmp_hot`. A fórmula anterior usava Isc e Voc_frio (resultado 100× errado na seção sugerida).
- ✅ **ΔV% thresholds** — Verde ≤ 1%, âmbar ≤ 2%, vermelho > 2% (absolutos em volts anteriormente eram incorretos).
- ✅ **Seções completas** — Array `[1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95]` mm² (faltavam 35–95).
- ✅ **`cableLength = 0`** — Exibe `"—"` em cinza (não configurado), não falso verde.
- ✅ **`unitIsc` em MpptMetric** — Campo adicionado; `FuseDetailCard` exibia `undefined` sem ele.

**Correções de UX:**
- ✅ **`ValidationMarker` click** — Navega para `bus-{mpptId}`, descolapsa grupo se necessário. Antes apontava para ID inexistente.
- ✅ **Wire hiding para nós colapsados** — Fios com endpoint em `collapsedNodeIds` são ocultados (antes ficavam "pendurados").
- ✅ **Export clean state** — `selectedNodeId`, `hoveredNodeId`, `compareNodeId`, `rulerStart/End` limpos antes do clone SVG; restaurados em `finally`.
- ✅ **Ruler excluído do export** — Linhas de régua são ferramenta de UI, não conteúdo do diagrama.
- ✅ **Background click deselect** — Click no fundo limpa `selectedNodeId`.
- ✅ **MPPT collapse aria** — `aria-expanded` + `aria-label` com contagem de strings.
- ✅ **`currentPowerKwp` display** — `totalKwp × (irradiance / 1000)` exibido quando `irradiance ≥ 50 && irradiance ≠ 1000`; `"(noturno)"` quando < 50.

**Correções de estabilidade:**
- ✅ **`collapsedMpptIds` stale** — `useEffect` limpa IDs de MPPTs removidos.
- ✅ **Validation markers stale** — Layout filtra markers de MPPTs que não existem mais no config.
- ✅ **Duplicate string IDs** — `usedNodeIds` Set; colisão → sufixo `-${strIdx}`.
- ✅ **Detail card stacking** — Apenas um painel de detalhe por vez (validation > node).
- ✅ **`useEffect` stale dep (rulerMode)** — `rulerMode` adicionado ao deps do keyboard handler.
- ✅ **`compareNodeId` cleanup** — Limpo quando nó desaparece do layout; nunca limpo automaticamente ao trocar `selectedNodeId`.
- ✅ **`systemSummary` irradiance** — `currentPowerKwp` calculado e exibido.
- ✅ **`PVStringSymbol` memo** — `React.memo` com comparador; 20+ strings re-renderizavam a cada pan/zoom.
- ✅ **Wire `nodeIds` semantics** — Ground stubs com nodeIds corretamente preenchidos (`[source, target]`).
- ✅ **Pan delta scaling** — `dx / cz` em `handleBgPointerMove` (L3 já estava correto, L2 não estava).

### 0.9.3 (2026-05-29) — Arranjo Sprint 5: Bugfixes & Area Editing
- ✅ **Fix: Stringing Popover position** — componente movido para dentro do `flex-1 relative min-w-0` (sistema de coordenadas correto)
- ✅ **Fix: Area labels clicáveis** — `iconSize [1,1]→[120,42]`; click=select, dblclick=rename
- ✅ **Footer contextual de área** — hints de Mover/Delete/Renomear + botão Excluir quando área selecionada
- ✅ **ParametricRoofBlock** — borda de área 2→3px; center grip 14→18px, cor violet

### 0.9.2 (2026-05-29) — Arranjo Sprint 4: Zoom, Stringing Inline, Nomeação
- ✅ **Ctrl+Scroll zoom** — `{ passive: false }` wheel listener em `MapInteractionOrchestrator`
- ✅ **StringingQuickPopover** — popover flutuante substitui bottom modal; posicionado no centróide dos módulos via `globalLeafletMapRef`
- ✅ **Area naming** — `InstallationArea.name?`, `renameArea()`, label customizado
- ✅ **Completion badge** — `ViewLayerSelector` mostra % de módulos com string atribuída
- ✅ **Bulk ops** — Delete = remover seleção; Ctrl+A = selecionar todos na área

### 6.1.0 (2026-05-10) — Solar Lobby Milestone
- ✅ Lobby de entrada com rastreamento solar real (Sky Engine)
- ✅ Normalização de logout Logto (`postLogoutRedirectUri`)
- ✅ PT-BR 100% na interface de acesso

---

## 🗂️ MÓDULO ARRANJO (PhysicalCanvasView) — Arquitetura Atual

### Camadas
| Camada | Descrição |
|--------|-----------|
| **Layer 0** | Leaflet + `ReactLeafletGoogleLayer` (satélite/híbrido). Opacidade controlada via `satelliteOpacity` (0–100). Fallback OSM se sem API key. |
| **Layer 1** | Canvas tools: POLYGON, SUBTRACT, PLACE_MODULE, STRINGING, MEASURE, DROP_POINT. WebGL via `InstancedMesh` para módulos. |
| **Layer 2** | `DiagramCanvasView` (topologia de blocos, Sugiyama layout). |
| **Layer 3** | `UnifilarSchematicCanvas` (IEC/NBR, símbolos elétricos). |

### Ilhas de Ferramentas (sidebar esquerda)
- `ManipulationIsland` — SELECT, MOVE + Undo/Redo
- `NavigationIsland` — PAN, Measure, DropPoint
- `VisionIsland` — Grid toggle, Anatomy panel
- `DraftingIsland` — ArrangementToolbar (POLYGON, SUBTRACT, PLACE_MODULE, orientação, superfície, Auto-Layout)

### Estado
- `uiStore`: `canvasViewMode` (`CONTEXT|DIAGRAM|UNIFILAR`), `activeTool`, `selectedEntity`, `showGrid`, `satelliteOpacity`, `mapStyle`
- `projectSlice`: `InstallationArea` com `name?`, `localVertices`, `polygon` (cache geo), `obstacles`, `placedModuleIds`
- `zundo` temporal: tracks `project` — Ctrl+Z/Y funcional

### Padrões Críticos
- **Module-level Leaflet icons**: `L.divIcon()` sem estado dinâmico DEVE ser declarado fora do componente (previne re-criação por render)
- **Rules of Hooks**: `useMemo`/`useEffect` ANTES de qualquer `return null` condicional
- **`suppressNextMapClick`**: flag em `ParametricRoofBlock.ts` evita que click em polígono limpe a seleção via `handleMapClick`
- **`globalLeafletMapRef`**: exportado de `MapCore.tsx`, permite acesso imperativo à instância Leaflet de fora do contexto `useMap()`
- **Stringing popover**: DEVE ser renderizado dentro de `div.flex-1.relative.min-w-0` para que `latLngToContainerPoint` e `offsetParent` compartilhem o mesmo sistema de coordenadas

### Arquivos Chave
```
frontend/src/
  core/state/
    uiStore.ts                         — Tool, CanvasViewMode, selectedEntity, showGrid
    slices/projectSlice.ts             — InstallationArea, PlacedModule, renameArea, updateArea
  modules/engineering/
    components/
      MapCore.tsx                      — MapInteractionOrchestrator (Ctrl+Scroll), globalLeafletMapRef
      SolarLayer.tsx                   — handleMapClick, Delete key para área
      ParametricRoofBlock.tsx          — FreeformGrips (center drag = mover área), suppressNextMapClick
    store/
      useDiagramStore.ts               — Zustand persist: wireLabelsMap, blockNotesMap, lockedBlockIdsMap, onRehydrateStorage
      useTechStore.ts                  — InverterState, mpptConfigs, snapshot
    hooks/
      useElectricalDashboard.ts        — MpptMetric (vocMax, vmpMin, vmpMax, impTotal, iscTotal, unitIsc)
    ui/panels/canvas-views/
      PhysicalCanvasView.tsx           — Motor principal (~2050 linhas)
        AreaLabelsLayer                — click=select, dblclick=rename, iconSize [120,42]
        StringingQuickPopover          — posicionado DENTRO do inner canvas div
        PolygonEditLayer               — vertex edit + rotation handle
        BoxSelectLayer                 — box select em STRINGING
      DiagramCanvasView.tsx            — Layer 2: diagrama de blocos SVG (~3850 linhas)
      diagramLayout.ts                 — buildInitialLayout, tipos FlexiblePort/DiagramBlock/DiagramWire
      electrical/
        UnifilarSchematicCanvas.tsx    — Layer 3: esquema unifilar IEC/NBR (~1950 linhas)
        unifilarLayout.ts              — buildUnifilarLayout, nós/fios/viewBox
        unifilarSymbols.tsx            — PVStringSymbol, SchematicWireRenderer, LabelLayer, ValidationMarker
        unifilarDetailCards.tsx        — StringDetailCard, InverterDetailPanel, FuseDetailCard, GridDetailCard
      toolbars/
        DraftingIsland.tsx
        ArrangementToolbar.tsx
        ManipulationIsland.tsx
        VisionIsland.tsx
      map/StringingMpptPickerModal.tsx — arquivo mantido mas não usado na UI (substituído pelo popover)
    ui/components/
      ViewLayerSelector.tsx            — badges de % conclusão por camada
```

### Padrões Críticos — Layer 2 (DiagramCanvasView)
- **`setWiresSafe`**: wrapper de `setWires` que mantém `wiresRef.current` em sync no mesmo frame. **NUNCA** usar `setWires` diretamente — usar sempre `setWiresSafe`.
- **`blockPositionsRef`**: atualizado DENTRO do `setBlockPositions` updater (não via `useEffect`) para garantir leitura correta no mesmo frame de evento.
- **Port IDs**: gerados com `chIdx` (índice do array, garantidamente único), NÃO `ch.mpptIndex` (valor do catálogo, pode colidir). Wire `toPortId` deve usar o mesmo esquema.
- **`setPointerCapture`**: obrigatório em `handlePortPointerDown` e `handleBlockPointerDown` para manter eventos durante drag fora do SVG.
- **`structuredClone`**: usado em `pushToHistory` para cópia profunda de `positions` + `wires`. `{ ...obj }` é shallow copy e corrompe o histórico.
- **Persist scope**: `useDiagramStore` persiste `wireLabelsMap`, `blockNotesMap`, `lockedBlockIdsMap` (keyed por `inverterId`). Estado transiente (drag, editing) fica só no componente.
- **`wireLabels`/`blockNotes`**: devem ser limpos ao deletar fio/bloco; incluídos em snapshots e no JSON export.

### Padrões Críticos — Layer 3 (UnifilarSchematicCanvas)
- **Fios AC vs DC**: AC usa `strokeDasharray="6 4"` (tracejado), DC é sólido, Terra `"4 3"` — obrigatório per IEC 60617 / NBR 16690.
- **ΔV fórmula**: `ΔV = ρ₈₀ × 2L × Imp / S`; `ΔV% = (ΔV / Vmp_hot) × 100`. Usar **Imp** (não Isc) e **Vmp_hot** (não Voc_frio) — NBR 16690 §522.8.3.
- **Seções padrão**: `[1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95]` mm². Limiares de cor: verde ≤ 1%, âmbar ≤ 2%, vermelho > 2%.
- **`cableLength = 0`**: exibir `"—"` (cabo não configurado), não `"0V"` verde.
- **Export limpo**: antes de clonar SVG para export, limpar `selectedNodeId`, `hoveredNodeId`, `editingNodeId`, `compareNodeId`, `rulerStart`, `rulerEnd`. Restaurar em `finally`.
- **`collapsedNodeIds`**: wires conectados a nós colapsados devem ser ocultados (`wire.nodeIds.some(nid => collapsedNodeIds.has(nid))`).
- **`ValidationMarker` click**: navega para `bus-{mpptId}` (não para o ID do marker); descolapsa o grupo se necessário.
- **`mpptMetricsKey`**: deve ser hash escalar (não `JSON.stringify`) para evitar rebuild de layout a cada render.

---

## ⏳ GAPS IDENTIFICADOS

- [ ] **[Auditoria-01] Risco de NaN em Queda de Tensão CC**: `moduleSpecs.imp` opcional pode causar `NaN` silencioso no cálculo de queda de tensão em `validateSystemStrings`.
- [ ] **[Auditoria-02] Orçamento Divergente no Simulador Rápido**: Custo de Projeto e Administração calculados incorretamente como R$ 0,00 em `SolarCalculator.ts` devido à multiplicação errônea por percentual zerado.
- [ ] **[Auditoria-03] Código Morto no Backend**: Middleware `authenticateToken` duplicado e incompleto em `server.js:L92`.
- [ ] **[Auditoria-04] Assinatura Inconsistente de String Metrics**: `calculateStringMetrics` retorna `powerKwp` apenas no erro.
- [ ] **Sincronização de Latitude**: Sol usa parábola padrão 06h-18h. Futuro: API de localização para arco astronômico exato.
- [ ] **Offline Mode**: Service Worker para visualização de projetos sem internet.
- [ ] **Stringing Popover — Módulos sem `center`**: Módulos com `center: [0,0]` (sem cache geo) travam o popover na posição de clamping mínima. Futura melhoria: filtrar antes do cálculo do centróide.
- [ ] **Area Select com módulos sobrepostos**: Clicar no corpo da área com módulos posicionados seleciona o módulo, não a área. Workaround atual: clicar no label da área. Solução definitiva: Shift+click para selecionar área pai.
- [ ] **StringingMpptPickerModal orphaned**: O arquivo `map/StringingMpptPickerModal.tsx` ainda existe mas não é mais usado. Candidato a remoção.
- [ ] **Minimap click-to-navigate (L2)**: Minimap é read-only. Feature não implementada — clicar no minimap poderia navegar o viewport para o ponto clicado.
- [ ] **Anotações L3 não persistidas**: Anotações criadas via Alt+click em Layer 3 ficam em state local — perdidas ao desmontar o componente. Persistência via store requer implementação.
- [ ] **Annotation node-anchoring (L3)**: Anotações ficam em coordenadas SVG fixas — após rebuild do layout, ficam desalinhadas dos nós. Feature de âncora por node ID requer implementação separada.
- [ ] **Voc cold / Vmp hot — Tcoeff externo**: As fórmulas em `electricalMath.ts` estão corretas, mas `T_min` e `T_max` são configurados globalmente. Futuro: puxar temperatura mínima histórica por geolocalização do projeto.
- [ ] **Compliance checklist — `maxInputVoltage` undefined**: Se `catalogItem` não for selecionado, o check de `Voc_cold ≤ maxInputVoltage` não é avaliado. Tratar como erro "configuração incompleta".
