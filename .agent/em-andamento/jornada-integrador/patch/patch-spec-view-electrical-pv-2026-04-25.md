# Patch Cirúrgico — spec-view-electrical-2026-04-15.md

**Tipo:** Patch Técnico (Engenharia PV)
**Supersede parcialmente:** `spec-view-electrical-2026-04-15.md` (mantém layout e estética Cockpit)
**Data:** 2026-04-25
**Versão:** 2.0
**Origem:** `spec-revisao-jornada-integrador-engenharia-pv-2026-04-25.md` — Lacunas L1–L6, L9–L11

---

## O que muda nesta spec

Este patch atualiza exclusivamente as **regras de validação elétrica**, os **chips de saúde** e o **VoltageRangeChart**. O layout Cockpit de Engenharia, o Header HUD, a topologia de strings e o mecanismo `activeFocusedBlock` permanecem inalterados da v1.0.

---

## §1 — VoltageRangeChart: Dois Eixos de Temperatura

### Comportamento anterior (depreciado)
O gráfico exibia apenas `Voc_corrigido` pela temperatura mínima, com `Tmin` lida de `solarStore.project.settings.minHistoricalTemp` sem especificação de fallback.

### Comportamento novo (canônico)

O `VoltageRangeChart` exibe **duas linhas de tensão corrigida** sobrepostas ao gráfico de faixas operacionais:

**Linha 1 — Voc(frio) [vermelho pontilhado]**
Representa a tensão máxima possível da string, ocorrendo em manhãs frias.

```
Tmin = project.settings.manualTmin
    ?? climateData.Tmin_historico
    ?? 10   // fallback conservador para regiões sem dado

Voc_modulo_frio = modulo.Voc_STC × (1 + modulo.tempCoeffVoc/100 × (Tmin − 25))
Voc_string_frio = Voc_modulo_frio × N_modulos_serie
```

**Linha 2 — Vmp(calor) [linha laranja tracejada — nova]**
Representa a tensão mínima de operação da string, ocorrendo em tardes quentes.

```
Tamb_max = project.settings.manualTmax
         ?? climateData.Tamb_max_historico
         ?? 35   // fallback conservador para regiões tropicais

NOCT = modulo.noct ?? 45

Tcell_max = Tamb_max + (NOCT − 20) × (1000 / 800)
  // 800 W/m² = condição de referência NOCT; 1000 W/m² = irradiância de projeto

Vmp_modulo_calor = modulo.Vmp_STC × (1 + modulo.tempCoeffVoc/100 × (Tcell_max − 25))
Vmp_string_calor = Vmp_modulo_calor × N_modulos_serie
```

**Faixas do gráfico (da base ao topo):**

| Faixa | Cor | Limites | Significado |
|-------|-----|---------|-------------|
| Zona proibida inferior | Vermelho/10% | 0 → `Vmin_MPPT` | Inversor não opera |
| Zona MPPT operacional | Verde/20% | `Vmin_MPPT` → `Vmax_MPPT` | Zona de eficiência |
| Zona de risco de tensão | Âmbar/10% | `Vmax_MPPT` → `Voc_max_hardware` | Opera mas sem MPPT |
| Zona proibida superior | Vermelho/10% | acima de `Voc_max_hardware` | Destruição do inversor |

**Linha de `Voc_string_frio`** deve ficar abaixo de `Voc_max_hardware`.
**Linha de `Vmp_string_calor`** deve ficar acima de `Vmin_MPPT`.

Quando `Tmin` ou `Tamb_max` não estiverem disponíveis nem manualmente configurados, as linhas correspondentes aparecem em cinza com label "Tmin não configurada — usar valor padrão (10°C)" e link para `ProjectSettings`.

---

## §2 — Chips de Validação: Especificação Completa

### 2.1 Chip FDI — Semáforo revisado

O FDI (Fator de Dimensionamento do Inversor) é `Potência_DC_instalada_kWp / Potência_CA_nominal_inversor_kW`.

**Faixas e cores:**

| Faixa FDI | Cor do chip | Símbolo | Tooltip |
|-----------|-------------|---------|---------|
| < 1,00 | Âmbar | ⚠ | "Inversor superdimensionado para o arranjo. Analise custo-benefício." |
| 1,00 – 1,10 | Verde-escuro | ✓ | "Dimensionamento conservador. Adequado para regiões de alta irradiância." |
| 1,10 – 1,35 | Verde | ✅ | "Faixa ideal para instalações residenciais e comerciais brasileiras." |
| 1,35 – 1,50 | Verde-âmbar | ~ | "Oversizing moderado. Clipping esperado nos horários de pico." |
| > 1,50 | Vermelho | 🔴 | "Oversizing elevado. Risco de clipping significativo e possível perda de garantia do inversor." |

> **Correção da v1.0:** A faixa verde anterior (0,80–1,35) estava incorreta. FDI < 1,00 indica inversor maior que o arranjo — situação válida mas que sinaliza subdimensionamento do gerador. A nova escala começa em 1,00 como piso de bom dimensionamento.

### 2.2 Chip Voc(frio) — Semáforo revisado

Exibe `Voc_string_frio` calculado em §1.

| Condição | Cor | Símbolo |
|----------|-----|---------|
| `Voc_string_frio < 90% × Voc_max_hardware` | Verde | ✅ |
| `90% ≤ Voc_string_frio < 95% × Voc_max_hardware` | Âmbar | ⚠ |
| `Voc_string_frio ≥ 95% × Voc_max_hardware` | Vermelho | 🔴 |
| Dado de Tmin ausente | Cinza | — |

Ao clicar no chip, expande painel inline com: `Tmin usada (°C)`, `Voc_STC por módulo (V)`, `N módulos em série`, `Voc_frio por módulo (V)`, `Voc_string (V)`, `Limite do inversor (V)`, `Margem restante (V e %)`.

### 2.3 Chip Vmp(calor) — Chip novo

Exibe `Vmp_string_calor` calculado em §1. Posicionado imediatamente abaixo do chip Voc(frio).

| Condição | Cor | Símbolo |
|----------|-----|---------|
| `Vmp_string_calor > 110% × Vmin_MPPT` | Verde | ✅ |
| `105% ≤ Vmp_string_calor ≤ 110% × Vmin_MPPT` | Âmbar | ⚠ |
| `Vmp_string_calor < 105% × Vmin_MPPT` | Vermelho | 🔴 |
| Dado de Tamb_max ausente | Cinza | — |

Label do chip: `Vmp(calor) XXX V`.

Tooltip em caso de status vermelho: "Em dias quentes, a tensão da string pode cair abaixo do limite mínimo do MPPT do inversor, causando desligamento durante o horário de pico de geração. Reduza o número de módulos em série ou selecione inversor com Vmin_MPPT mais baixo."

### 2.4 Chip Isc — Dois níveis explícitos

O chip Isc anterior validava apenas `Isc_string ≤ Imax_MPPT`. Passa a ter dois sub-chips:

**Sub-chip Isc(op) — limite operacional:**
```
Isc_efetivo_por_MPPT = Σ Isc_modulo × N_strings_paralelas × fator_bifacial

fator_bifacial = 1 + (albedo × bifacialityFactor × 0,25)
  // aplicado apenas quando modulo.bifacial === true
  // albedo default: 0,20 quando não configurado
  // bifacialityFactor: modulo.bifacialityFactor ?? 0,70
```

| Condição | Cor | Símbolo | Significado |
|----------|-----|---------|-------------|
| `Isc_efetivo ≤ Imax_MPPT` | Verde | ✅ | Sem clipping de corrente |
| `Isc_efetivo > Imax_MPPT` | Âmbar | ⚠ | Clipping esperado — perda de geração |

**Sub-chip Isc(hw) — limite de hardware:**
```
Isc_efetivo > inversor.Isc_max_hardware  →  erro bloqueante
```

| Condição | Cor | Símbolo | Significado |
|----------|-----|---------|-------------|
| `Isc_efetivo ≤ Isc_max_hardware` | Verde | ✅ | Dentro do limite físico |
| `Isc_efetivo > Isc_max_hardware` | Vermelho sólido | 🔴 | Risco de destruição do inversor |

**Formato do chip unificado:** `Isc [✅ op / ✅ hw]` ou `Isc [⚠ op / 🔴 hw]`.

Quando `Isc_max_hardware` não estiver disponível no catálogo (campo `null`), exibe: `Isc [✅ op / — hw]` com tooltip "Dado Isc_max_hardware não disponível no catálogo deste inversor. Consulte o datasheet."

### 2.5 Chips normativos — novos (informativos)

Posicionados no painel de validação, abaixo dos chips elétricos, **somente quando o inversor selecionado não atende**:

**Chip AFCI:**
Aparece quando `inversor.afci === false`.
```
[⚠ Sem AFCI]
```
Tooltip: "Este inversor não possui proteção contra arco elétrico (AFCI). A Portaria Inmetro 515/2023 exige AFCI para sistemas com Vin > 120 V e Isc > 20 A. Verifique a conformidade antes de submeter à distribuidora."

**Chip RSD:**
Aparece quando `inversor.rsd === false`.
```
[⚠ Sem RSD]
```
Tooltip: "Desligamento Rápido (RSD) ausente. A ABNT NBR 17193:2025 exige RSD em instalações prediais. Instalações após jan/2025 podem ter dificuldades na obtenção de alvarás e seguros."

**Chip Derating Térmico:**
Aparece quando `projeto.location.estado ∈ ESTADOS_TROPICAIS` **e** `inversor.coolingType === 'passive'` **e** `inversor.potenciaCA_kW > 10`.

```
ESTADOS_TROPICAIS = ['AM','PA','RR','AP','AC','RO','TO','MA','PI','CE','RN','PB','PE','AL','SE','BA']
```

```
[⚠ Derating Térmico]
```
Tooltip: "Inversores com resfriamento passivo acima de 10 kW em regiões tropicais frequentemente reduzem automaticamente a potência de saída durante horas de pico solar. Considere inversor com resfriamento ativo (IP65 mínimo) para esta região."

Esses três chips são **informativos** — não bloqueiam o CTA "Ver Simulação".

### 2.6 Chip Mismatch — novo (bloqueante)

Aparece quando há strings com orientações diferentes conectadas ao mesmo MPPT, ou quando a diferença de tensão entre strings paralelas excede 5%.

**Detecção de mismatch por orientação:**
```
Para cada MPPT com N_strings > 1:
  Para cada par de strings (A, B):
    mismatch_orientacao = (mpptConfig.azimuthDeg_A ≠ mpptConfig.azimuthDeg_B)
                       OR (mpptConfig.tiltDeg_A ≠ mpptConfig.tiltDeg_B)
```

**Detecção de mismatch por tensão:**
```
Para cada MPPT com N_strings > 1:
  Para cada par de strings (A, B):
    delta_Voc = |Voc_string_A − Voc_string_B| / Voc_string_A
    mismatch_tensao = delta_Voc > 0,05  // > 5%
```

**Chip:**
```
[⚠ Mismatch MPPT 1]
```

Ao clicar: o diagrama de topologia destaca as strings em conflito com borda pontilhada amarela. A mensagem na lista de erros expande: "Strings com orientações diferentes no mesmo MPPT causam perda de geração por mismatch. Use entradas MPPT independentes por orientação." ou "Diferença de tensão entre strings excede 5% (NBR 16690). Uniformize o número de módulos por string."

O chip Mismatch é **bloqueante** — quando presente, o CTA "Ver Simulação" permanece desabilitado.

---

## §3 — Configuração MPPT: Campos Adicionais

O painel de Configuração MPPT (editável por MPPT) recebe dois campos adicionais por string:

| Campo | Tipo | Fonte | Descrição |
|-------|------|-------|-----------|
| `azimuthDeg` | `number input` (0–360°) | `MPPTConfig` | Azimute dos módulos desta string |
| `tiltDeg` | `number input` (0–90°) | `MPPTConfig` | Inclinação dos módulos desta string |

**Pré-preenchimento automático:** quando a string estiver associada a uma `PhysicalArrangement` com `azimuth` e `tilt` definidos no mapa, os campos são pré-preenchidos e marcados com ícone de link `🔗`. Se o integrador editar manualmente, o ícone muda para `✏` indicando override.

**Layout da linha de configuração MPPT (atualizado):**
```
MPPT 1:  Módulos/String [9]  Strings [2]  Az[180°] Inc[14°]
MPPT 2:  Módulos/String [6]  Strings [1]  Az[90°]  Inc[14°]  ← ⚠ mismatch orientação
```

Quando `mismatch_orientacao = true` para um MPPT, a linha do MPPT recebe fundo âmbar/10% e ícone `⚠` à esquerda do label.

---

## §4 — globalHealth: Critério de Aprovação Revisado

O `globalHealth` passa de `'ok' | 'error'` para `'ok' | 'warning' | 'error'`:

| Estado | Condição | Efeito no CTA |
|--------|----------|---------------|
| `'ok'` | Todos os chips elétricos verdes ou ausentes | CTA "Ver Simulação" ativo |
| `'warning'` | Chips normativos (AFCI/RSD/Derating) presentes, sem erros elétricos | CTA ativo com badge de aviso |
| `'error'` | Qualquer chip elétrico vermelho ou Mismatch presente | CTA desabilitado |

O CTA em estado `'warning'` exibe texto alternativo: "Ver Simulação ⚠" com tooltip "Existem alertas de conformidade normativa. O sistema pode ser simulado, mas revise os chips de aviso antes de gerar a proposta."

---

## §5 — Critérios de Aceitação (adicionados)

- [ ] `Voc_string_frio` calculado com `tempCoeffVoc` do módulo e `Tmin` do projeto; resultado correto para: módulo Voc_STC=49V, tempCoeffVoc=−0,28%/°C, Tmin=10°C, N=12 → Voc_frio = 49×(1+(−0,0028)×(10−25))×12 = 612,7V
- [ ] `Vmp_string_calor` calculado com NOCT e Tamb_max; resultado correto para: módulo Vmp_STC=41V, NOCT=45°C, Tamb_max=35°C, N=12 → Tcell=35+(45−20)×(1000/800)=66,25°C → Vmp_frio=41×(1+(−0,0028)×(66,25−25))×12=456,9V
- [ ] Chip Vmp(calor) aparece mesmo quando chip Voc(frio) está verde
- [ ] Sub-chip Isc(hw) aparece em vermelho quando Isc_efetivo > Isc_max_hardware
- [ ] Para módulo bifacial (bifacialityFactor=0,70, albedo=0,20): Isc_efetivo = Isc_frontal × (1 + 0,20×0,70×0,25) = Isc_frontal × 1,035
- [ ] Chips AFCI e RSD aparecem apenas quando o inversor não possui o recurso
- [ ] Chip Derating aparece para inversor passivo > 10kW em estado PA (Pará)
- [ ] Chip Mismatch bloqueia CTA quando strings com azimutes diferentes estão no mesmo MPPT
- [ ] FDI=1,20 exibe chip verde; FDI=0,95 exibe âmbar; FDI=1,60 exibe vermelho
- [ ] CTA em estado 'warning' (apenas alertas normativos) permanece habilitado

---

## Referências

- Origem técnica: `spec-revisao-jornada-integrador-engenharia-pv-2026-04-25.md` §3.2
- Schema: `spec-catalogo-modulos-inversores-pv-2026-04-25.md` (nova spec)
- Contexto de layout: `spec-view-electrical-2026-04-15.md` v1.0 (mantido)
