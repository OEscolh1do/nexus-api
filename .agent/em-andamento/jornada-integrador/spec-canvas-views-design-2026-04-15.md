# Spec — Canvas Views: Design e Conteúdo de Todas as Vistas do CenterCanvas

**Tipo:** Refatoração de UX + Feature Nova
**Módulo:** `engineering` — `CenterCanvas` + todas as `canvas-views/`
**Prioridade:** P0 — Fundação visual da Jornada do Integrador
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv` + `design-lead`
**Data de criação:** 2026-04-15
**Versão:** 1.0
**Dependência direta:**
  - `spec-sincronia-bloco-canvas-2026-04-15.md` — mecanismo `activeFocusedBlock`
  - `spec-compositor-blocos-2026-04-15.md` — Fase A (`systemCompositionSlice`)

---

## 1. Visão Geral e Princípio de Design

O CenterCanvas é um slot polimórfico. Cada view é ativada por `activeFocusedBlock`
— não por navegação independente. O integrador nunca "escolhe uma tela": ele foca
num bloco e a view aparece.

### 1.1 Mapeamento canônico

| `activeFocusedBlock` | Canvas View | Bloco |
|----------------------|-------------|-------|
| `'consumption'` | `ConsumptionCanvasView` | ⚡ Consumo |
| `'module'` | `MapCore` (modo posicionamento) | ☀ Módulos FV |
| `'arrangement'` | `MapCore` (modo desenho) | 🗺 Arranjo |
| `'inverter'` | `ElectricalCanvasView` | 🔲 Inversor |
| `'simulation'` | `SimulationCanvasView` | 📊 Simulação |
| `null` / `'map'` | `MapCore` (modo neutro) | — |

Vistas adicionais via abas inferiores sem bloco vinculado:
- `SiteCanvasView` — dossiê de implantação
- `ProposalModule` — proposta (apenas após aprovação)

### 1.2 Princípio de design comum

Cada view segue três zonas:

```
┌─────────────────────────────────────────────────────┐
│  CORPO PRINCIPAL                                    │
│  (conteúdo específico)                              │
├─────────────────────────────────────────────────────┤
│  RODAPÉ / CTA (40px, opcional)                      │
│  Link para próximo bloco ou ação primária           │
└─────────────────────────────────────────────────────┘
obs.: sem header para bom uso do espaço.
```

Paleta: `bg-slate-950`, cards `bg-slate-900`, bordas `border-slate-800/50`.

**Cor de acento por view** — herda da cor do bloco:

| View | Cor | Tokens |
|------|-----|--------|
| ConsumptionCanvasView | Amber | `text-amber-400`, `border-amber-500/30` |
| MapCore (módulos) | Sky | `text-sky-400`, `border-sky-500/30` |
| ElectricalCanvasView | Emerald | `text-emerald-400`, `border-emerald-500/30` |
| SimulationCanvasView | Teal | `text-teal-400`, `border-teal-500/30` |
| SiteCanvasView | Violet | `text-violet-400`, `border-violet-500/30` |

### 1.3 Transição (CSS — sem desmontagem)

```css
.canvas-view {
  position: absolute; inset: 0;
  transition: opacity 250ms ease, transform 250ms ease;
}
.canvas-view--inactive {
  opacity: 0; transform: translateX(8px); pointer-events: none;
}
.canvas-view--active {
  opacity: 1; transform: translateX(0); pointer-events: auto;
}
```

`MapCore` usa `display: none` (não opacity) para preservar o estado do Leaflet.

---

## 2. ConsumptionCanvasView — NOVA

**Arquivo:** `canvas-views/ConsumptionCanvasView.tsx`
**Ativada por:** `activeFocusedBlock === 'consumption'`
**Propósito:** Raio-x completo do consumo. Onde o integrador entende e edita o problema do cliente.

### 2.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ ⚡ Consumo  Parauapebas, PA · Monofásico · R$ 0,82/kWh       │
│                                         [+ Adicionar carga] │
├─────────────────────────────────────────────┬───────────────┤
│  SEÇÃO 1                                    │ SEÇÃO 2       │
│  Perfil de Consumo (75%)                    │ Clima (25%)   │
│  (barras 12m editáveis)                     │               │
├─────────────────────────────────────────────┴───────────────┤
│  SEÇÃO 3 — Cargas Simuladas                                 │
│  [lista LoadItems]  [+ Adicionar carga inline]              │
├─────────────────────────────────────────────────────────────┤
│  SEÇÃO 4 — Fator de Crescimento   [──●──] 0–50%            │
├─────────────────────────────────────────────────────────────┤
│  kWp alvo: 4,22 kWp · Total: 672 kWh/mês  →ModulosFV ☀   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Seção 1 — Perfil de Consumo

**Componente:** `ConsumptionChart.tsx`

`ComposedChart` Recharts:
- Barras de consumo base (`clientData.monthlyConsumption[12]`) — âmbar
- Barras empilhadas de cargas simuladas — âmbar/40
- Linha de consumo médio — tracejada âmbar/60

**Interatividade:** clicar numa barra abre `Popover` com input numérico para editar o mês.

**Campo de edição rápida acima do gráfico:**
```
Consumo médio mensal: [____600____] kWh/mês
```
Action: `setAverageConsumption(v)` + redistribuição proporcional aos 12 meses.

**Estado vazio:** campo de entrada em destaque com hint "Insira o consumo médio para começar".

### 2.3 Seção 2 — Correlação Climática

**Componente:** `ClimateCorrelationChart.tsx`
**Condição:** `clientData.weatherData` disponível

`ComposedChart` dois eixos:
- Eixo Y esquerdo: kWh/mês (barras âmbar)
- Eixo Y direito: temperatura média °C (linha red-400)

Objetivo: integrador vê se consumo sobe com calor (ar-cond) ou frio (aquecimento).

**Fallback:** placeholder "Dados climáticos não disponíveis para [cidade]" com opção de inserção manual da Tmin.

### 2.4 Seção 3 — Cargas Simuladas

**Componente:** `SimulatedLoadsPanel.tsx`

```typescript
interface LoadItem {
  id: string;
  nome: string;
  potenciaW: number;
  horasDia: number;
  diasMes: number;
  perfil: 'constante' | 'verao' | 'inverno';
  // kWh/mês = potenciaW × horasDia × diasMes / 1000
}
```

UI da lista:
```
Ar-condicionado 12.000 BTU  · 350 kWh/mês
[verao]  9h/dia  22 dias      [✏] [🗑]

Carregador EV  · 120 kWh/mês
[constante]  4h/dia  30 dias  [✏] [🗑]
────────────────────────────────────────
Total cargas simuladas: + 470 kWh/mês
```

Formulário de adição inline (não modal):
```
Nome: [__________]  Potência: [____] W
Horas/dia: [__]  Dias/mês: [__]  Perfil: [Constante ▾]  → [Adicionar]
```

Distribuição sazonal:
```typescript
const isSummer = (i: number) => [0,1,2,9,10,11].includes(i);
const isWinter = (i: number) => [4,5,6,7].includes(i);
Virtual_Load_At[i] = perfil === 'constante' ? base
                   : perfil === 'verao'     ? (isSummer(i) ? base : 0)
                   : /* inverno */            (isWinter(i) ? base : 0);
```

Store: `clientData.simulatedItems` — actions existentes.

### 2.5 Seção 4 — Fator de Crescimento

```
Crescimento projetado: [──●──────] 0%  →  kWp alvo inalterado
```

Slider 0–50%. Action: `journeySlice.setLoadGrowthFactor(v)`.

### 2.6 Rodapé

```
kWp alvo: 4,22 kWp  ·  Consumo total: 672 kWh/mês  →  Selecionar módulo ☀
```

CTA: `setFocusedBlock('module')`. Visível quando `averageConsumption > 0`.

### 2.7 Arquivos a criar

| Arquivo | Propósito |
|---------|-----------|
| `canvas-views/ConsumptionCanvasView.tsx` | Orquestrador |
| `canvas-views/consumption/ConsumptionChart.tsx` | Barras 12m + edição por mês |
| `canvas-views/consumption/ClimateCorrelationChart.tsx` | Dual-axis kWh × °C |
| `canvas-views/consumption/SimulatedLoadsPanel.tsx` | CRUD de cargas |

---

## 3. MapCore — Adaptação para 3 Modos

**Arquivo:** `canvas-views/MapCore.tsx` (existente — modificar)
**Ativado por:** `'module'` | `'arrangement'` | `null`

### 3.1 Derivação do modo

```typescript
const focusedBlock = useFocusedBlock();
const mapMode: 'placement' | 'drawing' | 'neutral' =
  focusedBlock === 'module'      ? 'placement' :
  focusedBlock === 'arrangement' ? 'drawing'   : 'neutral';
```

### 3.2 Header contextual (novo — 32px)

**Modo `placement` (Módulos FV):**
```
☀ Módulos FV  ·  [Selecionar] [◻ Colocar] [⚡ Auto-Layout]
9 módulos posicionados  ·  Consistência: ✅ 9/9
```

**Modo `drawing` (Arranjo):**
```
🗺 Arranjo Físico  ·  [Selecionar] [✏ Desenhar Área] [📏 Medir]
2 áreas  ·  134 m²  ·  FDI: 0.47
```

**Modo `neutral`:**
```
🗺 Mapa  ·  [Selecionar] [📏 Medir]
```

### 3.3 Ferramentas HUD

Ferramentas não relevantes para o modo ficam ocultas (não desabilitadas).
Lógica de filtragem: `TOOL_VISIBILITY[mode].includes(tool)`.

### 3.4 Rodapé por modo

**`placement`:** "Auto-Layout posiciona N módulos automaticamente na área desenhada"
**`drawing`:** "Área pronta? → Ir para Inversor 🔲" (CTA: `setFocusedBlock('inverter')`)
**`neutral`:** sem rodapé

---

## 4. ElectricalCanvasView — Refatoração

**Arquivo:** `canvas-views/ElectricalCanvasView.tsx` (existente — reestruturar)
**Ativada por:** `activeFocusedBlock === 'inverter'`
**Propósito:** Sala de máquinas. Tudo para validar a topologia elétrica.

### 4.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ 🔲 Elétrica  Huawei SUN2000-5KTL · FDI 1.18 · ✅ válido    │
│                              [Trocar inversor] [Configurar] │
├───────────────────────────┬─────────────────────────────────┤
│  SEÇÃO 1                  │  SEÇÃO 2                        │
│  VoltageRangeChart        │  Chips de validação             │
│  (promovido do canvas)    │  FDI · Voc · Isc                │
│                           │  Lista de erros/warnings        │
├───────────────────────────┴─────────────────────────────────┤
│  SEÇÃO 3 — Topologia de Strings (visual)                    │
│  PHB 5kW → MPPT1 → [String A: 9m] [String B: 9m]           │
│              MPPT2 → [String C: 6m ⚠]                      │
├─────────────────────────────────────────────────────────────┤
│  SEÇÃO 4 — Configuração MPPT (campos editáveis)             │
│  MPPT 1: [módulos/string: 9] [strings: 2] [az: 180] [inc:14]│
│  MPPT 2: [módulos/string: 6] [strings: 1] [az: 90]  [inc:14]│
├─────────────────────────────────────────────────────────────┤
│  ✅ Sistema válido  →  Ver Simulação 📊                     │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Seção 1 — VoltageRangeChart (promover)

O `VoltageRangeChart` existente no `CenterCanvas.tsx` como overlay é movido para
esta view como seção principal.

Exibe:
- Faixa de operação MPPT (Vmp mín–máx) — zona verde
- Voc máximo corrigido por Tmin — linha vermelha pontilhada
- Tensão nominal DC — linha âmbar
- Tensão máxima do inversor — limite superior vermelho

Dados: `useElectricalValidation()` + `clientData.weatherData.minTemp`.

### 4.3 Seção 2 — Resumo de Validação

**Componente:** `ElectricalValidationSummary.tsx` (extrair do `ElectricalGroup` existente)

Cards de chips:
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ FDI: 1.18   │ │ Voc: 299V   │ │ Isc: 13.2A  │
│ ✅ OK        │ │ ✅ < 570V    │ │ ✅ < 16A     │
└──────────────┘ └──────────────┘ └──────────────┘
```

Com erros — lista expandida (cada item clicável leva ao campo na Seção 4):
```
⚠ MPPT 2: Isc 14.1A próximo do limite (16A)
🔴 MPPT 1: Voc 312V excede 95% da tensão máxima do inversor
```

### 4.4 Seção 3 — Topologia de Strings (visual)

Diagrama texto-visual baseado em `useTechStore`:

```
Huawei SUN2000-5KTL
├── MPPT 1 ──── String A  [●●●●●●●●●] 9m  Voc 299V  ✅
│            └── String B  [●●●●●●●●●] 9m  Voc 299V  ✅
└── MPPT 2 ──── String C  [●●●●●●] 6m  Voc 199V  ⚠ Vmp fora da faixa
```

String problemática: cor vermelho/âmbar. Clicável: `selectEntity('string', id)`.

### 4.5 Seção 4 — Configuração MPPT (editável)

Absorve `StringConfigurator` + `PropRowEditable`. Para cada MPPT:

```
MPPT 1
  Módulos/String: [9]   Nº Strings: [2]
  Azimute (°):   [180]  Inclinação (°): [14]

MPPT 2
  Módulos/String: [6]   Nº Strings: [1]
  Azimute (°):   [90]   Inclinação (°): [14]
```

Action: `updateMPPTConfig(inverterId, mpptId, {...})` — já implementada.
Commit: `onBlur` / `onPointerUp` — não a cada keystroke (Zundo).

**Validação em tempo real:** ao sair de qualquer campo, chips da Seção 2 recalculam.

### 4.6 Catálogo de Inversores

"Trocar inversor" → `InverterCatalogDialog` (overlay existente). A view atualiza via reatividade do `useTechStore`.

### 4.7 Rodapé

```
✅ Sistema elétrico válido  →  Ver Simulação 📊
```
Visível quando `globalHealth === 'ok'`. CTA: `setFocusedBlock('simulation')`.

### 4.8 Arquivos

| Arquivo | Status |
|---------|--------|
| `canvas-views/ElectricalCanvasView.tsx` | **[MODIFICAR]** layout |
| `canvas-views/electrical/ElectricalValidationSummary.tsx` | **[NOVO]** chips + lista |
| `canvas-views/electrical/StringTopologyDiagram.tsx` | **[NOVO]** diagrama visual |
| `canvas-views/electrical/MPPTConfigSection.tsx` | **[NOVO]** campos editáveis |

---

## 5. SimulationCanvasView — Refatoração

**Arquivo:** `canvas-views/SimulationCanvasView.tsx` (existente — refatorar)
**Ativada por:** `activeFocusedBlock === 'simulation'`
**Propósito:** O resultado do dimensionamento. O que o cliente vai ver.

### 5.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Simulação  8.340 kWh/ano · Cobertura 98% · Pay 4.2 anos │
│                              [Barras][Composição][Tabela]   │
├───────────────────────────┬─────────────────────────────────┤
│  SEÇÃO 1                  │  SEÇÃO 2                        │
│  Geração vs Consumo       │  Métricas-chave                 │
│  (visão selecionada)      │  Economia · kWh · Payback · TIR │
├───────────────────────────┴─────────────────────────────────┤
│  SEÇÃO 3 — Curva Diária Estimada                            │
│  [Janeiro ▾]  AreaChart 24h (bell-curve solar)              │
├─────────────────────────────────────────────────────────────┤
│  SEÇÃO 4 — Banco de Créditos Acumulados                     │
│  AreaChart cumulativo: saldo kWh mês a mês                  │
├─────────────────────────────────────────────────────────────┤
│  ✅ Dimensionamento completo  →  Aprovar sistema            │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Seção 1 — Gráfico Principal com 3 visões

**Componente:** `GenerationConsumptionChart.tsx` (existente — refatorar)

**Motor de cálculo corrigido:**
```typescript
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
geracaoMensal[i] = P_DC_kWp * hsp[i] * DAYS_IN_MONTH[i] * pr;
// P_DC_kWp: soma de (quantity × power_kWp) do inventário de módulos
```

**Visão A — Barras (default):**
Consumo base (slate-400) · Cargas simuladas (âmbar/40) · Geração (teal).

**Visão B — Composição empilhada:**
```typescript
const autoconsumo = Math.min(geracao[i], consumo[i]);
const injecao = Math.max(0, geracao[i] - consumo[i]);
const deficit = Math.max(0, consumo[i] - geracao[i]);
```
3 camadas: autoconsumo (esmeralda) · injeção (teal) · déficit (rose/40).

**Visão C — Tabela analítica:**
7 colunas: Mês · Consumo · Geração · Autoconsumo · Injeção · Déficit · Saldo.
Totalizadores no `<tfoot>`.

Navegação entre visões: botões no header da view. `useState` local — não precisa de store.

### 5.3 Seção 2 — Métricas-chave

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 8.340 kWh   │ │ Cobertura   │ │ Economia     │ │ Payback      │
│ Geração/ano │ │ 98%         │ │ R$ 570/mês  │ │ 4,2 anos     │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**Cálculo de economia (com custo de disponibilidade ANEEL):**
```typescript
const custoDisp = { monofasico: 30, bifasico: 50, trifasico: 100 }[connectionType];
economiaLiquida[i] = Math.max(0,
  Math.min(geracao[i], consumo[i]) * tarifa - custoDisp
);
```

### 5.4 Seção 3 — Curva Diária Estimada

**Componente:** `DailyGenerationChart.tsx` (novo — baseado em spec-01)

```typescript
function getDailyProfile(P_DC: number, HSP: number, PR: number): number[] {
  return Array.from({ length: 24 }, (_, h) => {
    if (h <= 6 || h >= 18) return 0;
    const dist = Math.abs(h - 12);
    return Math.max(0, 1 - (dist / 6) ** 2) * (HSP / 6) * P_DC * PR;
  });
}
```

`AreaChart` Recharts, eixo X = 0h–23h. Gradiente âmbar → transparente.
Seletor de mês: dropdown Jan–Dez. Usa `hsp[mesIndex]`.

### 5.5 Seção 4 — Banco de Créditos Acumulados

**Componente:** `CreditBankChart.tsx` (existente no `SimulationGroup` — promover)

```typescript
let saldo = 0;
const cumulativo = geracao.map((g, i) => ({
  mes: MESES[i], saldo: (saldo += g - consumo[i])
}));
```

`AreaChart` gradiente verde (saldo positivo) / vermelho (saldo negativo).
Tooltip: "Crédito acumulado: X kWh ≈ R$ Y".

### 5.6 Rodapé

```
✅ Dimensionamento completo  →  Aprovar sistema
```
Visível quando `systemCompositionSlice` sem erros. Chama `handleApprove()`.

### 5.7 Arquivos

| Arquivo | Status |
|---------|--------|
| `canvas-views/SimulationCanvasView.tsx` | **[MODIFICAR]** layout + motor |
| `canvas-views/simulation/GenerationConsumptionChart.tsx` | **[MODIFICAR]** motor + 3 visões |
| `canvas-views/simulation/DailyGenerationChart.tsx` | **[NOVO]** bell-curve |
| `canvas-views/simulation/CreditBankChart.tsx` | **[MODIFICAR/EXTRAIR]** |
| `canvas-views/simulation/SimulationMetrics.tsx` | **[NOVO]** 4 cards KPI |

---

## 6. SiteCanvasView — Refatoração

**Arquivo:** `canvas-views/SiteCanvasView.tsx` (existente — refatorar)
**Ativada por:** aba "Site" (sem bloco vinculado)
**Propósito:** Dossiê de implantação. Folha de rosto técnica do projeto. Read-only.

### 6.1 Layout — 5 cards em grid

```
┌─────────────────────────────────────────────────────────────┐
│ 🏗 Site  Parauapebas, PA · −6.0591° / −49.8778°            │
│                                      [Editar dados →]       │
├─────────────────────────┬───────────────────────────────────┤
│  CARD: Cliente          │  CARD: Infraestrutura             │
│  Nome                   │  Conexão · Distribuidora          │
│  Cidade · UF            │  Tarifa R$/kWh                    │
│  Lat/Lng                │                                   │
├─────────────────────────┼───────────────────────────────────┤
│  CARD: Irradiação       │  CARD: Temperatura                │
│  HSP médio: 4.8 kWh/m² │  Tmin: 18°C (crítico Voc)        │
│  Sparkline 12m          │  Sparkline Tmin mensal            │
│  Fonte: CRESESB         │  Fonte: INMET                     │
├─────────────────────────┴───────────────────────────────────┤
│  CARD: Dimensionamento atual (espelho dos blocos)           │
│  4.88 kWp · 8 módulos · Huawei 5KTL · FDI 1.18 · PR 0.80  │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Detalhes dos cards

**Card Cliente:** `clientData.clientName`, `.city`, `.state`, `.lat`/`.lng`.
**Card Infraestrutura:** `clientData.connectionType`, `.distributorName`, `.tariffRate`.
**Card Irradiação:** `clientData.monthlyIrradiation[12]` → sparkline + HSP médio.
  Fonte: "CRESESB / SunData" com link externo.
**Card Temperatura:** `clientData.weatherData.monthlyMinTemp[12]` → sparkline.
  Tmin destacada em vermelho (crítica para Voc de inverno).
  Fallback: "Tmin padrão: −5°C (conservador)" se `weatherData` ausente.
**Card Dimensionamento:** leitura read-only do `systemCompositionSlice`.
  Atualiza em tempo real conforme o integrador muda equipamentos nas outras views.

### 6.3 Comportamento

Puramente read-only. "Editar dados →" → `ClientDataModal` (existente).
Link "Premissas →" → `SettingsModule`.

### 6.4 Arquivos

| Arquivo | Status |
|---------|--------|
| `canvas-views/SiteCanvasView.tsx` | **[MODIFICAR]** reestruturar 5 cards |
| `canvas-views/site/IrradiationSparkline.tsx` | **[NOVO]** sparkline HSP |
| `canvas-views/site/TemperatureSparkline.tsx` | **[NOVO]** sparkline Tmin |

---

## 7. ProposalModule como Canvas View

**Arquivo:** `modules/proposal/ProposalModule.tsx` (existente — adaptar)
**Ativado por:** aba "Proposta" (apenas quando `variantStatus === 'APPROVED'`)

### 7.1 Adaptações necessárias

**Header padronizado:**
```
📄 Proposta  Padrão · APROVADO
                         [Exportar PDF]
```

**Tela de bloqueio** quando não aprovado:
```
🔒 Proposta bloqueada
   Aprove o sistema para gerar a proposta.
   [→ Ver Simulação 📊]
```

**Conteúdo existente:** mantido integralmente (pricing, BOM, simulação financeira, PDF).

---

## 8. WorkspaceTabs — Atualização

**Arquivo:** `panels/WorkspaceTabs.tsx` (modificar)

```typescript
const TABS = [
  { id: 'consumption', label: 'Consumo',   icon: Zap,       color: 'amber'   },
  { id: 'module',      label: 'Módulos',   icon: Sun,       color: 'sky'     },
  { id: 'inverter',    label: 'Elétrica',  icon: Activity,  color: 'emerald' },
  { id: 'simulation',  label: 'Simulação', icon: BarChart2, color: 'teal'    },
  { id: 'map',         label: 'Mapa',      icon: Map,       color: 'slate'   },
  { id: 'site',        label: 'Site',      icon: Building,  color: 'violet'  },
  { id: 'proposal',    label: 'Proposta',  icon: FileText,  color: 'indigo',
    disabled: variantStatus !== 'APPROVED' },
] as const;
```

**Aba ativa:** `text-{color}-400` + `border-t border-{color}-500`.
**Aba inativa:** `text-slate-500`.
**Aba desabilitada:** `text-slate-700` + ícone de cadeado + tooltip.

---

## 9. CenterCanvas — Orquestração

**Arquivo:** `panels/CenterCanvas.tsx` (modificar)

```typescript
const VIEW_MAP: Record<string, string> = {
  consumption: 'consumption', module: 'map',  arrangement: 'map',
  inverter: 'electrical',     simulation: 'simulation',
  map: 'map', site: 'site',   proposal: 'proposal',
};
const activeViewId = VIEW_MAP[focusedBlock ?? 'map'] ?? 'map';
const viewClass = (id: string) =>
  `canvas-view ${activeViewId === id ? 'canvas-view--active' : 'canvas-view--inactive'}`;
```

Renderização:
```tsx
<div className="relative w-full h-full">
  {/* MapCore — display:none preserva Leaflet */}
  <div style={{ display: activeViewId === 'map' ? 'block' : 'none' }}>
    <MapCore mode={mapMode} />
  </div>
  <ConsumptionCanvasView className={viewClass('consumption')} />
  <ElectricalCanvasView  className={viewClass('electrical')}  />
  <SimulationCanvasView  className={viewClass('simulation')}  />
  <SiteCanvasView        className={viewClass('site')}        />
  <ProposalModule        className={viewClass('proposal')}    />
</div>
```

---

## 10. Plano de Execução

```
Etapa 1: CSS de transição + orquestração no CenterCanvas
  → Todas as views montadas; transições funcionam

Etapa 2: WorkspaceTabs sincronizado com activeFocusedBlock
  → Abas refletem e controlam estado; cores de acento por view

Etapa 3: ConsumptionCanvasView (view nova)
  3a: Seções 1+4 (gráfico editável + slider crescimento)
  3b: Seção 3 (cargas simuladas)
  3c: Seção 2 (correlação climática — aguarda weatherData)

Etapa 4: ElectricalCanvasView (refatoração)
  4a: Header âmbar + VoltageRangeChart promovido
  4b: Chips de validação + lista de erros
  4c: Configuração MPPT inline

Etapa 5: SimulationCanvasView (refatoração)
  5a: Motor corrigido (DAYS_IN_MONTH)
  5b: Múltiplas visões do gráfico
  5c: Curva diária + banco de créditos

Etapa 6: SiteCanvasView
  → 5 cards com dados dos stores existentes

Etapa 7: MapCore header contextual por modo
  → Mudança cirúrgica em arquivo único

Etapa 8: ProposalModule integrado como canvas view
  → Header + tela de bloqueio
```

### Guardrails

- [ ] MapCore nunca desmonta (`display: none`, não conditional rendering)
- [ ] Nenhuma view acessa `RightInspector` — stores diretos
- [ ] Motor de simulação usa `DAYS_IN_MONTH` — nunca `× 30`
- [ ] `tsc --noEmit` ao fim de cada etapa
- [ ] Clicar no bloco E na aba do bottom produz resultado idêntico

---

## 11. Critérios de Aceitação

### ConsumptionCanvasView
- [ ] Editar consumo médio → barras atualizam → kWp alvo no rodapé recalcula em tempo real
- [ ] Adicionar carga "Ar-cond 350kWh/mês verão" → barras de jan/fev/out/nov/dez crescem → kWp sobe
- [ ] CTA "Selecionar módulo →" ativa `setFocusedBlock('module')`
- [ ] Slider crescimento 20% → kWp alvo aumenta 20%

### ElectricalCanvasView
- [ ] VoltageRangeChart visível com Voc corrigido por Tmin histórica da cidade
- [ ] Editar módulos/string → chips de validação recalculam imediatamente
- [ ] String com Voc > 95% do limite → chip vermelho + item na lista de erros clicável
- [ ] CTA "Ver Simulação" aparece apenas quando `globalHealth === 'ok'`

### SimulationCanvasView
- [ ] Geração calculada com `DAYS_IN_MONTH` — fevereiro ≠ março
- [ ] Alternância Barras / Composição / Tabela sem recarregar dados
- [ ] Curva diária muda corretamente ao alternar meses (jan vs jul)
- [ ] Economia em R$ inclui custo de disponibilidade ANEEL

### SiteCanvasView
- [ ] 5 cards preenchidos para projeto com dados completos
- [ ] Tmin histórica da cidade visível no card Temperatura
- [ ] Card Dimensionamento reflete estado atual dos blocos em tempo real

### WorkspaceTabs
- [ ] Aba ativa sempre corresponde ao `activeFocusedBlock`
- [ ] Aba Proposta com cadeado quando não aprovado; tooltip explicativo
- [ ] Cada aba com cor de acento correta ao estar ativa

---

## 12. Resumo dos Arquivos

### Criar (11 arquivos)
`ConsumptionCanvasView.tsx` · `consumption/ConsumptionChart.tsx` ·
`consumption/ClimateCorrelationChart.tsx` · `consumption/SimulatedLoadsPanel.tsx` ·
`electrical/ElectricalValidationSummary.tsx` · `electrical/StringTopologyDiagram.tsx` ·
`electrical/MPPTConfigSection.tsx` · `simulation/DailyGenerationChart.tsx` ·
`simulation/SimulationMetrics.tsx` · `site/IrradiationSparkline.tsx` ·
`site/TemperatureSparkline.tsx`

### Modificar (9 arquivos)
`panels/CenterCanvas.tsx` · `panels/WorkspaceTabs.tsx` · `canvas-views/MapCore.tsx` ·
`canvas-views/ElectricalCanvasView.tsx` · `canvas-views/SimulationCanvasView.tsx` ·
`canvas-views/SiteCanvasView.tsx` · `modules/proposal/ProposalModule.tsx` ·
`simulation/GenerationConsumptionChart.tsx` · `simulation/CreditBankChart.tsx`

---

## Referências

- Ativação por bloco: `spec-sincronia-bloco-canvas-2026-04-15.md`
- Bloco Arranjo: `spec-bloco-arranjo-fisico-2026-04-15.md` §2.6
- Motor analítico: `.agent/aguardando/spec-motor-analitico-faturado-2026-04-10.md`
- Monetização ANEEL: `.agent/aguardando/spec-monetizacao-banco-creditos`
- Curva diária: `.agent/concluido/spec-01-curva-geracao-diaria-2026-04-11.md`
- Visões múltiplas: `.agent/concluido/spec-02-visoes-multiplas-geracao-consumo-2026-04-11.md`
- Site original: `.agent/concluido/UX-004-center-promotions/SPEC-002-site-context-view.md`
- Simulation original: `.agent/concluido/UX-004-center-promotions/SPEC-004-simulation-view.md`
- Validação elétrica: `.agent/concluido/Engenharia_Dimensionamento_Funcional/Especificacao_Engenharia_Funcional.md`
- Reconstrução validação: `.agent/concluido/spec_rebuild_electrical_validation.md`
