# Spec — ProjectionCanvasView (Engineering Tool Aesthetic)

**Arquivo alvo:** `canvas-views/ProjectionCanvasView.tsx`
**Tipo:** Refatoração Completa (UX/UI & Layout) + Correção de Motor Matemático
**Módulo:** `engineering` — CenterCanvas
**Prioridade:** P0
**Responsável:** `the-builder`
**Revisor:** `design-lead` / `engenheiro-eletricista-pv` / `data-storyteller`
**Data de Atualização:** 2026-04-21
**Ativada por:** `activeFocusedBlock === 'projection'`
**Cor de acento:** Amber — `text-amber-400` / `border-amber-500/30`
> ⚠️ **Nota:** context.md é o guia mestre de design. Amber = Geração/Módulos conforme Matriz Semântica v3.8.1.

---

## 1. Propósito (A Narrativa da Energia)

A `ProjectionCanvasView` é o ponto culminante da jornada — um **Cockpit de Projeção** estritamente vertical e contínuo. Seguindo a **Pirâmide Invertida do Data Storyteller**, a view não é apenas uma leitura de banco de dados, mas uma ferramenta de argumentação B2B/B2C.

É aqui que o rigor matemático da Engenharia (consumo, HSP, coeficiente de temperatura) se traduz em narrativa econômica e técnica audível para o cliente final: **KWh reais, Economia Relativa, Payback e Segurança Energética**. 
Não há campos de inserção complexos nesta view; é o ambiente onde o integrador atesta que a engenharia de fato mitiga a fatura elétrica do cliente e se paga ao longo do tempo.

---

## 2. Correção Crítica do Motor: O Fim do "Mês de 30 Dias"

A fundação de todo o Data Storytelling financeiro reside na exatidão. A antiga aproximação flat de 30 dias para todos os meses introduzia erros em cascata que arruinavam a projeção de saldo ANEEL.

*   **O Problema (Depreciado):** `monthlyGeneration = dailyGeneration * 30`. Causava distorções irreais: superestimação na geração de fevereiro (~7%) e subestimação dos picos de meio de ano.
*   **A Correção (Novo Padrão `Dike`):** 
    Cômputo exato iterando o array real do calendário:
    ```typescript
    const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    // utils/simulationMath.ts
    const monthlyGenerationKwh = monthlyHSP.map((hsp, i) => {
      const dailyGenerationKwh = systemKwp * hsp * performanceRatio;
      return dailyGenerationKwh * DAYS_IN_MONTH[i];
    });
    ```

---

## 3. Layout (Cockpit de Engenharia)

```text
┌────────────────────────────────────────────────────────────────────────┐
│  HEADER (Fixo - HUD)                                                   │
│  [Ícone] Projeção de Energia       |   Métricas Vitais Globais         │
│          Geração: [ XXXX kWh/ano]  |   [ PR 76% ] (Teal-400)           │
│                                    |   [ Payback 2.4 Anos ]            │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 1 — Barra de Premissas e Decomposição do PR (Reuso de Motor)   │
│  [ Uv Térmico (Base do Mapa) ] [ Slider: Sujidade ] [ Slider: Sombr. ] │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 2 — KPI's de Engenharia (Resumo Técnico Expandido)             │
│  [ KPICard | Geração ] [ KPICard | Cobertura ] [ KPICard | Economia R$]│
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 3 — O Gráfico Contratual (12 Meses FullWidth)                  │
│  [ Seletor Modalidade: Barras | Área Empilhada | DataGrid Tabela ]     │
│  (Gráfico central em Full-Width — Extinguindo o formato lateralizado)  │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 4 — O "Micro" (Pico Horário e Saldo Restitutivo)               │
│  [ Gráfico de Perfil Horário (Bell) ]  [ Acumulador do Banco ANEEL ]   │
└────────────────────────────────────────────────────────────────────────┘
```
**Tipografia Principal:** `tabular-nums tracking-widest text-[11px] font-black`.
**Container:** `bg-slate-950 flex flex-col overflow-y-auto`.

---

## 4. Fórmulas e Arquitetura de Componentes

### 4.1. Painel 1: Barra de Premissas (Reuso de Motor — Sem Reimplementação)
**Importante:** Não será feita recriação da lógica de perdas do zero. O motor matemático e os estados (Zustand: `lossConfig.ts`) da Decomposição do PR (Sujidade, Sombreamento) serão **importados e reaproveitados**. A tarefa do desenvolvedor para este painel é estritamente **refatoração de UI/UX** — transmutar o formulário antigo (blocos modais/laterais) para uma faixa de acoplamento `inline` horizontal de alta densidade no cockpit.

### 4.2. Painel 2: KPI Metrics (`SimulationMetrics.tsx`)
Renderiza faróis executivos. Em caso de falta de premissas, exibe estado inerte "—".
*   **Geração Anual:** `sum(simulationResult.monthlyGenerationKwh)`
*   **Cobertura (%):** `(annualGenerationKwh / sum(clientData.monthlyConsumption)) × 100`
*   **Economia/ano (R$):** Usa `tariffRate`. Estimativa baseline: `min(geração_anual, consumo_anual) × tariffRate` acrescido do prêmio de injeção ANEEL se aplicável.
*   **Payback (Anos):** `pricingData.totalPriceR$ / economiaAno` (Depende dos dados de precificação, exibindo '—' se ausente).

### 4.3. Painel 3: O Gráfico Multi-Visão (`GenerationConsumptionChart.tsx`)
Sem reloads (estado local de React), o integrador alterna a narrativa visual (`w-full`):
1. **Visão Barras (`BarChart`):** Amber para geração `vs` Sky para consumo. Tracejado na meta (`averageConsumption`).
2. **Visão Composição (`AreaChart`):** Empilhado exibindo a dinâmica "Auto-Consumo (Usado Real-Time)" vs "Injeção na Rede (Excedente Exportado)".
3. **Visão Tabela (`AnalyticsTable.tsx`):** DataGrid 12x4 (Mês, Geração, Consumo, Saldo).

### 4.4. Painel 4: Curva Diária e Banco de Dados (`CreditBankChart.tsx`)
O **Perfil Diário** (`DailyGenerationChart.tsx`) é baseado numa distribuição gaussiana do HSP, ancorada ao sol do meio dia, limitando-se ao "Clipping" se `Total kWp > Potência AC Inversor`.
O **Banco de Créditos** mapeia a sobra usando o seguinte algoritmo vetorial mitigador:
```typescript
let saldoAcumulado = 0;
const bancoMensal = monthlyGenerationKwh.map((gerado, i) => {
  const consumido = clientData.monthlyConsumption[i];
  saldoAcumulado = Math.max(0, saldoAcumulado + gerado - consumido);
  // (Limites ANEEL de 60 meses abstraídos em favor do ciclo primário de 1 ano)
  return saldoAcumulado;
});
```

---

## 5. Estados Vazios (Empty States & Guardrails)

A tríade de Engenharia (`Consumo`, `Módulos`, `Inversões`) deve estar validada (`status === 'complete'`) para rodar `simulationResult`.

**Se `projectionResult === null`:**
O Cockpit bloqueia a montagem dos gráficos numéricos e exibe estritamente:
```text
📊 Projeção ainda não disponível
Complete os blocos de Consumo, Módulos e Inversor para extrair as matrizes energéticas.
[ ← Botão: Ir para Consumo ] // Action: setFocusedBlock('consumption')
```

---

## 6. Arquivos e Estrutura de Diretórios a Implementar

### Modificar Existentes:
*   `canvas-views/SimulationCanvasView.tsx` → renomear para `ProjectionCanvasView.tsx` (Reestruturar HTML layout e ancorar Header).
*   `utils/simulationMath.ts` → renomear para `projectionMath.ts` (Substituir motor base de `* 30` para `DAYS_IN_MONTH`).

### Novos Componentes (`canvas-views/projection/`):
*   `ProjectionLossBar.tsx` (Invólucro para refatoração UI dos sliders de perdas locais conectando com `lossConfig.ts` — sem duplicar lógica).
*   `ProjectionMetrics.tsx` (Faixa de KPIs com Payback).
*   `GenerationConsumptionChart.tsx` (Gráfico Visão de Barras).
*   `CompositionChart.tsx` (Visão Área Empilhada).
*   `AnalyticsTable.tsx` (DataGrid Mensal Rigoroso).
*   `DailyGenerationChart.tsx` (A Campana de Gauss Diária).
*   `CreditBankChart.tsx` (Acumulador Financeiro ANEEL).

---

## 7. Critérios de Aceitação (Chain of Verification)
- [x] O algoritmo de `DAYS_IN_MONTH` calcula fevereiro precisamente como 28 dias matemáticos exatos.
- [x] O arranjo visual obedece ao Cockpit Vertical (`w-full`), abandonando margens divididas laterais, em tipografia monospace `tabular-nums text-[11px]`.
- [x] A transição entre abas (Gráfico vs Tabela) ocorre em nível de componente, sem disparos laterais de query nem flickers arquiteturais.
- [x] A lógica do Banco de Créditos reflete a função Acumuladora vetorial `Math.max(0, acumulado + gerado - consumido)`.
- [x] Nenhuma lógica vetorial de Perda (PR) duplicada: o componente novo deve instanciar o motor atual.
- [x] `tsc --noEmit` retorna `0`.
