# Kurupira — Escopo Definitivo v3.7

**Produto:** Kurupira — Módulo de Engenharia Solar (Neonorte)
**Data:** 2026-04-15
**Versão:** 3.7 — Paradigma Foco em Bloco

---

## Critério de conclusão

O integrador abre o Kurupira, cria um projeto, dimensiona o sistema usando o
Compositor de Blocos, valida a elétrica, posiciona os módulos no telhado, aprova
e gera a proposta — do zero à entrega, sem planilha paralela, sem dúvida sobre
o que fazer a seguir.

---

## 1. Estrutura da Interface

O workspace é uma tela única e imersiva. Todo o trabalho acontece sem navegação
entre páginas. Três zonas compõem o workspace:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TOP RIBBON  (40px)                                                     │
│  [← Hub]  [Arquivo][Editar][Exibir][Projeto]  [KPIs]  [Ações]          │
├──────────────────┬──────────────────────────────────────────────────────┤
│                  │                                                      │
│  LEFT OUTLINER   │  CENTER CANVAS                                      │
│  240px           │  flex-1                                             │
│  (colapsável)    │                                                      │
│                  │  Slot polimórfico — todas as views montadas,        │
│  Compositor de   │  uma ativa por vez. MapCore nunca desmonta.         │
│  Blocos Lego     │                                                      │
│                  │                                                      │
├──────────────────┴──────────────────────────────────────────────────────┤
│  WORKSPACE TABS  (32px)                                                 │
│  [⚡Consumo][☀Módulos][🔲Elétrica][📊Simulação][🗺Mapa][🏗Site][📄]   │
└─────────────────────────────────────────────────────────────────────────┘
```

**CSS Grid:**
```css
grid-template-areas: "ribbon ribbon" "outliner canvas" "tabs tabs";
grid-template-columns: 240px 1fr;
grid-template-rows: 40px 1fr 32px;
height: 100vh; overflow: hidden;
```

---

## 2. Princípio de Navegação

Um único campo controla toda a interface simultaneamente:

```typescript
// uiStore.ts
type FocusedBlock =
  | 'consumption' | 'module' | 'arrangement'
  | 'inverter'    | 'simulation'
  | 'map' | 'site' | 'proposal'
  | null;

activeFocusedBlock: FocusedBlock;
setFocusedBlock: (b: FocusedBlock) => void;
```

Quando `activeFocusedBlock` muda, dois efeitos ocorrem simultaneamente em 250ms:
1. O bloco correspondente no LeftOutliner recebe glow e `opacity-100`
2. O CenterCanvas desliza para a Canvas View correspondente

Clicar num bloco, numa aba do bottom ou num CTA interno produz exatamente o mesmo
efeito — todos escrevem no mesmo campo.

**Autosave otimista:** toda mudança de `activeFocusedBlock` persiste o estado via
`solarStore + persist`. Sem prompt de confirmação em nenhum momento.

### 2.1 Tabela de mapeamento

| `activeFocusedBlock` | Bloco (Left) | Canvas View (Center) | Aba (Bottom) |
|----------------------|-------------|---------------------|-------------|
| `'consumption'` | ⚡ Consumo | `ConsumptionCanvasView` | ⚡ Consumo |
| `'module'` | ☀ Módulos FV | `MapCore` — modo posicionamento | ☀ Módulos |
| `'arrangement'` | 🗺 Arranjo | `MapCore` — modo desenho | — |
| `'inverter'` | 🔲 Inversor | `ElectricalCanvasView` | 🔲 Elétrica |
| `'simulation'` | 📊 Simulação | `SimulationCanvasView` | 📊 Simulação |
| `'map'` | — | `MapCore` — modo neutro | 🗺 Mapa |
| `'site'` | — | `SiteCanvasView` | 🏗 Site |
| `'proposal'` | — | `ProposalModule` | 📄 Proposta |
| `null` | nenhum | MapCore — modo neutro | — |

---

## 3. Top Ribbon

Layout em três setores com posicionamento absoluto para garantir simetria
independente do conteúdo de cada lado.

```
[── SETOR ESQUERDO ──]  [──── SETOR CENTRAL ────]  [── SETOR DIREITO ──]
  absolute left-2              mx-auto                  absolute right-2
```

### 3.1 Setor Esquerdo

| Elemento | Função |
|----------|--------|
| Logo / `← Hub` | `setActiveModule('hub')` — retorna ao ProjectExplorer |
| Undo / Redo | Zundo temporal via `useTemporalStore` |
| `[Arquivo][Editar][Exibir][Projeto]` | Menus dropdown com ações contextuais |

### 3.2 Setor Central — KPIs ao vivo

Exibidos quando há dados calculados. Derivados via `useTechKPIs()`.
Cada pílula é clicável e navega para a view relevante.

| Pílula | Valor | Ação ao clicar |
|--------|-------|---------------|
| `X.XX kWp` | Σ (qty × pmax_kWp) do inventário | `setFocusedBlock('module')` |
| `FDI X.XX` | P_DC / P_AC_nominal | `setFocusedBlock('inverter')` |
| `XX% cobertura` | geração_anual / consumo_anual × 100 | `setFocusedBlock('simulation')` |

### 3.3 Setor Direito — Ações e Status

| Elemento | Comportamento |
|----------|--------------|
| `[Padrão ▾]` Seletor de variante | Dropdown com todas as variantes (DRAFT/APPROVED/ARCHIVED) e "+ Nova variante" |
| **Dimensionamento Inteligente** | Ativo quando `consumo > 0`. Calcula kWpAlvo, sugere módulo + inversor, anima lego-snap em sequência, navega para `'module'` |
| **HealthCheck** `🟢/🟡/🔴` | Semáforo com popover: FDI, Voc corrigido, Isc por MPPT, consistência físico-lógica |
| **Aprovar sistema** | Esmeralda quando todos os blocos obrigatórios estão `'complete'`. Cinza com tooltip orientativo quando não. Modal de confirmação disponível. |
| **Gerar Proposta** | Aparece após `variantStatus === 'APPROVED'`. Navega para `'proposal'`. |
| `?` Guidelines | Tooltip: meta de kWp, área estimada, peso máximo, diretrizes NBR 16690 |
| `User` | Abre `ClientDataModal` |
| `Activity` | Abre `SettingsModule` (PR, perdas, temperatura mínima, tarifas) |

---

## 4. Left Outliner — Compositor de Blocos Lego

O LeftOutliner exibe uma pilha vertical de blocos com conectores SVG Tab/Notch.
Os conectores representam o fluxo elétrico: Consumo → DC → Físico → AC → Resultado.

### 4.1 Pilha completa

```
┌─────────────────────────────────────────┐
│  ⊕ GERADOR SOLAR              [Layers]  │  ← cabeçalho fixo do painel
│                                         │
│ ╭───────────────────────────────────╮   │
│ │  ⚡ Consumo           600 kWh/mês │   │  ← sempre ativo
│ │  7.200 kWh/ano                    │   │
│ │  kWp alvo: 4,22 kWp              │   │
│ ╰──────────────[kWh]───────────────╯   │  ← LegoTab âmbar
│                                         │
│ ╭───────────────────────────────────╮   │  ← LegoNotch sky
│ │  ☀ Módulos FV          6,28 kWp  │   │
│ │  9× DMEGC 630W · 1× 610W         │   │
│ │  Cobertura: 103%                  │   │
│ ╰──────────────[DC]────────────────╯   │  ← LegoTab sky
│                                         │
│ ╭───────────────────────────────────╮   │  ← LegoNotch índigo
│ │  🗺 Arranjo         2 áreas · 24m │   │
│ │  [✅ 24 · em sinc]  [134 m²]      │   │
│ │  [FDI 0,47 ⚠]                     │   │
│ ╰──────────────[físico]─────────────╯   │  ← LegoTab índigo
│                                         │
│ ╭───────────────────────────────────╮   │  ← LegoNotch esmeralda
│ │  🔲 Inversor  Huawei SUN2000-5KTL │   │
│ │  [FDI 1,18 ✅][Voc ✅][Isc ✅]    │   │
│ ╰──────────────[AC]────────────────╯   │  ← LegoTab esmeralda
│                                         │
│ ╭───────────────────────────────────╮   │  ← aparece via lego-snap
│ │  📊 Simulação                     │   │  ← bloco de saída
│ │  8.340 kWh/ano · Pay 4,2 anos    │   │
│ │  Economia: R$ 570/mês             │   │
│ ╰───────────────────────────────────╯   │
└─────────────────────────────────────────┘
```

### 4.2 Estados visuais

| Estado | CSS |
|--------|-----|
| **Focado** | `ring-2 shadow-[0_0_12px_<cor-glow>] opacity-100` |
| **Desfocado** | `opacity-40 grayscale-[0.15]` |
| **Neutro** (nenhum em foco) | `opacity-100` |
| **Locked** | `opacity-25 pointer-events-none border-dashed` |

Todos os estados têm `transition-all duration-300`.
Click em qualquer bloco: `active:scale-[0.98]`.
Click no canvas vazio: `setFocusedBlock(null)` → todos voltam ao neutro.

**Cores de glow:**

| Bloco | Cor | Token |
|-------|-----|-------|
| Consumo | Amber | `rgba(245,158,11,0.4)` |
| Módulos FV | Sky | `rgba(14,165,233,0.4)` |
| Arranjo | Indigo | `rgba(99,102,241,0.4)` |
| Inversor | Emerald | `rgba(16,185,129,0.4)` |

### 4.3 Cascata de ativação

| Bloco | Condição de ativação | LockedBlock hint |
|-------|---------------------|-----------------|
| Consumo | Sempre ativo | — |
| Módulos FV | `averageConsumption > 0` | "Informe o consumo médio primeiro" |
| Arranjo | `modules.ids.length > 0` | "Adicione módulos primeiro" |
| Inversor | `modules.ids.length > 0` | "Adicione módulos primeiro" |
| Simulação | `inverterBlock.status !== 'error'` | aparece via lego-snap quando válido |

### 4.4 Conectores

| Conector | Dado exibido | Cor |
|----------|-------------|-----|
| Consumo → Módulos | `kWp alvo: X,XX kWp` | Amber |
| Módulos → Arranjo | `N módulos lógicos` | Sky |
| Arranjo → Inversor | `N físicos · delta ±N` | Indigo |
| Inversor → saída | `N strings · Voc XXX V` | Emerald |

Quando o dado não pode ser calculado: `—` em `text-slate-600`.

### 4.5 Anatomia dos blocos

**ConsumptionBlock**
```
⚡ Consumo                    [cidade, UF]
600 kWh/mês  ·  7.200 kWh/ano
[Monofásico]  [HSP 4,8]  [R$ 0,82/kWh]
kWp alvo: 4,22 kWp
```
Campos inline editáveis: consumo médio mensal, fator de crescimento.

**ComposerBlockModule**
```
☀ Módulos FV                   6,28 kWp
9× DMEGC 630W
1× DMEGC 610W                 [+ modelo]
Cobertura: 103%   Meta: 4,22 kWp
```
Campos inline: quantidade por modelo. Botão "Trocar modelo" → `ModuleCatalogDialog`.

**ComposerBlockArrangement**
```
🗺 Arranjo               2 áreas · 24 m
[✅ 24 · em sinc]  [Área: 134 m²]
[FDI: 0,47 ⚠]         [Editar no mapa →]
```
Placeholder quando sem áreas:
```
🗺  Arranjo Físico
    Nenhuma área desenhada
    [→ Abrir mapa para desenhar]
```
"Editar no mapa": `setFocusedBlock('module')`.
"Abrir para desenhar": `setFocusedBlock('module')` + `setActiveTool('DRAW_AREA')`.

**ComposerBlockInverter**
```
🔲 Inversor  Huawei SUN2000-5KTL    5,0 kW
[FDI 1,18 ✅]  [Voc 299V ✅]  [Isc ✅]
```
Chips com semáforo. Botão "Trocar inversor" → `InverterCatalogDialog`.
Campos inline: módulos/string e strings por MPPT.

**Bloco Simulação** (somente leitura)
```
📊 Simulação
8.340 kWh/ano  ·  Cobertura 98%
Economia: R$ 570/mês  ·  Payback: 4,2 anos
```

---

## 5. Center Canvas

Slot polimórfico. Todas as views ficam montadas simultaneamente no DOM.

**Transição CSS (todas as views exceto MapCore):**
```css
.canvas-view { position: absolute; inset: 0; transition: opacity 250ms ease, transform 250ms ease; }
.canvas-view--inactive { opacity: 0; transform: translateX(8px); pointer-events: none; }
.canvas-view--active   { opacity: 1; transform: translateX(0);   pointer-events: auto; }
```

**MapCore:** usa `display: none` quando inativo — nunca desmonta. `IntersectionObserver`
aciona `leafletMap.invalidateSize()` automaticamente ao reaparecer.

**Princípio de design das views:** fundo `bg-slate-950`, cards `bg-slate-900`,
bordas `border-slate-800/50`. Sem headers. Cor de acento herdada do bloco correspondente.
Rodapé fixo opcional com CTA para o próximo bloco.

---

### 5.1 ConsumptionCanvasView

**Arquivo:** `canvas-views/ConsumptionCanvasView.tsx`
**Ativada por:** `'consumption'`
**Cor:** Amber

Quatro painéis + faixa de resultado. Ponto de entrada de todos os dados do cliente.

```
┌────────────────────────────┬──────────────────────┐
│  Perfil de Consumo         │  Correlação Climática │
│  col-span-8                │  col-span-4           │
│                            │                       │
│  campo: consumo médio      │  dual-axis:           │
│  ComposedChart 12 barras   │  kWh × temperatura°C  │
│  (editável por click)      │                       │
├────────────────────────────┴──────────────────────┤
│  Cargas Simuladas                                  │
│  lista de LoadItems + formulário inline            │
├───────────────────────────────────────────────────┤
│  Fator de Crescimento   [────●────]  0–50%        │
├───────────────────────────────────────────────────┤
│  kWp alvo: 4,22 kWp  ·  Total: 672 kWh/mês       │
│                          [→ Selecionar módulo ☀]  │
└───────────────────────────────────────────────────┘
```

**Perfil de Consumo:**
- `ComposedChart`: barras de consumo base (amber), empilhadas com cargas simuladas
  (amber/40), linha de média (amber/60 tracejada)
- Campo de consumo médio no topo redistribui os 12 meses proporcionalmente
- Click em qualquer barra abre `Popover` com input numérico para editar o mês

**Correlação Climática:**
- Eixo esquerdo: kWh (barras amber) — Eixo direito: temperatura °C (linha red-400)
- Fallback quando `weatherData` ausente: placeholder com Tmin padrão −5°C anotada

**Cargas Simuladas:**
```typescript
interface LoadItem {
  id: string;
  nome: string;
  potenciaW: number;
  horasDia: number;
  diasMes: number;
  perfil: 'constante' | 'verao' | 'inverno';
}
// kWh/mês = potenciaW × horasDia × diasMes / 1000
// verao   → ativo em [jan, fev, mar, out, nov, dez]
// inverno → ativo em [mai, jun, jul, ago]
```
Formulário de adição inline com preview do kWh antes de confirmar.
Ao adicionar/remover, gráfico e kWpAlvo recalculam em < 100ms.

**Fator de Crescimento:** slider 0–50%. Action: `journeySlice.setLoadGrowthFactor(v)`.

**Cálculo do kWp Alvo:**
```typescript
const consumoMedioAjustado = mean(monthlyConsumption) * (1 + loadGrowthFactor / 100);
const kWpAlvo = (consumoMedioAjustado * 12) / (hsp_medio_anual * 365 * pr);
```

**CTA:** "Selecionar módulo →" visível quando `kWpAlvo > 0`. Chama `setFocusedBlock('module')`.

---

### 5.2 MapCore — 3 modos

**Arquivo:** `canvas-views/MapCore.tsx`
**Ativado por:** `'module'` | `'arrangement'` | `'map'` | `null`

O modo é derivado do `activeFocusedBlock` e determina as ferramentas do HUD flutuante
e o conteúdo da barra contextual na base do canvas.

```typescript
const mapMode: 'placement' | 'drawing' | 'neutral' =
  focusedBlock === 'module'      ? 'placement' :
  focusedBlock === 'arrangement' ? 'drawing'   : 'neutral';
```

| Modo | Ferramentas HUD | Barra contextual inferior |
|------|-----------------|--------------------------|
| `placement` | SELECT · PLACE_MODULE · AUTO_LAYOUT | Contagem de módulos · delta de consistência · CTA "Ir para Inversor" |
| `drawing` | SELECT · DRAW_AREA · MEASURE | Contagem de áreas · m² · FDI · CTA "Posicionar módulos" |
| `neutral` | SELECT · MEASURE | Cidade · estado · coordenadas |

Ao trocar para modo `drawing` com `areaCount === 0`: `DRAW_AREA` ativa automaticamente.
Ao trocar de modo com ferramenta incompatível ativa: reseta para `SELECT`.

---

### 5.3 ElectricalCanvasView

**Arquivo:** `canvas-views/ElectricalCanvasView.tsx`
**Ativada por:** `'inverter'`
**Cor:** Emerald

Sala de máquinas elétrica. Quatro painéis + faixa CTA.

```
┌──────────────────────────────┬──────────────────────────────┐
│  VoltageRangeChart           │  Chips de Validação          │
│                              │  [FDI X,XX][Voc XXX V][Isc]  │
│  Seletor de MPPT (tabs)      │  Lista de erros clicáveis    │
│                              │  [Trocar inversor]           │
├──────────────────────────────┴──────────────────────────────┤
│  Topologia de Strings                                        │
│  Inversor → MPPT 1 → [●●●●●●●●● 9m  Voc 299V ✅]           │
│              MPPT 2 → [●●●●●● 6m  Voc 199V ⚠]             │
├─────────────────────────────────────────────────────────────┤
│  Configuração MPPT (editável por MPPT)                      │
│  MPPT 1:  Módulos/String [9]  Strings [2]  Az[180] Inc[14] │
│  MPPT 2:  Módulos/String [6]  Strings [1]  Az[90]  Inc[14] │
├─────────────────────────────────────────────────────────────┤
│  ✅ Sistema elétrico válido   →  Ver Simulação 📊           │
└─────────────────────────────────────────────────────────────┘
```

**VoltageRangeChart:**
- Lê `minHistoricalTemp` do `solarStore.project.settings` — nunca hardcoded
- `Voc_corrigido = Voc_STC × (1 + tempCoeff × (Tmin − 25)) × N_série`
- Faixas: zona verde (Vmp operacional), linha âmbar (Voc nominal), linha vermelha
  pontilhada (Voc corrigido), limite vermelho sólido (V_max inversor)

**Chips de validação:**
- FDI: verde 0,80–1,35 · âmbar fora · vermelho > 1,50
- Voc: verde < 95% do limite · âmbar 95–100% · vermelho > 100%
- Isc: verde ≤ Imax_MPPT · vermelho > Imax_MPPT

Erros clicáveis rolam até o campo relevante na configuração MPPT e aplicam `ring-2`.

**Configuração MPPT:** campos `onBlur`/`Enter` (nunca a cada keystroke).
Action: `updateMPPTConfig(inverterId, mpptId, {...})`. Reversível via Zundo.

**CTA "Ver Simulação":** visível apenas quando `globalHealth === 'ok'`.

---

### 5.4 SimulationCanvasView

**Arquivo:** `canvas-views/SimulationCanvasView.tsx`
**Ativada por:** `'simulation'`
**Cor:** Teal

O resultado do dimensionamento. Quatro painéis + faixa de aprovação.

```
┌─────────────────────────────────────────────────────────────┐
│  [8,3 MWh/ano]  [98% cobertura]  [R$ 570/mês]  [4,2 anos]  │
├─────────────────────────────────────────────────────────────┤
│  Geração vs Consumo  [Barras][Composição][Tabela]           │
│  12 meses                                                   │
├────────────────────────────┬────────────────────────────────┤
│  Curva Diária Estimada     │  Banco de Créditos             │
│  AreaChart 24h bell-curve  │  AreaChart cumulativo          │
│  [mês ▾]                   │  gradiente verde/vermelho      │
├────────────────────────────┴────────────────────────────────┤
│  ✅ Dimensionamento completo  →  Aprovar sistema            │
└─────────────────────────────────────────────────────────────┘
```

**Motor de geração:**
```typescript
const DAYS_IN_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31];
geracaoMensal[i] = P_DC_kWp * hsp[i] * DAYS_IN_MONTH[i] * pr;
// P_DC_kWp: derivado do inventário de módulos — nunca hardcoded
```

**Cálculo de economia com custo de disponibilidade ANEEL:**
```typescript
const CUSTO_DISP = { monofasico: 30, bifasico: 50, trifasico: 100 }; // kWh/mês
economiaLiquida[i] = Math.max(0,
  Math.min(geracao[i], consumoTotal[i]) * tariffRate
  - CUSTO_DISP[connectionType] * tariffRate
);
```

**Visões do gráfico principal** (seletor local, sem store):
- **Barras:** Consumo (slate-400) + Cargas simuladas (amber/40) + Geração (teal)
- **Composição:** Autoconsumo (emerald) + Injeção na rede (teal) + Déficit (rose/40)
- **Tabela:** 8 colunas — Mês, Consumo, Geração, Autoconsumo, Injeção, Déficit,
  Economia R$, Saldo Acumulado — com totalizadores em `<tfoot>`

**Curva Diária:** bell-curve solar, 24 pontos, AreaChart amber, seletor Jan–Dez.
**Banco de Créditos:** AreaChart cumulativo com gradiente positivo/negativo.
  Anota o mês em que o saldo se torna positivo.

**CTA "Aprovar sistema":** habilitado quando `systemCompositionSlice` tem todos os
blocos obrigatórios como `'complete'`.

---

### 5.5 SiteCanvasView

**Arquivo:** `canvas-views/SiteCanvasView.tsx`
**Ativada por:** `'site'`
**Cor:** Violet

Dossiê de implantação. Puramente read-only. Cinco cards em grid.

```
┌────────────────────────────┬───────────────────────────────┐
│  CARD: Cliente             │  CARD: Infraestrutura         │
│  Nome · Cidade · UF        │  Tipo de ligação              │
│  Lat/Lng                   │  Distribuidora · Tarifa       │
│                            │  Custo disponibilidade ANEEL  │
├────────────────────────────┼───────────────────────────────┤
│  CARD: Irradiação          │  CARD: Temperatura            │
│  Sparkline HSP 12 meses    │  Sparkline Tmin mensal        │
│  Média anual               │  Tmin crítica (Voc inverno)   │
│  Fonte: CRESESB/SunData    │  Fonte: INMET                 │
├────────────────────────────┴───────────────────────────────┤
│  CARD: Dimensionamento Atual (espelho do systemComposition) │
│  kWp instalado · módulos · inversor · FDI · PR             │
│  Atualiza em tempo real conforme os blocos mudam           │
├────────────────────────────────────────────────────────────┤
│  [Editar dados do cliente]       [Premissas de cálculo]    │
└────────────────────────────────────────────────────────────┘
```

Nenhum campo editável. "Editar dados" abre `ClientDataModal`. "Premissas" abre
`SettingsModule`. O Card Temperatura exibe Tmin padrão −5°C quando `weatherData`
não disponível.

---

### 5.6 ProposalModule

**Arquivo:** `modules/proposal/ProposalModule.tsx`
**Ativado por:** `'proposal'`
**Cor:** Indigo

**Estado bloqueado** (`variantStatus !== 'APPROVED'`):
```
        🔒
  Proposta bloqueada

  Aprove o sistema para gerar a proposta.

  [⚡ ✅]  [☀ ✅]  [🔲 ✅]   ← status dos blocos obrigatórios

     [→ Ver Simulação 📊]
```

**Estado ativo** (`variantStatus === 'APPROVED'`): módulo de proposta completo —
pricing com margens, lista de materiais (BOM), simulação financeira resumida,
exportação de PDF. Conteúdo vinculado à `DesignVariant` ativa.

---

## 6. Workspace Tabs

**Arquivo:** `panels/WorkspaceTabs.tsx`

As abas não têm estado próprio. São leitores e escritores do `activeFocusedBlock`.

| Aba | `id` | Cor ativa | Condição |
|-----|------|----------|---------|
| ⚡ Consumo | `'consumption'` | Amber | Sempre |
| ☀ Módulos | `'module'` | Sky | Sempre |
| 🔲 Elétrica | `'inverter'` | Emerald | Sempre |
| 📊 Simulação | `'simulation'` | Teal | Sempre |
| 🗺 Mapa | `'map'` | Slate | Sempre |
| 🏗 Site | `'site'` | Violet | Sempre |
| 📄 Proposta | `'proposal'` | Indigo | Desabilitada com 🔒 até `variantStatus === 'APPROVED'` |

**Aba ativa:** `border-t-2 border-{color}-500 text-{color}-400`
**Aba inativa:** `text-slate-500 hover:text-slate-300`
**Aba desabilitada:** `text-slate-700 cursor-not-allowed` + ícone de cadeado + tooltip

---

## 7. Stores e Slices

```
core/
├── state/
│   ├── solarStore.ts              ← orquestrador: compõe todos os slices
│   │                                persist (exceto uiStore) + zundo
│   ├── uiStore.ts                 ← estado de UI transiente (sem persist)
│   └── slices/
│       ├── clientSlice.ts         ← clientData, simulatedItems, weatherData
│       ├── techSlice.ts           ← modules{}, inverters{} (normalizado por id)
│       ├── electricalSlice.ts     ← bosInventory, logicalStrings
│       ├── engineeringSlice.ts    ← azimuth, inclination, settings
│       ├── projectSlice.ts        ← installationAreas, placedModules
│       ├── journeySlice.ts        ← loadGrowthFactor, kWpAlvo
│       ├── variantSlice.ts        ← activeVariantId, variantLabel, variantStatus
│       └── systemCompositionSlice.ts  ← seletores derivados (zero estado próprio)
```

### 7.1 `uiStore`

```typescript
interface UIState {
  activeTool: 'SELECT' | 'PLACE_MODULE' | 'DRAW_AREA' | 'MEASURE';
  setActiveTool: (t: Tool) => void;

  selectedEntity: { type: EntityType; id: string } | null;
  selectEntity: (type: EntityType, id: string) => void;
  clearSelection: () => void;

  activeFocusedBlock: FocusedBlock;
  setFocusedBlock: (b: FocusedBlock) => void;
}
```

### 7.2 `journeySlice`

```typescript
interface JourneySlice {
  loadGrowthFactor: number;          // 0–50, default 0
  kWpAlvo: number | null;
  setLoadGrowthFactor: (v: number) => void;
  setKWpAlvo: (v: number | null) => void;
}
```

`kWpAlvo` recalcula via `useEffect` na `ConsumptionCanvasView` sempre que
`monthlyConsumption`, `monthlyIrradiation` ou `loadGrowthFactor` mudam.

### 7.3 `variantSlice`

```typescript
interface VariantSlice {
  activeVariantId: string | null;
  variantLabel: string;
  variantStatus: 'DRAFT' | 'APPROVED' | 'ARCHIVED';
  loadVariant: (variantId: string) => Promise<void>;
  saveVariant: () => Promise<void>;
}
```

### 7.4 `systemCompositionSlice`

```typescript
interface BlockStatus {
  status: 'complete' | 'warning' | 'error' | 'empty';
  chips: Array<{ label: string; value: string; severity: 'ok'|'warn'|'error'|'neutral' }>;
}

interface SystemCompositionState {
  consumptionBlock: BlockStatus;
  moduleBlock: BlockStatus;
  arrangementBlock: ArrangementBlockStatus;  // estende BlockStatus com métricas de área
  inverterBlock: BlockStatus;
  connectorC1: { label: string; value: string; active: boolean };
  connectorC2: { label: string; value: string; active: boolean };
  autoSizingStep: 'idle' | 'consumption' | 'module' | 'inverter' | 'done';
}
// Zero estado armazenado — apenas seletores derivados com createSelector
```

### 7.5 `ArrangementBlockStatus`

```typescript
interface ArrangementBlockStatus extends BlockStatus {
  areaCount: number;
  physicalModuleCount: number;
  logicalModuleCount: number;
  totalAreaM2: number;
  fdi: number | null;
  consistencyDelta: number;   // physical − logical; positivo = excesso, negativo = falta
}
// Derivado via shoelaceAreaM2(area.localVertices) e cruzamento projectSlice × useTechStore
```

---

## 8. Modelo de Dados

### 8.1 Schema Prisma (`db_kurupira`)

```prisma
model TechnicalDesign {
  id          String          @id @default(uuid())
  tenantId    String
  iacaLeadId  String?
  clientData  Json
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  variants    DesignVariant[]
  @@index([tenantId])
}

model DesignVariant {
  id          String          @id @default(uuid())
  designId    String
  design      TechnicalDesign @relation(fields:[designId], references:[id], onDelete:Cascade)
  label       String          @default("Nova variante")
  status      String          @default("DRAFT")
  isFeatured  Boolean         @default(false)
  designData  Json
  pdfUrl      String?
  approvedAt  DateTime?
  archivedAt  DateTime?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  @@index([designId])
  @@index([designId, status])
}
```

### 8.2 Separação de dados

**`clientData`** — pertence ao `TechnicalDesign`, imutável por variante:
`clientName`, `city`, `state`, `lat`, `lng`, `connectionType`, `tariffRate`,
`monthlyConsumption[12]`, `distributorName`.

**`designData`** — pertence ao `DesignVariant`, varia por cenário:
módulos, inversores, strings, configurações de MPPT, áreas de instalação,
módulos posicionados, resultado de simulação, pricing.

### 8.3 Invariante de aprovação

Garantida no backend via transação atômica: aprovar uma variante arquiva
automaticamente todas as outras DRAFT do mesmo projeto. Jamais podem coexistir
duas variantes com `status === 'APPROVED'` no mesmo `TechnicalDesign`.

### 8.4 Rotas da API

```
GET    /api/v1/designs
GET    /api/v1/designs/:id
GET    /api/v1/designs/:id/variants
POST   /api/v1/designs/:id/variants
GET    /api/v1/designs/:id/variants/:variantId
PUT    /api/v1/designs/:id/variants/:variantId
PATCH  /api/v1/designs/:id/variants/:variantId/status
PATCH  /api/v1/designs/:id/variants/:variantId/label
DELETE /api/v1/designs/:id/variants/:variantId
```

---

## 9. Fluxo Completo do Integrador

```
Hub de Projetos
│
├── Criar novo projeto → ProjectInitWizardModal (cliente, localização, conexão)
│   ou abrir existente → deep link Iaçã (?token=JWT&leadId=X)
│
▼
Workspace abre → activeFocusedBlock = 'consumption'
│
▼  ConsumptionCanvasView
│  Integrador informa consumo → kWpAlvo calculado em tempo real
│  Integrador adiciona cargas simuladas (opcional)
│  Bloco Consumo fica verde → Bloco Módulos desbloqueia com lego-snap
│
▼  setFocusedBlock('module')   [CTA: Selecionar módulo →]
│
▼  MapCore modo placement
│  Integrador escolhe módulo no catálogo (overlay disparado pelo bloco)
│  Integrador posiciona módulos no telhado ou usa Auto-Layout
│  Bloco Arranjo atualiza chip de consistência
│  Bloco Inversor desbloqueia
│
▼  setFocusedBlock('inverter')  [Barra contextual: Ir para Inversor →]
│
▼  ElectricalCanvasView
│  Integrador escolhe inversor
│  Integrador configura MPPTs inline
│  Chips de validação ficam verdes
│  Bloco Simulação aparece com lego-snap
│
▼  setFocusedBlock('simulation')  [CTA: Ver Simulação →]
│
▼  SimulationCanvasView
│  Integrador vê geração anual, cobertura, economia R$/mês, payback
│  Integrador alterna entre visões do gráfico
│
▼  Aprovar sistema  [CTA: Aprovar sistema]
│  variantStatus = 'APPROVED'
│  Botão "Gerar Proposta" aparece no TopRibbon
│
▼  setFocusedBlock('proposal')  [Gerar Proposta →]
│
▼  ProposalModule
│  Integrador revisa pricing e BOM
│  Exporta PDF → DesignVariant.pdfUrl
│
FIM
```

---

## 10. Inventário de Arquivos

### Criar

```
canvas-views/
├── ConsumptionCanvasView.tsx
├── consumption/
│   ├── ConsumptionChart.tsx
│   ├── ClimateCorrelationChart.tsx
│   └── SimulatedLoadsPanel.tsx
├── electrical/
│   ├── ElectricalValidationSummary.tsx
│   ├── StringTopologyDiagram.tsx
│   └── MPPTConfigSection.tsx
├── simulation/
│   ├── DailyGenerationChart.tsx
│   ├── CreditBankChart.tsx
│   └── SimulationKPICards.tsx
└── site/
    ├── IrradiationSparkline.tsx
    └── TemperatureSparkline.tsx

core/state/slices/
├── journeySlice.ts
├── variantSlice.ts
└── systemCompositionSlice.ts

canvas-views/composer/
├── ComposerBlockArrangement.tsx
└── PropRowEditable.tsx

ui/components/
└── VariantSelector.tsx

ui/panels/
└── VariantManagerPanel.tsx

utils/
└── geoUtils.ts          ← shoelaceAreaM2()
```

### Modificar

```
panels/CenterCanvas.tsx               ← orquestração por activeFocusedBlock
panels/WorkspaceTabs.tsx              ← sincronização + cores de acento
panels/TopRibbon.tsx                  ← guardião + seletor de variante + Gerar Proposta
panels/LeftOutliner.tsx               ← onClick + estados visuais + ComposerBlockArrangement
canvas-views/MapCore.tsx              ← 3 modos + barra contextual + invalidateSize
canvas-views/ElectricalCanvasView.tsx ← layout reestruturado + VoltageRangeChart promovido
canvas-views/SimulationCanvasView.tsx ← motor corrigido + múltiplas visões
canvas-views/SiteCanvasView.tsx       ← 5 cards padronizados
canvas-views/composer/ComposerBlockModule.tsx
canvas-views/composer/ComposerBlockInverter.tsx
modules/proposal/ProposalModule.tsx   ← guard + tela de bloqueio
core/state/uiStore.ts                 ← activeFocusedBlock + 'arrangement' no FocusedBlock
core/state/solarStore.ts              ← compor journeySlice + variantSlice
prisma/schema.prisma                  ← DesignVariant + separação clientData/designData
src/routes/designs.js                 ← rotas de variantes
src/controllers/variants.controller.js← CRUD + aprovação atômica
```

---

## 11. Critérios de Aceitação

- [ ] Workspace abre com `activeFocusedBlock = 'consumption'` e `ConsumptionCanvasView` visível
- [ ] Click num bloco → canvas desliza para a view em 250ms
- [ ] Click numa aba → bloco correspondente recebe glow; todas as outras ficam `opacity-40`
- [ ] Editar consumo médio → kWp alvo no bloco atualiza em menos de 100ms
- [ ] Gráfico Perfil de Consumo: click numa barra abre Popover de edição do mês
- [ ] Adicionar carga sazonal "verão" → barras dos meses de verão crescem → kWp alvo sobe
- [ ] Nenhuma Canvas View desmonta ao navegar (verificável via React DevTools)
- [ ] MapCore não recarrega tiles ao alternar entre `'module'` e `'inverter'`
- [ ] `geracaoMensal[1]` (fevereiro) < `geracaoMensal[0]` (janeiro) para o mesmo projeto
- [ ] VoltageRangeChart usa Tmin da cidade — não −5°C fixo
- [ ] Editar módulos/string → chips de validação elétrica recalculam imediatamente
- [ ] Campos de configuração MPPT: commit no blur/enter, não a cada keystroke
- [ ] Bloco Arranjo exibe chip `△N` quando `physicalCount ≠ logicalCount`
- [ ] Economia mensal deduz custo de disponibilidade ANEEL conforme tipo de ligação
- [ ] Aprovação bloqueada quando blocos têm erros; tooltip lista exatamente o que falta
- [ ] Aprovar → `variantStatus = 'APPROVED'` → "Gerar Proposta" aparece no TopRibbon
- [ ] Aba Proposta bloqueada com 🔒 e tooltip até aprovação
- [ ] ProposalModule tela de bloqueio mostra status de cada bloco obrigatório
- [ ] Seletor de variante no TopRibbon funciona; trocar carrega o `designData` da variante
- [ ] Todo o fluxo sem nenhum prompt de "salvar"
- [ ] `tsc --noEmit` → EXIT CODE 0

---

## 12. Specs Detalhadas por Componente

| Spec | Escopo |
|------|--------|
| `spec-sincronia-bloco-canvas-2026-04-15.md` | Mecanismo `activeFocusedBlock` — fundação |
| `spec-compositor-blocos-2026-04-15.md` | Blocos: estados visuais, chips, conectores |
| `spec-foco-tatil-2026-04-15.md` | Glow, deemphasis, haptic feedback |
| `spec-edicao-inline-blocos-2026-04-15.md` | Campos inline nos blocos |
| `spec-bloco-arranjo-fisico-2026-04-15.md` | Bloco Arranjo: shoelace, FDI, consistência |
| `spec-guardiao-aprovacao-2026-04-15.md` | Lógica de aprovação + botão Gerar Proposta |
| `spec-jornada-integrador-2026-04-15.md` | journeySlice, kWpAlvo, cascata de ativação |
| `spec-multiplas-propostas-2026-04-15.md` | DesignVariant, variantes, seletor |
| `spec-view-consumption-2026-04-15.md` | ConsumptionCanvasView — especificação completa |
| `spec-view-electrical-2026-04-15.md` | ElectricalCanvasView — especificação completa |
| `spec-view-simulation-2026-04-15.md` | SimulationCanvasView — especificação completa |
| `spec-view-mapcore-2026-04-15.md` | MapCore 3 modos — especificação completa |
| `spec-view-site-2026-04-15.md` | SiteCanvasView — especificação completa |
| `spec-view-proposal-2026-04-15.md` | ProposalModule integração — especificação completa |
