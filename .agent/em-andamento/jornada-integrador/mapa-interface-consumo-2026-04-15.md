# Mapa de Interface — ConsumptionCanvasView

**Módulo:** `engineering` → `canvas-views/`  
**Arquivo principal:** `ConsumptionCanvasView.tsx`  
**Ativada por:** `activeFocusedBlock === 'consumption'`  
**Cor semântica:** 🟠 Âmbar (`amber`)  
**Versão:** 1.0 — 2026-04-15

---

## 1. Layout Visual (ASCII)

```
┌──────────────────────────────────────────────────────────────────────┐
│  HEADER                                                 h=~36px      │
│  ⚡ Consumo  ·  Parauapebas, PA  ·  Monofásico  ·  R$ 0,82/kWh     │
│  [text-amber-400 font-mono]  [text-slate-500 text-[10px]]           │
├──────────────────────────────────────────────────────┬───────────────┤
│  SEÇÃO 1 — Perfil de Consumo        xl:col-span-9   │  SEÇÃO 2     │
│                                                      │  Correlação   │
│  [h2 text-[10px] text-slate-400]                    │  Climática   │
│                                                      │  xl:col-span-3│
│  ┌─────────────────────────────────┐  ← input médio │               │
│  │ consumo médio: [___600___] kWh/mês              │  HSP: 4.8h   │
│  └─────────────────────────────────┘                │  Sparkline ↑ │
│                                                      │               │
│  ┌─ ComposedChart (Recharts) ──────────────────┐   │  (placeholder │
│  │  Bar: consumoBase (amber-700)               │   │   até INMET)  │
│  │  Bar: simulado   (amber-900/50, empilhado)  │   │               │
│  │  Line: media     (amber/60, tracejada)      │   │               │
│  │                                             │   │               │
│  │  [Jan][Fev][Mar][Abr][Mai][Jun]...          │   │               │
│  └─────────────────────────────────────────────┘   │               │
│                                                      │               │
│  Clique numa barra → EditPopover (inline, z-50)     │               │
├──────────────────────────────────────────────────────┴───────────────┤
│  SEÇÃO 3 — Cargas Simuladas                                          │
│                                                                      │
│  [h2 text-[10px] text-slate-400]         badge: +470 kWh/mês       │
│                                                                      │
│  ┌─ LoadItemRow ───────────────────────────────────────────────────┐│
│  │  ⚡  Ar-condicionado 12.000 BTU   · 350 kWh/mês  [✏] [🗑]      ││
│  │      1400W · 8h/dia · 30d/mês                                   ││
│  └─────────────────────────────────────────────────────────────────┘│
│  ┌─ LoadItemRow ───────────────────────────────────────────────────┐│
│  │  ⚡  Carregador EV   · 120 kWh/mês              [✏] [🗑]       ││
│  └─────────────────────────────────────────────────────────────────┘│
│  ──────────────────────────────────────────────────────────────────  │
│  Total simulado (2 cargas)                    + 470 kWh/mês         │
│                                                                      │
│  [+ Adicionar carga]           → AddForm (inline, não modal)        │
├──────────────────────────────────────────────────────────────────────┤
│  SEÇÃO 4 — Fator de Crescimento                         h=~40px     │
│                                                                      │
│  📈  Fator de Crescimento  [──────●──────────] 20%                  │
│                           ↑ range input accent-amber-500             │
├──────────────────────────────────────────────────────────────────────┤
│  RODAPÉ / CTA                                           h=~44px     │
│                                                                      │
│  kWp alvo: 4,22 kWp  ·  Total: 672 kWh/mês    [☀ Selecionar módulo]│
│  [font-mono text-xs]                           [bg-amber-600 btn]   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Árvore de Componentes

```
ConsumptionCanvasView (orquestrador)
│
├── HEADER (inline JSX)
│   ├── <Zap size={14} />  — ícone âmbar
│   └── metadados do cliente (city, state, connType, tariffRate)
│
├── SEÇÃO PRINCIPAL (grid xl:12 colunas)
│   │
│   ├── xl:col-span-9 → ConsumptionChart
│   │   ├── Input "Consumo médio mensal" (field rápido)
│   │   ├── ComposedChart (Recharts)
│   │   │   ├── Bar "consumoBase" — Cell por índice (amber-700 | amber-400 se editando)
│   │   │   ├── Bar "simulado" — (amber-900/50, empilhado)
│   │   │   ├── Line "media" — (tracejada, amber/60)
│   │   │   ├── CustomTooltip
│   │   │   └── ClickableBar (shape customizado com onClick)
│   │   └── EditPopover (condicional, z-50, posicionado acima do gráfico)
│   │       └── input text + botão <Check />
│   │
│   └── xl:col-span-3 → ClimateCorrelationPlaceholder
│       ├── [Com HSP] card HSP médio + mini sparkline manual
│       └── [Sem HSP] empty state com ícone ThermometerSun
│
├── SEÇÃO 3 → SimulatedLoadsPanel
│   ├── Header row (h2 + badge de total + botão "+ Adicionar carga")
│   ├── [items.length > 0] lista de LoadItemRow
│   │   ├── modo display: ⚡ nome · kWh/mês · [✏] [🗑]
│   │   └── modo edição: grid de inputs (name, power, hours, days) + [✓] [✕]
│   ├── Footer totais (quando items.length > 0)
│   └── [showForm] → AddForm
│       ├── campos: Nome, Potência (W), Horas/dia, Dias/mês, Qtd.
│       ├── preview kWh antes de confirmar (isValid)
│       └── botões: [Adicionar] [Cancelar]
│
├── SEÇÃO 4 → GrowthFactorSection (inline)
│   ├── <TrendingUp size={12} />
│   ├── range input (0-50, accent-amber-500)
│   └── output: "{n}%" + hint kWp ajustado
│
└── RODAPÉ
    ├── [kWpAlvo !== null] → "kWp alvo: X · Total: Y kWh/mês"
    ├── [kWpAlvo === null] → hint para preencher premissas
    └── <button> "Selecionar módulo" — desabilitado se !hasData
```

---

## 3. Fluxo de Dados

```
solarStore (Zustand)
│
├── clientData ──────────────────────────────────────→ ConsumptionCanvasView
│   ├── .averageConsumption  (número)                    ↓
│   ├── .invoices[0].monthlyHistory[12]  (barras)    ConsumptionChart
│   ├── .monthlyIrradiation[12]  (HSP)               ClimateCorrelationPlaceholder
│   ├── .city / .state / .connectionType / .tariffRate  HEADER
│   │
│   ├── updateClientData({ averageConsumption })  ← input campo médio
│   └── updateMonthlyConsumption(i, v)            ← EditPopover
│
├── simulatedItems (NormalizedCollection<LoadItem>)
│   ├── .ids[] / .entities{}                      → SimulatedLoadsPanel (lista)
│   ├── addLoadItem(item)                          ← AddForm.onAdd
│   ├── updateLoadItem(id, updates)               ← LoadItemRow edit commit
│   └── removeLoadItem(id)                        ← LoadItemRow botão 🗑
│
├── kWpAlvo (number | null)                        → RODAPÉ
│   └── setKWpAlvo(v)                             ← useEffect (recalcula)
│
└── loadGrowthFactor (0-50%)                       → GrowthFactorSection
    └── setLoadGrowthFactor(v)                     ← range input

uiStore
└── setFocusedBlock('module')                      ← botão "Selecionar módulo"

panelStore
└── restoreMap()                                   ← mesmo botão (garante MapCore visível)
```

---

## 4. Máquina de Estado Visual

```
Estado do componente:
─────────────────────────────────────────────────────────────

ConsumptionChart:
  editingMonth: number | null
    null → exibe gráfico normal
    0-11 → barra[i] recebe amber-400 + EditPopover aparece

SimulatedLoadsPanel:
  showForm: boolean
    false + items=[]  → empty state + "Adicionar carga"
    false + items>0   → lista + totais + "Adicionar carga"
    true              → lista + AddForm (botão some)

  LoadItemRow:
    editing: boolean
      false → linha display (hover revela ✏ 🗑)
      true  → grid inline de inputs (✓ ✕)

─────────────────────────────────────────────────────────────
Estado derivado (useEffect):
  [clientData.invoices, monthlyIrradiation, loadGrowthFactor]
    → calcKWpAlvo() → setKWpAlvo()

─────────────────────────────────────────────────────────────
Estado do rodapé:
  hasData = averageConsumption > 0
    false → botão disabled (bg-slate-800 text-slate-600)
    true  → botão ativo (bg-amber-600 hover:amber-500)
```

---

## 5. Interações Mapeadas

| Gatilho | Componente | Ação | Resultado |
|---|---|---|---|
| Input médio `onBlur`/`Enter` | `ConsumptionChart` | `updateClientData({ averageConsumption })` | Barras redistribuídas uniformemente |
| Clique na barra | `ClickableBar` | `setEditingMonth(i)` | `EditPopover` aparece acima do gráfico |
| `EditPopover` Enter/Check | `EditPopover` | `updateMonthlyConsumption(i, v)` | Barra[i] atualiza, média recalcula |
| `EditPopover` Escape | `EditPopover` | `setEditingMonth(null)` | Popover fecha sem salvar |
| "Adicionar carga" | `SimulatedLoadsPanel` | `setShowForm(true)` | `AddForm` aparece inline |
| Submit `AddForm` | `AddForm` | `addLoadItem(item)` | Item aparece na lista; overlay de barra atualiza |
| ✏ em `LoadItemRow` | `LoadItemRow` | `setEditing(true)` | Grid de inputs in-place |
| ✓ em modo edição | `LoadItemRow` | `updateLoadItem(id, {...})` | Item atualiza, kWh/mês recalcula |
| 🗑 em `LoadItemRow` | `LoadItemRow` | `removeLoadItem(id)` | Item removido da lista e do gráfico |
| Slider crescimento | `GrowthFactorSection` | `setLoadGrowthFactor(v)` | `kWpAlvo` recalcula via `useEffect` |
| "Selecionar módulo" | `ConsumptionCanvasView` | `setFocusedBlock('module')` + `restoreMap()` | Canvas desliza para MapCore |

---

## 6. Semântica de Cor (aplicada na view)

| Elemento | Classe | Semântica |
|---|---|---|
| Título / ícone | `text-amber-400` | Consumo / Demanda |
| Barra consumo base | `fill-amber-700` (Cell) | Consumo base |
| Barra editando | `fill-amber-400` | Destaque de seleção |
| Overlay simulado | `amber-900/50` | Consumo adicional |
| Linha de média | `stroke-amber-600/60` | Referência |
| Badge simulado | `text-amber-600/70 bg-amber-950/30` | Dado auxiliar |
| Total simulado | `text-amber-400 font-bold` | Dado relevante |
| HSP sparkline | `bg-yellow-600/50` | Irradiância |
| kWp alvo (output) | `text-white font-bold` | Resultado calculado |
| Botão CTA | `bg-amber-600` | Ação primária do bloco |

---

## 7. Empty States

| Condição | Componente | UI |
|---|---|---|
| `averageConsumption === 0` | `ConsumptionChart` | Overlay com ícone Zap + `QuickStartInput` inline |
| `monthlyIrradiation` zerado | `ClimateCorrelationPlaceholder` | Ícone ThermometerSun + hint para Premissas |
| `simulatedItems` vazio | `SimulatedLoadsPanel` | Texto italic + botão "Adicionar carga" |
| `kWpAlvo === null` | Rodapé | Hint italic ("Insira consumo e irradiação…") |

---

## 8. Dependências Externas

| Dependência | Uso |
|---|---|
| `recharts` | `ComposedChart`, `Bar`, `Line`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`, `Cell` |
| `lucide-react` | `Zap`, `MapPin`, `Sun`, `TrendingUp`, `ThermometerSun`, `Pencil`, `Check`, `X`, `Plus`, `Trash2` |
| `@/core/state/solarStore` | clientData, simulatedItems, kWpAlvo, loadGrowthFactor + actions |
| `@/core/state/uiStore` | `setFocusedBlock` |
| `../../store/panelStore` | `restoreMap` |
| `@/core/state/slices/journeySlice` | `calcKWpAlvo` (função pura) |
| `@/lib/utils` | `cn` |

---

## 9. Arquivos do Módulo

```
canvas-views/
├── ConsumptionCanvasView.tsx          ← Orquestrador (este mapa)
└── consumption/
    ├── ConsumptionChart.tsx           ← Gráfico 12m + edição por barra
    ├── SimulatedLoadsPanel.tsx        ← CRUD de cargas
    └── ClimateCorrelationChart.tsx    ← [PENDENTE] — aguarda spec INMET/weatherData
```

---

## 10. Critérios de Aceitação (da spec-canvas-views-design)

- [ ] Editar consumo médio → barras atualizam → kWp alvo no rodapé recalcula em tempo real
- [ ] Clicar na barra Jan → EditPopover abre → digitar 750 → Enter → barra Jan = 750, média recalcula
- [ ] Adicionar carga "Ar-cond 350kWh/mês" → overlay de barra aparece → kWp sobe
- [ ] Remover carga → overlay some → kWp diminui
- [ ] Slider crescimento 20% → kWp alvo aumenta ~20%
- [ ] CTA "Selecionar módulo" desabilitado se `averageConsumption === 0`
- [ ] CTA clicado → `activeFocusedBlock` muda para `'module'` → canvas desliza
- [ ] `tsc --noEmit` → EXIT CODE 0
