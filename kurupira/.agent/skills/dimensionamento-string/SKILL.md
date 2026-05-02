---
name: dimensionamento-string
description: >
  Consultor de dimensionamento de strings fotovoltaicas. Ative quando o desenvolvimento do Kurupira
  envolver cálculos de número de módulos em série/paralelo, janela MPPT, correção de tensão por
  temperatura, ou qualquer lógica nos arquivos electricalMath.ts, useStringCalculator.ts,
  ComposerBlockArrangement.tsx ou equivalentes. Fornece as fórmulas corretas, os limites normativos
  (NBR 16690) e os edge cases térmicos que a implementação deve cobrir.
---

# Skill: Dimensionamento de String Fotovoltaica

Consultor de domínio ativado durante o desenvolvimento de qualquer feature do Kurupira que envolva
cálculo de strings — da lógica de negócio no backend até o feedback de validação na UI.

---

## Fundamentos: Os 4 Parâmetros do Módulo

Toda lógica de string parte dos valores do datasheet do módulo em STC (1000 W/m², 25°C):

| Parâmetro | Símbolo | Papel no Dimensionamento |
|-----------|---------|--------------------------|
| Tensão de Circuito Aberto | Voc | Define o limite máximo de segurança da string |
| Tensão em Máxima Potência | Vmp | Define o ponto de operação dentro da janela MPPT |
| Corrente de Curto-Circuito | Isc | Define o dimensionamento de proteções |
| Corrente em Máxima Potência | Imp | Define a operação normal e o clipping |

Associação em série: tensões somam, corrente permanece igual ao módulo individual.
Associação em paralelo: correntes somam, tensão permanece igual ao módulo individual.

---

## Cálculo do Número de Módulos em Série

### Limite Superior — Proteção do Inversor

O Voc de uma string cresce com o frio. O pior caso ocorre na temperatura mínima histórica do local.

```
Voc_corrigido(T) = Voc_stc × [1 + (TempCoeff_Voc / 100) × (T_amb - 25)]
```

Onde `TempCoeff_Voc` é negativo (ex: -0,30 %/°C), portanto em temperaturas abaixo de 25°C o Voc sobe.

**Número máximo de módulos em série:**
```
N_max = floor( Vinput_max_inversor / Voc_corrigido(T_min) )
```

Margem de segurança recomendada: nunca usar mais de 95% do limite — aplicar fator 0,95:
```
N_max_seguro = floor( Vinput_max_inversor × 0,95 / Voc_corrigido(T_min) )
```

> **Referência normativa:** NBR 16690:2019 §6.3 — a tensão máxima do sistema é calculada
> com a temperatura mínima do local de instalação.

### Limite Inferior — Operação dentro da Janela MPPT

O Vmp de uma string cai com o calor. O pior caso ocorre quando a célula atinge temperatura máxima.

**Temperatura de célula no pior caso:**
```
T_celula_max = T_ambiente_max + NOCT - 20
```

**Vmp operacional no calor extremo:**
```
Vmp_hot = Vmp_stc × [1 + (TempCoeff_Vmp / 100) × (T_celula_max - 25)]
```

**Número mínimo de módulos em série:**
```
N_min = ceil( MPPT_Vmin / Vmp_hot )
```

### Faixa Válida de Strings

```
N_min ≤ N_série ≤ N_max_seguro
```

Se `N_min > N_max_seguro`, o par módulo + inversor é **incompatível** para aquele clima.

---

## Cálculo de Strings em Paralelo

Cada MPPT do inversor tem uma corrente máxima de entrada (`Iinput_max_mppt`).

**Corrente total de strings em paralelo (com fator de segurança NBR):**
```
Isc_total = Isc_stc × N_paralelo × 1,25
```

O fator 1,25 cobre picos de irradiância acima de 1000 W/m² (reflexos, limpeza de nuvens).

**Número máximo de strings em paralelo por MPPT:**
```
N_paralelo_max = floor( Iinput_max_mppt / (Isc_stc × 1,25) )
```

> **Atenção bifacial:** Se o módulo é bifacial, o Isc efetivo deve incluir o ganho traseiro:
> ```
> Isc_bifacial = Isc_stc × (1 + fator_bifacialidade × albedo)
> ```
> Fator bifacialidade típico: 0,65–0,75. Albedo padrão (concreto/terra): 0,20–0,25.

---

## Oversize Ratio (Taxa CC/CA)

```
Oversize_ratio = (N_série × N_paralelo × Pmodulo_stc) / Pac_nominal_inversor
```

Faixas de referência para o mercado brasileiro:

| Ratio | Classificação | Recomendação |
|-------|--------------|--------------|
| < 1,05 | Subdimensionado | Inversor subutilizado — economicamente ineficiente |
| 1,05 – 1,25 | Ótimo | Padrão para telhados com boa inclinação |
| 1,25 – 1,35 | Aceitável | Indicado para compensar perdas térmicas em climas quentes |
| 1,35 – 1,50 | Elevado | Requer análise de clipping — aceitável com justificativa |
| > 1,50 | Crítico | Risco de clipping excessivo e estresse térmico no inversor |

---

## Impacto da Temperatura na Eficiência do Inversor

A eficiência do inversor não é constante. Ela atinge o pico quando a tensão da string está próxima
à "tensão nominal DC" do equipamento. Operar fora dessa faixa aumenta as perdas de comutação.

**Implicação para o Kurupira:** ao recomendar a configuração ótima de string, priorizar o `N_série`
que posiciona o `Vmp_operacional` mais próximo da tensão nominal DC do inversor selecionado, dentro
dos limites de segurança calculados.

---

## Proteção em Arranjos Paralelos (NBR 16690)

Quando `N_paralelo ≥ 3` strings por MPPT, a NBR 16690 §7.4 exige **proteção individual por string**
(fusíveis ou disjuntores CC).

**Dimensionamento do fusível de string:**
```
1,5 × Isc_string ≤ If ≤ 2,4 × Isc_string
```

Categoria de utilização: `gG` ou `gPV` (específica para FV).

O Kurupira deve alertar quando `N_paralelo ≥ 3` e não houver proteção configurada.

---

## Multi-MPPT: Regra de Mismatch

Quando múltiplas strings são conectadas ao mesmo MPPT, a diferença entre elas deve ser controlada:

- Diferença máxima de Vmp entre strings no mesmo MPPT: **≤ 5%**
- Diferença máxima de potência entre strings no mesmo MPPT: **≤ 5%**

Strings de orientações diferentes (Leste/Oeste, telhados inclinados distintos) devem usar
**MPPTs independentes** — nunca o mesmo rastreador.

---

## Shadow Scanning (Múltiplos Picos MPPT)

Em arranjos com sombreamento parcial, a curva P-V deixa de ter um único pico e passa a ter
**múltiplos máximos locais**. Algoritmos MPPT convencionais ficam presos em picos locais.

Inversores com **Global MPPT / Shadow Scan** varrem toda a faixa de tensão periodicamente para
encontrar o pico global. Ao implementar lógica de recomendação de inversor no Kurupira, considerar
como critério de seleção quando o projeto tiver sombreamento identificado.

---

## O Que Implementar no Kurupira

### Motor de Cálculo (`electricalMath.ts` ou equivalente)

```typescript
// Inputs obrigatórios
interface StringCalcInputs {
  voc_stc: number;           // V
  vmp_stc: number;           // V
  isc_stc: number;           // A
  tempCoeff_voc: number;     // %/°C (negativo)
  tempCoeff_vmp: number;     // %/°C (negativo)
  t_min_historico: number;   // °C — temperatura mínima do local
  t_ambiente_max: number;    // °C — temperatura máxima do local
  noct: number;              // °C (padrão: 45)
  p_modulo_stc: number;      // W
  isBifacial: boolean;
  fator_bifacialidade?: number; // 0-1 (típico: 0,70)
  albedo?: number;              // 0-1 (típico: 0,20)
  
  vmax_inversor: number;        // V
  mppt_vmin: number;            // V
  mppt_vmax: number;            // V
  imax_mppt: number;            // A por MPPT
  pac_nominal: number;          // W
}

// Outputs obrigatórios
interface StringCalcResult {
  n_serie_min: number;
  n_serie_max: number;
  n_serie_otimo: number;        // mais próximo da tensão nominal DC
  n_paralelo_max: number;
  voc_string_max: number;       // V — com T_min
  vmp_string_hot: number;       // V — com T_max
  isc_total: number;            // A — com fator 1,25
  oversize_ratio: number;
  requer_fusivel_string: boolean; // N_paralelo >= 3
  alertas: StringAlert[];
}
```

### Validações Obrigatórias (Alertas)

| Condição | Severidade | Mensagem sugerida |
|----------|-----------|-------------------|
| `voc_string × N > vmax_inversor` | CRÍTICO | "Voc máx corrigido ({V}V) excede o limite do inversor ({V}V). Reduza para {N} módulos." |
| `vmp_string_hot × N < mppt_vmin` | CRÍTICO | "No pior caso de calor, a string cai abaixo do MPPT mínimo. Adicione {N} módulo(s)." |
| `isc_total > imax_mppt` | CRÍTICO | "Corrente total da string ({A}A) excede o máximo do MPPT ({A}A)." |
| `oversize_ratio > 1,50` | AVISO | "Oversize ratio {x} acima de 1,50. Verificar perdas por clipping." |
| `N_paralelo >= 3 sem fusível` | AVISO | "3+ strings em paralelo exigem proteção individual por string (NBR 16690 §7.4)." |
| `mismatch > 5% entre strings` | INFO | "Diferença de Vmp entre strings no mesmo MPPT: {%}%. Considere MPPTs separados." |

---

## Referências Normativas

| Norma | Seção relevante |
|-------|----------------|
| ABNT NBR 16690:2019 | §6.3 — Dimensionamento de strings; §7.4 — Proteção de sobrecorrente |
| IEC 62548:2016 | Design requirements for PV arrays |
| ABNT NBR 5410:2004 | Dimensionamento de condutores e proteções |
