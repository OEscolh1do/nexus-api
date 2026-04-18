# Spec — Canvas Views: Design e Conteúdo de Todas as Vistas do CenterCanvas

**Tipo:** Refatoração de UX + Feature Nova
**Módulo:** `engineering` — `CenterCanvas` + todas as `canvas-views/`
**Prioridade:** P0 — Fundação visual da Jornada do Integrador
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv` + `design-lead`
**Data de criação:** 2026-04-15
**Versão:** 2.0 — alinhado ao Kurupira v3.7 (2026-04-16)
**Dependência direta:**
  - `escopo-definitivo-kurupira-v3.7-2026-04-15.md` — Mestre
  - `01-spec-sincronia-bloco-canvas-2026-04-15.md` — mecanismo `activeFocusedBlock`

---

## 1. Visão Geral e Grid Master (v3.7)

O CenterCanvas é um slot polimórfico. O workspace é regido por um grid master:
- **LeftOutliner:** Fixo em **240px**. Não colapsa automaticamente para não quebrar a metáfora da pilha.
- **CenterCanvas:** Ocupa `flex-1`.

### 1.1 Mapeamento canônico expandido (9 estados)

| `activeFocusedBlock` | Canvas View | Bloco Vinculado | Cor Tema |
|----------------------|-------------|-----------------|----------|
| `'consumption'` | `ConsumptionCanvasView` | ⚡ Consumo | Amber |
| `'module'` | `ModuleCanvasView` | ☀ Módulos FV | Sky |
| `'arrangement'` | `MapCore` (modo desenho) | 🗺 Arranjo | Indigo |
| `'inverter'` | `ElectricalCanvasView` | 🔲 Inversor | Emerald |
| `'simulation'` | `SimulationCanvasView` | 📊 Simulação | Teal |
| `'site'` | `SiteCanvasView` | — (Aba Site) | Violet |
| `'proposal'` | `ProposalModule` | — (Aba Proposta) | Indigo |
| `'map'` | `MapCore` (modo neutro) | — | Slate |
| `null` | — (última ativa) | — | — |

### 1.2 Layout de View de Engenharia (75/25)

As views de trabalho intenso (**Consumo**, **Módulo** e **Elétrica**) devem seguir o grid interno:
- **Painel Principal (75%):** Gráficos, diagramas, desenhos, catálogos.
- **Painel Lateral (25%):** Edições granulares, chips de saúde, parâmetros rápidos, especificações.

---

## 2. ModuleCanvasView (NOVA v3.7.1)

**Arquivo:** `canvas-views/ModuleCanvasView.tsx`
**Layout:** Grid `grid-cols-[3fr_1fr]` (75/25).

### 2.1 Conteúdo
- **Painel 75%:** `ModuleCatalogGrid.tsx`. Exibe grade de módulos disponíveis. Filtros por marca e tecnologia.
- **Painel 25%:** `ModuleSpecsPanel.tsx`. Exibe datasheet do módulo selecionado (Voc, Isc, Coef. Temperatura, Dimensões).
- **Footer:** Banner com `Potência Instalada` (calculada) vs `Alvo`.

---

## 3. ConsumptionCanvasView (Refatorada v3.7)

**Arquivo:** `canvas-views/ConsumptionCanvasView.tsx`
**Layout:** Grid `grid-cols-[3fr_1fr]` (75/25).

### 2.1 Conteúdo (v3.7)
- **Painel 75%:** Gráfico `ConsumptionChart.tsx` (barras 12m + edição inline).
- **Painel 25%:** 
  - `ClimateCorrelationChart.tsx` (irradiância/temperatura vs consumo).
  - `SimulatedLoadsPanel.tsx` (lista de cargas adicionais).
- **Footer:** Banner fixo com `kWp Alvo` resultante.

---

## 3. MapCore v3.7

**Propósito:** Gerenciar os 3 modos de interação espacial.

- **Modo Posicionamento (`'module'`)**: HUD sky, foco em colocar o ícone do sistema.
- **Modo Desenho (`'arrangement'`)**: HUD indigo, ferramentas de polígono ativas.
- **Modo Exploração (`null`/`'map'`)**: HUD neutro.

---

## 4. ElectricalCanvasView (Refatorada v3.7)

**Layout:** Grid `grid-cols-[3fr_1fr]` (75/25).

### 4.1 Conteúdo
- **Painel 75%:** `StringTopologyDiagram.tsx` ou `SingleLineOverview`.
- **Painel 25%:** 
  - `VoltageRangeChart.tsx` (promovido).
  - `ElectricalValidationSummary.tsx` (Chips: FDI, Voc, Isc).

---

## 5. Site e Finalização

### 5.1 SiteCanvasView (Ato 7)
View densa com 5 cards de dossiê técnica (Cliente, Localização, Clima, Equipamentos, Dimensionamento).

### 5.2 ProposalModule (Ato 8)
- Só desbloqueia se `variantStatus === 'APPROVED'`.
- Se bloqueado: Exibe "Lock Screen" com indicação do que falta para aprovar.

---

## 11. Critérios de Aceitação (v3.7)

- [ ] `LeftOutliner` forçado em `240px` (utilizar `min-w-[240px] max-w-[240px]`).
- [ ] `ConsumptionCanvasView` e `ElectricalCanvasView` implementadas com grid 75/25.
- [ ] Transições entre views sem desmontagem do `MapCore`.
- [ ] Sincronia de cores (glow) entre bloco lateral e tema da view central.

---

## Referências

- Mestre: `escopo-definitivo-kurupira-v3.7-2026-04-15.md`
- Sincronia: `01-spec-sincronia-bloco-canvas-2026-04-15.md`
