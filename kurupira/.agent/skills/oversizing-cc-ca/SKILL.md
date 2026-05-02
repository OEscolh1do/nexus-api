---
name: oversizing-cc-ca
description: >
  Consultor de dimensionamento de potência solar e taxa CC/CA (oversizing ratio). Ative quando o
  Kurupira precisar calcular ou recomendar a relação entre a potência CC instalada (arranjo FV) e
  a potência CA nominal do inversor, modelar perdas por clipping, justificar o oversizing na
  proposta técnica, ou implementar lógicas de otimização de yield em generationSimulation.ts,
  SolarCalculator.ts ou equivalentes. Cobre: lógica do oversizing, curvas de eficiência do
  inversor, métricas ponderadas (Eficiência Europeia, CEC, brasileira), e topologias de inversão
  (string, microinversores, otimizadores).
---

# Skill: Dimensionamento de Potência Solar (Taxa CC/CA)

Consultor de domínio para o motor de geração e dimensionamento econômico do Kurupira.

---

## O Que é Oversizing (Superdimensionamento)

Oversizing é a prática de instalar uma potência CC (arranjo fotovoltaico) maior do que a potência
CA nominal do inversor. A taxa CC/CA (ou "oversize ratio") mede essa relação:

```
Oversize_ratio = P_cc_instalada (kWp) / P_ca_nominal_inversor (kW)
```

Um sistema com 10 kWp de módulos e um inversor de 8 kW tem oversize ratio = 1,25.

---

## Por Que o Oversizing é Econômico (Não um Erro)

Módulos fotovoltaicos **raramente operam em sua potência máxima nominal**. As principais causas:

| Fator de Perda | Redução típica |
|---------------|----------------|
| Temperatura de célula acima de 25°C | 5% – 15% |
| Sujeira e poeira acumulada | 2% – 5% |
| Sombreamento parcial | variável |
| Degradação anual dos módulos | 0,5% – 0,7%/ano |
| Perdas de cabeamento CC | 1% – 2% |
| Mismatch entre módulos | 0,5% – 2% |

A potência real entregada ao inversor na maior parte do tempo é **significativamente menor** que
o valor de pico STC. O inversor opera em carga parcial na maioria das horas do dia.

**Lógica do oversizing:** ao instalar mais módulos CC, o inversor atinge sua potência nominal
mais cedo pela manhã e mantém por mais tempo à tarde — aumentando a energia total diária (kWh)
mesmo que o pico seja limitado ("clipped").

---

## Impacto na Curva de Geração Diária

```
Sem oversizing (ratio = 1,0):
     ▲ kW
     │     ╭──╮
     │   ╭─╯  ╰─╮
     │  ╭╯       ╰╮
     └──────────────→ horas
     
Com oversizing (ratio = 1,3):
     ▲ kW         ← limite do inversor (clipping)
     │  ┌─────────┐
     │  │  clipping│
     │╭─╯          ╰─╮
     └──────────────→ horas
     Maior área total sob a curva = mais kWh/dia
```

---

## Tabela de Referência CC/CA para o Mercado Brasileiro

| Ratio | Perda por Clipping | Classificação | Quando usar |
|-------|-------------------|---------------|-------------|
| < 1,05 | Zero | Subdimensionado | Não recomendado — inversor subutilizado |
| 1,05 – 1,20 | < 1% | Ótimo conservador | Telhados com boa inclinação e baixa temperatura |
| 1,20 – 1,35 | 1% – 4% | Ótimo para BR | Padrão para compensar perdas térmicas em climas quentes |
| 1,35 – 1,50 | 4% – 8% | Elevado | Regiões com irradiância muito alta (ex: Nordeste) |
| > 1,50 | > 8% | Excessivo | Requer justificativa técnica — risco de estresse térmico |

**Para o contexto amazônico / Norte do Brasil:** a alta temperatura ambiente reduz a potência real
dos módulos em até 15%. Ratios de 1,25–1,40 são frequentemente justificados para compensar.

---

## Curvas de Eficiência do Inversor

A eficiência do inversor **não é constante** — ela varia com o nível de carga. A curva típica:

```
Eficiência
    %
99 │         ╭────────────────────────────
98 │       ╭─╯
97 │     ╭─╯
96 │   ╭─╯
95 │  ╭╯
   └────────────────────────────→ Carga (% da potência nominal)
   0   10   20   30   50   75   100
```

A eficiência máxima ocorre entre 70% e 90% da carga nominal — não em plena carga.

**Implicação:** um inversor operando com oversize ratio = 1,25 passa mais horas no "sweet spot"
de eficiência (75%–90% de carga) do que um inversor sem oversizing. Isso pode aumentar a
eficiência média anual de conversão em 0,5%–1,5%.

---

## Métricas de Eficiência Ponderada

A eficiência máxima do datasheet é medida em laboratório e não reflete o uso real. Para comparar
inversores, usar eficiências ponderadas:

### Eficiência Europeia (Euro Efficiency)
Calibrada para climas com irradiância moderada e dias nublados frequentes.

```
η_euro = 0,03×η_5% + 0,06×η_10% + 0,13×η_20% + 0,10×η_30% + 0,48×η_50% + 0,20×η_100%
```

### Eficiência CEC (California Energy Commission)
Calibrada para climas de alta irradiância (ex: Nordeste brasileiro).

```
η_cec = 0,04×η_10% + 0,05×η_20% + 0,12×η_30% + 0,21×η_50% + 0,53×η_75% + 0,05×η_100%
```

### Eficiência Brasileira (Portaria 140/2022)
Privilegia os patamares de alta carga, refletindo a abundância solar do Brasil.

| Nível de Carga | Peso |
|---------------|------|
| 10% | 0,02 |
| 20% | 0,02 |
| 30% | 0,04 |
| 50% | 0,12 |
| 75% | 0,32 |
| 100% | 0,48 |

```
η_br = 0,02×η_10% + 0,02×η_20% + 0,04×η_30% + 0,12×η_50% + 0,32×η_75% + 0,48×η_100%
```

**Para o Kurupira:** ao exibir a eficiência de um inversor na proposta técnica, usar
**η_cec** para projetos no Norte/Nordeste e **η_euro** para projetos no Sul/Sudeste.

---

## Performance Ratio (PR) Decomposto

O PR não deve ser um valor fixo no Kurupira. Ele é calculado como produto de fatores:

```
PR = (1 - L_temp) × (1 - L_sombreamento) × (1 - L_sujeira)
   × (1 - L_mismatch) × (1 - L_cabos_dc) × (1 - L_inversor)
   × (1 - L_cabos_ac) × (1 - L_disponibilidade)
```

Valores de referência para projetos brasileiros sem sombreamento:

| Fator de Perda | Símbolo | Referência |
|---------------|---------|-----------|
| Temperatura | L_temp | Calculado pelo TempCoeff × (T_celula_media - 25) |
| Sombreamento | L_sombreamento | 0% – 15% (configurável por projeto) |
| Sujeira | L_sujeira | 2% – 5% (ajustável por frequência de limpeza) |
| Mismatch | L_mismatch | 1% – 3% |
| Cabos DC | L_cabos_dc | 1% – 2% (deve vir do cálculo de queda de tensão) |
| Inversor | L_inversor | 1 - η_ponderada |
| Cabos AC | L_cabos_ac | 0,5% – 1% |
| Disponibilidade | L_disponibilidade | 0,5% – 1% (manutenções, falhas) |

PR típico para instalações brasileiras bem dimensionadas: **0,75 – 0,82**

---

## Perda por Temperatura (L_temp) — Cálculo Mensal

A perda por temperatura não é constante ao longo do ano — varia conforme a temperatura média mensal.

```
T_celula_media_mensal = T_ambiente_media_mensal + (NOCT - 20) × (HSP_mensal / (HSP_mensal + 1))
L_temp_mensal = |TempCoeff_Pmax / 100| × max(0, T_celula_media_mensal - 25)
```

**Para o Kurupira:** o motor de simulação mensal (`generationSimulation.ts`) deve calcular
`L_temp` separadamente para cada mês, não usar um valor anual médio fixo.

---

## Topologias de Inversão: Quando Recomendar Cada Uma

### Inversor de String (padrão)
- Conversão centralizada, custo por watt mais baixo
- Adequado para telhados sem sombreamento, uma ou duas orientações
- Limitação: um MPPT por grupo de strings — mismatch entre orientações diferentes reduz yield

### Otimizadores de Potência (MLPE — Module Level Power Electronics)
- MPPT individual por módulo, conversão centralizada no string inverter
- Indicado para telhados com sombreamento parcial ou múltiplas orientações
- Performance Ratio superior em condições de perdas variáveis
- Custo adicional de 8%–15% sobre o sistema string padrão

### Microinversores (MLPE)
- Conversão CA diretamente no módulo — elimina alta tensão CC no telhado
- Nativamente compatível com Rapid Shutdown (NBR 17193)
- Indicado para residências com sombreamento severo ou restrições de segurança CC
- Custo mais elevado — justificado pela segurança e pelo ganho em sombreamento

### Inversor Híbrido
- Gerencia arranjo FV + banco de baterias + rede CA
- Distinção crítica: bateria de Alta Tensão (>100V, cabos finos, eficiência maior) vs.
  Baixa Tensão (48V, cabos grossos, mais modular)
- Verificar lista de baterias homologadas pelo fabricante do inversor (compatibilidade BMS)

**Para o Kurupira:** ao selecionar a topologia no `ComposerBlockArrangement`, exibir comparativo
de PR estimado e custo incremental entre string, otimizadores e microinversores para o perfil
de telhado do projeto.

---

## Cálculo de Energia Gerada (Motor de Simulação)

Fórmula base mensal para o Kurupira:

```
E_mensal (kWh) = P_pico_instalada (kWp) × HSP_mensal (h/dia) × dias_mes × PR_mensal
```

Incorporando o oversizing e o clipping:

```
P_efetiva_cc = min(P_cc_real_operacional, P_ca_nominal_inversor)
P_cc_real_operacional = P_pico_instalada × (1 - L_temp_mensal) × (1 - L_outras_perdas)
E_mensal = P_efetiva_cc × HSP_mensal × dias_mes × η_inversor_ponderada
```

**Transparência obrigatória na UI:** o Kurupira deve exibir cada variável deste cálculo de forma
visível e editável — o engenheiro não deve receber apenas o número final sem poder rastreá-lo.

---

## Degradação Anual

Módulos fotovoltaicos degradam ao longo do tempo. A projeção de geração para 25 anos deve incluir:

```
E_ano_n = E_ano_1 × (1 - taxa_degradacao_anual)^(n-1)
```

Taxa de degradação típica para módulos monopercslinos: 0,5% – 0,7% ao ano.
Garantia de potência linear dos fabricantes: geralmente 80% da potência nominal em 25 anos.

---

## O Que Implementar no Kurupira

### Módulo de Dimensionamento Econômico

```typescript
interface OversizingAnalysis {
  oversize_ratio: number;
  p_cc_kwp: number;
  p_ca_kw: number;
  clipping_loss_pct: number;        // % de energia anual perdida por clipping
  clipping_loss_kwh_year: number;
  eficiencia_media_anual: number;   // η ponderada pelo perfil de geração
  pr_calculado: number;             // PR decomposto
  e_gerada_ano1_kwh: number;
  e_gerada_25anos_kwh: number;      // com degradação anual
  justificativa_oversizing: string; // gerada automaticamente baseada nos inputs
}
```

### Alertas de Oversizing

| Condição | Tipo | Mensagem |
|----------|------|----------|
| ratio < 1,05 | INFO | "Inversor superdimensionado. Considere reduzir a potência CA ou adicionar módulos." |
| ratio 1,05–1,35 | OK | "Taxa CC/CA dentro da faixa ótima para este clima." |
| ratio 1,35–1,50 | AVISO | "Clipping estimado de {%}%. Verificar se o ganho de kWh compensa a perda no pico." |
| ratio > 1,50 | AVISO | "Oversize elevado. Verificar limite térmico do inversor para operação contínua em plena carga." |

---

## Referências

| Fonte | Relevância |
|-------|-----------|
| Portaria INMETRO 140/2022 | Eficiência ponderada brasileira — métrica obrigatória |
| Canal Solar — Oversizing e Clipping | Práticas de mercado brasileiro |
| PVGIS (API pública JRC) | Dados de irradiação horária TMY — alternativa superior ao CRESESB para simulação |
| IEC 61724-1 | Performance monitoring of PV systems — definição de PR |
