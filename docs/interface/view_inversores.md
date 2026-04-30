# Mapa de Interface: View de Inversores (Electrical Dashboard)

Este documento descreve a arquitetura visual, hierarquia de componentes e fluxo de dados da aba **Inversores** (`ElectricalCanvasView.tsx`) do cockpit de engenharia do Kurupira. A view utiliza o padrão "Dashboard de Engenharia" de alta densidade estruturado em três níveis de informação (Tier 1/2/3).

## 1. Arquitetura Visual e Hierarquia de Componentes

```mermaid
graph TD
    subgraph Stores
        SS[SolarStore <br/> Clima, Módulos FV]
        TS[TechStore <br/> Topologia de Inversores]
        CS[CatalogStore]
    end

    subgraph ElectricalCanvasView [ElectricalCanvasView (Root)]
        IH[InverterHub <br/> Nível 1: Gestão de Inversores]
        MCS[MPPTConfigStrip <br/> Nível 2: Configuração de Strings]
        
        subgraph ContentArea [Nível 3: Área de Conteúdo]
            direction LR
            subgraph MainTabs [Visões Técnicas]
                VRC[VoltageRangeChart <br/> Aba: Tensão Térmica]
                OP[OversizingPanel <br/> Aba: FDI / Oversizing]
                STV[StringTopologyViewer <br/> Aba: Topologia]
            end
            ITP[InverterTechnicalProfile <br/> Ficha e Diagnósticos]
        end
    end

    SS -.->|Tmin, Tamb_max, totalKwpCC| ElectricalCanvasView
    TS -.->|techInverters, mpptConfigs| ElectricalCanvasView
    CS -.->|catalogInverters| ElectricalCanvasView

    ElectricalCanvasView --> IH
    ElectricalCanvasView --> MCS
    ElectricalCanvasView --> ContentArea
```

---

## 2. Descrição dos Componentes Principais

### Nível 1: `InverterHub`
Barra principal focada na gestão macro dos equipamentos de conversão de energia.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  INVERTER HUB (Nível 1)                                                                                 │
│  ╔════════╗  ┌──────────────────────────────────┐  ┌────────────────────────────────┐                  │
│  ║  ⚡    ║  │  P_CC          P_CA       FDI     │  │  DUAL-STATE COCKPIT            │                  │
│  ║ 2 INV  ║  │  ●  45.20 kWp  ●  30.0kW  126%   │  │  (Saldo de Módulos)            │                  │
│  ╚════════╝  └──────────────────────────────────┘  └────────────────────────────────┘                  │
│  [PREFIX]         [KPI PANEL]                            [MÓDULO COCKPIT]                               │
│                                                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐   ┌──────────────────────────────────┐  │
│  │ ● DEYE 15.0kW  X │  │ ● GROWATT 10kW X │  │ + INVERSOR ▾  │   │ ● Voc  ● Isc  ● FDI  ● MPPT    │  │
│  │   4 MPPT         │  │   2 MPPT         │  └───────────────┘   └──────────────────────────────────┘  │
│  └──────────────────┘  └──────────────────┘                          [KPI PILLS de SAÚDE ELÉTRICA]     │
│       [INVERTER CHIPS — Radio Group]           [+ Catálogo / .OND]                                     │
│ ════════════════════════════════════════════════════════════════════════════════════════════════════════ │
│                                        ← barra de aderência FDI (2px) →                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

*   **Inverter Chips:** Lista os inversores instanciados no projeto atual. Cada chip exibe o fabricante, modelo, potência e contagem de MPPTs. Atua como um rádio-button para o inversor "ativo".
*   **KPI Pills de Saúde Elétrica:** Exibe distintivos dinâmicos que informam o status crítico do inversor ativo:
    *   `FDI`: Relação Potência CC / CA (Muda de cor dependendo da faixa de oversizing).
    *   `Voc`: Tensão de Circuito Aberto sob frio extremo vs Limite do Inversor.
    *   `Isc`: Corrente de Curto-Circuito vs Limite por MPPT.
*   **Saldo de Módulos — Dual-State Cockpit:** Indicador vivo de progresso de alocação do inventário de módulos. Possui 3 estados distintos:

```
  ESTADO 1: PROGRESSO (Módulos pendentes de alocação)
  ┌──────────────────────────────────────────────────┐
  │  Alocados: 10               Restam: 10 ·(pulsa)· │
  │  ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← barra azul enchendo
  │            Orçado: 20 Módulos                     │
  └──────────────────────────────────────────────────┘

  ESTADO 2: CONCLUÍDO (100% alocado — Progressive Disclosure)
  ┌──────────────────────────────────────────────────┐
  │  ✓  100% ALOCADO (20)                            │  ← badge verde, sem ruído
  └──────────────────────────────────────────────────┘

  ESTADO 3: EXCESSO (orçamento ultrapassado — alerta crítico)
  ┌──────────────────────────────────────────────────┐
  │  ⚠ Orçamento Excedido          +5 Mód ·(pulsa)· │
  │  ████████████████████████████████████████████████│  ← barra vermelha + brilho
  └──────────────────────────────────────────────────┘
```

*   **Ações Globais:** Adicionar Inversor do Catálogo, importar arquivo do PVSyst (`.OND`) e um selo de Saúde Global (`globalHealth`) validado pelo `useElectricalValidation`.

---

### Nível 2: `MPPTConfigStrip`
Régua dinâmica contextual que reflete os dados do inversor ativo (selecionado no Hub).

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│  MPPT CONFIG STRIP — DEYE 15kW (ativo)                                                            │
│                                                                                                   │
│  ┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐               │
│  │  MPPT 1               │   │  MPPT 2               │   │  MPPT 3               │               │
│  │  ──────────────────── │   │  ──────────────────── │   │  ──────────────────── │               │
│  │  Mód/Str   [ 10 ▲▼]  │   │  Mód/Str   [ 12 ▲▼]  │   │  Mód/Str   [  0 ▲▼]  │               │
│  │  Nº Str    [  2 ▲▼]  │   │  Nº Str    [  1 ▲▼]  │   │  Nº Str    [  0 ▲▼]  │               │
│  │  ──────────────────── │   │  ──────────────────── │   │  ──────────────────── │               │
│  │  ✓ Voc OK   448V      │   │  ⚠ Voc ALTO  601V    │   │  — Sem strings        │               │
│  │  ✓ Isc OK  18.2A      │   │  ✓ Isc OK   9.1A     │   │                       │               │
│  └───────────────────────┘   └───────────────────────┘   └───────────────────────┘               │
│          [OK]                    [WARN → Scroll-to-Alert]              [IDLE]                     │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

*   **MPPT Cards:** Renderiza blocos para cada MPPT do inversor, permitindo a definição manual de:
    *   Quantidade de módulos em série por string.
    *   Número de strings em paralelo naquele MPPT.
*   **Feedback Instantâneo:** Mostra imediatamente se a tensão a frio (Voc) ou a corrente ultrapassam os limites físicos específicos daquele MPPT. Permite "Scroll-to-Alert" quando acionado pelo painel de diagnóstico.

---

### Nível 3: Área de Conteúdo Split

```
┌────────────────────────────────────────────────────────────────────────────┬──────────────────────┐
│  [Tensão Térmica] [FDI / Oversizing] [Topologia]                           │  InverterTechnical   │
│  ──────────────────────────────────────────────────────────────────────    │  Profile             │
│                                                                             │                      │
│  ABA: TENSÃO TÉRMICA                                                        │  DEYE SUN-15K        │
│                                                                             │  ─────────────────── │
│  Voc Frio  │ ████████████████████████░░░░  601V → ⚠ excede MPPT Max       │  Vmax:      1000V    │
│  Vmp Calor │ ███████████░░░░░░░░░░░░░░░░░  330V → ✓ acima MPPT Min        │  MPPT Min:   200V    │
│            │                                                                │  MPPT Max:   550V    │
│            │◄─ MPPT Min (200V) ──────── MPPT Max (550V) ──► VMax(1000V)   │  Imax/MPPT:   15A   │
│            └─────────────────────────────────────────────────────────      │  ─────────────────── │
│                                                                             │  ALERTAS DIAGNÓSTICO │
│  ABA: TOPOLOGIA                                                             │  ─────────────────── │
│                                                                             │  ⚠ MPPT 2: Voc Alto  │
│   [MOD]─[MOD]─[MOD]─ × 10                                                 │     601V > 550V      │
│      └──────────── String 1 ──┐                                            │     [→ Ir pro MPPT]  │
│   [MOD]─[MOD]─[MOD]─ × 10    ├── MPPT 1 ──── DEYE 15kW                   │                      │
│      └──────────── String 2 ──┘                                            │                      │
│                                                                             │                      │
│   [MOD]─[MOD]─[MOD]─ × 12 ──── String 1 ──── MPPT 2 ──── DEYE 15kW      │                      │
└────────────────────────────────────────────────────────────────────────────┴──────────────────────┘
```

#### Esquerda: Área Principal (Tabs)
Área de foco alternável baseada no tipo de análise de engenharia desejada.
1.  **Tensão Térmica (`VoltageRangeChart`):** Gráfico de barras horizontais que confronta as janelas de tensão do arranjo (Vmp Calor até Voc Frio) com a janela de operação do inversor (Min MPPT, Max MPPT, VMax Inversor).
2.  **FDI / Oversizing (`OversizingPanel`):** Painel focado na análise econômica e de *clipping* da taxa de carregamento CC/CA do inversor, considerando os perfis climáticos (UF).
3.  **Topologia (`StringTopologyViewer`):** Visão esquemática em diagrama de árvore ilustrando as conexões elétricas (Módulo → String → MPPT → Inversor).

#### Direita: `InverterTechnicalProfile`
Ficha técnica lateral (side-panel) e hub central de diagnósticos.
*   **Ficha Técnica:** Exibe as correntes, tensões de partida, modelo, fabricante e faixas nominais.
*   **Lista de Alertas Diagnósticos:** Consome o relatório do `useElectricalValidation`. Alertas como "Corrente Excedida" ou "Sobretensão" são renderizados aqui. Os alertas são interativos e executam rolagem para o `MPPTConfigStrip` problemático.

---

## 3. Dinâmica de Estado e Motores de Cálculo

### Validação Cruzada (Físico vs Elétrico vs Climático)
O Cockpit de Inversores é o ponto de encontro de três matrizes de dados independentes:
1.  **Matriz Climática (`SolarStore.clientData`):** A temperatura mínima recorde (`Tmin`) e máxima (`Tamb_max`) são herdadas da localização do projeto para aplicar correções de temperatura (Coeficiente de Temperatura).
2.  **Matriz Física (`SolarStore.modules`):** O módulo fotovoltaico definido na View de Módulos ("O representante" daquele arranjo) dita o Isc, Vmp e Voc base.
3.  **Matriz Elétrica (`TechStore`):** A quantidade de módulos *lógicos* amarrados nos MPPTs multiplicará as matrizes anteriores e as submeterá contra os limites físicos (*Hardware Limits*) definidos no Catálogo (`CatalogStore`).

### Tratamento de Falhas Regionais (Fallback)
O sistema aplica correções de segurança automáticas. Caso a geolocalização falhe em obter um `Tmin` exato, a constante `TMIN_POR_UF` injeta o pior cenário de frio histórico para o estado (ex: -5°C para o RS, +22°C para o AM), blindando o dimensionamento contra queima de inversores por excesso de `Voc` no inverno.

---
*Gerado e verificado via fluxos `Chain-of-Verification` e `Divine Triad Synergy`.*
