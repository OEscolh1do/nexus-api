# CONTEXT.md — Sistema NEONORTE

> **Última Atualização:** 2026-04-14
> **Arquiteto:** Antigravity AI
> **Versão do Sistema:** 3.8.0 (Operação Stack Dinâmica — Acordeão & Respiro)

---

## 📋 VISÃO GERAL

**Neonorte** é um ecossistema **multi-serviço** para o setor de energia solar. O antigo monólito "Nexus" foi cisado em dois domínios autônomos, cada um com frontend + backend + schema MySQL dedicado, orquestrados por Docker Compose.

| Domínio | Codinome | Responsabilidade |
|---------|----------|-----------------|
| **Gestão & CRM** | **Iaçã** | ERP, Leads, Pipeline, Finanças, Strategy, Operations, IAM |
| **Engenharia Solar** | **Kurupira** | Dimensionamento, Elétrico, Documentação, Proposta, Simulação |

---

## 🏗️ ARQUITETURA DE UI (v3.8.0)

O Kurupira evoluiu para uma interface de **Composição Tátil**, focada em um fluxo de trabalho sequencial e utilitário, com uma base de design focada estritamente em **Engineering Tool Aesthetic**.

### Paradigma Visual: Ferramenta de Engenharia ("Engineering Tool Esthetic")
A interface transitou de um modelo arredondado / gamificado ("B2C") para uma densidade e retilinidade dignas de softwares pro B2B (CAD/BIM).
- **Geometria Reta**: Uso primário de \`rounded-sm\` a \`rounded-md\`. Abolição do \`rounded-3xl\` em painéis estruturais.
- **Micro-Bordas e Menos Sombra**: Substituição de \`shadow-2xl\` amplas por \`border-slate-700/80\` bem marcadas, provendo limite claro de dados.
- **Glassmorphism Otimizado**: Mantido apenas o estritamente necessário para integração com o canvas de mapa do fundo, eliminando _glows neons_ excessivos.
- **Tipografia de Dados (Mono)**: Amplo uso de fontes monoespaçadas (tabular numbers) para alinhamento rápido de variáveis elétricas.
- **Color Coding Semântico Estrito**: 
  - 🔵 **Consumo / Demanda**: Tons de Azul (`sky`, `blue`, `cyan`).
  - 🟠 **Geração / Fontes / Equipamentos**: Tons de Laranja/Âmbar (`amber`, `orange`).
  - 🟢 🟣 **Métricas / Fatores / Destaques Especiais**: Tons de Verde (`emerald`, `teal`) e Roxo (`purple`, `violet`).
  - ⚫ **Matriz Neutra & Profundidade (Grays/Slates)**:
    - **Slate-950 / Black**: Fundo primário do canvas e áreas de vácuo.
    - **Slate-900 / 800**: Superfícies de painéis, sidebars e containers estruturais.
    - **Slate-700 / 600**: Divisores, bordas de componentes e estados inativos/hover.
    - **Slate-400 / 300**: Tipografia de dados secundários e rótulos de unidade (kW, V, A).
    - **Slate-100 / White**: Texto de leitura primária e valores de alta prioridade.

### Paradigma de Composição: Stack Dinâmica (Accordion)
O **LeftOutliner** evoluiu de uma pilha estática para uma **Stack Dinâmica de Contexto**:
- **Dynamic Accordion**: Apenas o bloco focado exibe detalhes completos; blocos inativos colapsam para barras de resumo minimalistas com KPIs essenciais.
- **Lego Gap Architecture**: Substituição do encaixe flush por um espaçamento de `gap-1.5`, provendo o "respiro" visual necessário para clareza mental.
- **FlowConnectors (Pontes)**: Conectores físicos que bridgeiam os gaps entre módulos, simbolizando a transmissão de energia e dados.
- **Cascata Progressiva**: Blocos subsequentes iniciam como `LockedBlock` (flutuantes e esmaecidos) e "encaixam" apenas quando o predecessor é validado.
- **Fluxo Crítico**: Consumo (Sky) → Módulos (Amber) → Inversor (Emerald) → Projeção (Teal/Amber) → Proposta (Indigo).

### Orquestração de Painéis
- **MenuBar CAD Style**: Top Ribbon com menus clássicos (Arquivo, Editar, Exibir, Projeto) e widgets de saúde sistêmica (Health Check).
- **Bottom Workspace Tabs**: Navegação "Excel-style" para alternar rapidamente entre Views do CanvasCenter (`Mapa`, `Simulação`, `Elétrica`).
- **CenterCanvas Permanente**: O motor gráfico (Leaflet + WebGL) nunca desmonta, servindo de portal para o minimapa quando outras views estão ativas.

---

## 📐 REGRAS DE DOMÍNIO & ENGENHARIA

### Premissas Financeiras (Tarifação e Net Metering)

#### **Taxa Fixa (Custo de Disponibilidade)**
Regulamentada pela **ANEEL (Resolução Normativa n° 1000/2021)**, representa o valor mínimo faturável para cobrir a infraestrutura da rede.
- **Natureza**: Cobrança obrigatória, independente de haver consumo ou geração no período.
- **Impacto no Solar**: O sistema fotovoltaico pode reduzir a fatura de energia, mas nunca abaixo desse patamar mínimo.
- **Valores por Padrão de Entrada**:
  - 🏠 **Monofásico**: 30 kWh
  - 🏠🏠 **Bifásico**: 50 kWh
  - 🏭 **Trifásico**: 100 kWh

---

## 🏗️ INFRAESTRUTURA & STACK
[Mantido v3.5.0]

---

## 🧩 MÓDULOS POR DOMÍNIO

### Kurupira (Engenharia Solar) — `kurupira/`

| Módulo | Localização | Status |
|--------|------------|--------|
| Compositor Lego (UI/UX) | `frontend/src/modules/engineering/ui/panels/` | ✅ Operacional (v3.6) |
| Dimensionamento (Inventário) | `frontend/src/modules/engineering/` | ✅ Operacional (v3.6) |
| Simulação Analítica | `frontend/src/modules/simulation/` | ✅ Operacional (TRL 8) |
| Documentação (Memorial, ART) | `frontend/src/modules/documentation/` | 🚧 Refatorando |
| Proposta (Pricing, PDF) | `frontend/src/modules/proposal/` | ✅ Operacional |

---

## 🔄 CHANGELOG

### v3.8.0 (2026-04-25) — Operação Stack Dinâmica & Respiro

- ✅ **Foco Contextual (Accordion)**: Implementação de expansão/colapso automático baseado no foco do usuário, reduzindo a carga cognitiva.
- ✅ **Lego Gap Architecture**: Introdução de espaçamento controlado entre módulos com redesenho dos conectores para funcionarem como "pontes" físicas.
- ✅ **Summary Mode**: Criação de visualizações minimalistas para blocos não focados, mantendo KPIs críticos sempre visíveis (kWp, kWh, Status).
- ✅ **Refinamento de Densidade**: Aumento de paddings internos e unificação de layouts de instrumentos para máxima legibilidade.

### v3.7.0 (2026-04-15) — Pivot para "Engineering Tool Aesthetic"

- ✅ **Pivô de Design**: Transbordo da estética gamificada/arredondada para uma vertente **Engineering Tool** séria, com arestas finas, grids densamente preenchidos e hierarquia B2B pro CAD.
- ✅ **ConsumptionCanvasView Premium**: Refatoração da view de consumo para input rigoroso com pílulas tabulares e redução expressiva de margens de respiro c/ foco "Above the fold".
- ✅ **Z-Index Master Control**: Centralização assertiva do `z-index` flutuante para blindar colisão com canvas nativos (Leaflet `400~1000`).
- ⏳ **Arranjo Físico Deferido**: Módulo de desenho de arranjo físico ocultado da UI e removido como gate de progressão; será reativado em fase posterior.

### v3.6.0 (2026-04-14) — Operação Lego-Scratch (Interface Tátil)

- ✅ **Compositor Lego (LeftOutliner):** Reescrita do painel esquerdo para modelo de blocos interconectados. Implementação de `LegoTab` e `LegoNotch` via SVG Puzzle-shapes.
- ✅ **Máquina de Estados Visual:** Sistema de ativação em cascata (Consumo → Módulos → Inversor) com estados `LockedBlock` (fantasmas desencaixados).
- ✅ **Aesthetics Engine (Scratch-style):** Introdução de cores saturadas sólidas (amber, sky, emerald), `inset shadow` para profundidade 3D e animações `lego-snap` (overshoot spring).
- ✅ **Refatoração de Mapas de Interface:** Criação de `docs/interface/mapa-left-outliner.md` e atualização completa do `mapa-dimensionamento.md` eliminando terminologia de "Árvore de Topologia".
- ✅ **Z-Index & Overlap Control:** Gestão física de camadas para garantir que os conectores (tabs) se sobreponham visualmente aos blocos de baixo sem frestas.

### v3.5.0 (2026-04-14) — Workspace TRL 7-8 & Advanced Simulation
[Mantido para histórico]

---
[Restante do arquivo preservado...]
