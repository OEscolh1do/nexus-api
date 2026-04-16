# CONTEXT.md — Sistema NEONORTE

> **Última Atualização:** 2026-04-16
> **Arquiteto:** Antigravity AI
> **Versão do Sistema:** 3.8.0 (Jornada do Integrador — Dashboard de Rigor Elétrico + MapCore Multi-Modo)

---

## 📋 VISÃO GERAL

**Neonorte** é um ecossistema **multi-serviço** para o setor de energia solar. O antigo monólito "Nexus" foi cisado em dois domínios autônomos, cada um com frontend + backend + schema MySQL dedicado, orquestrados por Docker Compose.

| Domínio | Codinome | Responsabilidade |
|---------|----------|-----------------| 
| **Gestão & CRM** | **Iaçã** | ERP, Leads, Pipeline, Finanças, Strategy, Operations, IAM |
| **Engenharia Solar** | **Kurupira** | Dimensionamento, Elétrico, Documentação, Proposta, Simulação |

---

## 🏗️ ARQUITETURA DE UI (v3.8.0)

O Kurupira opera como um **Dashboard de Engenharia de Alta Densidade**, onde cada aba da Jornada do Integrador exibe uma canvas view especializada sobreposta ao motor de mapas (Leaflet + WebGL).

### Paradigma Visual: Ferramenta de Engenharia ("Engineering Tool Aesthetic")
- **Geometria Reta**: Uso exclusivo de `rounded-sm`. Abolição total de `rounded-xl/2xl/3xl` em painéis.
- **Tipografia de Dados**: `font-mono` + `tabular-nums` em todos os valores elétricos e de consumo.
- **Gráficos Industriais**: Barras com `radius={0}` em todos os charts (Recharts), eixos em `font-mono`.
- **Color Coding Semântico Estrito** (7 famílias):
  - 🟠 **Consumo / Demanda**: `amber`, `orange`
  - 🔵 **Geração / Fontes / Equipamentos**: `sky`, `blue`, `cyan`
  - 🔴 **Perdas / Alertas / Falhas**: `red`, `fuchsia`
  - 🌡️ **Temperatura (ambiente / célula)**: `pink`, `rose`
  - ☀️ **Irradiância / GHI / DNI / HSP**: `yellow`, `lime`
  - 💧 **Umidade / Atmosfera / Vento**: `indigo`, `slate`/`zinc`
  - 🟣 **Arranjo Físico / Drawing mode**: `indigo` (contextual)

### Jornada do Integrador: Canvas Views sobrepostas ao MapCore

| FocusedBlock | Canvas View Ativa | Modo do MapCore |
|---|---|---|
| `null` / `map` | Mapa livre | `neutral` |
| `consumption` | `ConsumptionCanvasView` | — (overlay opaco) |
| `module` | Mapa + HUD placement | `placement` |
| `arrangement` | Mapa + HUD drawing | `drawing` |
| `inverter` | `ElectricalCanvasView` | — (overlay opaco) |
| `simulation` | `SimulationCanvasView` | — (overlay opaco) |

### MapCore: Modos de Operação (v3.8.0)
O `MapCanvasView` wrapper gerencia 3 modos contextuais derivados do `activeFocusedBlock`:
- **`placement`** (`module`): Ferramentas SELECT, PLACE_MODULE, MEASURE. Barra sky com contagem de módulos.
- **`drawing`** (`arrangement`): Ferramentas SELECT, POLYGON, MEASURE. Barra indigo + FDI. Auto-ativa POLYGON.
- **`neutral`** (default): Ferramentas SELECT, MEASURE. Barra slate com coordenadas.

### Workspace Tabs (Ordem na UI)
`Consumo → Módulos → Arranjo → Elétrica → Simulação → Mapa`

---

## 🏗️ INFRAESTRUTURA & STACK
[Mantido v3.5.0]

---

## 🧩 MÓDULOS POR DOMÍNIO

### Kurupira (Engenharia Solar) — `kurupira/`

| Módulo | Localização | Status |
|--------|------------|--------|
| Compositor Lego (UI/UX) | `frontend/src/modules/engineering/ui/panels/` | ✅ Operacional (v3.8) |
| MapCore Multi-Modo | `canvas-views/MapCanvasView.tsx` | ✅ v3.8.0 |
| Barra Contextual MapCore | `canvas-views/map/MapContextBar.tsx` | ✅ v3.8.0 |
| Dimensionamento (Elétrico) | `canvas-views/electrical/` | ✅ v3.7.0 |
| VoltageRangeChart (Multi-MPPT) | `canvas-views/electrical/VoltageRangeChart.tsx` | ✅ v3.7.0 |
| ConsumptionCanvasView | `canvas-views/ConsumptionCanvasView.tsx` | ✅ Engineering Aesthetic (v3.8) |
| Simulação Analítica | `frontend/src/modules/simulation/` | ✅ TRL 8 |
| Documentação (Memorial, ART) | `frontend/src/modules/documentation/` | 🚧 Refatorando |
| Proposta (Pricing, PDF) | `frontend/src/modules/proposal/` | ✅ Operacional |

---

## 🔄 CHANGELOG

### v3.8.0 (2026-04-16) — Jornada do Integrador: MapCore Multi-Modo + Consumption Refactor

- ✅ **MapCore Multi-Modo**: Criação do `MapCanvasView` wrapper com 3 modos (`placement`, `drawing`, `neutral`) derivados do `activeFocusedBlock`. Filtragem de HUD de ferramentas por modo, auto-ativação do POLYGON no modo drawing.
- ✅ **MapContextBar**: Nova barra de status contextual `h-8` inferior com métricas reativas por modo.
- ✅ **FocusedBlock `'arrangement'`**: Adicionado ao tipo `FocusedBlock` em `uiStore.ts`.
- ✅ **Aba "Arranjo"**: Adicionada ao `WorkspaceTabs` com ícone `Layers`.
- ✅ **CenterCanvas simplificado**: `MapPayload` inline substituído por `<MapCanvasView />`.
- ✅ **ConsumptionCanvasView Engineering Aesthetic**: Grid 75/25, rodapé com `tabular-nums`, `rounded-sm` global, CTA industrial.
- ✅ **ConsumptionChart**: Barras `radius={0}`, Tooltip industrial em `font-mono`, input `rounded-sm`.
- ✅ **ClimateCorrelationChart**: Fontes `font-mono` nos eixos; legendas column-style ao invés de pills.
- ✅ **SimulatedLoadsPanel**: Badges de perfil `rounded-sm` com borda semântica; form inline `grid-cols-12`; `tabular-nums` na coluna kWh.

### v3.7.0 (2026-04-15) — Rigor Paramétrico Elétrico + Multi-MPPT Termodinâmico

- ✅ **InverterState.snapshot**: Expandido com `maxInputVoltage`, `min/maxMpptVoltage`, `maxCurrentPerMPPT`.
- ✅ **useElectricalValidation**: Limites do snapshot do inversor; fallback `minHistoricalTemp` → `-5°C` (NEC 690.7).
- ✅ **ElectricalCanvasView**: Abolição de constantes hardcoded.
- ✅ **VoltageRangeChart Multi-MPPT**: Gantt Chart termodinâmico por MPPT. Tick de Voc vermelho ao ultrapassar limite.

### v3.6.0 (2026-04-14) — Operação Lego-Scratch (Interface Tátil)
[Mantido para histórico]

### v3.5.0 (2026-04-14) — Workspace TRL 7-8 & Advanced Simulation
[Mantido para histórico]

---

## 🔑 PADRÕES INEGOCIÁVEIS (Engineering Aesthetic Rules)

1. **Sem `rounded-xl/2xl/3xl`** em painéis estruturais. Apenas `rounded-sm` ou no máximo `rounded-md`.
2. **Todos os valores numéricos elétricos**: `font-mono tabular-nums`.
3. **Gráficos Recharts**: `radius={0}` em todas as barras. Grid `strokeDasharray="2 2"` em `#1e293b`.
4. **Tooltips**: `bg-slate-900 border border-slate-700 rounded-sm`, uppercase tracking-widest, mono font.
5. **Badges de status**: `border` semântica explícita (ex: `border-amber-500/20`) ao invés de `bg-opacity` isolado.
6. **MapCore**: NUNCA desmonta. Usa camadas de overlay (FrozenViewContainer) — jamais unmount/remount.
