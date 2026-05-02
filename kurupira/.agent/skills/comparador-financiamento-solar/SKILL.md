---
name: comparador-financiamento-solar
description: >
  Especialista em estruturas de financiamento para sistemas fotovoltaicos no Brasil. Ative quando
  o Kurupira precisar comparar modalidades de aquisição (à vista vs. financiado vs. leasing),
  calcular o fluxo de caixa do cliente com e sem financiamento, modelar o efeito de alavancagem
  no ROE, demonstrar o conceito de "desembolso zero", gerar a tabela de opções de crédito solar
  (BNDES Finame, bancos privados, cooperativas), ou implementar o comparador financeiro na
  proposta. Integra-se ao roi-fotovoltaico para calcular ROE vs. ROI.
---

# Skill: Comparador de Financiamento Solar

Consultor de estrutura de capital para o módulo comercial do Kurupira.

---

## Por Que o Financiamento Transforma o ROI

O ROI padrão (roi-fotovoltaico) assume compra à vista — todo o CAPEX sai do bolso do cliente
no momento zero. Mas o financiamento muda a equação fundamentalmente:

**Lógica de alavancagem:**
- Se a TIR do projeto > taxa de juros do financiamento → o capital de terceiros aumenta o
  **Retorno sobre Capital Próprio (ROE)** do cliente
- Em muitos casos: parcela mensal ≈ economia na conta de luz → desembolso líquido ≈ zero

```
ROE (alavancado) > ROI (sem financiamento) quando TIR_projeto > taxa_juros_financiamento
```

---

## 1. Linhas de Crédito Disponíveis no Brasil

### 1.1 BNDES Finame Solar

- **Perfil:** Pessoa Jurídica (PJ), rural, cooperativas, condomínios
- **Prazo:** até 96 meses (8 anos)
- **Carência:** até 12 meses
- **Juros:** 0,9%–1,1% a.m. (taxa combinada BNDES + spread do agente)
- **Cobertura:** até 100% do equipamento homologado
- **Exigência crítica:** equipamentos devem constar no credenciamento do BNDES
  (módulos e inversores com índice de nacionalização ≥ 60% em conteúdo local)
- **Vantagem:** menor custo de capital disponível no mercado formal BR

### 1.2 Bancos Privados — Pessoa Física

- **Perfil:** residencial, microempreendedores
- **Prazo:** 24–84 meses
- **Juros:** 1,4%–2,2% a.m. (varia com score e relacionamento)
- **Aprovação:** digital, 24–72h
- **Documentação:** simplificada vs. BNDES
- **Vantagem:** agilidade; aceita equipamentos sem credenciamento específico

Principais operadores: BV Financeira (líder em solar PF), Santander Solar, Sicredi Energia,
Bradesco Solar, Caixa Econômica (programas específicos por estado)

### 1.3 Cooperativas de Crédito (Sicredi / Sicoob)

- **Perfil:** agronegócio, rural, associados
- **Prazo:** variável por cota
- **Juros:** negociados com relacionamento — frequentemente abaixo dos bancos privados
- **Carência:** até 6–12 meses (plantio, entressafra)
- **Vantagem:** flexibilidade no calendário de pagamento, sem burocracia BNDES

### 1.4 Leasing Operacional / Energia como Serviço (EaaS)

- **Modelo:** o integrador ou fundo detém o sistema; o cliente paga mensalmente pela energia
- **Custo para o cliente:** R$/kWh gerado (inferior à tarifa da concessionária)
- **CAPEX do cliente:** zero
- **Vantagem:** elimina risco de manutenção e substituição de equipamentos
- **Desvantagem:** cliente não é proprietário; sem benefício residual após o contrato

| Linha | Perfil | Juros Estimados (a.m.) | Prazo | Vantagem Principal |
|-------|--------|----------------------|-------|-------------------|
| BNDES Finame | PJ / Rural | 0,9%–1,1% | até 96 meses | Menor custo do mercado |
| Bancos Privados PF | Pessoa Física | 1,4%–2,2% | 24–84 meses | Aprovação rápida |
| Cooperativas | Agronegócio | Variável | Flexível | Carência e relacionamento |
| EaaS / Leasing | Qualquer | N/A (R$/kWh) | 10–20 anos | CAPEX zero para o cliente |

---

## 2. Cálculo do Fluxo de Caixa com Financiamento

### 2.1 Parcela Mensal (Price / SAC)

**Sistema Price (parcelas fixas):**
```
PMT = CAPEX_financiado × [i × (1+i)^n] / [(1+i)^n − 1]
```

Onde:
- `CAPEX_financiado` = CAPEX_total − entrada (% do cliente)
- `i` = taxa de juros mensal (ex: 0,012 para 1,2% a.m.)
- `n` = número de parcelas

**Sistema SAC (amortização constante — comum no BNDES):**
```
Amortizacao_mensal = CAPEX_financiado / n
Juros_mes_k = saldo_devedor_k × i
Parcela_mes_k = Amortizacao_mensal + Juros_mes_k  (decrescente)
```

### 2.2 Fluxo de Caixa do Cliente (Perspectiva Mensal)

```
FC_cliente_mes = Economia_energia_mes − Parcela_financiamento_mes

Desembolso_liquido = max(0, Parcela − Economia)
                   = 0 em cenário de "desembolso zero"
```

**Condição de desembolso zero:**
```
Economia_mes_1 ≥ PMT_mes_1
```

Essa condição depende de:
1. Economia gerada no mês 1 (proporcional ao CAPEX e à tarifa)
2. Prazo e taxa do financiamento

### 2.3 ROE (Retorno sobre Capital Próprio)

```
ROE = TIR calculada apenas sobre o capital próprio investido

Fluxo_ROE:
  t=0: −Entrada (% do CAPEX que o cliente pagou à vista)
  t=1..n: FC_liquido_t − Parcela_financiamento_t
  t=n+1..25: FC_liquido_t (sem parcela — quitado)
```

O ROE frequentemente supera 30%–50% a.a. em projetos com financiamento de baixo custo e
alta tarifa local — muito superior ao ROI do projeto sem alavancagem.

---

## 3. Análise de "Desembolso Zero"

O argumento comercial mais poderoso do setor solar:

> "Você começa a economizar no primeiro mês — a parcela é paga pela própria conta de luz."

### Verificação Rigorosa

O Kurupira deve calcular se o desembolso zero é real ou uma simplificação enganosa:

```typescript
interface DesembolsoZeroAnalysis {
  parcela_mensal: number;           // R$ — PMT do financiamento
  economia_mes_1: number;          // R$ — economia real no primeiro mês
  desembolso_liquido_mes_1: number; // R$ — parcela − economia (positivo = gasto real)
  meses_ate_desembolso_zero: number; // meses até economia ≥ parcela
  // (por causa da inflação tarifária, chega um ponto onde economia > parcela)
  economias_anos: { ano: number; economia_anual: number; parcelas_anuais: number }[];
}
```

**Casos reais:**
- Tarifa 0,90 R$/kWh + financiamento 1,1% a.m. + sistema bem dimensionado: desembolso zero
  real desde o mês 1
- Tarifa 0,60 R$/kWh + financiamento 1,8% a.m. + sistema superdimensionado: desembolso
  positivo nos primeiros 6–12 meses até a tarifa inflar suficientemente

---

## 4. Comparativo À Vista vs. Financiado

### Exemplo Ilustrativo

| Parâmetro | À Vista | Financiado (BNDES) | Financiado (Privado) |
|-----------|---------|-------------------|---------------------|
| CAPEX | R$ 80.000 | R$ 80.000 | R$ 80.000 |
| Entrada | R$ 80.000 | R$ 8.000 (10%) | R$ 0 |
| Capital próprio em risco | R$ 80.000 | R$ 8.000 | R$ 0 |
| Juros pagos total | R$ 0 | R$ ~14.000 | R$ ~32.000 |
| VPL (capital próprio) | R$ 45.000 | R$ ~39.000 | R$ ~18.000 |
| ROI (sobre CAPEX total) | 16% a.a. | 16% a.a. | 16% a.a. |
| **ROE (sobre capital próprio)** | **16% a.a.** | **~42% a.a.** | **∞ (sem capital)** |
| Payback (fluxo do cliente) | 7 anos | 3 anos (liquidação) | 0 (parcela = economia) |

*O VPL absoluto cai com o financiamento (juros são um custo), mas o ROE dispara.*

---

## 5. Quando Recomendar Cada Estrutura

| Perfil do Cliente | Recomendação | Justificativa |
|------------------|-------------|---------------|
| PJ com acesso ao BNDES | BNDES Finame | Menor custo de capital — maximiza ROE |
| PF com score aprovado | Banco Privado (BV/Santander) | Agilidade — proposta pode ser fechada em 24h |
| Produtor rural / cooperado | Sicredi/Sicoob | Carência alinhada à safra |
| Cliente sem acesso a crédito | EaaS / Aluguel Solar | CAPEX zero — economia imediata |
| PF/PJ com caixa disponível | À Vista | Maximiza VPL absoluto; sem risco de juros |
| Projeto de grande porte (MW) | Project Finance + BNDES | Estrutura específica com SPE e garantias reais |

---

## 6. O Que Implementar no Kurupira

### Interface do Motor de Financiamento

```typescript
interface FinanciamentoInput {
  capex_total: number;
  percentual_entrada: number;           // 0.0 – 1.0 (ex: 0.10 = 10% de entrada)
  taxa_juros_mensal: number;            // ex: 0.012 para 1,2% a.m.
  prazo_meses: number;                  // ex: 60
  carencia_meses?: number;              // meses sem amortização (apenas juros)
  sistema_amortizacao: 'PRICE' | 'SAC';
  roi_inputs: SolarROIInputs;           // da skill roi-fotovoltaico
}

interface FinanciamentoOutput {
  parcela_mensal: number;               // R$ — Price ou parcela inicial SAC
  total_juros_pagos: number;            // R$ — custo total do crédito
  fluxo_cliente_mensal: FluxoClienteMes[];
  desembolso_zero_analise: DesembolsoZeroAnalysis;
  roe: number;                          // % a.a. — sobre capital próprio
  roi_sem_financiamento: number;        // % a.a. — referência à vista
  comparativo: ComparativoFinanciamento;
}

interface FluxoClienteMes {
  mes: number;
  economia_energia: number;            // R$
  parcela: number;                     // R$
  fc_liquido: number;                  // R$ = economia − parcela
  saldo_devedor: number;               // R$ — apenas para SAC
}

interface ComparativoFinanciamento {
  opcoes: {
    nome: string;                      // ex: 'À Vista', 'BNDES Finame', 'Banco Privado'
    taxa_mensal: number;
    prazo_meses: number;
    entrada_requerida: number;         // R$
    parcela_mensal: number;            // R$
    total_juros: number;               // R$
    roe: number;                       // % a.a.
    meses_desembolso_zero: number;     // -1 se nunca atingir
  }[];
}
```

### Alertas e Validações

| Condição | Tipo | Mensagem |
|----------|------|---------|
| Parcela > economia mês 1 | INFO | "Desembolso inicial de R$ {valor}/mês. Em {meses} meses a economia cobre a parcela integralmente." |
| Taxa_juros > TIR_projeto | AVISO | "Taxa de financiamento supera a TIR do projeto. Financiamento reduz o retorno — avaliar se vale alavancar." |
| ROE > 35% a.a. | DESTAQUE | "Alta alavancagem financeira: ROE de {%} a.a. sobre o capital próprio investido." |
| BNDES disponível para o perfil | INFO | "Este projeto se qualifica para BNDES Finame. Taxa estimada de {%} a.m. — solicitar orçamento." |
| Prazo_financiamento > 7 anos | ATENÇÃO | "Prazo longo aumenta o custo total de juros. Avaliar quitação antecipada após o payback." |

### Exibição na Proposta Kurupira

A seção financeira da proposta deve apresentar **três colunas lado a lado**:

```
┌─────────────────┬──────────────────┬──────────────────┐
│   Compra à Vista│   BNDES Finame   │   Banco Privado  │
├─────────────────┼──────────────────┼──────────────────┤
│ Entrada: 100%   │ Entrada: 10%     │ Entrada: 0%      │
│ Parcela: —      │ Parcela: R$ xxx  │ Parcela: R$ xxx  │
│ ROI: 16% a.a.   │ ROE: 42% a.a.   │ ROE: muito alto  │
│ Payback: 7 anos │ Payback efetivo: │ Payback: 0 meses │
│                 │ 3 anos           │ (desembolso zero)│
└─────────────────┴──────────────────┴──────────────────┘
```

---

## Referências

| Fonte | Relevância |
|-------|-----------|
| BNDES Finame | Critérios de elegibilidade e taxas vigentes |
| BV Financeira Solar | Taxas e prazos para PF — maior operador do segmento |
| Sicredi Energia | Linhas para agronegócio e cooperados |
| BC — Calculadora do Cidadão | Validação de PMT e SAC para qualquer taxa |
| ABINEE — Custo de financiamento solar | Pesquisa setorial de acesso a crédito |
