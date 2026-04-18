# Spec — Sincronia Bloco-Canvas com Autosave Otimista

**Tipo:** Feature Nova (Arquitetura de Navegação)
**Módulo:** `engineering` — `uiStore`, `panelStore`, `LeftOutliner`, `CenterCanvas`, `WorkspaceTabs`
**Prioridade:** P0 — Bloqueante para Jornada do Integrador
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv` + `design-lead`
**Data de criação:** 2026-04-15
**Versão:** 1.0
**Origem:** decisão arquitetural — jornada do integrador v3.7

---

## 1. Contexto e Decisão

### 1.1 O problema que esta spec resolve

O workspace v3.6 tem blocos no LeftOutliner e Canvas Views nas abas do bottom,
mas os dois sistemas são independentes. Clicar no bloco Consumo não faz nada no
canvas. Clicar na aba "Simulação" não afeta o estado dos blocos. A sincronia entre
os dois — que é o coração da "Jornada do Integrador" — não existe.

### 1.2 A decisão arquitetural

**Um único campo controla tudo:** `activeFocusedBlock` no `uiStore`.

Quando esse campo muda, dois efeitos acontecem simultaneamente:
1. O bloco correspondente no LeftOutliner entra em estado de foco (glow, opacity-100)
2. O CenterCanvas desliza para a Canvas View correspondente

Os Bottom Tabs são apenas leitura desse campo — eles refletem o estado, não o
criam. Clicar numa aba é idêntico a clicar no bloco: ambos escrevem no mesmo campo.

### 1.3 Autosave otimista

Quando `activeFocusedBlock` muda (o usuário "sai" de uma view), o `solarStore`
persiste automaticamente via `persist` do Zustand — sem prompt de confirmação,
sem estado "não salvo". A decisão é definitiva: **desliza sempre, salva
automáticamente**.

### 1.4 Grid Master (v3.7)

O layout do workspace é regido por um grid master:
- **`LeftOutliner`**: Fixo em `240px`.
- **`CenterCanvas`**: Ocupa o espaço restante (`flex-1`).

---

## 2. Mapeamento Bloco → View → Aba

| `activeFocusedBlock` | Bloco no Left | Canvas View | Aba no Bottom | Cor (Glow) |
|----------------------|---------------|-------------|---------------|------------|
| `'consumption'` | Consumo | `'consumption'` | ⚡ Consumo | Amber |
| `'module'` | Módulos FV | `'map' (Layer Modules)` | ☀ Módulos | Sky |
| `'arrangement'` | Arranjo Físico | `'map' (Layer Roof)` | 🗺 Arranjo | Indigo |
| `'inverter'` | Inversor | `'electrical'` | 🔲 Elétrica | Emerald |
| `'simulation'` | Simulação | `'simulation'` | 📊 Simulação | Teal |
| `'site'` | — (Aba) | `SiteCanvasView` | 🏗 Site | Violet |
| `'proposal'` | — (Aba) | `ProposalModule` | 📄 Proposta | Indigo |
| `'map'` | — | `MapCore` (Layer Base) | 🗺 Mapa | Slate |
| `null` | nenhum | último ativo | — | — |

**Regra de ouro:** `activeFocusedBlock` é a única fonte de verdade.
Nenhum componente decide a view ativa por conta própria.

---

## 3. Especificação Técnica

### 3.1 Modificação no `uiStore`

```typescript
// src/core/state/uiStore.ts

type FocusedBlock = 'consumption' | 'module' | 'arrangement' | 'inverter' | 'simulation' | 'map' | 'site' | 'proposal' | null;

interface UIState {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;

  selectedEntity: { type: EntityType; id: string } | null;
  selectEntity: (type: EntityType, id: string) => void;
  clearSelection: () => void;

  // NOVO — campo central desta spec
  activeFocusedBlock: FocusedBlock;
  setFocusedBlock: (block: FocusedBlock) => void;
}

// Implementação da action
setFocusedBlock: (block) => set({ activeFocusedBlock: block }),

// Hook de conveniência
export const useFocusedBlock = () => useUIStore(s => s.activeFocusedBlock);
```

Não há lógica no setter — ele apenas escreve o valor. Os efeitos colaterais
(transição do canvas, glow do bloco) são derivados via seletores nos componentes.

### 3.2 Modificação no `CenterCanvas`

O `CenterCanvas` substitui a lógica atual de `activeCanvasView` por um
derivado direto do `activeFocusedBlock`:

```typescript
// CenterCanvas.tsx

const focusedBlock = useFocusedBlock();

// Mapeia activeFocusedBlock → qual Canvas View renderizar em frente
const VIEW_MAP: Record<NonNullable<FocusedBlock>, string> = {
  consumption: 'consumption',
  module: 'map',       // aciona activeLayer: 'layer_modules' no MapCore
  arrangement: 'map',  // aciona activeLayer: 'layer_roof' no MapCore
  inverter: 'electrical',
  simulation: 'simulation',
  site: 'site',
  proposal: 'proposal',
  map: 'map',
};

const activeView = focusedBlock ? VIEW_MAP[focusedBlock] : 'map';
```

**Regra de não-desmontagem:** todas as Canvas Views continuam montadas.
A transição é feita via CSS `opacity` + `translateX` — não via
conditional rendering. O Leaflet nunca desmonta.

```tsx
// Padrão de transição para cada view
<div
  style={{
    opacity: activeView === 'consumption' ? 1 : 0,
    transform: activeView === 'consumption' ? 'translateX(0)' : 'translateX(8px)',
    transition: 'opacity 250ms ease, transform 250ms ease',
    pointerEvents: activeView === 'consumption' ? 'auto' : 'none',
    position: 'absolute',
    inset: 0,
  }}
>
  <ConsumptionCanvasView />
</div>
```

O Leaflet usa o padrão já existente de `display: none` via `restoreMap()` —
essa lógica não muda, apenas é controlada pelo `activeFocusedBlock`.

### 3.3 Modificação no `LeftOutliner`

Cada bloco lê `activeFocusedBlock` e deriva seu estado visual:

```typescript
// ConsumptionBlock (exemplo — mesmo padrão para Module e Inverter)
const focusedBlock = useFocusedBlock();
const { setFocusedBlock } = useUIStore();

const isFocused = focusedBlock === 'consumption';
const isDeemphasized = focusedBlock !== null && focusedBlock !== 'consumption';
```

```tsx
<div
  onClick={() => setFocusedBlock('consumption')}
  className={cn(
    'transition-all duration-300 cursor-pointer',
    isFocused && 'ring-2 shadow-[0_0_12px_rgba(245,158,11,0.4)] opacity-100',
    isDeemphasized && 'opacity-40 grayscale-[0.15]',
    !isFocused && !isDeemphasized && 'opacity-100',
  )}
>
  {/* conteúdo existente do bloco */}
</div>
```

**Cores de glow por bloco (spec-foco-tatil):**
- Consumo: `rgba(245, 158, 11, 0.4)` (Amber)
- Módulos: `rgba(14, 165, 233, 0.4)` (Sky)
- Arranjo: `rgba(99, 102, 241, 0.4)` (Indigo)
- Inversor: `rgba(16, 185, 129, 0.4)` (Emerald)

### 3.4 Modificação nos `WorkspaceTabs`

As abas do bottom passam a ser bidirecionais — leem e escrevem `activeFocusedBlock`:

```typescript
// WorkspaceTabs.tsx
const focusedBlock = useFocusedBlock();
const { setFocusedBlock } = useUIStore();

const TABS: Array<{ id: FocusedBlock; label: string; icon: string }> = [
  { id: 'consumption', label: 'Consumo', icon: '⚡' },
  { id: 'module',      label: 'Módulos', icon: '☀' },
  { id: 'inverter',    label: 'Elétrica', icon: '🔲' },
  { id: 'simulation',  label: 'Simulação', icon: '📊' },
  { id: 'map',         label: 'Mapa', icon: '🗺' },
];
```

A aba ativa é determinada pelo `focusedBlock` — não por estado local do componente.

### 3.5 Autosave — onde fica

O `solarStore` já usa `persist` do Zustand (Zustand persist middleware). O autosave
**não requer código novo** — a persistência já acontece a cada mutação do store.

O único cuidado é garantir que `activeFocusedBlock` **não** entra no persist
(é estado de UI, não dado de projeto). Verificar que o `partialize` do persist
exclui campos do `uiStore`. Como `uiStore` e `solarStore` são stores separados
e o persist está apenas no `solarStore`, isso já está correto por arquitetura.

---

## 4. `ConsumptionCanvasView` — especificação da view mais rica

Esta é a view nova de maior valor. As outras views (`ElectricalCanvasView`,
`SimulationCanvasView`, `MapCore`) já existem — apenas ganham sincronia com o
bloco. A `ConsumptionCanvasView` precisa ser criada.

### 4.1 Conteúdo da view

```

├── [Seção 1] Perfil de Consumo
│   ├── Gráfico de barras — 12 meses (kWh)
│   ├── Campo editável: consumo médio mensal
│   ├── Pico destacado com gradiente divergente
│   └── Totais: consumo anual, média, mês de pico
│
├── [Seção 2] Análise Climática (raio-x do consumo)
│   ├── Gráfico dualConsumptionCanvasView-axis: consumo kWh × temperatura média °C
│   ├── Dados de temperatura: histórico INMET via solarStore.clientData
│   ├── Correlação visual sazonalidade x consumo
│   └── HSP médio anual (CRESESB)
│
├── [Seção 3] Cargas Simuladas
│   ├── Lista de itens: { nome, potência W, horas/dia, dias/mês }
│   ├── Botão "+ Adicionar carga"
│   ├── Total simulado: kWh/mês adicional
│   └── Impacto no kWp alvo: recalcula em tempo real
│
└── [Seção 4] Fator de Crescimento
    ├── Slider: 0% a 50% (default 0%)
    └── Preview: consumo ajustado em kWh/mês
```

### 4.2 Conexão com o bloco

O `ConsumptionBlock` no Left exibe apenas o resumo: consumo médio + kWp alvo.
A `ConsumptionCanvasView` é a fonte de entrada de todos os dados que alimentam
esse resumo. A sincronia é automática via `solarStore.clientData` — não há
prop drilling entre os dois.

### 4.3 Dados já disponíveis no store

| Campo | Store | Status |
|-------|-------|--------|
| `clientData.averageConsumption` | `solarStore` | ✅ existe |
| `clientData.monthlyConsumption[12]` | `solarStore` | ✅ existe |
| `clientData.tariffRate` | `solarStore` | ✅ existe |
| `clientData.city` | `solarStore` | ✅ existe |
| `clientData.monthlyIrradiation` | `solarStore` | ✅ existe (HSP) |
| `clientData.simulatedItems` | `solarStore` | ✅ existe (LoadItem[]) |
| Temperatura histórica | `solarStore.weatherData` | ⚠️ verificar disponibilidade |
| `journeySlice.loadGrowthFactor` | `solarStore` via `core/state/slices/journeySlice.ts` | ✅ especificado em spec-jornada |

---

## 5. Arquivos Afetados

### Modificar

| Arquivo | Mudança |
|---------|---------|
| `core/state/uiStore.ts` | Adicionar `activeFocusedBlock: FocusedBlock` + `setFocusedBlock()` + hook `useFocusedBlock()` |
| `ui/panels/CenterCanvas.tsx` | Substituir lógica de `activeCanvasView` por derivado do `activeFocusedBlock`; padrão de transição CSS sem desmontagem |
| `ui/panels/LeftOutliner.tsx` | `ConsumptionBlock` lê `useFocusedBlock()`, aplica glow/deemphasis no onClick |
| `canvas-views/composer/ComposerBlockModule.tsx` | Idem — `setFocusedBlock('module')` no onClick |
| `canvas-views/composer/ComposerBlockInverter.tsx` | Idem — `setFocusedBlock('inverter')` no onClick |
| `ui/panels/WorkspaceTabs.tsx` | Ler `focusedBlock` para aba ativa; `setFocusedBlock()` no onClick de cada aba |

### Criar

| Arquivo | Propósito |
|---------|-----------|
| `canvas-views/ConsumptionCanvasView.tsx` | View de raio-x do consumo (§4) |
| `canvas-views/consumption/ConsumptionChart.tsx` | Gráfico 12 meses editável |
| `canvas-views/consumption/ClimateCorrelationChart.tsx` | Dual-axis consumo × temperatura |
| `canvas-views/consumption/SimulatedLoadsPanel.tsx` | CRUD de cargas simuladas |

### Sem alteração (explícito)

| Arquivo | Motivo |
|---------|--------|
| `core/state/solarStore.ts` | O autosave já funciona via `persist` existente |
| `ui/panels/TopRibbon.tsx` | Não é afetado por esta spec |
| `canvas-views/ElectricalCanvasView.tsx` | Apenas ganha sincronia passiva — sem mudança interna |
| `canvas-views/SimulationCanvasView.tsx` | Idem |

---

## 6. Plano de Execução

```
Etapa 1: uiStore — adicionar activeFocusedBlock
  → Sistema compila; campo existe mas nenhum componente o consome ainda

Etapa 2: WorkspaceTabs — ler e escrever activeFocusedBlock
  → Clicar nas abas já muda o campo; CenterCanvas ainda não reage

Etapa 3: CenterCanvas — derivar view ativa do activeFocusedBlock
  → Clicar nas abas troca a view do canvas; blocos ainda não têm glow

Etapa 4: LeftOutliner — glow/deemphasis nos blocos
  → Clicar no bloco aciona o canvas; clicar no canvas reflete no bloco
  → Sincronia bidirecional completa

Etapa 5: ConsumptionCanvasView (view nova)
  → Seção 1 primeiro (gráfico + campo editável)
  → Seção 3 depois (cargas simuladas — depende de UI mais elaborada)
  → Seção 2 por último (correlação climática — depende de weatherData)
```

### Guardrails

- [ ] `activeFocusedBlock` nunca entra no `persist` do `solarStore`
- [ ] Nenhuma Canvas View desmonta — apenas `opacity` e `pointerEvents` mudam
- [ ] O Leaflet continua usando o padrão `display:none` existente (não regredir)
- [ ] `tsc --noEmit` passa ao fim de cada etapa
- [ ] Projetos salvos abrem com `activeFocusedBlock = null` → default para `'map'`

---

## 7. Avaliação de Riscos

| Risco | Prob. | Sev. | Mitigação |
|-------|:-----:|:----:|-----------|
| `weatherData` indisponível para correlação climática | Alta | Baixa | Seção 2 da ConsumptionCanvasView implementada por último; placeholder se dados ausentes |
| Transição CSS com 4+ views simultâneas causar jank | Baixa | Média | Usar `will-change: opacity` apenas na view que está entrando; remover após transição |
| `activeFocusedBlock = null` ao abrir projeto legado | Alta | Baixa | Default para `'map'` no getter: `focusedBlock ?? 'map'` |
| Clicar no bloco `LockedBlock` (módulo sem consumo) | Média | Baixa | `LockedBlock` tem `pointer-events: none` — já tratado |

---

## 8. Critérios de Aceitação

### Funcionais
- [ ] Clicar no bloco Consumo → canvas desliza para ConsumptionCanvasView em ≤ 300ms
- [ ] Clicar na aba "Consumo" no bottom → bloco Consumo recebe glow âmbar
- [ ] Os dois gestos acima são indistinguíveis para o usuário
- [ ] Editar consumo médio na ConsumptionCanvasView → bloco Consumo atualiza em tempo real
- [ ] Adicionar carga simulada → kWp alvo no bloco Consumo recalcula imediatamente
- [ ] Navegar Consumo → Módulos → Inversor → Simulação sem nenhum prompt de "salvar"
- [ ] Recarregar a página → dados editados na ConsumptionCanvasView persistiram

### Técnicos
- [ ] `tsc --noEmit` → EXIT CODE 0
- [ ] Nenhum Canvas View desmonta ao trocar de foco (verificar via React DevTools)
- [ ] `activeFocusedBlock` não aparece no snapshot do `persist` (localStorage)
- [ ] Transição de view completa em 250–300ms (não usar `setTimeout` para simular)

### UX
- [ ] Engenheiro consegue ir de "abrir workspace" a "ver simulação" sem confusão
- [ ] Não há nenhum estado intermediário visível entre clicar no bloco e a view aparecer
- [ ] Bottom Tabs sempre refletem o bloco ativo — nunca ficam "dessincronizados"

---

## 9. O que esta spec desbloqueia

| Feature | Desbloqueio |
|---------|-------------|
| `spec-foco-tatil` | Glow/deemphasis dos blocos (Etapa 4 desta spec é a fundação) |
| `ConsumptionCanvasView` com cargas simuladas | Etapa 5 desta spec |
| Guardião de aprovação | Precisa saber se todos os blocos já foram focados pelo menos uma vez |
| Variantes de proposta | O mecanismo de "ver o sistema" que o integrador usa antes de aprovar |

---

## Referências

- `spec-foco-tatil.md` — estados visuais dos blocos (glow, deemphasis, haptic)
- `02-spec-jornada-integrador-2026-04-15.md.md` — `journeySlice.loadGrowthFactor`
- `uiStore` base: `.agent/concluido/WebGL_Leaflet/Especificacao_Integracao_Grafica_Kurupira_v2.md` §5
- `panelStore` base: `.agent/concluido/UX-002-panel-system/SPEC-005-panel-store.md`
- Autosave via persist: `solarStore.ts` middleware já configurado
