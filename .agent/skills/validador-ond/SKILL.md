---
name: validador-ond
description: >
  Motor de regras físicas para arquivos .OND (inversores do PVSyst). Ative quando o Kurupira
  precisar verificar se os parâmetros de um inversor são fisicamente coerentes antes de usar em
  dimensionamento, simulação ou catálogo. Cobre: coerência de tensão (Vmin_mpp < Vmax_mpp < Vabsmax),
  relação de potência (PAC_max ≥ PAC_nom), monotonidade da curva de eficiência, limiar de
  autoconsumo (Pth ≥ 0,5% Pnom) e consistência de corrente máxima de entrada. Complementa —
  mas não substitui — o seletor de inversores e o dimensionador de strings.
---

# Skill: Validador de Parâmetros .OND (Inversor)

Consultor de domínio ativado quando o Kurupira precisa garantir que um arquivo `.OND` é
fisicamente correto antes de usar seus parâmetros em qualquer cálculo.

---

## Por Que Validar o .OND Antes de Usar

As skills `seletor-inversor-tropical` e `dimensionamento-string` assumem que os parâmetros
do inversor são internamente consistentes. Se um `.OND` tiver `Vmax_mpp > Vabsmax`, o
dimensionamento de string calculará uma janela MPPT fisicamente impossível — e o erro só
aparecerá no campo quando o inversor falhar.

Erros comuns em arquivos `.OND` de fabricante:
- `Vmin_mpp` e `Vmax_mpp` invertidos (erro de entrada de dados)
- `Pthreshold` zerado ou ausente (causa divisão por zero no motor de simulação)
- Curva de eficiência com pontos não-monótonos (interpolação linear inválida)
- `Imax_entrada` calculado de forma inconsistente com `Pnom / Vmin`

---

## Regra 1 — Coerência de Tensão (Crítica)

### Hierarquia obrigatória

```
Vmin_mpp  <  Vmax_mpp  <  Vabsmax
```

| Parâmetro | Nome no .OND | Descrição |
|-----------|-------------|-----------|
| `Vmin_mpp` | `Vmin` | Tensão mínima da janela MPPT |
| `Vmax_mpp` | `Vmax` | Tensão máxima da janela MPPT |
| `Vabsmax` | `VAbsMax` | Tensão máxima absoluta de hardware (dano irreversível se excedida) |

```typescript
function validateVoltageHierarchy(params: {
  vMinMpp: number;
  vMaxMpp: number;
  vAbsMax: number;
}): PanValidationResult[] {
  const results: PanValidationResult[] = [];

  if (params.vMinMpp >= params.vMaxMpp) {
    results.push({
      rule: 'voltage_mppt_order',
      status: 'critical',
      message: `Vmin_mpp (${params.vMinMpp}V) deve ser menor que Vmax_mpp (${params.vMaxMpp}V). Parâmetros parecem invertidos.`,
    });
  }
  if (params.vMaxMpp >= params.vAbsMax) {
    results.push({
      rule: 'voltage_abs_max',
      status: 'critical',
      message: `Vmax_mpp (${params.vMaxMpp}V) deve ser menor que Vabsmax (${params.vAbsMax}V). Configuração fisicamente impossível — janela MPPT não pode ultrapassar o limite de hardware.`,
    });
  }
  if (params.vAbsMax < 600 || params.vAbsMax > 1500) {
    results.push({
      rule: 'vabsmax_range',
      status: 'warning',
      message: `Vabsmax=${params.vAbsMax}V fora da faixa típica (600–1500V). Verificar unidade (V vs mV).`,
    });
  }
  return results;
}
```

---

## Regra 2 — Relação de Potência CA (Crítica)

```
PAC_max ≥ PAC_nom
```

Alguns inversores permitem operação acima da potência nominal por curtos períodos (overload
temporário em temperaturas baixas). `PAC_max` representa esse pico permitido. Se `PAC_max <
PAC_nom`, o dado é fisicamente impossível.

```typescript
function validateAcPower(params: {
  pAcNom: number;    // W — potência nominal CA
  pAcMax: number;    // W — potência máxima CA
}): PanValidationResult {
  if (params.pAcMax < params.pAcNom) {
    return {
      rule: 'pac_max_less_than_nom',
      status: 'critical',
      message: `PAC_max (${params.pAcMax}W) menor que PAC_nom (${params.pAcNom}W). Fisicamente impossível — inversor não pode ter potência máxima menor que a nominal.`,
    };
  }
  if (params.pAcMax > params.pAcNom * 1.3) {
    return {
      rule: 'pac_max_excessive',
      status: 'warning',
      message: `PAC_max (${params.pAcMax}W) é ${((params.pAcMax / params.pAcNom - 1) * 100).toFixed(1)}% maior que PAC_nom. Valor incomum — verificar se não é erro de unidade (kW vs W).`,
    };
  }
  return { rule: 'pac_power', status: 'ok', message: 'PAC_max ≥ PAC_nom — coerente.' };
}
```

---

## Regra 3 — Limiar de Autoconsumo Pth (Crítica para Simulação)

### O que Pth representa

`Pthreshold` (ou `Pth`) é a potência mínima de entrada CC necessária para que o inversor
comece a injetar energia na rede. Representa o autoconsumo interno dos circuitos de controle.

### Por que a regra de 0,5% é obrigatória

O motor de simulação do PVSyst calcula a eficiência fracionada como:

```
η_real = η_max × (PAC / Pnom) / (PAC / Pnom + Pth / Pnom)
```

Se `Pth = 0` ou `Pth` ausente, esta expressão tem denominador zero para `PAC → 0`, causando
`NaN` ou `Infinity` no resultado da simulação — o PVSyst não avisa, simplesmente retorna
um yield incorreto.

```typescript
function validatePthreshold(params: {
  pThreshold: number | undefined;  // W
  pAcNom: number;                  // W
}): PanValidationResult {
  const minPth = params.pAcNom * 0.005;  // 0,5% da potência nominal

  if (params.pThreshold === undefined || params.pThreshold === null) {
    return {
      rule: 'pthreshold_missing',
      status: 'critical',
      message: `Pthreshold ausente. Mínimo obrigatório: ${minPth.toFixed(1)}W (0,5% de PAC_nom). Inserir antes de exportar.`,
    };
  }
  if (params.pThreshold < minPth) {
    return {
      rule: 'pthreshold_too_low',
      status: 'critical',
      message: `Pthreshold=${params.pThreshold}W abaixo do mínimo de ${minPth.toFixed(1)}W (0,5% de PAC_nom). Pode causar divisão por zero na simulação PVSyst.`,
      value: params.pThreshold,
      threshold: minPth,
    };
  }
  return { rule: 'pthreshold', status: 'ok', message: `Pthreshold=${params.pThreshold}W acima do mínimo de ${minPth.toFixed(1)}W.` };
}
```

---

## Regra 4 — Monotonidade da Curva de Eficiência

A curva de eficiência é definida por pares `(P_entrada, η)`. O PVSyst interpola linearmente
entre os pontos — se os pontos de potência não forem estritamente crescentes, a interpolação
inverte a curva e o resultado é uma eficiência que *aumenta* com a queda de potência (fisicamente
impossível).

```typescript
interface EfficiencyCurvePoint {
  power: number;       // W — potência de entrada CC
  efficiency: number;  // 0–1 ou 0–100% (normalizar antes de validar)
}

function validateEfficiencyCurve(
  points: EfficiencyCurvePoint[]
): PanValidationResult[] {
  const results: PanValidationResult[] = [];

  if (points.length < 2) {
    results.push({
      rule: 'efficiency_curve_min_points',
      status: 'critical',
      message: 'Curva de eficiência requer ao menos 2 pontos.',
    });
    return results;
  }

  for (let i = 1; i < points.length; i++) {
    if (points[i].power <= points[i - 1].power) {
      results.push({
        rule: 'efficiency_curve_monotonicity',
        status: 'critical',
        message: `Ponto ${i + 1} (P=${points[i].power}W) não é maior que o ponto ${i} (P=${points[i - 1].power}W). Curva não-monótona causa interpolação inválida.`,
        value: points[i].power,
        threshold: points[i - 1].power,
      });
    }
    if (points[i].efficiency > 1.0 || points[i].efficiency < 0) {
      results.push({
        rule: 'efficiency_range',
        status: 'critical',
        message: `Eficiência no ponto ${i + 1} (η=${points[i].efficiency}) fora do intervalo 0–1. Verificar se o valor está em % em vez de fração.`,
      });
    }
  }

  // Eficiência máxima típica de inversores modernos: 93%–99,5%
  const maxEff = Math.max(...points.map(p => p.efficiency));
  if (maxEff > 0.995 || maxEff < 0.88) {
    results.push({
      rule: 'efficiency_max_range',
      status: 'warning',
      message: `Eficiência máxima=${(maxEff * 100).toFixed(2)}% fora da faixa típica (88%–99,5%). Verificar unidade ou plausibilidade dos dados.`,
    });
  }

  return results;
}
```

---

## Regra 5 — Consistência da Corrente Máxima de Entrada

O PVSyst deriva internamente a corrente máxima de entrada como:

```
Imax_entrada_calculado = PAC_nom / Vmin_mpp
```

Se o arquivo `.OND` declara um `Imax_entrada` explícito inconsistente com esta relação,
o dimensionamento de string reportará perdas massivas por limitação de corrente que não
correspondem ao equipamento real.

```typescript
function validateImaxEntrada(params: {
  imaxEntrada?: number;  // A — corrente máxima declarada no .OND
  pAcNom: number;        // W
  vMinMpp: number;       // V
  tolerancePct?: number; // % — tolerância aceita (padrão: 10%)
}): PanValidationResult {
  const tolerance = params.tolerancePct ?? 0.10;
  const imaxCalculado = params.pAcNom / params.vMinMpp;

  if (!params.imaxEntrada) {
    return {
      rule: 'imax_missing',
      status: 'warning',
      message: `Imax_entrada não declarado. PVSyst usará ${imaxCalculado.toFixed(1)}A (PAC_nom / Vmin_mpp).`,
      value: imaxCalculado,
    };
  }

  const diff = Math.abs(params.imaxEntrada - imaxCalculado) / imaxCalculado;
  if (diff > tolerance) {
    return {
      rule: 'imax_inconsistent',
      status: 'warning',
      message: `Imax_entrada declarado (${params.imaxEntrada}A) difere em ${(diff * 100).toFixed(1)}% do calculado PAC_nom/Vmin_mpp (${imaxCalculado.toFixed(1)}A). Dimensionamento de string pode resultar em corrente de clipping incorreta.`,
      value: params.imaxEntrada,
      threshold: imaxCalculado,
    };
  }
  return { rule: 'imax_entrada', status: 'ok', message: 'Imax_entrada consistente com PAC_nom/Vmin_mpp.' };
}
```

---

## Motor de Validação Completo

```typescript
interface OndParams {
  vMinMpp: number;
  vMaxMpp: number;
  vAbsMax: number;
  pAcNom: number;
  pAcMax: number;
  pThreshold?: number;
  imaxEntrada?: number;
  efficiencyCurve: EfficiencyCurvePoint[];
  vac?: number;         // V — tensão de rede (informativo)
  frequencia?: number;  // Hz — frequência de rede (informativo)
}

function validateOnd(params: OndParams): PanValidationResult[] {
  return [
    ...validateVoltageHierarchy(params),
    validateAcPower(params),
    validatePthreshold(params),
    ...validateEfficiencyCurve(params.efficiencyCurve),
    validateImaxEntrada(params),
    validateFrequencia(params.frequencia),
  ].filter(Boolean);
}

function validateFrequencia(freq?: number): PanValidationResult | null {
  if (!freq) return null;
  if (freq !== 50 && freq !== 60) {
    return {
      rule: 'frequencia_nonstandard',
      status: 'warning',
      message: `Frequência=${freq}Hz. Valores esperados: 50Hz (Europa/Brasil) ou 60Hz (EUA). Verificar compatibilidade com a rede local.`,
    };
  }
  return null;
}
```

---

## Matriz de Diagnóstico por Severidade

| Regra | Severidade | Impacto se Ignorado |
|-------|-----------|---------------------|
| Vmin_mpp ≥ Vmax_mpp | Crítico | Dimensionamento de string usa janela MPPT invertida |
| Vmax_mpp ≥ Vabsmax | Crítico | Risco de sobretensão de hardware no modelo |
| PAC_max < PAC_nom | Crítico | Fisicamente impossível — dados corrompidos |
| Pth ausente ou < 0,5% | Crítico | Divisão por zero ou NaN no motor de simulação |
| Curva não-monótona | Crítico | Interpolação inválida → eficiência crescente com queda de potência |
| Imax_entrada inconsistente | Aviso | Clipping calculado incorretamente no dimensionamento |
| Vabsmax fora de 600–1500V | Aviso | Possível erro de unidade — verificar com datasheet |
| Eficiência máxima > 99,5% | Aviso | Dado implausível — possível erro de formatação |

---

## Referências

| Fonte | Relevância |
|-------|-----------|
| PVSyst Forum — Topic #774 | Clarificação dos parâmetros principais do .OND |
| PVSyst Help — Inverter Model: Efficiency | Modelo matemático de eficiência e Pthreshold |
| PVSyst Forum — Topic #4489 | Curva de eficiência por arquivo .OND |
| pvlib.iotools.read_panond | Implementação de referência do parser |

---

## Handoff para Outras Skills

| Entrega | Destinatário |
|---------|-------------|
| Parâmetros validados do inversor | `dimensionamento-string` (Vmin_mpp, Vmax_mpp, Vabsmax, Imax_mppt) |
| Parâmetros validados do inversor | `compatibilidade-modulos-inversor` (cruzar com módulo) |
| Parâmetros validados do inversor | `seletor-inversor-tropical` (derating térmico, IP, etc.) |
| Resultado de validação com severidades | `the-builder` (exibir alertas na UI e bloquear exportação em crítico) |
| Parâmetros do inversor para simulação | `pv-simulation-engine` (curva de eficiência, Pthreshold) |
