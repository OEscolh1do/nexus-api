# Patch — Motor Financeiro da ProjectionCanvasView (Lei 14.300 + VPL/TIR/LCOE)

**Tipo:** Patch Técnico (Motor de Cálculo Financeiro)
**Supersede parcialmente:** `spec-roi-projection-2026-04-21.md` e `views-spec-view-simulation-v1.md` §4.2
**Data:** 2026-04-25
**Versão:** 1.0
**Origem:** Documento "Metodologia Avançada e Estrutura Regulatória para Determinação do ROI em Sistemas Fotovoltaicos no Brasil"

---

## 1. Diagnóstico — O que está incompleto no motor atual

O motor de ROI existente em `projectionMath.ts` calcula:
```
Economia_N = (Geração_0 × (1 − 0.005)^N) × (Tarifa_0 × (1 + 0.05)^N)
Acumulado_N = Σ Economia_0..N
```

Este modelo tem **cinco lacunas técnicas** identificadas pelo documento de referência:

| # | Lacuna | Impacto no Resultado |
|---|--------|----------------------|
| L1 | Fio B / Lei 14.300 não modelado | Superestima economia em até 10% para novos projetos |
| L2 | Degradação fixa em 0,5% a.a. — não ligada ao módulo selecionado | Imprecisão de 3–5% ao longo de 25 anos |
| L3 | OPEX de substituição de inversor ausente | Subestima o custo total em 8–15% do CAPEX |
| L4 | Simultaneidade ignorada — economia calculada sobre 100% da geração | Superestima retorno para instalações residenciais noturnas |
| L5 | Métricas VPL, TIR e LCOE ausentes | Integrador não tem argumentos comparativos com renda fixa |

---

## 2. Modelo Financeiro Canônico

### 2.1 Variáveis de entrada

Todas as variáveis de entrada ficam em `lossConfig` (existente) e em campos novos de `ProjectSettings` (dentro de `clientData`):

| Variável | Tipo | Fonte | Default |
|----------|------|-------|---------|
| `capexTotal` | `number` | `pricing.totalPrice` | obrigatório |
| `tariffRate` | `number` | `clientData.tariffRate` | obrigatório |
| `reajusteTarifarioAnual` | `number` | `projectSettings.reajusteTarifarioAnual` | `0.11` (11%) |
| `taxaDesconto` | `number` | `projectSettings.taxaDesconto` | `0.10` (10% a.a.) |
| `degradacaoAnual` | `number` | `moduloSelecionado.degradacaoAnual ?? 0.005` | `0.005` (0,5% a.a.) |
| `simultaneidade` | `number` | `projectSettings.simultaneidade` | `0.30` (30%) |
| `fioBPorcentagem` | `number` | `projectSettings.fioBPorcentagem` | derivado do ano de instalação |
| `opexAnualR$` | `number` | `projectSettings.opexAnual` | `200.0` (R$/ano) |
| `anoTrocaInversor` | `number` | `projectSettings.anoTrocaInversor` | `12` |
| `custoTrocaInversor` | `number` | `projectSettings.custoTrocaInversor` | `0.20 × capexTotal` |
| `vidaUtilAnos` | `number` | fixo | `25` |

### 2.2 Cronograma do Fio B (Lei 14.300/2022)

O percentual de Fio B incidente sobre a energia injetada segue o cronograma legal, calculado a partir do `anoInstalacao` do projeto:

```typescript
// utils/projectionMath.ts

const FIOБ_CRONOGRAMA: Record<number, number> = {
  2023: 0.15,
  2024: 0.30,
  2025: 0.45,
  2026: 0.60,
  2027: 0.75,
  2028: 0.90,
};

export function getFioBPercentual(anoInstalacao: number, anoCalculo: number): number {
  // Sistemas instalados até jan/2023: isentos até 2045 (direito adquirido)
  if (anoInstalacao <= 2022) return 0;
  
  const anoReferencia = Math.min(anoCalculo, 2029);
  return FIOБ_CRONOGRAMA[anoReferencia] ?? 1.0; // 100% a partir de 2029
}
```

O `anoInstalacao` é derivado de `TechnicalDesign.createdAt` (ano de criação do projeto). Para projetos criados em 2026 ou posterior, o impacto do Fio B já é máximo em 2029 (durante o período de 25 anos de análise).

### 2.3 Decomposição da Economia por Ano

Para cada ano `N` (1 a 25):

```typescript
export interface AnualFlowItem {
  ano: number;
  geracaoKwh: number;           // geração com degradação acumulada
  autoconsumKwh: number;        // geração × simultaneidade
  injecaoKwh: number;           // geração × (1 − simultaneidade)
  tarifaVigente: number;        // tariffRate × (1 + reajuste)^N
  fioBPercentual: number;       // da tabela legal
  valorFioB: number;            // injecaoKwh × tarifaFioB × fioBPercentual
  economiaAutoconsumo: number;  // autoconsumKwh × tarifaVigente
  economiaInjecao: number;      // injecaoKwh × tarifaVigente − valorFioB
  economiaTotal: number;        // economiaAutoconsumo + economiaInjecao
  opex: number;                 // opexAnual + custoTrocaInversor (se ano = anoTrocaInversor)
  fluxoCaixaLiquido: number;    // economiaTotal − opex
  fluxoDescontado: number;      // fluxoCaixaLiquido / (1 + taxaDesconto)^N
}

export function calcAnualFlows(params: ROIParams): AnualFlowItem[] {
  const {
    geracaoAno1Kwh,
    anoInstalacao,
    tariffRate,
    reajusteTarifarioAnual,
    taxaDesconto,
    degradacaoAnual,
    simultaneidade,
    opexAnualR$,
    anoTrocaInversor,
    custoTrocaInversor,
    vidaUtilAnos,
    fioBPorKwhDistribuidora,  // valor em R$/kWh do Fio B da distribuidora local
  } = params;

  return Array.from({ length: vidaUtilAnos }, (_, idx) => {
    const N = idx + 1;
    const anoCalculo = anoInstalacao + N;

    const geracaoKwh = geracaoAno1Kwh * Math.pow(1 - degradacaoAnual, N - 1);
    const tarifaVigente = tariffRate * Math.pow(1 + reajusteTarifarioAnual, N);
    const fioBPercentual = getFioBPercentual(anoInstalacao, anoCalculo);

    const autoconsumKwh = geracaoKwh * simultaneidade;
    const injecaoKwh = geracaoKwh * (1 - simultaneidade);

    const economiaAutoconsumo = autoconsumKwh * tarifaVigente;

    // Fio B incide sobre energia injetada, à tarifa da distribuidora
    const valorFioB = injecaoKwh * fioBPorKwhDistribuidora * fioBPercentual;
    const economiaInjecao = (injecaoKwh * tarifaVigente) - valorFioB;

    const economiaTotal = economiaAutoconsumo + Math.max(0, economiaInjecao);

    const opexExtraordinario = N === anoTrocaInversor ? custoTrocaInversor : 0;
    const opex = opexAnualR$ + opexExtraordinario;

    const fluxoCaixaLiquido = economiaTotal - opex;
    const fluxoDescontado = fluxoCaixaLiquido / Math.pow(1 + taxaDesconto, N);

    return {
      ano: N,
      geracaoKwh,
      autoconsumKwh,
      injecaoKwh,
      tarifaVigente,
      fioBPercentual,
      valorFioB,
      economiaAutoconsumo,
      economiaInjecao: Math.max(0, economiaInjecao),
      economiaTotal,
      opex,
      fluxoCaixaLiquido,
      fluxoDescontado,
    };
  });
}
```

### 2.4 VPL, TIR e Payback Descontado

```typescript
export interface ROIMetrics {
  paybackSimples: number | null;    // ano em que acumulado > CAPEX (sem desconto)
  paybackDescontado: number | null; // ano em que VPL acumulado > 0
  vpl: number;                      // Valor Presente Líquido ao final de 25 anos
  tir: number | null;               // Taxa Interna de Retorno (busca binária)
  lcoe: number;                     // Custo Nivelado de Energia (R$/kWh)
  economiaTotal25Anos: number;      // soma bruta de economiaTotal
  retornoSobre100: number;          // (economiaTotal25Anos / capexTotal - 1) × 100
}

export function calcROIMetrics(
  flows: AnualFlowItem[],
  capexTotal: number,
  geracaoTotal25AnosKwh: number,
  taxaDesconto: number,
): ROIMetrics {
  let acumuladoSimples = 0;
  let acumuladoDescontado = 0;
  let vpl = -capexTotal;
  let paybackSimples: number | null = null;
  let paybackDescontado: number | null = null;
  let economiaTotal25Anos = 0;

  for (const flow of flows) {
    acumuladoSimples += flow.fluxoCaixaLiquido;
    acumuladoDescontado += flow.fluxoDescontado;
    vpl += flow.fluxoDescontado;
    economiaTotal25Anos += flow.economiaTotal;

    if (paybackSimples === null && acumuladoSimples >= capexTotal) {
      paybackSimples = flow.ano;
    }
    if (paybackDescontado === null && acumuladoDescontado >= capexTotal) {
      paybackDescontado = flow.ano;
    }
  }

  // LCOE: (CAPEX + Σ OPEX descontados) / Σ Geração descontada
  const opexTotalDescontado = flows.reduce(
    (sum, f) => sum + f.opex / Math.pow(1 + taxaDesconto, f.ano), 0
  );
  const geracaoDescontadaKwh = flows.reduce(
    (sum, f) => sum + f.geracaoKwh / Math.pow(1 + taxaDesconto, f.ano), 0
  );
  const lcoe = (capexTotal + opexTotalDescontado) / geracaoDescontadaKwh;

  // TIR: taxa que zera o VPL — busca binária entre 0% e 100%
  const tir = calcTIR(flows, capexTotal);

  return {
    paybackSimples,
    paybackDescontado,
    vpl,
    tir,
    lcoe,
    economiaTotal25Anos,
    retornoSobre100: ((economiaTotal25Anos / capexTotal) - 1) * 100,
  };
}

function calcTIR(flows: AnualFlowItem[], capexTotal: number): number | null {
  // Busca binária — precisão de 0.01%
  let lo = 0, hi = 1.0;
  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) / 2;
    const vpl = flows.reduce(
      (sum, f) => sum + f.fluxoCaixaLiquido / Math.pow(1 + mid, f.ano), -capexTotal
    );
    if (Math.abs(vpl) < 0.01) return mid;
    if (vpl > 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
```

### 2.5 Extensão do ModuleModel — campo de degradação

O campo `degradacaoAnual` é adicionado ao catálogo de módulos:

| Campo | Tipo SQL | Prisma | Default | Descrição |
|-------|----------|--------|---------|-----------|
| `degradacaoAnual` | `DECIMAL(5,4)` | `Float` | `0.005` | Taxa de degradação anual (fração; 0,5% a.a. = 0,005) |

```sql
-- migration: add_module_degradation
ALTER TABLE "ModuleModel"
  ADD COLUMN "degradacaoAnual" DECIMAL(5,4) NOT NULL DEFAULT 0.005;
```

Exibido no `ModuleSpecsPanel` como "Degradação: −0,50%/ano".

### 2.6 Extensões em `ProjectSettings` / `clientData`

Campos novos dentro do JSON `clientData`:

```typescript
interface ClientData {
  // ... campos existentes ...
  
  // novos — financeiros
  reajusteTarifarioAnual: number;   // default 0.11 (11%)
  taxaDesconto: number;             // default 0.10 (10% a.a. — custo de oportunidade)
  simultaneidade: number;           // default 0.30 (30% de autoconsumo)
  fioBPorKwhDistribuidora: number;  // default 0.05 (R$/kWh); extraído da fatura
  opexAnual: number;                // default 200.0 (R$/ano)
  anoTrocaInversor: number;         // default 12
  custoTrocaInversor: number | null; // null = calculado como 20% do capexTotal
}
```

**Silent migration:** campos ausentes em `clientData` legados recebem os defaults no carregamento via spread.

---

## 3. Interface — ProjectionCanvasView: Novos Painéis

### 3.1 Painel de Premissas Financeiras (novo — após barra de PR)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ PREMISSAS FINANCEIRAS                                          [Editar ▾] │
│                                                                          │
│  Simultaneidade  Reajuste Tarifário  Taxa de Desconto  Fio B (local)    │
│  [30%]           [11% a.a.]          [10% a.a.]        [R$ 0,050/kWh]   │
│                                                                          │
│  OPEX Anual    Troca Inversor    Custo Troca                             │
│  [R$ 200/ano]  [Ano 12]         [R$ 4.510,00 (20%)]                     │
└──────────────────────────────────────────────────────────────────────────┘
```

Painel colapsado por padrão. Ao expandir, todos os campos são editáveis inline com `onBlur` commit (mesmo padrão dos demais campos da view). Alterações recalculam o fluxo de 25 anos em tempo real.

**Alerta de Fio B:** quando `anoInstalacao >= 2023` e `fioBPercentual > 0`, exibe badge âmbar ao lado do campo:

```
Fio B (local)  [R$ 0,050/kWh]  ⚠ Incide sobre energia injetada a partir de 2023
```

Tooltip: "A Lei 14.300/2022 cobra Fio B progressivamente sobre a energia que você injeta na rede. Em 2026, o percentual é 60%; em 2029 atingirá 100%. Projetos instalados antes de 2023 têm isenção até 2045."

### 3.2 KPI Metrics — expansão (Painel 2 atualizado)

Os KPIs existentes (Geração, Cobertura, Economia/ano) ganham três novos cards:

| KPI | Valor | Cor | Condição de exibição |
|-----|-------|-----|---------------------|
| **VPL** | `R$ XX.XXX` | Teal se positivo / Vermelho se negativo | Sempre que `capexTotal > 0` |
| **TIR** | `XX,X%` a.a. | Teal | Sempre que TIR calculável |
| **LCOE** | `R$ X,XX/kWh` | Amber | Sempre que `capexTotal > 0` |
| **Payback** | `X,X anos (descontado)` | Teal | Sempre |

Os cards de VPL e TIR ficam à direita dos existentes, com um divisor visual. Se `capexTotal === 0` (preço não definido), exibem `—` com tooltip "Defina o preço do sistema na aba Proposta para calcular VPL e TIR."

### 3.3 Gráfico ROI 25 Anos — atualizado

O `CumulativeROIChart` atual exibe uma única curva de economia acumulada. O gráfico atualizado exibe:

**Três curvas no mesmo eixo:**
- `Economia bruta acumulada` (amber — sem descontos, sem Fio B)
- `Economia líquida acumulada` (teal — com Fio B e OPEX descontados)
- `Linha de CAPEX` (branca/pontilhada — referência fixa)

**Marcadores no gráfico:**
- `●` no ponto de `paybackSimples` — primeiro cruzamento com linha de CAPEX (curva amber)
- `◆` no ponto de `paybackDescontado` — cruzamento da curva teal
- `▼` no `anoTrocaInversor` — queda no fluxo (custo de substituição)

**Tooltip ao hover em cada ponto:**
```
Ano 8
Geração: 7.820 kWh (após degradação)
Tarifa: R$ 0,95/kWh
Autoconsumo: 2.346 kWh | Injeção: 5.474 kWh
Fio B (60%): −R$ 164,22
Economia líquida: R$ 2.881
OPEX: −R$ 200
Fluxo do Ano: R$ 2.681
Acumulado: R$ 19.324
```

### 3.4 Tabela de Fluxo de Caixa Anual (nova aba na visão tabela)

A visão tabela do `GenerationConsumptionChart` (12 meses) permanece inalterada. Uma segunda aba "Fluxo 25 Anos" exibe a tabela de fluxo de caixa anual completa:

| Coluna | Dado |
|--------|------|
| Ano | 1 → 25 |
| Geração (kWh) | com degradação |
| Tarifa (R$/kWh) | com reajuste |
| Fio B (%) | pelo cronograma legal |
| Economia Bruta (R$) | sem descontos |
| OPEX (R$) | com destaque no ano de troca |
| Fluxo Líquido (R$) | economia − OPEX |
| Fluxo Descontado (R$) | para cálculo de VPL |
| Acumulado (R$) | running total |

A linha do `anoTrocaInversor` recebe fundo âmbar/10% e ícone `⚡` na coluna OPEX.
A linha de `paybackSimples` recebe borda esmeralda e label "Payback".

---

## 4. Simultaneidade — Campo no ClientData

**Definição:** proporção da geração que é consumida instantaneamente (autoconsumo direto), sem transitar pela rede.

- `simultaneidade = 0.30` → 30% autoconsumo, 70% injetado
- Instalações residenciais com consumidores fora de casa durante o dia: 15–25%
- Estabelecimentos comerciais funcionando em horário solar: 55–75%

**Interface no Painel de Premissas:** slider horizontal de 5% a 95%, step 5%. Ao clicar, tooltip educativo: "Percentual da geração solar que é consumida no momento da geração (sem passar pela rede). Quanto maior, menor o impacto do Fio B."

**Alerta de simultaneidade baixa:** quando `simultaneidade < 0.25` e `anoInstalacao >= 2023`, exibe badge âmbar no slider: "⚠ Baixa simultaneidade aumenta o impacto do Fio B neste projeto."

---

## 5. Bloco Projeção (LeftOutliner) — Dados adicionais

O bloco `ComposerBlockProjection` no LeftOutliner expande o rodapé para incluir VPL e TIR quando `capexTotal > 0`:

```
┌──────────────────────────────────────────┐
│ [📈] Projeção          text-amber-400    │
│      Est. 8.432 kWh/ano                  │
├──────────────────────────────────────────┤
│  Geração Est.   │  Cobertura             │
│  8.432 kWh      │  103%                  │
├──────────────────────────────────────────┤
│  PR: 76.4%  ·  Payback: 4.2a (desct.)    │
│  VPL: R$ 28.340  ·  TIR: 22,1%           │  ← NOVO (quando pricing disponível)
└──────────────────────────────────────────┘
```

Quando `capexTotal === 0`, a linha VPL/TIR não aparece (sem dado de preço).

---

## 6. Alerta de Imposto de Importação 2026

Quando o projeto usa módulos ou inversores de fabricantes reconhecidamente importados (campo futuro `modulo.origemFabricacao === 'importado'`) **e** `anoInstalacao >= 2026`, exibe um chip informativo no Painel de Premissas Financeiras:

```
[⚠ Imposto de Importação 2026]
```

Tooltip: "A Resolução Gecex 666 elevou o imposto de importação sobre módulos fotovoltaicos para 25% a partir de 2026, impactando o CAPEX em até 35% sobre o custo dos equipamentos. O payback do projeto pode ter sido afetado por essa variável. Verifique se o CAPEX informado já reflete esse custo."

Este chip é **informativo** — não modifica cálculo nem bloqueia nenhuma ação.

---

## 7. SimulationResult — novos campos

```typescript
// core/types/design.ts

export interface SimulationResult {
  // campos existentes
  monthlyGeneration: number[];
  annualGenerationKwh: number;
  performanceRatio: number;
  prComponents: PRComponents | null;

  // campos novos — financeiros
  roiMetrics: ROIMetrics | null;          // null quando capexTotal === 0
  anualFlows: AnualFlowItem[] | null;     // array de 25 anos; null quando sem pricing
  premissasFinanceiras: {                 // snapshot das premissas usadas no cálculo
    simultaneidade: number;
    reajusteTarifarioAnual: number;
    taxaDesconto: number;
    fioBPorKwhDistribuidora: number;
    opexAnual: number;
    anoTrocaInversor: number;
    custoTrocaInversor: number;
    anoInstalacao: number;
  } | null;
}
```

**Silent migration:** projetos legados sem `roiMetrics` carregam com `roiMetrics: null`, `anualFlows: null`, `premissasFinanceiras: null`. O painel de KPIs exibe `—` nos novos campos até que o integrador edite qualquer premissa financeira, disparando o recálculo.

---

## 8. Critérios de Aceitação

### Motor matemático
- [ ] Para projeto 2026 com `simultaneidade = 0.30` e `tariffRate = 0.85`: `economiaAutoconsumo_ano1 = geracaoAnual × 0.30 × 0.85`
- [ ] Fio B em 2026 = 60% → `valorFioB = geracaoAnual × 0.70 × fioBPorKwh × 0.60`
- [ ] Em 2029 o percentual atinge 100% e permanece neste valor para todos os anos seguintes
- [ ] Sistemas instalados em 2022 ou antes: `fioBPercentual = 0` em todos os anos
- [ ] Degradação de 0,5% a.a.: no ano 10, geração = `geracaoAno1 × (1 − 0.005)^9`
- [ ] No `anoTrocaInversor`, `opex = opexAnual + custoTrocaInversor`; nos outros anos `opex = opexAnual`
- [ ] VPL com `taxaDesconto = 0` é igual a `Σ fluxoCaixaLiquido − capexTotal`
- [ ] TIR: para fluxo onde `paybackSimples = 5 anos`, TIR deve estar entre 20% e 30% a.a.
- [ ] LCOE: para sistema de R$ 15.000 gerando 8.000 kWh/ano em 25 anos, resultado esperado entre R$ 0,08 e R$ 0,18/kWh

### Interface
- [ ] Painel de Premissas Financeiras colapsa/expande sem rerender do gráfico
- [ ] Editar `simultaneidade` → curva do gráfico ROI atualiza em tempo real
- [ ] Badge âmbar de Fio B aparece para projetos de 2023 em diante
- [ ] Badge âmbar de simultaneidade baixa aparece quando `simultaneidade < 0.25` e `anoInstalacao >= 2023`
- [ ] Tooltip de cada ponto do gráfico exibe decomposição completa do fluxo do ano
- [ ] Cards VPL e TIR exibem `—` quando `capexTotal === 0`
- [ ] Linha de CAPEX pontilhada fixa no gráfico ROI
- [ ] Marcador `◆` no ano de payback descontado
- [ ] Marcador `▼` no ano de troca de inversor
- [ ] Tabela "Fluxo 25 Anos" exibe linha de troca de inversor com fundo âmbar

### Silent migration
- [ ] Projetos legados sem `roiMetrics` carregam sem erro
- [ ] Projetos legados com `roiMetrics` no formato antigo (apenas `payback` e `acumulado`) carregam sem erro; novos campos exibem `—`

---

## 9. Fora do Escopo desta Spec

- **Financiamento** (BNDES, bancos) — afeta fluxo de caixa mas requer modelagem de amortização e IOF; spec separada quando necessário.
- **ICMS sobre TUSD** por estado — a variação estadual é significativa mas requer banco de dados de alíquotas por distribuidora; modelado como campo manual por enquanto (`fioBPorKwhDistribuidora`).
- **Geração compartilhada / minigeração remota** — regra de Fio A + Fio B distinta; aplicável apenas a sistemas > 500 kW, fora do escopo residencial/comercial atual.
- **Baterias / LCOS** — armazenamento aumenta simultaneidade mas exige modelo separado de CAPEX de bateria, degradação de ciclos e eficiência de round-trip.

---

## Referências

- Origem técnica: "Metodologia Avançada e Estrutura Regulatória para a Determinação do ROI em Sistemas Fotovoltaicos no Brasil" (documento anexo, 2026-04-25)
- Lei 14.300/2022 — Marco Legal da Geração Distribuída
- Resolução Gecex 666 — imposto de importação 25% (jan/2026)
- `spec-roi-projection-2026-04-21.md` — supersedido parcialmente neste patch
- `views-spec-view-simulation-v1.md` §4.2 — KPIs afetados (expandidos)
- `spec-catalogo-modulos-inversores-pv-2026-04-25.md` — campo `degradacaoAnual` em `ModuleModel`
