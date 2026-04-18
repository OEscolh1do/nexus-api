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

## 2. Layout (Cockpit de Engenharia)

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
│  PAINEL 2 — Perfil de Consumo (Área Principal)                         │
│  [ Gráfico de Barras Principal: ConsumptionChart ]                     │
│  ----------------------------------------------------------------      │
│  Grade de Edição de Geração:                                           │
│  [JAN] [FEV] [MAR] [ABR] [MAI] [JUN] [JUL] [AGO] [SET] [OUT] [NOV] [DEZ]
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 3 — Inventário de Cargas Projetadas                            │
│  [ SimulatedLoadsPanel (Lista de Equipamentos com CRUD inline) ]       │
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

### 3.3 Painel 2 — Gráficos e Grade Histórica
- **`ConsumptionChart`**: O gráfico principal em barras verticais.
- **Formulário Grid de 12 Meses**: Abaixo do gráfico, ao invés do usuário editar as barras clicando nelas (como na especificação antiga), o sistema agora possui uma grade contínua e visível com 12 inputs (Jan a Dez). Isso se provou mais rápido para o *data-entry* de engenheiros lendo uma conta de luz física.

### 3.4 Painel 3 — Inventário de Cargas Simulado (`SimulatedLoadsPanel`)
- Lista de equipamentos futuros que o cliente comprará. 
- Somam em kWh no montante final para redefinir o cálculo da Potência Alvo do Inversor/Arranjo.

*(Nota: O Painel de Correlação Climática foi removido na revisão estética final para focar amplamente no gráfico de Consumo principal, garantindo clareza sem sufocar o Grid de 12 meses).*

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
