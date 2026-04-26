# Patch Cirúrgico — escopo-definitivo-kurupira-v3.7: Correções PV

**Tipo:** Patch Técnico (Correções de Domínio)
**Supersede parcialmente:** `escopo-definitivo-kurupira-v3.7-2026-04-15.md`
**Data:** 2026-04-25
**Versão:** 1.0
**Seções afetadas:** §4.4 (Chips do bloco inversor), §4.5 (Anatomia dos blocos), §5.3 (ElectricalCanvasView), §5.4 (SimulationCanvasView motor)

---

## §1 — Correção: Semáforo do FDI (§4.4 e §5.3)

### Texto anterior (depreciado)

```
FDI: verde 0,80–1,35 · âmbar fora · vermelho > 1,50
```

### Texto canônico (substitui)

```
FDI: vermelho < 1,00 · verde-escuro 1,00–1,10 · verde 1,10–1,35
     verde-âmbar 1,35–1,50 · vermelho > 1,50
```

Razão: FDI < 1,00 significa que o inversor tem capacidade CA superior à potência DC instalada — situação de subdimensionamento do gerador que merece aviso, não aprovação verde. A faixa 0,80–1,35 anterior era tecnicamente incorreta ao tratar FDI = 0,80 como aceitável sem sinalização.

A especificação completa dos semáforos está em `patch-spec-view-electrical-pv-2026-04-25.md §2.1`.

---

## §2 — Correção: Chips de Validação Isc (§5.3)

### Texto anterior (depreciado)

```
Isc: verde ≤ Imax_MPPT · vermelho > Imax_MPPT
```

### Texto canônico (substitui)

O chip Isc tem **dois sub-chips independentes**:

- **Isc(op):** verde quando `Isc_efetivo ≤ imaxMppt`; âmbar quando excede (clipping, não destruição)
- **Isc(hw):** verde quando `Isc_efetivo ≤ iscMaxHardware`; vermelho sólido bloqueante quando excede (risco de destruição)

Formato exibido: `Isc [✅ op / ✅ hw]`

Para módulos bifaciais, `Isc_efetivo` inclui o ganho bifacial:
```
Isc_efetivo = Isc_frontal × (1 + albedo × bifacialityFactor × 0,25)
```

A especificação completa está em `patch-spec-view-electrical-pv-2026-04-25.md §2.4`.

---

## §3 — Adição: Chip Vmp(calor) ao painel de validação (§5.3)

Após o chip `Voc`, adiciona-se o chip `Vmp(calor) XXX V`:

```
[FDI X,XX]  [Voc(frio) XXX V]  [Vmp(calor) XXX V]  [Isc ✅ op / ✅ hw]
```

O `Vmp(calor)` valida que a tensão mínima de operação da string em dias quentes permanece acima do `Vmin_MPPT` do inversor. Detalhes em `patch-spec-view-electrical-pv-2026-04-25.md §1` e `§2.3`.

---

## §4 — Adição: Chips normativos e de mismatch (§5.3)

Abaixo dos chips elétricos principais, o painel de validação exibe chips informativos condicionais:

```
[⚠ Sem AFCI]   — quando inversor.afci === false
[⚠ Sem RSD]    — quando inversor.rsd === false
[⚠ Derating Térmico]  — quando projeto em região tropical + inversor passivo > 10kW
[⚠ Mismatch MPPT N]   — quando strings com orientações diferentes no mesmo MPPT
```

Os três primeiros são informativos (não bloqueam CTA). O Mismatch é bloqueante.

Detalhes completos em `patch-spec-view-electrical-pv-2026-04-25.md §2.5` e `§2.6`.

---

## §5 — Correção: Motor de geração — PR dinâmico (§5.4)

### Texto anterior (depreciado)

```typescript
// motor de geração:
geracaoMensal[i] = P_DC_kWp * hsp[i] * DAYS_IN_MONTH[i] * pr;
// pr: lossConfig (PR decomposto ou default 0.80)
```

### Texto canônico (substitui)

O motor de geração permanece estruturalmente idêntico, mas `pr` passa a ser calculado dinamicamente em vez de ser um valor de entrada:

```typescript
// utils/simulationMath.ts
const { pr } = calcPerformanceRatio({
  tempCoeffPmax: moduloSelecionado.tempCoeffPmax,
  tcellMediaAnual: calcTcellMediaAnual({
    tambMediaAnual: climateData.Tamb_media_anual ?? 28,
    noct: moduloSelecionado.noct,
  }),
  perdaSujeira: lossConfig.soiling ?? 0.03,
  perdaCabos: lossConfig.wiring ?? 0.02,
  eficienciaInversor: lossConfig.inverterEfficiency ?? 0.975,
  mismatchPresente: systemCompositionSlice.hasMismatch,
});

// motor de geração — inalterado:
geracaoMensal[i] = P_DC_kWp * hsp[i] * DAYS_IN_MONTH[i] * pr;
```

O PR fixo `0.80` era um default conservador aceitável mas impreciso. O PR calculado reflete as condições reais do projeto (módulo escolhido, clima da instalação, configuração elétrica).

Implementação completa: `patch-spec-projection-pr-dinamico-2026-04-25.md`.

---

## §6 — Correção: Anatomia do bloco Simulação (§4.5)

### Texto anterior (depreciado)

```
📊 Simulação
8.340 kWh/ano  ·  Cobertura 98%
Economia: R$ 570/mês  ·  Payback: 4,2 anos
```

### Texto canônico (substitui)

```
📊 Simulação
8.340 kWh/ano  ·  Cobertura 98%
PR: 0,826  ·  Economia: R$ 570/mês  ·  Payback: 4,2 anos
```

O PR calculado é exibido no bloco para que o integrador possa identificar rapidamente projetos com PR atipicamente baixo (sugestão de revisão de premissas) ou alto (configuração otimizada).

---

## §7 — Adição: Campos ao ConnectorC2 (Inversor → saída)

### Texto anterior

```
Conector Inversor → saída: N strings · Voc XXX V
```

### Texto canônico (substitui)

```
Conector Inversor → saída: N strings · Voc(frio) XXX V · Vmp(calor) XXX V
```

O conector passa a exibir as duas tensões corrigidas, não apenas o Voc nominal, para que o integrador veja o intervalo de operação da string diretamente no LeftOutliner sem precisar abrir a view elétrica.

---

## §8 — Referências normativas adicionadas ao glossário (§1 ou equivalente)

Os seguintes termos passam a ser parte do vocabulário canônico do Kurupira:

| Termo | Definição |
|-------|-----------|
| `Voc_max_hardware` | Tensão máxima absoluta suportada pelo inversor sem risco de destruição; distinto de `vocMaxInput` (limite do MPPT) |
| `Isc_max_hardware` | Corrente máxima de curto-circuito suportada por entrada MPPT; limite físico, não operacional |
| `FDI` | Fator de Dimensionamento do Inversor: `Potência_DC_kWp / Potência_CA_kW`. Faixa ótima: 1,10–1,35 |
| `AFCI` | Arc Fault Circuit Interrupter — proteção contra arco elétrico DC; exigido pela Portaria 515/2023 |
| `RSD` | Rapid Shutdown Device — desligamento rápido de emergência; exigido pela NBR 17193:2025 |
| `Mismatch` | Perda causada por diferenças de tensão/corrente entre strings do mesmo MPPT |
| `Derating térmico` | Redução automática de potência do inversor para proteção térmica; mais frequente em ambientes tropicais com resfriamento passivo |
| `NOCT` | Nominal Operating Cell Temperature — temperatura da célula sob 800 W/m² e 20°C de ambiente |
| `PR dinâmico` | Performance Ratio calculado a partir de componentes de perda individuais, em oposição ao PR fixo de 0,80 |
