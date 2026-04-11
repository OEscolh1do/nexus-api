# Spec 02: Visões Múltiplas de Geração vs Consumo
**Tipo:** Feature de Simulação  
**Skill responsável:** design-lead (visualização) + the-builder (dados)  
**Revisor de aceitação:** engenheiro-eletricista-pv  
**Prioridade:** P1  
**Origem:** Jornada do Engenheiro — Dimensionamento via Simulação

---

## Problema

O Dashboard atual oferece **uma única visão**: o Grouped BarChart mensal. Para um engenheiro convencer o cliente, apresentar ao banco ou defender o projeto na distribuidora, ele precisa de múltiplas perspectivas analíticas sobre os mesmos dados. Softwares de referência (PVsyst, SolarEdge Designer) oferecem no mínimo 3-4 visões distintas.

O projetista quer responder perguntas diferentes conforme a audiência:
- **Para o cliente:** "Em quais meses eu pago menos?" → Visão de economia mensal.
- **Para o banco:** "Quanto eu acumulo ao longo do ano?" → Visão cumulativa.
- **Para a distribuidora:** "O sistema injeta mais do que consome?" → Visão de balanço líquido.

## Solução Técnica

### Visão A — Barras Empilhadas (Stacked: Autoconsumo + Injeção)
Decompor a barra de geração em duas camadas:
```typescript
// Para cada mês i:
const autoconsumo = Math.min(geracao[i], consumo[i]);   // kWh consumidos instantaneamente
const injecao = Math.max(0, geracao[i] - consumo[i]);    // kWh injetados na rede
const deficit = Math.max(0, consumo[i] - geracao[i]);     // kWh comprados da rede
```

**Gráfico:** StackedBarChart com 3 camadas:
- Autoconsumo (verde-escuro/emerald) — base
- Injeção na rede (âmbar-claro) — topo da barra de geração
- Déficit (vermelho/rose-suave) — barra negativa ou separada

### Visão B — Curva Cumulativa (Running Total)
Acumular mês a mês o saldo `Geração - Consumo`:
```typescript
let saldoAcumulado = 0;
const cumulativeData = MONTHS.map((month, i) => {
  saldoAcumulado += geracao[i] - consumo[i];
  return { month, saldo: saldoAcumulado };
});
```

**Gráfico:** AreaChart com gradiente verde (acima de zero) e vermelho (abaixo de zero). Mostra visualmente o ponto de break-even e a acumulação de créditos no tempo.

### Visão C — Tabela Analítica (Data Grid)
Tabela numérica precisa com todas as colunas computadas:

| Mês | Consumo (kWh) | Geração (kWh) | Autoconsumo | Injeção | Déficit | Saldo Acumulado |
|-----|:---:|:---:|:---:|:---:|:---:|:---:|

**Componente:** Tabela HTML estilizada com totalizadores no `<tfoot>`.

### Navegação entre Visões
- **Barra de botões/tabs** no header do Bloco Comparativo: `[Barras] [Composição] [Cumulativo] [Tabela]`
- Estado local via `useState<'bars' | 'stacked' | 'cumulative' | 'table'>`.
- Transição suave entre as visões com `animate-in`.

---

## Arquivos Afetados

### Modificar
- `[MODIFY] SimulationCanvasView.tsx` — Adicionar as 3 visões alternativas + tabs de navegação.

### Novo (opcional, se o componente crescer demais)
- `[NEW] .../canvas-views/simulation/ChartBarView.tsx` — Visão atual (barras simples).
- `[NEW] .../canvas-views/simulation/ChartStackedView.tsx` — Visão de composição.
- `[NEW] .../canvas-views/simulation/ChartCumulativeView.tsx` — Visão cumulativa.
- `[NEW] .../canvas-views/simulation/DataTableView.tsx` — Tabela analítica.

---

## Critérios de Aceitação
- [ ] O engenheiro consegue alternar entre 4 visões sem recarregar a página.
- [ ] Os dados são derivados do mesmo `useMemo` — sem re-computação por visão.
- [ ] A Tabela Analítica exibe 7 colunas com totais no rodapé.
- [ ] A Visão Cumulativa mostra claramente em qual mês o saldo acumulado se torna positivo.
- [ ] `tsc --noEmit` → EXIT CODE 0.

## Referências
- PVsyst 7.x — "Detailed Results" → Monthly Balance.
- SolarEdge Designer — "Energy Production" → Monthly Breakdown.
