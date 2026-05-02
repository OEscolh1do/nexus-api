---
name: analise-sensibilidade-pv
description: >
  Especialista em análise estocástica de risco para projetos fotovoltaicos. Ative quando o
  Kurupira precisar gerar cenários P50/P75/P90/P95 de produção, realizar stress tests de
  viabilidade financeira (choque tarifário, risco regulatório Lei 14.300, perda de isenção
  ICMS, reforma tributária IVA), avaliar "bankability" para project finance ou BNDES, ou
  calcular o ponto de break-even de sistemas BESS acoplados para recuperar o payback. Ative
  em `sensitivityEngine.ts`, `scenarioBuilder.ts` ou na aba de risco da proposta.
---

# Skill: Análise de Sensibilidade e Risco em Projetos Fotovoltaicos

Consultor de domínio para aferição fiduciária e bankability de projetos solares no Kurupira.

---

## Por Que Análise Estocástica é Obrigatória

Projetos fotovoltaicos têm horizonte de 25 anos. Usar apenas premissas determinísticas (um
único valor de irradiação, uma única premissa tarifária) é cientificamente inadequado e
financeiramente imprudente. As incertezas principais:

| Fonte de Incerteza | Impacto típico no yield | Controlável? |
|-------------------|------------------------|--------------|
| Variabilidade interanual de irradiação | ±5%–10% | Não |
| Precisão dos dados TMY (PVGIS, CRESESB) | ±3%–6% | Parcialmente |
| Degradação real vs. garantia do fabricante | ±2%–5% | Não |
| Soiling (sujeira acumulada) | ±2%–6% | Sim (limpeza) |
| Precisão do software de simulação | ±2%–5% | Parcialmente |
| Perdas de disponibilidade (falhas, paradas) | ±0,5%–2% | Sim (O&M) |
| Reformas regulatórias (Fio B, ICMS) | ±5%–20% no ROI | Não |

---

## 1. Modelagem Estocástica de Produção: P50/P75/P90/P95

### Conceito de Excedência

`P90` significa que o sistema tem 90% de probabilidade de **superar** essa produção. É o
inverso de um percentil de falha — quanto maior o P, mais conservador (menor o valor).

```
P50 = μ (média — base do fluxo de caixa esperado)
P75 = μ − 0,674 × σ
P90 = μ − 1,282 × σ
P95 = μ − 1,645 × σ
```

Onde:
- `μ` — Produção P50 anual (kWh) — output do pv-simulation-engine com TMY
- `σ` — Desvio padrão composto de todas as fontes de incerteza

### Composição do Desvio Padrão Consolidado

As incertezas são independentes e se combinam em quadratura (soma dos quadrados):

```
σ_total = μ × √(σ_tmY² + σ_degradacao² + σ_soiling² + σ_software² + σ_disponibilidade²)
```

Valores de referência para projetos brasileiros:

| Componente | σ típico (% do yield) |
|-----------|----------------------|
| Variabilidade interanual TMY | 5%–7% |
| Degradação vs. garantia | 2%–4% |
| Soiling (sem monitoramento) | 2%–4% |
| Precisão do software | 3%–5% |
| Disponibilidade do sistema | 1%–2% |
| **σ_total composto** | **6%–10%** |

**Default seguro para o Kurupira:** `σ_total = 8%` (sem dados site-specific).

### Exemplo Numérico

Sistema P50 = 180.000 kWh/ano, σ_total = 8%:

```
σ = 180.000 × 0,08 = 14.400 kWh

P75 = 180.000 − 0,674 × 14.400 = 170.294 kWh  (−5,4%)
P90 = 180.000 − 1,282 × 14.400 = 161.539 kWh  (−10,3%)
P95 = 180.000 − 1,645 × 14.400 = 156.312 kWh  (−13,2%)
```

### Aplicação de Mercado por Cenário

| Cenário | Probabilidade de superar | Aplicação |
|---------|-------------------------|-----------|
| **P50** | 50% | Retorno sobre capital próprio (RoE). Estudos de viabilidade de M&A. |
| **P75** | 75% | Análise de investidores com apetite a risco moderado. |
| **P90** | 90% | **Benchmark para project finance e dívida bancária.** O projeto deve pagar todas as parcelas do empréstimo neste cenário. |
| **P95** | 95% | Stress test extremo. Regiões com alta variabilidade (secas, microclimas). |

**Regra do BNDES/bancos de desenvolvimento:** projetos financiados devem demonstrar
viabilidade (fluxo de caixa positivo suficiente para amortização) no cenário **P90**.

---

## 2. Stress Tests Fisco-Regulatórios

Além da variabilidade física, o Kurupira deve testar três cenários de risco regulatório:

### Modelo 1 — Baseline Legal (Cenário Padrão)

- Aplica o escalonamento exato do Fio B conforme tabela da Lei 14.300 (ver roi-fotovoltaico)
- Mantém isenções de ICMS via Convênio 16/2015 em todos os estados que as adotaram
- Reajuste tarifário = IPCA + 2% ao ano
- Serve como base comparativa para os outros dois modelos

### Modelo 2 — Estresse Tributário (IVA/Reforma Tributária)

Cenário pessimista que modela a perda de isenções fiscais com a unificação tributária:

```
Impacto = E_injetada_t × tarifa_t × aliquota_iva_incremental
```

Testar com alíquotas incrementais de 5%, 10%, 15% sobre a energia compensada.

O modelo identifica o "limite letal": a alíquota máxima de IVA que faz o VPL decair a zero.
Isso é especialmente crítico para projetos de Autoconsumo Remoto e Geração Compartilhada,
que historicamente enfrentam disputas tributárias sobre a natureza jurídica da compensação.

### Modelo 3 — Break-Even BESS (Sistemas de Armazenamento)

Em cenários onde os Modelos 1 e 2 inviabilizam o financiamento, calcular o BESS break-even:

```
CAPEX_total_bess = CAPEX_solar + CAPEX_bateria
Economia_bess = E_autoconsumo_solar + E_bateria_noturna (elimina Fio B sobre E_injetada)
                + Peak_shaving (Grupo A: corte de demanda na ponta)

Break-even_BESS = encontrar N tal que VPL_bess(N) = VPL_sem_bess
```

O Kurupira deve identificar o **Ano Fiscal de Cruzamento**: ponto a partir do qual o projeto
com BESS supera o projeto sem BESS em VPL acumulado, justificando o CAPEX adicional.

**Benefícios do BESS que eliminam a penalidade Fio B:**
1. Armazena excedente diurno → descarrega à noite → elimina E_injetada (sem Fio B)
2. Peak shaving Grupo A: reduz demanda de ponta → economia na componente kW
3. Back-up parcial: resiliência operacional em regiões com interrupções frequentes

---

## 3. Matriz de Sensibilidade Cruzada

Gerar uma matriz 3D que mostra o VPL (ou payback) variando duas variáveis simultaneamente:

### Exemplo: VPL × (Irradiação ± %, CAPEX ± %)

```
              CAPEX −15%   CAPEX −10%   CAPEX base   CAPEX +10%   CAPEX +15%
Irrad. +10%  [VPL máx]    [...]         [...]         [...]         [...]
Irrad. +5%   [...]         [...]         [...]         [...]         [...]
Irrad. base  [...]         [...]         [VPL base]    [...]         [...]
Irrad. −5%   [...]         [...]         [...]         [...]         [...]
Irrad. −10%  [...]         [...]         [...]         [VPL mín]    [...]
```

### Variáveis Recomendadas para Análise

| Variável | Faixa de Stress | Sensibilidade Esperada |
|---------|----------------|----------------------|
| Irradiação solar | ±10% | Alta — afeta toda a receita |
| CAPEX | −15% a +15% | Alta — base do investimento |
| Reajuste tarifário | ±3 p.p. | Alta no longo prazo |
| Taxa de simultaneidade | ±20 p.p. | Alta pós-Lei 14.300 |
| TMA (custo de capital) | ±2 p.p. | Moderada (afeta VP) |
| Taxa de degradação | ±0,3 p.p./ano | Baixa no curto, alta em 25 anos |

---

## 4. Relatório de Bankability

O Kurupira deve gerar um relatório de bankability com:

### Seção 1 — Sumário Executivo

```
Sistema: {potência} kWp | Local: {cidade, estado}
Distribuidora: {nome} | Grupo: A / B | Simultaneidade: {%}

INDICADORES BASE (P50):
  VPL:              R$ {valor}
  TIR:              {%} a.a.
  Payback:          {anos} anos
  LCOE:             R$ {valor}/kWh

CENÁRIO DE STRESS (P90):
  VPL:              R$ {valor}  (Δ {%} vs P50)
  TIR:              {%} a.a.    (Δ {p.p.} vs P50)
  Payback:          {anos} anos

VEREDICTO: {BANKABLE / BANKABLE COM RESTRIÇÕES / NÃO BANKABLE}
```

### Seção 2 — Tabela de Excedência

| Cenário | Produção (kWh/ano) | VPL (R$) | TIR (%) | Payback (anos) |
|---------|-------------------|---------|--------|----------------|
| P50 | {valor} | {valor} | {valor} | {valor} |
| P75 | {valor} | {valor} | {valor} | {valor} |
| P90 | {valor} | {valor} | {valor} | {valor} |
| P95 | {valor} | {valor} | {valor} | {valor} |

### Seção 3 — Vulnerabilidades Identificadas

Lista automática de alertas baseada nos resultados dos stress tests.

### Seção 4 — Recomendações

Geradas automaticamente pelo motor de risco com base nos thresholds abaixo.

---

## 5. Critérios de Decisão Go/No-Go

| Condição | Veredito | Ação Recomendada |
|----------|---------|-----------------|
| TIR_P90 > TMA + 2% e VPL_P90 > 0 | BANKABLE | Aprovar com as premissas atuais |
| TIR_P90 entre TMA e TMA+2% | BANKABLE COM RESTRIÇÕES | Exigir garantias adicionais ou reduzir alavancagem |
| VPL_P90 < 0 | NÃO BANKABLE | Revisar design, CAPEX ou verificar BESS |
| Limite_letal_IVA < 10% | RISCO REGULATÓRIO ALTO | Alertar cliente sobre instabilidade tributária |
| Break-even_BESS < 8 anos | BESS RECOMENDADO | Propor sistema híbrido com armazenamento |

---

## 6. O Que Implementar no Kurupira

### Interface do Motor de Sensibilidade

```typescript
interface SensitivityConfig {
  p50_producao_kwh: number;
  sigma_total_pct: number;           // default 0.08
  roi_inputs_base: SolarROIInputs;   // da skill roi-fotovoltaico
  stress_tests: {
    variacao_irradiacao: number[];   // ex: [-0.10, -0.05, 0, 0.05, 0.10]
    variacao_capex: number[];        // ex: [-0.15, -0.10, 0, 0.10, 0.15]
    variacao_tarifa: number[];       // ex: [-0.03, 0, 0.03] (delta p.p. no reajuste)
    variacao_simultaneidade: number[]; // ex: [-0.20, 0, 0.20]
    aliquota_iva_incremental: number[]; // Modelo 2: [0.05, 0.10, 0.15]
  };
  incluir_bess?: {
    capex_bess: number;              // R$
    capacidade_kwh: number;
    eficiencia_roundtrip: number;    // ex: 0.92
    ciclos_por_dia: number;          // ex: 1.0
  };
}

interface SensitivityOutputs {
  cenarios_excedencia: {
    p50: ROIScenario;
    p75: ROIScenario;
    p90: ROIScenario;
    p95: ROIScenario;
  };
  matriz_sensibilidade: MatrizSensibilidade[][];
  limite_letal_iva: number;          // % máximo de IVA antes do VPL zerar
  bess_break_even_ano?: number;      // ano em que BESS supera sem-BESS em VPL
  veredicto_bankability: 'BANKABLE' | 'BANKABLE_COM_RESTRICOES' | 'NAO_BANKABLE';
  alertas: SensitivityAlert[];
}

interface ROIScenario {
  producao_kwh: number;
  vpl: number;
  tir: number;
  payback_anos: number;
}
```

### Cálculo P90 Mínimo Obrigatório

O Kurupira **deve** sempre calcular e exibir o P90 ao lado do P50. Exibir apenas P50
sem contexto de risco é eticamente inadequado para uma plataforma de engenharia séria.

```typescript
function calcularCenariosExcedencia(
  p50_kwh: number,
  sigma_pct: number = 0.08
): Record<'P50' | 'P75' | 'P90' | 'P95', number> {
  const sigma = p50_kwh * sigma_pct;
  return {
    P50: p50_kwh,
    P75: p50_kwh - 0.674 * sigma,
    P90: p50_kwh - 1.282 * sigma,
    P95: p50_kwh - 1.645 * sigma,
  };
}
```

---

## Referências

| Fonte | Relevância |
|-------|-----------|
| EPE — NT Metodologia Estimativa MMGD | Base metodológica para incertezas P50/P90 no Brasil |
| IEC 61724-2 | Capacity Evaluation of PV systems — definição de P-values |
| UFRGS — Análise de Sensibilidade Monte Carlo (SFCR) | Referência acadêmica BR para distribuição normal |
| BNDES Finame Solar | Critérios de bankability para financiamento público |
| Resolução Normativa ANEEL 1000/2021 | PRODIST — qualidade da energia e proteções |
