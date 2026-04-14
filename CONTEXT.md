# CONTEXT.md — Sistema NEONORTE

> **Última Atualização:** 2026-04-14
> **Arquiteto:** Antigravity AI
> **Versão do Sistema:** 3.6.0 (Operação Lego-Scratch — Compositor de Engenharia de Alta Tactilidade)

---

## 📋 VISÃO GERAL

**Neonorte** é um ecossistema **multi-serviço** para o setor de energia solar. O antigo monólito "Nexus" foi cisado em dois domínios autônomos, cada um com frontend + backend + schema MySQL dedicado, orquestrados por Docker Compose.

| Domínio | Codinome | Responsabilidade |
|---------|----------|-----------------|
| **Gestão & CRM** | **Iaçã** | ERP, Leads, Pipeline, Finanças, Strategy, Operations, IAM |
| **Engenharia Solar** | **Kurupira** | Dimensionamento, Elétrico, Documentação, Proposta, Simulação |

---

## 🏗️ ARQUITETURA DE UI (v3.6.0)

O Kurupira evoluiu para uma interface de **Composição Tátil**, inspirada em Scratch (linguagem de blocos) e Tinkercad, focada em fluxo de trabalho sequencial e "Poka-Yoke" visual.

### Paradigma de Composição: Pilha Lego
O **LeftOutliner** não é mais uma árvore hierárquica, mas um **Compositor de Blocos Intertravados**:
- **Tactilidade Visual**: Blocos com conectores SVG puzzle (Tab/Notch), sombras 3D de profundidade e cores saturadas (Lego-style).
- **Cascata Progressiva**: Blocos subsequentes iniciam como `LockedBlock` (flutuantes e esmaecidos) e "encaixam" (`animate-lego-snap`) apenas quando o predecessor é validado.
- **Fluxo Crítico**: Consumo (Âmbar) → Módulos (Cyan) → Inversor (Esmeralda).

### Orquestração de Painéis
- **MenuBar CAD Style**: Top Ribbon com menus clássicos (Arquivo, Editar, Exibir, Projeto) e widgets de saúde sistêmica (Health Check).
- **Bottom Workspace Tabs**: Navegação "Excel-style" para alternar rapidamente entre Views do CanvasCenter (`Mapa`, `Simulação`, `Elétrica`).
- **CenterCanvas Permanente**: O motor gráfico (Leaflet + WebGL) nunca desmonta, servindo de portal para o minimapa quando outras views estão ativas.

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
