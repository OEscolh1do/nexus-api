# Patch Cirúrgico — ProjectionCanvasView: PR Dinâmico e Decomposição de Perdas

**Tipo:** Patch Técnico (Motor de Cálculo)
**Supersede parcialmente:** `views-spec-view-simulation-v1.md` §Painel 1 e `escopo-definitivo-kurupira-v3.7` §5.4 (motor de geração)
**Data:** 2026-04-25
**Versão:** 1.0
**Origem:** `spec-revisao-jornada-integrador-engenharia-pv-2026-04-25.md` — Lacuna L12

---

## O que muda nesta spec

O Performance Ratio (PR) deixa de ser um valor fixo em `lossConfig` e passa a ser calculado dinamicamente a partir de componentes de perda individuais. O motor de geração `geracaoMensal[i] = P_DC_kWp × hsp[i] × DAYS_IN_MONTH[i] × pr` permanece inalterado — apenas `pr` deixa de ser uma constante de entrada e passa a ser um valor derivado.

---

## §1 — Composição do PR

### 1.1 Fórmula canônica

```typescript
// utils/simulationMath.ts

export function calcPerformanceRatio(params: PRParams): PRResult {
  const {
    tempCoeffPmax,       // decimal negativo, ex: -0.0034
    tcellMediaAnual,     // °C — temperatura média anual da célula
    perdaSujeira,        // fração: 0.03 = 3%
    perdaCabos,          // fração: 0.02 = 2%
    eficienciaInversor,  // fração: 0.975 = 97.5%
    mismatchPresente,    // boolean — strings com orientações diferentes no mesmo MPPT
  } = params;

  const perdaTermica = Math.abs(tempCoeffPmax) * Math.max(0, tcellMediaAnual - 25);
  // ex: |−0.0034| × (55 − 25) = 0.102 = 10,2% de perda térmica

  const perdaInversao = 1 - eficienciaInversor;
  // ex: 1 − 0.975 = 0.025 = 2,5%

  const perdaMismatch = mismatchPresente ? 0.05 : 0.01;
  // 5% com mismatch confirmado; 1% como perda residual padrão

  const pr =
    (1 - perdaTermica) *
    (1 - perdaSujeira) *
    (1 - perdaCabos) *
    (1 - perdaInversao) *
    (1 - perdaMismatch);

  return {
    pr,
    components: {
      perdaTermica,
      perdaSujeira,
      perdaCabos,
      perdaInversao,
      perdaMismatch,
    },
  };
}

export interface PRParams {
  tempCoeffPmax: number;
  tcellMediaAnual: number;
  perdaSujeira: number;
  perdaCabos: number;
  eficienciaInversor: number;
  mismatchPresente: boolean;
}

export interface PRResult {
  pr: number;
  components: {
    perdaTermica: number;
    perdaSujeira: number;
    perdaCabos: number;
    perdaInversao: number;
    perdaMismatch: number;
  };
}
```

### 1.2 Temperatura média anual da célula

```typescript
// utils/simulationMath.ts

export function calcTcellMediaAnual(params: {
  tambMediaAnual: number;  // °C — temperatura ambiente média anual (de climateData)
  noct: number;            // °C — do catálogo do módulo; default 45
}): number {
  const { tambMediaAnual, noct } = params;
  // Fórmula simplificada para temperatura média operacional da célula:
  // Tcell = Tamb + (NOCT − 20) × (Irradiância_media / 800)
  // Irradiância_media ≈ 600 W/m² como proxy conservador de média diária
  return tambMediaAnual + (noct - 20) * (600 / 800);
}
```

**Fonte de `tambMediaAnual`:** `climateData.Tamb_media_anual` (dado da API NASA/PVGIS). Se ausente: `(manualTmax + manualTmin) / 2` se ambos disponíveis. Fallback final: `28°C` (conservador para regiões tropicais brasileiras).

### 1.3 Defaults dos componentes editáveis

| Componente | Campo em `lossConfig` | Default | Faixa válida |
|-----------|----------------------|---------|--------------|
| `perdaSujeira` | `lossConfig.soiling` | `0.03` | 0,01 – 0,15 |
| `perdaCabos` | `lossConfig.wiring` | `0.02` | 0,005 – 0,05 |
| `eficienciaInversor` | `lossConfig.inverterEfficiency` | `0.975` | 0,90 – 0,99 |

`eficienciaInversor` é preenchido automaticamente com `inversorSelecionado.efficiency` ao selecionar o inversor, mas é editável manualmente no painel de PR.

---

## §2 — LossConfig: campos novos no store

```typescript
// core/state/slices/lossConfigSlice.ts (extensão dos campos existentes)

interface LossConfig {
  // campos existentes (mantidos)
  pr: number;           // DEPRECIADO como entrada primária — passa a ser saída calculada
                        // mantido para compatibilidade com projetos legados e leitura
  shadingFactor: number;

  // campos novos
  soiling: number;           // fração: perda por sujeira; default 0.03
  wiring: number;            // fração: perda por resistência de cabos; default 0.02
  inverterEfficiency: number; // fração: eficiência do inversor; default 0.975
                              // preenchido automaticamente do catálogo ao selecionar inversor
}
```

**Migração de projetos legados:** projetos sem os campos novos carregam com os defaults. O `pr` legado é mantido como campo de leitura para exibição histórica, mas o motor de simulação usa o PR calculado a partir dos componentes.

**Pré-requisito de backend:** nenhuma migração de coluna SQL necessária — `lossConfig` está dentro do `designData` JSON.

---

## §3 — ProjectionCanvasView: Painel de Premissas atualizado

### 3.1 Painel 1 — Decomposição do PR

O Painel 1 da `ProjectionCanvasView` (Barra de Premissas) é expandido para exibir a decomposição do PR:

```
┌─────────────────────────────────────────────────────────────────────┐
│ PREMISSAS E COMPOSIÇÃO DO PR                                        │
│                                                                     │
│  Perda Térmica    Sujeira        Cabos         Inversão   Mismatch  │
│  [▓▓▓▓▓▓ 10,2%]  [▓▓▓  3,0%]   [▓▓  2,0%]   [▓▓ 2,5%] [▓  1,0%] │
│   calculada        [slider]       [slider]      [auto]    [calc.]   │
│                                                                     │
│  PR Resultante: 0,826  (era 0,80 no projeto anterior)              │
│  [↺ Usar PR manual: 0,80]                                          │
└─────────────────────────────────────────────────────────────────────┘
```

**Campos editáveis:**
- Sujeira: slider 1% → 15%, step 0,5%
- Cabos: slider 0,5% → 5%, step 0,5%
- Inversão: exibido como somente leitura quando preenchido do catálogo; editável quando o inversor não estiver no catálogo (campo manual)

**Campos calculados (somente leitura):**
- Perda Térmica: calculada automaticamente de `tempCoeffPmax × (Tcell_media − 25)`; exibida com tooltip mostrando `Tcell_media` e sua fonte
- Mismatch: 1% padrão ou 5% quando `mismatchPresente === true` (detectado na ElectricalCanvasView)

**Link "Usar PR manual":** abre input numérico que, quando preenchido, substitui o PR calculado pelo valor manual. O banner do PR exibe `⚠ PR manual: 0,80 (calculado: 0,826)` para deixar claro que o valor dinâmico foi sobrescrito.

### 3.2 Atualização do bloco Simulação (LeftOutliner)

O bloco Simulação no LeftOutliner exibe o PR calculado:

```
📊 Simulação
8.340 kWh/ano  ·  Cobertura 98%
PR: 0,826  ·  Economia: R$ 570/mês  ·  Payback: 4,2 anos
```

### 3.3 SimulationResult: PR salvo no designData

```typescript
// core/types/design.ts

export interface SimulationResult {
  monthlyGeneration: number[];       // kWh por mês (12 valores)
  annualGenerationKwh: number;
  performanceRatio: number;          // PR calculado (ou manual se sobrescrito)
  prComponents: {                    // NOVO — componentes que geraram o PR
    perdaTermica: number;
    perdaSujeira: number;
    perdaCabos: number;
    perdaInversao: number;
    perdaMismatch: number;
    isManualOverride: boolean;       // true se o PR foi definido manualmente
    manualPrValue: number | null;    // valor manual, null se calculado
  } | null;                          // null para projetos legados sem decomposição
}
```

**Silent migration:** projetos legados que possuem `simulationResult` sem `prComponents` carregam com `prComponents: null`. O painel de PR exibe "PR histórico: X,XX (decomposição não disponível)".

---

## §4 — Critérios de Aceitação

- [ ] Para módulo com `tempCoeffPmax = −0.0034`, `Tcell_media = 55°C`: `perdaTermica = 0.0034 × (55−25) = 0.102 = 10,2%`
- [ ] PR resultante com defaults (sujeira 3%, cabos 2%, inversão 2,5%, mismatch 1%, térmica 10,2%): `PR = (1−0.102)×(1−0.03)×(1−0.02)×(1−0.025)×(1−0.01) ≈ 0.826`
- [ ] Geração anual com PR calculado ≠ geração com PR fixo 0,80 para o mesmo projeto; diferença exibida no painel
- [ ] PR manual sobrescreve o calculado; banner de aviso é exibido
- [ ] `prComponents` é salvo no `simulationResult` ao simular
- [ ] Projetos legados sem `prComponents` carregam sem erro
- [ ] Quando `mismatchPresente === true` (detectado na view elétrica), `perdaMismatch` passa de 1% para 5% automaticamente
- [ ] `eficienciaInversor` é preenchido automaticamente do catálogo ao selecionar inversor; editável manualmente
