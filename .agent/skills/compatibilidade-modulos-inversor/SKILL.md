---
name: compatibilidade-modulos-inversor
description: >
  Consultor de compatibilidade elétrica entre módulos fotovoltaicos e inversores. Ative quando o
  Kurupira precisar validar se um par módulo + inversor é tecnicamente compatível, especialmente
  com módulos de alta potência (M10/G12, >500 Wp), módulos bifaciais, ou ao implementar a lógica
  de seleção automática de equipamentos. Cobre: limites de corrente (Isc vs Imax_hardware),
  sobretensão CC (Voc corrigido vs Vmax), janela MPPT, clipping, NOCT/NMOT e evolução dos
  wafers (125mm → M6 → M10 → G12).
---

# Skill: Compatibilidade Elétrica Módulos × Inversores

Consultor ativado durante o desenvolvimento de qualquer feature de validação, seleção automática
ou alertas de compatibilidade no Kurupira.

---

## Por Que a Compatibilidade é Crítica Hoje

Entre 2018 e 2022, a potência nominal dos módulos comerciais saltou de ~300 Wp para >600 Wp.
Isso não foi por melhora de eficiência das células (que cresceu apenas de 17% para ~21%), mas pelo
**aumento da área física do wafer** — o que eleva diretamente a corrente de saída.

Módulos antigos operavam com Imp abaixo de 9 A. Módulos modernos M10/G12 ultrapassam rotineiramente
13–18 A. Inversores de geração anterior (projetados para <10 A por string) **não são compatíveis**
com esses módulos sem análise cuidadosa.

---

## Evolução dos Wafers e Impacto na Corrente

| Padrão | Dimensão | Imp típico | Compatibilidade |
|--------|---------|-----------|----------------|
| Tradicional | 125 mm | < 8,0 A | Alta com inversores legados |
| M6 | 166 mm | 10,0 – 12,5 A | Padrão 2018–2021 |
| M10 | 182 mm | 13,0 – 14,5 A | Exige MPPT ≥ 15 A |
| G12 | 210 mm | > 15,0 A | Risco de clipping severo em inversores < 20 A |

**Implicação no Kurupira:** ao exibir alertas de compatibilidade, o sistema deve identificar o
padrão de wafer e aplicar o limiar de corrente correspondente.

---

## Os 4 Critérios de Compatibilidade

### Critério 1 — Tensão Máxima CC (Segurança de Hardware)

Este é o parâmetro **mais crítico**. Uma sobretensão nos terminais CC causa dano imediato e
irreversível aos transistores de potência e capacitores de barramento do inversor.

```
Voc_string_max = N_série × Voc_stc × [1 + (TempCoeff_Voc/100) × (T_min - 25)]
```

**Condição obrigatória:**
```
Voc_string_max < Vmax_entrada_inversor
```

Margem de segurança: usar 95% do limite como teto operacional.

> Diferente da corrente, que pode ser limitada eletronicamente, a sobretensão CC **não tem
> mecanismo de proteção** além do limite físico do componente. O inversor simplesmente falha.

### Critério 2 — Corrente de Curto-Circuito de Hardware (Isc_max_hardware)

Distinto da corrente máxima de MPPT, o `Isc_max_hardware` é o limite físico do inversor — o
máximo que o equipamento consegue suportar em condições de falta interna.

Se o arranjo for dimensionado com `Isc_total > Isc_max_hardware`, o inversor não consegue extinguir
uma falta interna, levando à destruição de componentes e perda de garantia.

```
Isc_total_arranjo = N_paralelo × Isc_stc × (1 + ganho_bifacial)
```

**Condição obrigatória:**
```
Isc_total_arranjo < Isc_max_hardware_inversor
```

### Critério 3 — Corrente Máxima de MPPT (Operacional)

O `Imax_mppt` define o limite operacional do rastreador — o máximo que o inversor consegue
processar para injeção na rede. Exceder este limite causa **clipping de corrente**: o inversor
desloca o ponto de operação na curva I-V para reduzir a corrente, e a energia excedente "fica
no módulo" (não é dissipada como calor no inversor).

```
Imax_string_operacional = N_paralelo × Imp_stc × (1 + ganho_bifacial)
```

Quando `Imax_string_operacional > Imax_mppt`, ocorre clipping. Isso é aceitável se intencional
(estratégia de oversizing), mas deve ser quantificado.

### Critério 4 — Janela de Tensão MPPT (Eficiência)

```
MPPT_Vmin ≤ Vmp_string_operacional ≤ MPPT_Vmax
```

Onde:
```
Vmp_string_hot = N_série × Vmp_stc × [1 + (TempCoeff_Vmp/100) × (T_celula_max - 25)]
T_celula_max = T_ambiente_max + NOCT - 20
```

Se `Vmp_string_hot < MPPT_Vmin` nos dias mais quentes, o inversor perde eficiência de rastreamento
— pode continuar operando mas não extrai a potência máxima dos módulos.

---

## Módulos Bifaciais: O Fator Extra

Módulos bifaciais captam luz pela face traseira, elevando exclusivamente a corrente de saída
(Imp e Isc aumentam; a tensão permanece estável).

**Cálculo do Isc efetivo:**
```
Isc_bifacial = Isc_stc × (1 + fator_bifacialidade × albedo)
```

Valores típicos:
- Fator de bifacialidade: 0,65 – 0,75 (informado no datasheet)
- Albedo solo branco/concreto claro: 0,30 – 0,40
- Albedo areia/concreto escuro: 0,20 – 0,25
- Albedo terra/grama: 0,15 – 0,25

**Ganho bifacial prático em campo:** 8% – 20% dependendo da altura de instalação e do solo.

> **Ponto crítico para o Kurupira:** se o usuário selecionar um módulo bifacial sem ajustar
> a corrente efetiva, a validação de compatibilidade pode aprovar um arranjo que na prática
> excederá os limites do inversor. O sistema deve solicitar ou estimar o albedo do local.

---

## Temperatura de Operação: STC vs. NOCT vs. NMOT

As especificações STC (1000 W/m², 25°C) são condições de laboratório raramente encontradas em campo.

| Condição | Irradiância | T_ambiente | Estado do módulo | Uso |
|----------|------------|------------|-----------------|-----|
| STC | 1000 W/m² | 25°C | Em circuito aberto | Dados do datasheet |
| NOCT | 800 W/m² | 20°C | Em circuito aberto | Estimativa de T_célula |
| NMOT | 800 W/m² | 20°C | Sob carga (MPPT) | Mais realista — módulos ~3°C mais frios |

**Fórmula NOCT para temperatura de célula em campo:**
```
T_celula = T_ambiente + (NOCT - 20) × (Irradiância / 800)
```

**Impacto na potência real:**
```
P_real = P_stc × [1 + (TempCoeff_Pmax/100) × (T_celula - 25)]
```

TempCoeff_Pmax típico para monocristalino: -0,34 %/°C

Exemplo: módulo de 450 Wp com T_celula = 70°C:
```
P_real = 450 × [1 + (-0,34/100) × (70 - 25)] = 450 × 0,847 = 381 W
```

O sistema perde ~15% da potência nominal apenas pelo calor.

---

## Clipping: Quando é Aceitável

O clipping de corrente ocorre quando `Imp_arranjo > Imax_mppt`. O inversor desloca o ponto de
operação para reduzir a corrente — a energia excedente é "devolvida" para os módulos como tensão.

**O clipping NÃO danifica o inversor** — é um modo de operação previsto.

**Quando é estratégico (oversizing intencional):**
- O inversor atinge potência nominal mais cedo pela manhã e mais tarde à tarde
- O perfil de geração diária fica "achatado no topo" com maior área total (kWh/dia)
- Em climas com alta irradiância mas alta temperatura (ex: Nordeste), é a estratégia padrão

**Quando é problemático:**
- Clipping > 5% da energia anual total sem justificativa econômica
- Clipping constante por muitas horas aumenta temperatura de operação do inversor

**Quantificação de clipping para o Kurupira:**
```
Energia_clipping_estimada = HSP × N_horas_pico × max(0, Imp_arranjo - Imax_mppt) × Vmp_string
```

---

## Matriz de Diagnóstico de Compatibilidade

O Kurupira deve implementar uma saída de compatibilidade com 4 estados por critério:

| Estado | Critério | Ação |
|--------|---------|------|
| ✅ Compatível | Todos os critérios atendidos | Prosseguir |
| ⚠️ Alerta operacional | Clipping > 3% ou Vmp próximo do limite MPPT | Informar e quantificar |
| ❌ Incompatível operacional | Vmp cai abaixo do MPPT_Vmin no verão | Reconfigurar string |
| 🚫 Incompatível crítico | Voc > Vmax ou Isc > Isc_max_hardware | Bloquear — risco de falha |

---

## Verificação de Mismatch entre Strings

Quando múltiplas strings alimentam o mesmo MPPT, o desajuste entre elas gera perdas e risco de
corrente reversa.

**Condições que indicam mismatch problemático:**
- Diferença de Vmp > 5% entre strings do mesmo MPPT
- Strings com número de módulos diferente no mesmo MPPT
- Strings em orientações ou inclinações diferentes no mesmo MPPT

**Corrente reversa:** Se uma string tem menor potência que as demais, as outras podem forçar
corrente reversa através dela, superaquecendo células. Proteção: diodos de bloqueio ou fusíveis
individuais por string (obrigatórios quando N_paralelo ≥ 3, conforme NBR 16690 §7.4).

---

## Queda de Tensão no Cabeamento CC

A queda de tensão no circuito CC entre o arranjo e o inversor reduz a tensão disponível no MPPT
e introduz perdas por efeito Joule.

**Limite NBR 16690:** queda de tensão CC ≤ 3% (recomendação de campo: ≤ 1%)

```
ΔV = (2 × L × I) / (σ × A)
```

Onde:
- L = comprimento do cabo (m)
- I = corrente da string (A)
- σ = condutividade do cobre (56 × 10⁶ S/m)
- A = seção do condutor (mm²)

**Implicação no Kurupira:** ao calcular a compatibilidade com o MPPT, a tensão efetiva recebida
pelo inversor é `Vmp_string - ΔV_cabo`. Em projetos com cabos longos, isso pode fazer a string
operar abaixo do MPPT_Vmin.

---

## O Que Implementar no Kurupira

### Interface de Validação (`useElectricalValidation.ts` ou equivalente)

```typescript
interface CompatibilityResult {
  status: 'compatible' | 'warning' | 'incompatible' | 'critical';
  criteria: {
    voc_safety: CriterionResult;      // Voc_max < Vmax_inversor
    isc_hardware: CriterionResult;    // Isc_total < Isc_max_hardware
    mppt_window: CriterionResult;     // Vmp operacional dentro da janela
    current_clipping: CriterionResult; // Imp vs Imax_mppt
  };
  clipping_pct?: number;              // % de energia anual com clipping
  bifacial_warning?: boolean;         // alertar se bifacial sem albedo definido
  mismatch_warning?: boolean;
  recommendations: string[];         // ações corretivas específicas
}
```

### Checklist de Validação por Módulo de Alta Potência (M10/G12)

Quando o módulo selecionado tiver Imp > 12 A, o sistema deve verificar automaticamente:
- [ ] O inversor selecionado suporta Imax_mppt ≥ 15 A?
- [ ] O ganho bifacial foi considerado no cálculo de Isc?
- [ ] O oversize ratio resultante está dentro da faixa 1,05–1,35?
- [ ] O número de strings em paralelo não excede o Isc_max_hardware?

---

## Referências Normativas

| Norma | Relevância |
|-------|-----------|
| ABNT NBR 16690:2019 | §6 — Parâmetros de design; §7.4 — Proteção de sobrecorrente |
| ABNT NBR 16274:2014 | Comissionamento — medição de Voc e Isc em campo |
| IEC 62548:2016 | PV array design requirements — limites de corrente e tensão |
| IEC 61730 | Qualificação e segurança de módulos — limites operacionais |
