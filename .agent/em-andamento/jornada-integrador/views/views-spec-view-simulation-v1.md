# Spec — SimulationCanvasView

**Arquivo alvo:** `canvas-views/SimulationCanvasView.tsx`
**Tipo:** Refatoração + Correção de Motor
**Módulo:** `engineering` — CenterCanvas
**Prioridade:** P0
**Responsável:** `the-builder`
**Revisor:** `engenheiro-eletricista-pv` + `design-lead`
**Data:** 2026-04-16
**Versão:** 1.0
**Ativada por:** `activeFocusedBlock === 'simulation'` (via aba "Simulação" — bloco não tem `onClick`)
**Cor de acento:** Teal — `text-teal-400` / `border-teal-500/30`

---

## 1. Propósito

A `SimulationCanvasView` é o painel de resultados do dimensionamento. É onde o
integrador confirma que o sistema funciona na prática — quanto vai gerar, quanto o
cliente vai economizar, em quantos anos paga o investimento.

É a view de saída da jornada: não tem campos de entrada, só leitura e análise.
O integrador entra aqui para **confirmar** o que construiu nos blocos anteriores,
não para editar.

**Distinção importante:** o Bloco Simulação no LeftOutliner é uma saída passiva —
não tem `onClick` nem dispara `setFocusedBlock`. Apenas a aba "Simulação" no
`WorkspaceTabs` ativa esta view. Quando `activeFocusedBlock === 'simulation'`,
nenhum bloco do LeftOutliner recebe glow.

**Pré-condição para uso:** Bloco Consumo + Bloco Módulos + Bloco Inversor devem
estar completos para que os dados sejam significativos. A view renderiza mesmo com
blocos incompletos, mas exibe um aviso de dados insuficientes.

---

## 2. Correção do Motor: `DAYS_IN_MONTH` (crítico)

### 2.1 O problema

O motor atual usa `× 30` fixo para converter geração diária em mensal:

```typescript
// ERRADO — motor atual
const monthlyGeneration = dailyGeneration * 30; // fevereiro = 28, não 30
```

Isso causa erro sistemático: fevereiro é superestimado em ~7%, julho é subestimado
em ~3%. Payback e cobertura ficam levemente errados.

### 2.2 A correção

```typescript
// CORRETO
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
// Índice 0 = janeiro, índice 11 = dezembro

const monthlyGenerationKwh = monthlyHSP.map((hsp, i) => {
  const dailyGenerationKwh = systemKwp * hsp * performanceRatio;
  return dailyGenerationKwh * DAYS_IN_MONTH[i];
});
```

**Impacto:** fevereiro e meses com 30 dias calculados corretamente. Diferença
típica em projetos reais: < 2% no total anual, mas importante para precisão mensal
e para o relatório de banco de créditos ANEEL.

### 2.3 Localização da correção

O cálculo está em `utils/simulationMath.ts` (ou equivalente). A correção é
cirúrgica — substituir `* 30` por `* DAYS_IN_MONTH[monthIndex]`.

**Impacto em `simulation_result` persistido:** variantes aprovadas com o motor
antigo têm `monthlyGenerationKwh` incorreto. A correção aplica apenas a novos
cálculos — não retroativo em variantes já aprovadas.

---

## 3. Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  FAIXA DE MÉTRICAS (4 cards horizontais)                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  PAINEL PRINCIPAL — Gráfico + Seletor de Visão                  │   │
│  │  [Barras]  [Composição]  [Tabela]          [◀ Jan ▶]           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────┬──────────────────────────────┐   │
│  │  PAINEL CURVA DIÁRIA             │  PAINEL BANCO DE CRÉDITOS    │   │
│  │  (geração horária do mês sel.)   │  (saldo mensal acumulado)    │   │
│  └──────────────────────────────────┴──────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  RODAPÉ — CTA de aprovação                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

Container: `h-full overflow-y-auto bg-slate-950 p-4 flex flex-col gap-4`

---

## 4. Faixa de Métricas

4 cards horizontais em `grid grid-cols-4 gap-3`:

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  ☀ Geração Anual │ │  📊 Cobertura    │ │  💰 Economia/ano │ │  ⏱ Payback       │
│  8.432 kWh       │ │  103%            │ │  R$ 8.274        │ │  4,2 anos        │
│  teal-400        │ │  sky-400         │ │  emerald-400     │ │  amber-400       │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
```

**Dados:**
- Geração Anual: `sum(simulationResult.monthlyGenerationKwh)`
- Cobertura: `annualGenerationKwh / sum(clientData.monthlyConsumption) × 100`
- Economia/ano: requer `tariffRate` + modelo ANEEL (custo de disponibilidade incluído se `spec-monetizacao-banco-creditos` disponível; caso contrário, estimativa simples: `min(geração, consumo) × tariffRate × 12`)
- Payback: `pricingData.totalPriceR$ / economiaAno` (null se `pricingData` ausente)

**Estado sem dados:** todos os 4 cards exibem `—` com tooltip "Dados insuficientes.
Complete os blocos de Consumo, Módulos e Inversor."

---

## 5. Painel Principal — Gráfico com Múltiplas Visões

### 5.1 Seletor de visão

```
[Barras ▾]  [Composição]  [Tabela]
```

Três visões alternáveis sem recarregar dados — apenas mudança de componente de
renderização, mantendo os dados em `useState` local.

### 5.2 Visão: Barras (padrão)

`BarChart` Recharts com dois conjuntos de barras por mês:
- Barras de **Geração** — `fill: teal-500` (ou `teal-400` quando mês selecionado)
- Barras de **Consumo** — `fill: amber-500/60`
- Linha de meta — tracejada no valor de `averageConsumption`

Eixo X: meses (jan–dez, abreviados).
Tooltip: geração kWh, consumo kWh, saldo kWh (± do sistema).

```
kWh
 900 │     ████
 800 │  ██ ████ ██
 700 │  ██ ████ ██ ██ ██
 600 │──██─████─██─██─██─── meta
 500 │  ██ ████ ██ ██ ██
     └──────────────────── meses
       J  F  M  A  M  J  J  A  S  O  N  D
       ■ Geração  ■ Consumo
```

**Interatividade:** clicar numa barra seleciona o mês → atualiza o Painel Curva Diária.

### 5.3 Visão: Composição

`StackedBarChart` ou `AreaChart` mostrando como a geração se divide em:
- **Autoconsumo** — geração usada no momento (estimativa: `min(geração_hora, consumo_hora)`)
- **Injeção na rede** — excedente enviado (geração - autoconsumo)
- **Da rede** — consumo não coberto pela geração

Útil para clientes com consumo concentrado em horários específicos (ar-cond diurno
vs. noturno). Estimativa simplificada: autoconsumo ≈ 30% da geração para perfil
residencial típico.

### 5.4 Visão: Tabela

```
Mês     Geração(kWh)  Consumo(kWh)  Saldo(kWh)  Cobertura(%)
Jan     720           610           +110         118%
Fev     668           590           +78          113%
Mar     701           615           +86          114%
...
─────────────────────────────────────────────────────────
Total   8.432         7.320         +1.112       115%
```

Alternância com as outras visões é imediata — sem loading.

---

## 6. Painel Curva Diária

**Ativado por:** mês selecionado no gráfico principal (default: mês atual).

```
Perfil de geração — Janeiro
────────────────────────────
   kW
3.5│         ▄▄▄▄▄
3.0│       ▄▄     ▄▄
2.5│     ▄▄         ▄▄
2.0│   ▄▄               ▄▄
1.5│  ▄                   ▄
   └──────────────────────────── hora
      6  8  10 12 14 16 18
```

**Dados:** `AreaChart` Recharts com perfil horário de irradiação da cidade para o
mês selecionado. Fórmula: `potência_hora = systemKwp × irradiação_hora × PR`.

**Fonte de irradiação horária:** perfil típico de curva gaussiana centrado ao
meio-dia solar, modulado pelo HSP do mês. Não requer API externa — cálculo
client-side baseado na latitude do projeto e no mês.

**Header do painel:**
```
☀ Janeiro  ·  Geração: 720 kWh  ·  HSP: 5,1 kWh/m²/dia
```

---

## 7. Painel Banco de Créditos

Visualização do saldo acumulado de créditos de energia ao longo do ano.

```
Saldo acumulado (kWh)
 600│         ▄▄▄▄▄▄▄▄▄▄▄▄
 400│      ▄▄▄              ▄▄▄
 200│  ▄▄▄▄                    ▄▄▄
   0└────────────────────────────── meses
      J  F  M  A  M  J  J  A  S  O  N  D
```

**Algoritmo:**
```typescript
let saldoAcumulado = 0;
const saldoMensal = monthlyGenerationKwh.map((gerado, i) => {
  const consumido = clientData.monthlyConsumption[i];
  saldoAcumulado = Math.max(0, saldoAcumulado + gerado - consumido);
  // créditos expiram após 60 meses (ANEEL RN 1000) — não modelado aqui, simplificação
  return saldoAcumulado;
});
```

**Header do painel:**
```
🏦 Banco de Créditos  ·  Pico: 520 kWh (julho)  ·  Zerado em: 4 meses/ano
```

---

## 8. Rodapé — CTA de Aprovação

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ✅ Sistema elétrico válido  ·  Geração 8.432 kWh/ano         [Aprovar sistema →] │
└─────────────────────────────────────────────────────────────────────────┘
```

**Condição de exibição do CTA:**
- Bloco Consumo, Módulos e Inversor com `status === 'complete'`
- `simulationResult` calculado (não null)

**Quando não disponível:**
```
⚠ Complete os blocos de Consumo, Módulos e Inversor para aprovar.
```

**Clique no CTA:** `handleApprove()` — chama a mesma lógica do guardião no
`TopRibbon`. O rodapé é um atalho de conveniência, não um segundo ponto de
aprovação com lógica diferente.

---

## 9. Estado de Dados Insuficientes

Quando `simulationResult === null` (nenhum cálculo feito):

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│         📊                                                              │
│         Simulação ainda não disponível                                  │
│                                                                         │
│         Complete os blocos de Consumo, Módulos e Inversor               │
│         para ver a geração estimada e o payback.                        │
│                                                                         │
│         [← Ir para Consumo]                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

CTA `[← Ir para Consumo]` chama `setFocusedBlock('consumption')`.

---

## 10. Persistência do `simulation_result`

### 10.1 Quando calcular

`simulationResult` é calculado e persistido **automaticamente** quando todos os
inputs estão presentes:
- `clientData.monthlyConsumption` (12 valores não-zero)
- `clientData.monthlyIrradiation` (ou HSP da tabela estática da cidade)
- `designData.moduleData.totalKwp > 0`

O cálculo roda em `useEffect` observando esses três inputs. O resultado vai para
`solarStore.designVariant.designData.simulationResult` e é salvo pelo autosave
otimista.

### 10.2 Obrigatoriedade ao aprovar

Ao chamar `approveVariant()` no backend, o campo `simulationResult` deve estar
preenchido no `designData`. O backend valida e retorna 422 se ausente.

**Responsabilidade do frontend:** garantir que `simulationResult` está calculado
antes de habilitar o botão de aprovação. O `systemCompositionSlice` verifica isso
como parte do estado `'complete'` do Bloco Simulação.

---

## 11. Arquivos

### Modificar

| Arquivo | Mudança |
|---------|---------|
| `canvas-views/SimulationCanvasView.tsx` | Reescrever layout; adicionar seletor de visão; corrigir motor `DAYS_IN_MONTH` |
| `utils/simulationMath.ts` | Substituir `* 30` por `* DAYS_IN_MONTH[i]` |

### Criar

| Arquivo | Propósito |
|---------|-----------|
| `canvas-views/simulation/SimulationMetrics.tsx` | Faixa dos 4 cards de métricas |
| `canvas-views/simulation/GenerationConsumptionChart.tsx` | Visão Barras (se ainda não refatorada) |
| `canvas-views/simulation/CompositionChart.tsx` | Visão Composição |
| `canvas-views/simulation/AnalyticsTable.tsx` | Visão Tabela |
| `canvas-views/simulation/DailyGenerationChart.tsx` | Curva diária por mês |
| `canvas-views/simulation/CreditBankChart.tsx` | Banco de créditos |

---

## 12. Critérios de Aceitação

### Motor
- [ ] Fevereiro calculado com 28 dias, não 30 — verificar: `mockData.monthlyGeneration[1] ≠ mockData.monthlyGeneration[0]` para HSP idêntico
- [ ] `sum(monthlyGenerationKwh)` com `DAYS_IN_MONTH` difere do motor antigo em < 2% mas > 0% para qualquer projeto

### Interface
- [ ] Alternância Barras / Composição / Tabela sem flicker ou recarregamento de dados
- [ ] Clicar na barra de julho → Painel Curva Diária muda para perfil de julho
- [ ] Estado de dados insuficientes exibe empty state (não gráfico em branco)
- [ ] CTA "Aprovar sistema" no rodapé visível apenas quando todos os blocos estão completos
- [ ] Aba "Simulação" com `activeFocusedBlock === 'simulation'` → nenhum bloco recebe glow

### Persistência
- [ ] `simulationResult` recalcula automaticamente ao mudar `totalKwp` ou `monthlyConsumption`
- [ ] `simulationResult` está preenchido no `designData` antes de habilitar aprovação

### Técnico
- [ ] `tsc --noEmit` → EXIT CODE 0
- [ ] Sem referência a `× 30` no `simulationMath.ts` após correção — verificar grep

---

## Referências

- `spec-sincronia-bloco-canvas-2026-04-15.md` §2 — Bloco Simulação como saída passiva
- `spec-guardiao-aprovacao-2026-04-16.md` — lógica de aprovação (rodapé CTA)
- `spec-multiplas-propostas-2026-04-16.md` §5.3 — `simulationResult` no `DesignData`
- `spec-canvas-views-design-2026-04-15.md` §5 — plano de refatoração original
- `.agent/concluido/spec-01-curva-geracao-diaria-2026-04-11.md` — curva diária (especificação original)
- `.agent/concluido/spec-02-visoes-multiplas-geracao-consumo-2026-04-11.md` — múltiplas visões (especificação original)
- `.agent/aguardando/spec-motor-analitico-faturado-2026-04-10.md` — motor analítico faturado (melhoria futura)
- `.agent/aguardando/spec-monetizacao-banco-creditos` — economia em R$ com ANEEL (melhoria futura)
