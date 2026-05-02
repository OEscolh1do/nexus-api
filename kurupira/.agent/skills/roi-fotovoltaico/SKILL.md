---
name: roi-fotovoltaico
description: >
  Especialista em análise financeira de sistemas fotovoltaicos no contexto brasileiro pós-Lei
  14.300/2022. Ative quando o Kurupira precisar calcular ou gerar VPL, TIR, Payback Descontado e
  LCOE para uma proposta; modelar o impacto do escalonamento TUSD Fio B sobre o fluxo de caixa;
  diferenciar Grupo A (binômio) de Grupo B (monômio); incorporar simultaneidade/autoconsumo como
  variável de ROI; ou implementar o motor financeiro em `roiEngine.ts`, `proposalFinancial.ts` ou
  equivalentes. Inclui estrutura de CAPEX/OPEX, degradação, inflação tarifária e isenções fiscais.
---

# Skill: ROI de Sistemas Fotovoltaicos (Brasil, pós-Lei 14.300)

Consultor de domínio financeiro para o motor econômico do Kurupira.

---

## Contexto Regulatório Obrigatório

O cálculo de ROI solar no Brasil é radicalmente diferente do modelo internacional. Dois marcos
regulatórios definem o regime atual:

- **REN 482/2012 (extinta para novas instalações após jan/2023):** net metering 1:1, sem cobrança
  de Fio B sobre a energia injetada — regime "ouro" que gerou as projeções otimistas do mercado.
- **Lei 14.300/2022 (Marco Legal GD):** institui cobrança progressiva do TUSD Fio B sobre a
  energia injetada. Sistemas instalados até jan/2023 têm direito adquirido de isenção até 2045.
  Novas instalações seguem o cronograma de transição obrigatoriamente.

**Implicação direta:** o motor financeiro do Kurupira DEVE aplicar o escalonamento Fio B ao
calcular a economia anual de qualquer projeto pós-2023.

---

## 1. Indicadores Financeiros Primários

### 1.1 Valor Presente Líquido (VPL)

O VPL mede a criação absoluta de riqueza: soma dos fluxos de caixa futuros descontados menos
o investimento inicial. VPL > 0 significa viabilidade econômica.

```
VPL = Σ [FC_t / (1 + TMA)^t] - CAPEX
      t=1 até N
```

Variáveis:
- `FC_t` — Fluxo de Caixa Líquido no ano `t` = economia_bruta_t − OPEX_t − custo_fio_b_t
- `TMA` — Taxa Mínima de Atratividade (custo de oportunidade do capital). Referência BR 2025–2026:
  10%–12% a.a. para projetos corporativos; Selic-projetada para projetos residenciais
- `N` — Horizonte de planejamento: 25 anos (alinhado à garantia linear dos módulos)
- `CAPEX` — Investimento inicial total (ver seção 4)

**Benchmark de impacto legislativo (minigeração, área CEMIG):**

| Regime | VPL Calculado | TIR | Payback Descontado |
|--------|--------------|-----|-------------------|
| REN 482 (isenção plena) | R$ 197.352 | 16% a.a. | 10,1 anos |
| Lei 14.300 (sem incentivos) | R$ 23.729 | 11% a.a. | 20,6 anos |

### 1.2 Taxa Interna de Retorno (TIR)

A TIR é a taxa de desconto que zera o VPL — mede a rentabilidade relativa do projeto em % a.a.
Critério de aceitação: `TIR > TMA`.

```
0 = Σ [FC_t / (1 + TIR)^t] - CAPEX
    t=1 até N
```

Calculada por método iterativo (Newton-Raphson ou bisseção). No Kurupira, usar a função
`xirr` de uma biblioteca financeira (ex: `financial-ts`, `financejs`) pois os fluxos
são anuais com datas reais.

**Referência de mercado 2025–2026:**
- Projetos residenciais com alta simultaneidade: TIR 15%–22% a.a.
- Projetos comerciais Grupo A bem dimensionados: TIR 13%–18% a.a.
- Projetos com baixa simultaneidade, Lei 14.300 integral: TIR 8%–12% a.a.
- Linha de corte de risco: quando TIR < TMA + 2%, o projeto é vulnerável a variações

### 1.3 Payback Descontado

Tempo exato `PB` em que a soma cumulativa dos FC descontados iguala o CAPEX.
**Nunca usar Payback Simples** — omite degradação, inflação tarifária e custo do dinheiro.

```
Σ [FC_t / (1 + TMA)^t] = CAPEX    →    encontra t = PB
t=1 até PB
```

Implementação: calcular cumulativamente ano a ano até cruzar o valor do CAPEX.

### 1.4 Custo Nivelado de Energia (LCOE)

LCOE é o "preço de custo" do kWh gerado ao longo de 25 anos. Compara a energia solar com a
tarifa da concessionária. Se LCOE < tarifa_local, o projeto tem paridade de rede.

```
LCOE = LCOE_I + LCOE_f

LCOE_I = (IC × (1 - IR) × FCR) / (CF × 8,76 × Σ D_t)

LCOE_f = (Σ [C_nr_t / (1 + r)^t] + TFO&M × Σ [1 / (1 + r)^t]) / Σ [E_t / (1 + r)^t]
```

Variáveis críticas:
- `IC` — Investment Cost total (R$/kWp). Referência EPE 2025: R$ 3.000–R$ 5.500/kWp
- `IR` — Fator de incentivos/isenções fiscais
- `CF` — Capacity Factor (fator de capacidade). Solar BR: 18%–25%
- `C_nr` — Custos não recorrentes (substituição de inversores no ano 12–15)
- `TFO&M` — Total de O&M fixo anual (limpeza, seguro, monitoramento)
- `D_t` — Fator de degradação acumulada no ano t

**Referência de LCOE para o Kurupira:**

| Porte | LCOE Típico (R$/kWh) | Tarifa Média BR (R$/kWh) | Paridade |
|-------|---------------------|--------------------------|---------|
| Residencial (5–15 kWp) | 0,20–0,35 | 0,80–1,20 | Alta vantagem |
| Comercial (30–100 kWp) | 0,15–0,25 | 0,60–0,90 | Alta vantagem |
| Industrial (500 kWp+) | 0,10–0,18 | 0,40–0,70 (TUSD) | Moderada |

---

## 2. Escalonamento TUSD Fio B (Lei 14.300) — Núcleo do Cálculo

O Fio B é cobrado **somente sobre a energia injetada** (não sobre o autoconsumo). A cobrança
é progressiva anualmente para sistemas pós-jan/2023:

| Ano | % Fio B sobre energia injetada (microgeração < 500 kW) | Minigeração > 500 kW |
|-----|--------------------------------------------------------|----------------------|
| 2023 | 15% | 100% Fio B + 40% Fio A |
| 2024 | 30% | 100% Fio B + 40% Fio A |
| 2025 | 45% | 100% Fio B + 40% Fio A |
| 2026 | 60% | 100% Fio B + 40% Fio A |
| 2027 | 75% | 100% Fio B + 40% Fio A |
| 2028 | 90% | 100% Fio B + 40% Fio A |
| 2029+ | 100% | 100% Fio B + 40% Fio A |

### Fórmula da Economia Líquida Anual (pós-Lei 14.300)

```
Economia_t = E_autoconsumo_t × tarifa_t
           + E_injetada_t × (tarifa_t − FioB_R$/kWh × alpha_t)
           − OPEX_t
```

Onde:
- `E_autoconsumo_t` — kWh consumidos simultaneamente à geração (não passam pelo medidor)
- `E_injetada_t` — kWh injetados na rede e compensados posteriormente
- `tarifa_t` — tarifa inflacionada no ano t: `tarifa_0 × (1 + reajuste_anual)^t`
- `FioB_R$/kWh` — valor absoluto do Fio B na estrutura tarifária da distribuidora
- `alpha_t` — percentual de incidência do Fio B no ano t (tabela acima)

**Para obter `FioB_R$/kWh`:** extrair da estrutura tarifária publicada pela ANEEL para a
distribuidora do projeto. Varia por estado e concessionária.

### Simultaneidade — A Variável de Ouro

```
Taxa_simultaneidade = E_autoconsumo / E_gerada_total
```

| Taxa de Simultaneidade | Perfil | Impacto do Fio B |
|-----------------------|--------|-----------------|
| > 60% | Comercial diurno, indústria | Baixo — maioria isenta |
| 30%–60% | Misto | Moderado |
| < 30% | Residencial com moradores fora durante o dia | Alto — maioria tributada |

**Regra prática:** o Kurupira deve solicitar ou estimar a taxa de simultaneidade do cliente
antes de gerar qualquer projeção de ROI. Usar 40% como default conservador para residencial
e 65% para comercial sem dados específicos.

---

## 3. Estrutura Tarifária: Grupo A vs Grupo B

### Grupo B — Baixa Tensão (Monômio)

- Tensão < 2,3 kV (127V/220V): residências, comércios pequenos
- Faturamento **apenas em kWh** — sem demanda contratada
- O sistema solar deve ser dimensionado para abater o consumo total de kWh
- Custo residual mínimo: "custo de disponibilidade" (taxa fixa monofásico/bifásico/trifásico)
- Tarifa Branca (opcional): postos tarifários ponta/fora-ponta/intermediário — dimensionar
  privilegiando geração nos horários de maior custo

### Grupo A — Média e Alta Tensão (Binômio)

- Tensão ≥ 2,3 kV: industriais, grandes comerciais, shopping centers
- Faturamento em **kWh (consumo) + kW (demanda contratada)**
- Ponta: 3h contínuas entre 17h–22h — tarifa 3x–5x maior que fora de ponta
- Solar gera apenas fora de ponta → os créditos compensam ponta via fator de conversão

**Risco crítico Grupo A — TUSD-G (Tarifa de Uso por Geração):**
```
Se P_pico_injeção > Demanda_contratada_de_carga → necessário contratar TUSD-G
Custo_TUSD-G = (P_pico_injeção - Demanda_contratada) × R$/kW_tusd_g
```

Ultrapassagem de demanda é penalizada com fator multiplicador (~3x). **Implementar verificação
obrigatória** no motor de dimensionamento para projetos Grupo A. Alternativa técnica: configurar
Active Power Control (Zero Export) no inversor para limitar a potência de injeção.

| Parâmetro | Grupo B | Grupo A |
|-----------|---------|---------|
| Base de faturamento | Somente kWh | kWh + kW demanda |
| Postos tarifários | Único (exceto Tarifa Branca) | Ponta/Fora de Ponta obrigatório |
| Custo afundado mensal | Mínimo (disponibilidade) | Alto (demanda contratada) |
| Risco de penalidade | Não | Sim (TUSD-G por ultrapassagem) |

---

## 4. Estrutura de CAPEX e OPEX

### CAPEX — Composição Típica 2025–2026

| Componente | % do CAPEX | Observação |
|-----------|-----------|------------|
| Módulos fotovoltaicos | 40%–45% | Impacto da Gecex 666: II elevado a 25% em 2026 |
| Inversores | 15%–20% | Substituição prevista no ano 12–15 (OPEX) |
| Estruturas de fixação | 8%–12% | Alumínio ou galvanizado conforme corrosividade |
| Cabeamento DC/AC | 5%–8% | Subdimensionamento é erro crítico de segurança |
| String Box / DPS | 2%–4% | Obrigatório NBR 16690 |
| Mão de obra + engenharia | 10%–15% | Projeto elétrico + homologação distribuidora |
| Frete e logística | 3%–5% | Custo crítico para Região Norte |
| Soft costs (licenças, ART) | 2%–4% | — |

**Referência de custo total por kWp instalado (mercado BR 2025–2026):**
- Residencial (≤ 20 kWp): R$ 4.500–R$ 6.500/kWp
- Comercial (20–500 kWp): R$ 3.500–R$ 5.000/kWp
- Industrial (> 500 kWp): R$ 2.800–R$ 4.000/kWp

**Impacto da Gecex 666 (2026):** elevação do II de ~12,6% para 25% sobre módulos importados.
Payback médio passou de 3–4 anos para 5–7 anos em regiões sem isenção de ICMS.

### OPEX — Custos Operacionais Anuais

| Item | Frequência | Custo Estimado |
|------|-----------|----------------|
| Limpeza de módulos (soiling) | 2–4x/ano | R$ 0,02–R$ 0,05/kWp/mês |
| Monitoramento remoto | Contínuo | R$ 30–R$ 100/mês (SaaS) |
| Seguro patrimonial | Anual | 0,3%–0,8% do CAPEX/ano |
| Inspeção termográfica | Anual | R$ 500–R$ 2.000/visita |
| Substituição de inversores | Ano 12–15 | 15%–25% do CAPEX inicial |
| Arrendamento de terreno | Mensal | Variável (usinas de solo) |

---

## 5. Variáveis Macroeconômicas

### Inflação Tarifária (Hedge Solar)

A energia solar é um hedge contra a inflação tarifária. No modelo de fluxo de caixa:

```
tarifa_t = tarifa_0 × (1 + reajuste_anual)^t
```

| Premissa | Valor | Justificativa |
|---------|-------|---------------|
| Conservadora | IPCA + 1% | Mínimo histórico |
| Base (padrão Kurupira) | IPCA + 2% | Referência de mercado |
| Otimista | IPCA + 3% | Pressão estrutural de custos (transmissão, termelétrica) |

Projeção 2026–2030: reajustes médios de ~11% a.a. em grandes capitais.

### Degradação dos Módulos

```
E_ano_t = E_ano_1 × (1 − taxa_degradacao)^(t-1)
```

| Tecnologia | Taxa de Degradação | Performance em 25 anos |
|-----------|-------------------|------------------------|
| Monocristalino PERC | 0,5%/ano | ~88% da potência nominal |
| Monopercslino TOPCon | 0,4%/ano | ~90% |
| Bifacial | 0,45%/ano | ~89% |

Default seguro para o Kurupira: **0,6%/ano** (conservador e independente do fabricante).

---

## 6. Isenções Fiscais por Estado

### ICMS (Convênio CONFAZ 16/2015)

A maioria dos estados isenta o ICMS sobre a parcela de energia compensada (Tarifa de Energia).
A incidência sobre a TUSD varia — gera impacto de 10%–15% no ROI.

| Estado | Isenção ICMS sobre TE | Isenção sobre TUSD | Perspectiva ROI |
|--------|----------------------|-------------------|----------------|
| Minas Gerais | Sim | Sim (leis estaduais) | Excelente |
| Bahia | Sim | Total | Excelente |
| São Paulo | Sim | Parcial | Muito Boa |
| Rio de Janeiro | Sim | Regras específicas TUSD | Boa |
| Paraná | Sim | Sim (Lei 18.890) | Sólida |
| Pará / Norte | Variável | Verificar ato específico | Consultar SEFA |

### PIS/COFINS

Incidem sobre o faturamento da energia comprada da rede, não sobre a compensada. A diferença
líquida (kWh consumido − kWh injetado) é a base de cálculo — benéfico para o prosumidor.

---

## 7. O Que Implementar no Kurupira

### Interface do Motor Financeiro

```typescript
interface SolarROIInputs {
  capex_total: number;           // R$ — investimento inicial completo
  potencia_kwp: number;          // kWp instalados
  e_gerada_ano1_kwh: number;     // output do pv-simulation-engine
  taxa_simultaneidade: number;   // 0.0 – 1.0 (ex: 0.4 = 40%)
  tarifa_energia_kwh: number;    // R$/kWh — TE da distribuidora
  fio_b_kwh: number;             // R$/kWh — componente Fio B da distribuidora
  ano_instalacao: number;        // define ponto de entrada no escalonamento Fio B
  tma: number;                   // taxa mínima de atratividade (ex: 0.12)
  reajuste_tarifario_anual: number; // ex: 0.10 (IPCA + spread)
  taxa_degradacao_anual: number; // ex: 0.006
  opex_anual_base: number;       // R$/ano — O&M fixo
  custo_reposicao_inversores: number; // R$ — no ano de reposição
  ano_reposicao_inversores: number;   // ex: 13
  horizonte_anos: number;        // default: 25
  grupo_tarifario: 'A' | 'B';
  // Grupo A adicional:
  demanda_contratada_kw?: number;
  pico_injecao_kw?: number;
  tusd_g_kwh?: number;
}

interface SolarROIOutputs {
  vpl: number;                    // R$
  tir: number;                    // decimal (ex: 0.16 = 16% a.a.)
  payback_descontado_anos: number;
  lcoe_kwh: number;               // R$/kWh
  fluxo_caixa_anual: FluxoCaixaAnual[];
  economia_25anos_bruta: number;  // R$ sem desconto
  economia_25anos_vp: number;     // R$ a valor presente
  custo_fio_b_acumulado: number;  // R$ — impacto total da Lei 14.300
  alerta_tusd_g?: string;         // Grupo A: aviso de ultrapassagem de demanda
}

interface FluxoCaixaAnual {
  ano: number;
  e_gerada_kwh: number;
  e_autoconsumo_kwh: number;
  e_injetada_kwh: number;
  tarifa_vigente: number;
  alpha_fio_b: number;            // % do escalonamento naquele ano
  custo_fio_b: number;            // R$ — desconto aplicado
  economia_bruta: number;         // R$
  opex: number;                   // R$
  fc_liquido: number;             // R$ — fluxo de caixa líquido
  fc_descontado: number;          // R$ — trazido a VP
  fc_acumulado_descontado: number; // R$ — cumulativo (payback quando cruzar CAPEX)
}
```

### Função do Escalonamento Fio B

```typescript
function getAlphaFioB(anoInstalacao: number, anoCalculo: number): number {
  const anosAposTransicao = anoCalculo - Math.max(anoInstalacao, 2023);
  const escalonamento = [0.15, 0.30, 0.45, 0.60, 0.75, 0.90, 1.00];
  const idx = Math.min(anosAposTransicao, escalonamento.length - 1);
  return idx < 0 ? 0 : escalonamento[idx]; // 0 para sistemas com direito adquirido pré-2023
}
```

### Alertas de ROI na UI

| Condição | Tipo | Mensagem |
|----------|------|----------|
| VPL > 0 e TIR > TMA + 3% | SUCESSO | "Excelente viabilidade. TIR supera o custo de capital em {spread}%." |
| VPL > 0 e TIR entre TMA e TMA+3% | ATENÇÃO | "Viabilidade marginal. Pequenas variações de tarifa ou irradiação impactam o retorno." |
| VPL < 0 | CRÍTICO | "Projeto inviável com as premissas atuais. Revisar CAPEX ou aumentar potência." |
| Payback > 15 anos | ATENÇÃO | "Payback descontado elevado. Verificar taxa de simultaneidade e isenções de ICMS." |
| TIR - TMA < 1% | ALERTA | "Spread insuficiente. Projeto vulnerável a variações regulatórias." |
| Grupo A: pico_injeção > demanda_contratada | CRÍTICO | "Risco de sobretaxa TUSD-G. Limitar potência de injeção ou contratar demanda adicional." |

---

## Referências

| Fonte | Relevância |
|-------|-----------|
| Lei 14.300/2022 | Marco Legal da Microgeração e Minigeração Distribuída |
| ANEEL — Estruturas Tarifárias | Valores de Fio B por distribuidora (publicação anual) |
| EPE — Caderno de Preços de Geração | Referências de CAPEX por tecnologia e porte |
| Convênio CONFAZ 16/2015 | Base das isenções de ICMS por estado |
| Resolução Gecex 666/2025 | Elevação do II para 25% sobre módulos importados em 2026 |
| ABNT NBR 16690 | Instalações elétricas de sistemas fotovoltaicos — base do projeto elétrico |
