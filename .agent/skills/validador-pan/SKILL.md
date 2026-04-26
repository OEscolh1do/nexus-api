---
name: validador-pan
description: >
  Motor de regras físicas para arquivos .PAN (módulos fotovoltaicos do PVSyst). Ative quando o
  Kurupira precisar verificar se os parâmetros de um módulo FV são fisicamente consistentes antes
  de usar em simulação, proposta ou catálogo. Cobre: regra dos 0,2% (Pmpp × Pnom), resistência
  shunt dinâmica (Rp_Exp), estabilidade do RSerie pela heurística de 3% do PVSyst, e consistência
  interna do Modelo de Diodo Único (SDM). Complementa — mas não substitui — o validador de
  compatibilidade módulo × inversor.
---

# Skill: Validador de Parâmetros .PAN (Módulo FV)

Consultor de domínio ativado quando o Kurupira precisa garantir que um arquivo `.PAN` é
fisicamente correto e será aceito sem erros ou silenciosamente alterado pelo PVSyst.

---

## Por Que Validar o .PAN Antes de Usar

O PVSyst aceita arquivos `.PAN` sem feedback claro de erro — ele simplesmente recalcula
parâmetros inconsistentes internamente sem avisar o usuário. Um arquivo `.PAN` de fabricante
que viola a regra dos 0,2% fará o PVSyst usar um Pnom diferente do especificado, resultando
em projeções de geração erradas que não são rastreáveis sem auditar o arquivo-fonte.

Arquivos de laboratórios de terceiros (TÜV, CENER) são bankable porque passam por fitting
com restrições físicas. Arquivos de fabricante frequentemente não passam. O Kurupira deve
distinguir e alertar sobre os dois.

---

## Regra 1 — Discrepância de Potência Nominal (0,2%)

### O que o PVSyst exige

```
|Imp × Vmp − Pnom| / Pnom ≤ 0.002
```

Se a discrepância for maior que 0,2%, o PVSyst ignora o `Pnom` declarado pelo fabricante
e recalcula internamente como `Pnom_recalculado = Imp × Vmp`. O arquivo parece aceito, mas
a potência usada na simulação é diferente da etiqueta do painel.

### Implementação

```typescript
interface PanValidationResult {
  rule: string;
  status: 'ok' | 'warning' | 'critical';
  message: string;
  value?: number;
  threshold?: number;
}

function validatePmppDiscrepancy(params: {
  pnom: number;
  imp: number;
  vmp: number;
}): PanValidationResult {
  const pmpp = params.imp * params.vmp;
  const discrepancy = Math.abs(pmpp - params.pnom) / params.pnom;

  if (discrepancy > 0.002) {
    return {
      rule: 'pmpp_discrepancy',
      status: 'warning',
      message: `Imp×Vmp (${pmpp.toFixed(2)}W) difere de Pnom (${params.pnom}W) em ${(discrepancy * 100).toFixed(3)}%. PVSyst recalculará Pnom silenciosamente.`,
      value: discrepancy,
      threshold: 0.002,
    };
  }
  return { rule: 'pmpp_discrepancy', status: 'ok', message: 'Pnom consistente com Imp×Vmp.' };
}
```

### Ação no Kurupira

Quando a discrepância exceder 0,2%, oferecer ao usuário dois caminhos:
1. **Ajustar Pnom** para `Imp × Vmp` (garante aceitação)
2. **Ajustar Imp ou Vmp** para que o produto bata no Pnom declarado (preserva a etiqueta)

Nunca silenciar o alerta — ele é a diferença entre uma simulação auditável e uma não auditável.

---

## Regra 2 — Resistência Shunt Dinâmica (Rp_Exp)

### O que o parâmetro significa

O PVSyst modela a resistência shunt como função da irradiância:

```
Rsh(G) = RShunt + (Rp_0 − RShunt) × exp(−Rp_Exp × G / G_ref)
```

O `Rp_Exp` controla a taxa de decaimento da resistência shunt com a irradiância. Em baixa
irradiância (manhã, entardecer, dias nublados), uma resistência shunt mal parametrizada
superestima a geração em até **5% no yield anual**.

### Valor padrão e quando desviar

| Rp_Exp | Situação | Ação |
|--------|----------|------|
| 5,5 | Padrão da indústria adotado pelo PVSyst | Nenhuma — usar como está |
| Diferente de 5,5 | Só válido se derivado de medições IEC 61853-1 | Alertar e solicitar evidência |
| Ausente no arquivo | Versão antiga do formato | Inserir 5,5 como default na exportação |

```typescript
function validateRpExp(rpExp: number | undefined): PanValidationResult {
  if (rpExp === undefined || rpExp === null) {
    return {
      rule: 'rp_exp_missing',
      status: 'warning',
      message: 'Rp_Exp ausente. Será usado o valor padrão 5.5 do PVSyst na exportação.',
    };
  }
  if (Math.abs(rpExp - 5.5) > 0.1) {
    return {
      rule: 'rp_exp_nonstandard',
      status: 'warning',
      message: `Rp_Exp=${rpExp} difere do padrão 5.5. Válido apenas se derivado de medições IEC 61853-1. Arquivo pode ser excessivamente otimista em baixa irradiância.`,
      value: rpExp,
      threshold: 5.5,
    };
  }
  return { rule: 'rp_exp', status: 'ok', message: 'Rp_Exp dentro do padrão.' };
}
```

---

## Regra 3 — Estabilidade do RSerie (Heurística do PVSyst)

### O que o PVSyst faz internamente

O PVSyst ajusta o RSerie de forma que o módulo perca exatamente **3% de eficiência relativa**
quando a irradiância cai de 1000 W/m² para 200 W/m² a 25°C. Esta heurística garante que o
modelo seja fisicamente realizável — sem ela, um fitting matemático livre pode gerar um RSerie
que é correto no ponto de ajuste mas produz comportamento divergente fora dele.

### Por que isso importa para o Kurupira

Módulos com RSerie derivado de fitting irrestrito (sem a restrição dos 3%) frequentemente
apresentam **falha de convergência nas simulações anuais** do PVSyst — o solver não consegue
encontrar um ponto de operação estável para aquele módulo em certas condições.

### Estimativa simplificada de RSerie aceitável

A relação empírica para um primeiro alerta:

```typescript
function validateRSerie(params: {
  rSerie: number;    // Ω
  vmp: number;       // V em STC
  imp: number;       // A em STC
  nCelS: number;     // número de células em série
}): PanValidationResult {
  // RSerie máximo empírico: ~2× a resistência característica de uma célula
  // Resistência característica ≈ Vmp / (nCelS × Imp)
  const rChar = params.vmp / (params.nCelS * params.imp);
  const rSerieMax = 2 * rChar * params.nCelS;

  if (params.rSerie > rSerieMax) {
    return {
      rule: 'rserie_physical_bounds',
      status: 'critical',
      message: `RSerie=${params.rSerie}Ω está acima do limite físico estimado de ${rSerieMax.toFixed(4)}Ω para este módulo. Pode causar falha de convergência em simulações PVSyst.`,
      value: params.rSerie,
      threshold: rSerieMax,
    };
  }
  if (params.rSerie <= 0) {
    return {
      rule: 'rserie_nonpositive',
      status: 'critical',
      message: 'RSerie deve ser um valor positivo.',
    };
  }
  return { rule: 'rserie', status: 'ok', message: 'RSerie dentro de limites físicos esperados.' };
}
```

---

## Regra 4 — Consistência de Tecnologia e Número de Células

```typescript
const TECHNOL_CODES: Record<string, string> = {
  mtSiMono: 'Monocristalino',
  mtSiPoly: 'Policristalino',
  mtCdTe: 'CdTe (First Solar)',
  mtCIS: 'CIS/CIGS',
  mtAmorphous: 'Amorfo',
  mtHIT: 'HIT/HJT',
  mtTopCon: 'TOPCon',
};

function validateTechnol(technol: string, nCelS: number): PanValidationResult {
  if (!TECHNOL_CODES[technol]) {
    return {
      rule: 'technol_unknown',
      status: 'warning',
      message: `Código de tecnologia '${technol}' não reconhecido pelo PVSyst. Verificar se a versão do PVSyst suporta este tipo.`,
    };
  }
  // Monocristalino moderno: 60–132 células em série (wafers M6, M10, G12)
  if (technol === 'mtSiMono' && (nCelS < 60 || nCelS > 144)) {
    return {
      rule: 'nCelS_range',
      status: 'warning',
      message: `NCelS=${nCelS} incomum para módulo monocristalino. Valores típicos: 60–144. Verificar se não é erro de digitação.`,
      value: nCelS,
    };
  }
  return { rule: 'technol', status: 'ok', message: `Tecnologia ${TECHNOL_CODES[technol]} reconhecida.` };
}
```

---

## Regra 5 — Coeficientes de Temperatura (Sinais e Magnitude)

```typescript
function validateTempCoeffs(params: {
  tempCoeffVoc: number;   // %/°C — deve ser negativo
  tempCoeffIsc: number;   // %/°C — deve ser positivo
  tempCoeffPmax: number;  // %/°C — deve ser negativo
}): PanValidationResult[] {
  const results: PanValidationResult[] = [];

  if (params.tempCoeffVoc >= 0) {
    results.push({
      rule: 'tempCoeff_voc_sign',
      status: 'critical',
      message: `TempCoeff_Voc deve ser negativo. Valor recebido: ${params.tempCoeffVoc}%/°C.`,
    });
  }
  if (params.tempCoeffIsc <= 0) {
    results.push({
      rule: 'tempCoeff_isc_sign',
      status: 'warning',
      message: `TempCoeff_Isc positivo esperado. Valor recebido: ${params.tempCoeffIsc}%/°C. Verificar unidade.`,
    });
  }
  if (params.tempCoeffPmax >= 0) {
    results.push({
      rule: 'tempCoeff_pmax_sign',
      status: 'critical',
      message: `TempCoeff_Pmax deve ser negativo. Valor recebido: ${params.tempCoeffPmax}%/°C.`,
    });
  }
  // Magnitude típica para Si: −0,2% a −0,5%/°C
  if (params.tempCoeffPmax < -0.8 || params.tempCoeffPmax > -0.1) {
    results.push({
      rule: 'tempCoeff_pmax_magnitude',
      status: 'warning',
      message: `TempCoeff_Pmax=${params.tempCoeffPmax}%/°C fora da faixa típica (−0,1 a −0,8%/°C). Verificar se o valor não está em mV/°C ou V/°C ao invés de %/°C.`,
    });
  }
  return results;
}
```

---

## Motor de Validação Completo

```typescript
interface PanParams {
  pnom: number;
  imp: number;
  vmp: number;
  isc: number;
  voc: number;
  nCelS: number;
  nCelP: number;
  technol: string;
  rSerie: number;
  rShunt: number;
  rp0: number;
  rpExp?: number;
  gamma: number;
  tempCoeffVoc: number;
  tempCoeffIsc: number;
  tempCoeffPmax: number;
}

function validatePan(params: PanParams): PanValidationResult[] {
  return [
    validatePmppDiscrepancy(params),
    validateRpExp(params.rpExp),
    validateRSerie({ rSerie: params.rSerie, vmp: params.vmp, imp: params.imp, nCelS: params.nCelS }),
    validateTechnol(params.technol, params.nCelS),
    ...validateTempCoeffs(params),
  ].filter(Boolean);
}
```

---

## Classificação de Bancabilidade

| Classificação | Critério | Implicação |
|---------------|---------|-----------|
| **Bankable** | Parâmetros derivados de IEC 61853-1, laboratório certificado (TÜV/CENER), zero violações críticas | Aceito por financiadores e engenheiros independentes (IE) |
| **Aceitável** | Apenas alertas (warnings), nenhuma regra crítica violada | Pode ser usado com ressalvas documentadas |
| **Não-confiável** | Uma ou mais regras críticas violadas | Bloquear uso em simulações de engenharia até correção |

O Kurupira deve exibir esta classificação no card do componente e incluí-la no relatório técnico
da proposta.

---

## Referências Normativas

| Norma/Fonte | Relevância |
|-------------|-----------|
| PVSyst Forum — Topic #1030 | Especificação oficial dos campos do .PAN no banco de dados PVSyst |
| PVSyst Forum — Topic #49 | Regra dos 0,2% e recálculo silencioso de Pnom |
| IEC 61853-1 | Medição de desempenho de módulos FV — fonte dos parâmetros bankable |
| pvlib.iotools.read_panond | Implementação de referência do parser |
| PV Tech — "The importance of understanding PAN files" | Impacto de Rp_Exp incorreto no yield anual |

---

## Handoff para Outras Skills

| Entrega | Destinatário |
|---------|-------------|
| Parâmetros validados do módulo | `compatibilidade-modulos-inversor` (para cruzar com inversor) |
| Parâmetros validados do módulo | `dimensionamento-string` (Voc, Vmp, Isc, Imp, coefs. temperatura) |
| Parâmetros SDM validados | `pv-simulation-engine` (para simulação TMY) |
| Classificação de bancabilidade | `the-builder` (para exibir no card e incluir no relatório) |
