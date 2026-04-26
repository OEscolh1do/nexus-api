# Patch — Análise de Sensibilidade Financeira, Grupo A e Riscos Regulatórios

**Tipo:** Patch Técnico (Motor Financeiro + Modelo de Dados + UI)
**Supersede parcialmente:** `patch-motor-financeiro-lei-14300-roi-2026-04-25.md` (estende §2 e §3)
**Amplia:** `spec-view-site-2026-04-15.md` (Gap G-01: Grupo A)
**Data:** 2026-04-26
**Versão:** 1.0
**Origem:** "Avaliação Exaustiva da Viabilidade Econômico-Financeira de Projetos Solares Fotovoltaicos" (documento anexo)

---

## 1. Diagnóstico — Quatro Lacunas Identificadas

| # | Lacuna | Spec afetada | Impacto |
|---|--------|-------------|---------|
| L1 | Tarifa binômia (Grupo A) não modelada — demanda contratada, TUSD-G, risco de multa | `SiteCanvasView`, `clientData`, motor de economia | Projetos C&I inviabilizados sem este modelo |
| L2 | Análise de sensibilidade P50/P75/P90/P95 ausente | `ProjectionCanvasView`, motor financeiro | Proposta sem crivo de risco — não bankable |
| L3 | Risco de perda de isenção ICMS/PIS-COFINS (Reforma Tributária) não modelado como cenário | Motor de ROI | Subavalia risco regulatório para clientes em estados com convênio CONFAZ 16/15 |
| L4 | Tarifa Branca (Grupo B com postos horários) não mencionada | `clientData`, motor de economia | Clientes optantes da Tarifa Branca têm cálculo de economia incorreto |

---

## 2. Grupo A — Tarifa Binômia

### 2.1 Conceito e impacto no dimensionamento

Clientes do Grupo A (instalações em média ou alta tensão, tipicamente empresas, indústrias e comércios de grande porte) pagam duas rubricas simultâneas:

- **Consumo de energia (R$/kWh):** segmentado em Ponta (horário de maior demanda, geralmente 17h–22h) e Fora de Ponta. A geração solar ocorre exclusivamente no horário Fora de Ponta.
- **Demanda de potência contratada — TUSD-c (R$/kW):** valor fixo mensal independente do consumo. O solar não reduz esta rubrica diretamente.

A geração solar injeta energia na rede no horário Fora de Ponta. Se a potência máxima de injeção for maior que a demanda contratada de carga do cliente, o sistema exigirá contratação de **demanda de geração (TUSD-G)** — custo adicional que pode inviabilizar o projeto se não previsto.

### 2.2 Extensões no modelo de dados

#### 2.2.1 ClientData — campos novos para Grupo A

```typescript
interface ClientData {
  // campos existentes ...
  rateGroup: 'B1' | 'B2' | 'B3' | 'B4' | 'A4' | 'A3a' | 'A3' | 'A2' | 'A1';
  
  // campos novos — Grupo A (null quando rateGroup começa com 'B')
  grupoA: GrupoAData | null;
  
  // campo novo — Tarifa Branca (Grupo B optante)
  tarifaBranca: boolean;   // default false
  tarifaBrancaConfig: TarifaBrancaConfig | null;
}

interface GrupoAData {
  demandaContratadaKw: number;          // kW — demanda TUSD-c vigente no contrato
  tarifaDemandaFpRkw: number;           // R$/kW — tarifa de demanda Fora de Ponta
  tarifaDemandaPontaRkw: number;        // R$/kW — tarifa de demanda de Ponta
  tarifaConsumoFpRkwh: number;          // R$/kWh — tarifa de consumo Fora de Ponta
  tarifaConsumosPontaRkwh: number;      // R$/kWh — tarifa de consumo Ponta
  horasPontaPorDia: number;             // horas de ponta/dia (padrão: 3)
  modalidade: 'verde' | 'azul';        // modalidade tarifária do contrato
  tusdGNecessaria: boolean;             // calculada: potênciaInversores > demandaContratada
  tusdGKw: number | null;              // kW de TUSD-G a contratar (null se não necessária)
  tarifaTusdGRkw: number | null;       // R$/kW — tarifa TUSD-G da distribuidora
}

interface TarifaBrancaConfig {
  tarifaPontaRkwh: number;              // R$/kWh — horário de Ponta
  tarifaIntermediarioRkwh: number;      // R$/kWh — horário Intermediário
  tarifaForaPontaRkwh: number;         // R$/kWh — horário Fora de Ponta
}
```

**Persistência:** todos os campos ficam dentro do JSON `clientData` do `TechnicalDesign`. Nenhuma migração de coluna SQL necessária.

#### 2.2.2 Detecção de necessidade de TUSD-G

```typescript
// utils/grupoAValidator.ts

export function calcTusdGNecessidade(params: {
  potenciaInversoresKw: number;    // potência nominal CA total dos inversores
  demandaContratadaKw: number;     // demanda TUSD-c vigente
}): { necessaria: boolean; deltaKw: number } {
  const delta = params.potenciaInversoresKw - params.demandaContratadaKw;
  return {
    necessaria: delta > 0,
    deltaKw: Math.max(0, delta),
  };
}
```

### 2.3 Motor de economia para Grupo A

O motor de economia do Grupo A é estruturalmente diferente do Grupo B:

```typescript
// utils/projectionMath.ts — extensão

export function calcEconomiaAnualGrupoA(params: {
  geracaoKwh: number;           // geração anual com degradação
  consumoFpKwh: number;         // consumo Fora de Ponta anual do cliente
  simultaneidade: number;       // fração de autoconsumo
  tarifaFpKwh: number;          // tarifa de consumo Fora de Ponta (corrigida pelo reajuste)
  fioBPercentual: number;        // do cronograma Lei 14.300
  fioBPorKwh: number;           // valor unitário do Fio B da distribuidora
  tusdGMensal: number;          // custo mensal de TUSD-G (0 se não necessária)
}): number {
  const autoconsumKwh = params.geracaoKwh * params.simultaneidade;
  const injecaoKwh = params.geracaoKwh * (1 - params.simultaneidade);

  const economiaConsumo = autoconsumKwh * params.tarifaFpKwh;
  const economiaInjecao = Math.max(0,
    injecaoKwh * params.tarifaFpKwh
    - injecaoKwh * params.fioBPorKwh * params.fioBPercentual
  );

  // TUSD-G é custo adicional se necessária
  const custoTusdGAnual = params.tusdGMensal * 12;

  return economiaConsumo + economiaInjecao - custoTusdGAnual;
}
```

**Nota importante:** a demanda contratada (TUSD-c) não é reduzida pela geração solar a menos que o cliente renegicie o contrato com a distribuidora. A economia do solar no Grupo A incide apenas sobre a componente de consumo em kWh, não sobre a demanda em kW.

### 2.4 Interface — SiteCanvasView: expansão Grupo A

Quando `rateGroup` inicia com `'A'`, a Seção C (Rede Elétrica) da SiteCanvasView expande para exibir campos adicionais:

```
── Rede Elétrica (Grupo A) ─────────────────────────────────
  Modalidade:       [● Verde  ○ Azul]
  Demanda Contrat.: [_______] kW
  Tarifa Demanda FP: [_______] R$/kW
  Tarifa Consumo FP: [_______] R$/kWh
  Tarifa Consumo Ponta: [_______] R$/kWh
  Horas de Ponta/dia:   [3]

── TUSD-G ──────────────────────────────────────────────────
  [⚠ TUSD-G necessária: +25 kW] (aparece quando inversores > demanda)
  Tarifa TUSD-G:    [_______] R$/kW/mês
  Custo TUSD-G:     R$ 450,00/mês (calculado)
```

O alerta `⚠ TUSD-G necessária` aparece automaticamente quando `calcTusdGNecessidade` retorna `necessaria: true`. É vermelho sólido se `tarifaTusdGRkw` não estiver preenchido (não é possível calcular o impacto), âmbar quando preenchido (impacto calculado mas expressivo).

### 2.5 Interface — ConsumptionCanvasView: postos tarifários

Quando `rateGroup` inicia com `'A'`, o gráfico de consumo de 12 meses ganha uma segunda série superposta em pontilhado representando o consumo de Ponta (que o solar não atende). O painel lateral mostra:

```
Consumo Total:    X.XXX kWh/mês
  ├── Fora Ponta: X.XXX kWh/mês  ← solar atende
  └── Ponta:        XXX kWh/mês  ← solar NÃO atende
```

**Campo novo:** `consumoPontaKwhMes` em `clientData` — percentual do consumo que ocorre no horário de Ponta. Editável pelo integrador com slider (0–30%, default 15%). Afeta o cálculo de economia: a geração solar não compensa consumo de Ponta.

### 2.6 Interface — Tarifa Branca (Grupo B optante)

Quando `tarifaBranca: true`, o campo "Tarifa R$/kWh" único da Seção C é substituído por três campos:

```
Tarifa Ponta:        [_______] R$/kWh  (18h–21h)
Tarifa Intermediário:[_______] R$/kWh  (17h–18h e 21h–22h)
Tarifa Fora de Ponta:[_______] R$/kWh  (demais horários)
```

O motor de economia usa a tarifa Fora de Ponta para o crédito de geração solar (que ocorre no período diurno). O tooltip de ajuda explica: "Na Tarifa Branca, a geração solar é creditada à tarifa Fora de Ponta. O sistema não reduz os custos da Ponta tarifária."

---

## 3. Análise de Sensibilidade — P50, P75, P90, P95

### 3.1 Conceito aplicado ao Kurupira

A geração P50 é a projeção base (valor médio esperado). Em cenários reais, a geração pode ser maior ou menor dependendo de variações climáticas interanuais (El Niño/La Niña, nebulosidade), imprecisões de medição e perdas sistêmicas não previstas.

A análise de sensibilidade produz quatro cenários:

| Cenário | Probabilidade de superar | Z-score | Uso |
|---------|--------------------------|---------|-----|
| **P50** | 50% | 0 | Base da proposta comercial |
| **P75** | 75% | −0,674 | Conservador para financiamentos privados |
| **P90** | 90% | −1,282 | Padrão internacional para dívida bancária |
| **P95** | 95% | −1,645 | Stress test para regiões de alta variabilidade |

### 3.2 Fórmula

```typescript
// utils/projectionMath.ts — extensão

const Z_SCORES: Record<'P50'|'P75'|'P90'|'P95', number> = {
  P50: 0,
  P75: -0.674,
  P90: -1.282,
  P95: -1.645,
};

export function calcGeracaoPxx(params: {
  geracaoP50Kwh: number;    // geração base calculada
  incertezaFrac: number;    // desvio padrão como fração; default 0.08 (8%)
  cenario: 'P50' | 'P75' | 'P90' | 'P95';
}): number {
  const { geracaoP50Kwh, incertezaFrac, cenario } = params;
  const z = Z_SCORES[cenario];
  return geracaoP50Kwh * (1 + z * incertezaFrac);
}
```

**Campo de incerteza:** `incertezaGeracao` em `ProjectSettings` — fração decimal, default `0.08` (8%). Editável no painel de premissas financeiras. Tooltip: "Representa a variabilidade esperada da geração solar devida a oscilações climáticas interanuais, imprecisões de medição e perdas sistêmicas. Valores típicos: 6–10%. Use valores maiores para regiões sujeitas a El Niño/La Niña (Norte e Nordeste)."

### 3.3 Interface — Painel de Sensibilidade na ProjectionCanvasView

Nova seção no final da ProjectionCanvasView, abaixo do gráfico ROI 25 anos:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ANÁLISE DE SENSIBILIDADE                        Incerteza: [8%] [Editar] │
│                                                                          │
│  Cenário    Geração Ano 1  VPL        TIR       Payback Desc.  Status    │
│  ─────────────────────────────────────────────────────────────────────── │
│  P50 (base)  8.432 kWh    R$ 28.340  22,1%     6,2 anos       ✅ Viável  │
│  P75         8.002 kWh    R$ 22.180  19,4%     7,1 anos       ✅ Viável  │
│  P90 (dívida)7.614 kWh   R$ 16.820  17,0%     8,3 anos       ✅ Viável  │
│  P95 (stress)7.344 kWh   R$ 13.210  15,1%     9,4 anos       ⚠ Marginal │
│                                                                          │
│  Nota: P90 é o cenário mínimo exigido por instituições financeiras       │
│  para aprovação de financiamentos bancários (bankability).               │
└──────────────────────────────────────────────────────────────────────────┘
```

**Critério de status:**
- `✅ Viável` — TIR > TMA + 5pp (margem de segurança)
- `⚠ Marginal` — TIR entre TMA e TMA + 5pp
- `🔴 Inviável` — TIR < TMA (VPL negativo)

**Interatividade:** clicar em qualquer linha da tabela de sensibilidade destaca o cenário no gráfico ROI 25 anos (a curva do cenário selecionado fica sólida; as demais ficam em tracejado leve).

### 3.4 Extensão do SimulationResult

```typescript
interface SimulationResult {
  // campos existentes ...
  
  // novo — análise de sensibilidade
  sensibilidade: {
    incertezaFrac: number;
    cenarios: {
      P50: ROIMetrics;
      P75: ROIMetrics;
      P90: ROIMetrics;
      P95: ROIMetrics;
    };
  } | null;  // null quando capexTotal === 0
}
```

---

## 4. Cenários de Estresse Regulatório

### 4.1 Três cenários canônicos

Inspirados no modelo de stress testing do documento de referência, o motor de ROI passa a calcular três fluxos de caixa alternativos além do baseline:

| Cenário | Descrição | Quando ativar |
|---------|-----------|---------------|
| **Baseline** | Lei 14.300 com cronograma Fio B nominal + isenção ICMS vigente | Sempre |
| **Estresse Tributário** | Perda da isenção ICMS (Convênio 16/15 caduca com Reforma Tributária) | Quando `estado ∈ ESTADOS_COM_CONVÊNIO_16_15` |
| **Zero Isenção** | Incidência plena de ICMS + PIS/COFINS sobre toda a energia compensada | Stress test máximo |

#### 4.1.1 Impacto do ICMS sobre a economia

Quando a isenção ICMS caduca, o valor de cada kWh compensado é reduzido pela alíquota estadual de ICMS incidente sobre energia:

```typescript
// utils/projectionMath.ts — extensão

export function calcEconomiaComIcms(params: {
  economiaBaseline: number;       // economia sem ICMS (baseline)
  energiaInjetadaKwh: number;
  aliquotaIcmsEstadual: number;   // fração: 0.25 para 25%
  cenario: 'baseline' | 'semIsencao' | 'zeroIsencao';
}): number {
  switch (params.cenario) {
    case 'baseline':
      return params.economiaBaseline;
    case 'semIsencao':
      // ICMS incide sobre energia injetada compensada
      const descontoIcms = params.energiaInjetadaKwh
        * params.aliquotaIcmsEstadual;
      return params.economiaBaseline - descontoIcms;
    case 'zeroIsencao':
      // ICMS + PIS/COFINS sobre tudo compensado
      const descontoTotal = params.economiaBaseline * 0.35; // estimativa conservadora
      return params.economiaBaseline - descontoTotal;
  }
}
```

#### 4.1.2 Tabela de alíquotas ICMS por estado

Adicionada como constante no sistema (não editável pelo integrador — dado regulatório):

```typescript
// utils/tarifasRegionais.ts

export const ICMS_ENERGIA_POR_ESTADO: Record<string, number> = {
  AM: 0.25, PA: 0.25, RR: 0.27, AP: 0.17, AC: 0.17, RO: 0.17, TO: 0.18,
  MA: 0.22, PI: 0.25, CE: 0.18, RN: 0.18, PB: 0.20, PE: 0.18, AL: 0.17,
  SE: 0.27, BA: 0.18,
  MG: 0.30, ES: 0.27, RJ: 0.30, SP: 0.25,
  PR: 0.29, SC: 0.25, RS: 0.30,
  MT: 0.17, MS: 0.17, GO: 0.17, DF: 0.12,
};

// Estados onde o Convênio CONFAZ 16/15 concede isenção (sujeito a alteração)
export const ESTADOS_COM_ISENÇÃO_ICMS = [
  'CE', 'MG', 'MT', 'SP', 'RS', 'PE', 'BA', 'GO', 'RJ', 'PR', 'PA',
  // outros estados que aderiram ao convênio — lista mantida pelo time
];
```

### 4.2 Interface — Painel de Estresse Regulatório

Painel adicional na ProjectionCanvasView, colapsado por padrão, abaixo da tabela de sensibilidade P50–P95:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ESTRESSE REGULATÓRIO                                           [▼ Expandir]│
│                                                                          │
│  Cenário                VPL        TIR       Payback    Status          │
│  ─────────────────────────────────────────────────────────────────────  │
│  Baseline (ICMS isento) R$ 28.340  22,1%     6,2 anos   ✅ Viável      │
│  Sem Isenção ICMS       R$ 19.820  17,8%     7,9 anos   ✅ Viável      │
│  Zero Isenção (máx.)    R$ 12.050  13,2%    10,4 anos   ⚠ Marginal    │
│                                                                          │
│  ⚠ Projetos no PA possuem isenção ICMS via Convênio CONFAZ 16/15.      │
│  A Reforma Tributária (IVA Dual) pode alterar esta isenção.             │
│  Verifique a legislação estadual vigente antes de emitir a proposta.    │
└──────────────────────────────────────────────────────────────────────────┘
```

O painel aparece **apenas quando** `clientData.state ∈ ESTADOS_COM_ISENÇÃO_ICMS`. Para estados sem isenção ativa, o painel não é renderizado (não há diferença entre os cenários).

---

## 5. Impacto nas Specs Existentes

### 5.1 `patch-motor-financeiro-lei-14300-roi-2026-04-25.md` — extensões

As extensões deste patch **adicionam** ao motor financeiro anterior:

- Seção §2 recebe `calcEconomiaAnualGrupoA` como função alternativa ao `calcAnualFlows` quando `rateGroup === 'A*'`
- A variável `economiaAnualBase` na tabela de fluxo anual passa a ser roteada pela função correta conforme o grupo tarifário
- `incertezaGeracao` é adicionado às variáveis de entrada em §2.1
- `sensibilidade` é adicionado ao `SimulationResult` em §7

### 5.2 `spec-view-site-2026-04-15.md` — Gap G-01 resolvido

O campo `rateGroup = 'A*'` agora tem spec completa. A nota "G-01: Suporte a Grupo A — P2" pode ser marcada como resolvida pela implementação descrita em §2 deste patch.

### 5.3 `escopo-definitivo-kurupira-v3.7` — extensão do glossário

Termos adicionados ao vocabulário canônico:

| Termo | Definição |
|-------|-----------|
| `TUSD-c` | Tarifa de Uso do Sistema de Distribuição — Carga. Rubrica de demanda no Grupo A. |
| `TUSD-G` | Tarifa de Uso do Sistema de Distribuição — Geração. Rubrica adicional quando a injeção ultrapassa a demanda contratada. |
| `Modalidade Verde` | Contrato Grupo A com uma única tarifa de demanda (sem diferenciação Ponta/Fora de Ponta). |
| `Modalidade Azul` | Contrato Grupo A com tarifas de demanda distintas para Ponta e Fora de Ponta. |
| `Tarifa Branca` | Modalidade opcional do Grupo B com tarifas de consumo diferenciadas por período do dia. |
| `P50 / P90 / P95` | Percentis de excedência da geração solar. P90 significa que há 90% de probabilidade de superar esse valor. |
| `Convênio CONFAZ 16/15` | Acordo entre estados que concede isenção de ICMS sobre energia compensada via SCEE. Sujeito à Reforma Tributária. |
| `Bankability` | Capacidade de um projeto solar passar pelos critérios de aprovação de financiamentos bancários — tipicamente exige viabilidade no cenário P90. |

---

## 6. Extensões em `clientData` — resumo consolidado

Adicionando ao que foi especificado no `patch-motor-financeiro-lei-14300-roi-2026-04-25.md`:

```typescript
interface ClientData {
  // campos do patch anterior ...
  
  // novos — deste patch
  grupoA: GrupoAData | null;
  tarifaBranca: boolean;
  tarifaBrancaConfig: TarifaBrancaConfig | null;
  consumoPontaFrac: number;     // fração do consumo no horário de Ponta; default 0.15
  incertezaGeracao: number;     // para análise P50–P95; default 0.08
  aliquotaIcmsEstadual: number; // preenchido automaticamente do estado; editável
}
```

---

## 7. Critérios de Aceitação

### Grupo A
- [ ] Quando `rateGroup = 'A4'`, SiteCanvasView exibe campos de Grupo A (demanda, modalidade, tarifas por posto)
- [ ] `calcTusdGNecessidade` retorna `necessaria: true` quando `potenciaInversoresKw = 100` e `demandaContratadaKw = 75`; `deltaKw = 25`
- [ ] Alerta TUSD-G vermelho quando campo `tarifaTusdGRkw` está vazio; âmbar quando preenchido
- [ ] Economia Grupo A descontada do custo de TUSD-G quando necessária
- [ ] ConsumptionCanvasView exibe série de Ponta destacada quando `rateGroup = 'A*'`

### Tarifa Branca
- [ ] Toggle "Tarifa Branca" substitui campo único de tarifa por três campos de posto
- [ ] Motor usa `tarifaForaPontaRkwh` para valorar os créditos de geração solar

### Sensibilidade P50–P95
- [ ] `calcGeracaoPxx('P90', 8432, 0.08)` retorna `8432 × (1 + (−1.282) × 0.08) = 8432 × 0.8974 ≈ 7565 kWh`
- [ ] Tabela de sensibilidade exibe quatro linhas com VPL, TIR e Payback corretos para cada cenário
- [ ] Clicar na linha P90 destaca a curva correspondente no gráfico ROI
- [ ] Status "⚠ Marginal" quando TIR do cenário está entre TMA e TMA+5pp
- [ ] Quando `capexTotal === 0`, tabela de sensibilidade exibe `—` em todas as colunas financeiras

### Estresse regulatório
- [ ] Painel de estresse aparece apenas para estados `∈ ESTADOS_COM_ISENÇÃO_ICMS`
- [ ] Para PA (Pará, alíquota ICMS 25%), cenário "Sem Isenção" reduz a economia corretamente
- [ ] Texto de alerta específico para o estado do projeto aparece no rodapé do painel

---

## 8. Fora do Escopo deste Patch

- **Autoconsumo Remoto e Geração Compartilhada** — requer modelagem de múltiplas unidades consumidoras e regras específicas de TUSD-A; escopo de minigeração remota (> 500 kW) não é o foco atual do Kurupira.
- **Modalidade Horária Verde e Azul completas** — a diferenciação de tarifas de demanda Ponta vs. Fora de Ponta na Modalidade Azul é suportada nos campos mas o motor simplifica; análise completa exige perfil de carga horário.
- **Importação de fatura PDF da distribuidora** — automatizaria o preenchimento dos campos de Grupo A mas é funcionalidade de OCR/IA separada.
- **Simulação com Monte Carlo** — o modelo gaussiano simplificado (P50–P95 via z-score) é suficiente para a interface de integrador; Monte Carlo completo é ferramenta de consultoria financeira avançada fora do escopo MVP.
