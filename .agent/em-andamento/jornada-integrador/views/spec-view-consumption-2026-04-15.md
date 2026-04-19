# Spec — ConsumptionCanvasView (Refatorada)

**Arquivo alvo:** `canvas-views/ConsumptionCanvasView.tsx`
**Tipo:** Feature Refatorada
**Módulo:** `engineering` — CenterCanvas
**Prioridade:** P0
**Responsável:** `the-builder`
**Revisor:** `design-lead` / `engenheiro-eletricista-pv`
**Data de Atualização:** 2026-04-18
**Ativada por:** `activeFocusedBlock === 'consumption'`

---

## 1. Propósito

A `ConsumptionCanvasView` foi elevada de um painel de inserção simples para um **Cockpit de Engenharia** rigoroso. Ela é a primeira etapa ativa e funciona como o raio-x do perfil de carga do cliente. Com a última refatoração, abraçou integralmente a *Engineering Tool Aesthetic*: layout denso, tabular-nums, mono fonts, elementos rectilinearizados com cores focais (Predominantemente Sky Blue para engenharia base e Amber para cargas).

Nela, o integrador define premissas base, inspeciona e corrige mês a mês (faturas) e mapeia projeções de carga (simuladas e crescimento em %), vendo a **Potência Alvo (kWp)** reagir instantaneamente no cabeçalho imobilizado (HUD).

---

## 2. Layout (Cockpit de Engenharia — Dashboard Unificado)

```text
┌────────────────────────────────────────────────────────────────────────┐
│  HEADER (Fixo - HUD)                                                   │
│  [Ícone] Módulo: Dimensionamento   |   [Potência Alvo]                 │
│          Base: X kWh/mês           |     [ 0.00 ] kWp                  │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 1 — Premissas (Inputs Inline Compactos)                        │
│  [Ligação: Mono/Tri] | [Tarifa R$] | [Média (kWh)] | [Expansão %]      │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 2 — Dashboard Unificado (Gráfico + Inventário)                 │
│  ┌──────────────────────────────────┬────────────────────────────────┐ │
│  │                                  │  ⚡ INVENTÁRIO DE CARGAS        │ │
│  │  [ ConsumptionChart ]            │  [Selecionar Carga ▾]          │ │
│  │  (inc. History Grid na base)     │  [Nome] [W] [H/d] [+ ADD]     │ │
│  │                                  │  ┌────────────────────────┐    │ │
│  │                                  │  │ Ar-Cond. 12k   36 kWh │    │ │
│  │                                  │  │ Chuveiro        82 kWh │    │ │
│  │                                  │  └────────────────────────┘    │ │
│  │                                  │  Total Cargas: +118 kWh/mês   │ │
│  │                                  │  Projeção Média: 485 kWh/mês  │ │
│  └──────────────────────────────────┴────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

Container da View: `relative w-full h-full flex flex-col bg-slate-950 overflow-hidden`

---

## 3. Especificações por Componente

### 3.1 Header HUD
**Fixado no topo**. Não dá *scroll*.  
- Exibe o Título, Cidade/UF carregados do `clientData`.
- O principal elemento é a **Potência Alvo (DC) em kWp**, que é reativa.  
- Quando qualquer premissa, matriz de 12 meses ou inventário de carga é adicionado, este valor altera em tempo real através do hook derivado: `calcKWpAlvo()`.

### 3.2 Painel 1 — Barra de Premissas (Master Control)
Inputs compactados horizontalmente (flex row), exibindo:
1. **Tipo de Ligação**: `select` (Monofásico, Bifásico, Trifásico).
2. **Tarifa Final**: Input numérico para R$/kWh (`tariffRate`).
3. **Média Rápida**: Input numérico (kWh). Sobrescreve a grade para um espalhamento flat caso o usuário não tenha a fatura detalhada.
4. **Expansão de Carga**: Slider *inline* (0 a 50%) que adiciona fator de crescimento na média do projeto.

*Estética:* `tabular-nums tracking-widest text-[11px] font-black`.

### 3.3 Painel 2 — Dashboard Unificado (Layout Flex-Row + Grid Inferior)
O bloco principal une gráfico, cargas projetadas e histórico de faturas num único container visual (`bg-slate-900`).

**Lado Esquerdo — `ConsumptionChart` (flex-1)**:
- Gráfico de barras verticais com controles climáticos.
- **History Grid (Lançamento por Mês Elétrico)**: Integrado na base do componente para edição direta das faturas.

### 3.4 Responsividade

| Breakpoint | Gráfico + Sidebar | History Grid | Premissas |
|-----------|-------------------|-------------|-----------|
| **Desktop** (≥1024px) | Side-by-side (`flex-row`) | `grid-cols-12` (1 linha) | `flex-row` inline |
| **Tablet** (768–1023px) | Sidebar colapsa abaixo | `grid-cols-6` (2 linhas) | `flex-row flex-wrap` |
| **Mobile** (<768px) | Empilhados (`flex-col`) | `grid-cols-4` (3 linhas) | `flex-col` empilhado |

---

## 4. Integração de Estado

Toda interação invoca a store central (`useSolarStore`):
```typescript
const setLoadGrowthFactor = useSolarStore(s => s.setLoadGrowthFactor);
const setKWpAlvo = useSolarStore(s => s.setKWpAlvo);
const updateClientData = useSolarStore(s => s.updateClientData);
const updateMonthlyConsumption = useSolarStore(s => s.updateMonthlyConsumption);
```
O recálculo do kWp Alvo avalia em tempo real a irradiância local (HSP local):
```typescript
const result = calcKWpAlvo(totalConsumptionMonthly, monthlyHsp, loadGrowthFactor);
```

---

## 5. Critérios de Aceitação Atualizados
- [x] Header travado exibe "Potência Alvo (DC)" reagindo instantaneamente às edições de consumo.
- [x] O usuário pode redigitar rapidamente as 12 faturas no grid inferior sem interagir com modais/popups.
- [x] Slider de Fator de Expansão e Input de Média Rápida compactados na barra fixa de premissas com estilo `Engineering Aesthetic`.
- [x] Arquitetura livre de vazamento de UI/renders paralelos infinitos (Infinite Loop Bugs debelados).
- [x] Inventário de Cargas integrado ao sidebar direito do Dashboard Unificado (sem scroll para acessar).
- [x] Biblioteca de Cargas compactada como `<select>` ao invés de chips de botões.
- [x] Responsividade de 3 breakpoints (mobile, tablet, desktop) validada.
- [x] `tsc --noEmit` → EXIT CODE 0.
