# CONTEXT.md — Kurupira (Motor de Engenharia Solar)

> **Última Atualização:** 2026-05-11
> **Arquiteto:** Antigravity AI
> **Versão do Sistema:** 0.9.1-beta.1 (Engineering Cockpit v3 & Regulatory Specs)

---

## 📋 VISÃO GERAL

**Kurupira** é o motor de engenharia solar do ecossistema Neonorte. Opera como um **Dashboard de Engenharia de Alta Densidade**, onde cada aba da Jornada do Integrador exibe uma Canvas View especializada sobreposta ao motor de mapas (Leaflet + WebGL).

| Aspecto | Detalhe |
|---------|---------|
| **Papel** | Dimensionamento, Elétrico, Documentação, Proposta, Simulação |
| **Usuários** | Engenheiros integradores (assinantes da plataforma) |
| **Porta Backend** | 3002 |
| **Porta Frontend** | 5173 (dev) |

---

## 🏗️ STACK

### Frontend
- **Framework**: Vite + React + TypeScript
- **Mapa**: Leaflet + react-leaflet
- **Gráficos**: Recharts
- **Estado**: Zustand + Zundo (undo/redo)
- **Canvas 3D**: Three.js / R3F (módulo arranjo)
- **Estilo**: Tailwind CSS (dark-mode exclusivo)

### Backend
- **Runtime**: Node.js (CommonJS)
- **Framework**: Express
- **ORM**: Prisma (db_kurupira)
- **Auth**: Logto SSO (OIDC/PKCE) com validação JWKS estrita (ES384/RS256). Fallbacks locais removidos.
- **M2M**: Logto Client Credentials (OAuth2).
- **Governança**: Zero-Trust (O acesso do Kurupira exige registro prévio validado no `db_sumauma`).

---

## 🏗️ ARQUITETURA DE UI (v6.0.0)

### Paradigma Visual: Engineering Cockpit (Single-Column)
- **Full Center Canvas**: Abandono do modelo de sidebars fixas (RightInspector). O workspace opera em uma coluna única de alta largura, priorizando o viewport técnico.
- **Navegação Vertical (Tabs v6.0)**: Indicadores de seleção movidos para a lateral (vertical 3px) das abas, reforçando a estética de "IDE Profissional".
- **Geometria Reta**: Uso exclusivo de `rounded-sm`. Abolição total de `rounded-xl/2xl/3xl` em painéis.
- **Tipografia de Dados**: `font-mono` + `tabular-nums` em todos os valores elétricos e de consumo.
- **Gráficos Industriais**: Barras com `radius={0}` em todos os charts (Recharts), eixos em `font-mono`.

### Matriz de Cores Semântica (v3.8.1)
Para garantir contraste (WCAG AA) em Dark Mode (`slate-950`), utilizamos o sistema **10-20-400**:

| Família | Uso | Surface (10%) | Border (20%) | Text (400) |
|:---|:---|:---|:---|:---|
| 🔵 **Sky** | Consumo/Carga | `sky-900/10` | `sky-500/20` | `sky-400` |
| 🟠 **Amber** | Geração/Módulos | `amber-900/10` | `amber-500/20` | `amber-400` |
| 🟢 **Emerald** | Eficiência/OK | `emerald-900/10` | `emerald-500/20` | `emerald-400` |
| 🌡️ **Rose** | Temperatura | `rose-900/10` | `rose-500/20` | `rose-400` |
| 🟣 **Violet** | Drawing/Arranjo | `violet-900/10` | `violet-500/20` | `violet-400` |
| ☀️ **Yellow** | Irradiância (HSP) | `yellow-900/10` | `yellow-500/20` | `yellow-400` |
| 🔴 **Red** | Erros/Críticos | `red-900/20` | `red-500/30` | `red-400` |

### Jornada do Integrador: Canvas Views sobrepostas ao MapCore

| FocusedBlock | Canvas View Ativa | Modo do MapCore |
|---|---|---|
| `null` / `map` | Mapa livre | `neutral` |
| `consumption` | `ConsumptionCanvasView` | — (overlay opaco) |
| `module` | Mapa + HUD placement | `placement` |
| `inverter` | `ElectricalCanvasView` | — (overlay opaco) |
| `simulation` | `SimulationCanvasView` | — (overlay opaco) |

### MapCore: Modos de Operação (v3.8.0)
O `MapCanvasView` wrapper gerencia 3 modos contextuais derivados do `activeFocusedBlock`:
- **`placement`** (`module`): Ferramentas SELECT, PLACE_MODULE, MEASURE. Barra sky com contagem de módulos.
- **`drawing`** (`arrangement`): Ferramentas SELECT, POLYGON, MEASURE. Barra indigo + FDI. Auto-ativa POLYGON.
- **`neutral`** (default): Ferramentas SELECT, MEASURE. Barra slate com coordenadas.

### Workspace Tabs (Ordem na UI)
`Consumo → Módulos → Elétrica → Simulação → Mapa`

---

## 📍 MARCADOR PADRONIZADO (Neonorte Standard Marker)

O Pin de localização é o elemento central de ancoragem visual e interatividade espacial.

- **Componente Visual**: `NeonorteMarkerUI.tsx` (CSS Puro + Anéis de Radar).
- **Wrapper Leaflet**: `ProjectSiteMarker.tsx` (Integração com `solarStore` e `uiStore`).
- **Comportamento**:
  - **Hub/Explorer**: Renderizado como overlay estático (`size="sm"`, pulse desativado).
  - **Workspace/Maps**: Atua como gatilho de foco. Ao clicar, executa `selectEntity('site', ...)` e `setFocusedBlock('site')`.
  - **Tooltip**: Estética Industrial (Slate 950, 95% opacidade, font-mono, border semântica Emerald).

---

## 🧩 MÓDULOS

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
| Auditoria Elétrica (NBR 16690) | `canvas-views/electrical/` | ✅ Specs 01, 02, 04, 05 |
| Proposta (Pricing, PDF) | `frontend/src/modules/proposal/` | ✅ Operacional |

---

## 🔑 PADRÕES INEGOCIÁVEIS (Engineering Aesthetic Rules)

1. **Sem `rounded-xl/2xl/3xl`** em painéis estruturais. Apenas `rounded-sm` ou no máximo `rounded-md`.
2. **Todos os valores numéricos elétricos**: `font-mono tabular-nums`.
3. **Gráficos Recharts**: `radius={0}` em todas as barras. Grid `strokeDasharray="2 2"` em `#1e293b`.
4. **Tooltips**: `bg-slate-900 border border-slate-700 rounded-sm`, uppercase tracking-widest, mono font.
5. **Badges de status**: `border` semântica explícita (ex: `border-amber-500/20`) ao invés de `bg-opacity` isolado.
6. **MapCore**: NUNCA desmonta. Usa camadas de overlay (FrozenViewContainer) — jamais unmount/remount.
7. **Rigor Decimal**: Todos os valores numéricos técnicos (kWp, kWh, V, A, W, R$) apresentados em blocos, painéis HUD e tabelas **devem ter exatamente 2 casas decimais** (`.toFixed(2)`), garantindo a estética de precisão. Valores de porcentagem podem ser inteiros se a variância for baixa.
8. **Scrollbars Ghost**: Devem ter largura de **6px**, acabamento em **slate-800** sobre fundo transparente. Tornam-se visíveis apenas quando necessário para reduzir ruído visual. O utilitário `.scrollbar-hide` deve ser usado para ocultar a barra mantendo a funcionalidade de scroll quando o design exigir.
9. **Rigor de Tipografia e Acessibilidade**:
   - **Micro (`text-[11px]`)**: Limite mínimo absoluto. Uso restrito a badges, unidades (W, V, A) e legendas de gráficos.
   - **Small (`text-xs` / 12px)**: Padrão para labels de formulário, títulos de mini-cards e metadados secundários.
   - **Base (`text-sm` / 14px)**: Padrão para dados de engenharia principais, valores numéricos em HUDs e corpo de texto.
   - **Contraste**: Labels secundárias sobre `bg-slate-950` devem usar no mínimo `text-slate-400`. Nunca usar `slate-500/600` para textos informativos essenciais.
10. **Escalas Climáticas Adaptativas (Amplitude Mínima)**: Para evitar gráficos "tendenciosos" e manter a honestidade de engenharia em diferentes latitudes (ex: Norte vs Sul do Brasil), eixos de clima devem impor uma amplitude mínima:
    - **Temperatura**: Span mínimo de **15°C**.
    - **HSP**: Span mínimo de **3.0**.
    - Se a variação real for menor que o span mínimo, os dados devem ser centralizados no eixo, garantindo que pequenas flutuações não pareçam mudanças drásticas.
11. **Caixas de Diálogo e Intertravamentos (Engineering Modals)**: Abandono de pop-ups centrais B2C flutuantes (Portals).
    - **Contexto**: Alertas críticos devem ser `In-Canvas Overlays` (`absolute inset-0` dentro do painel que sofre a alteração), mantendo o foco do usuário no módulo afetado.
    - **Visual Sóbrio e Glassmorphism**: Caixa de aviso centralizada com fundo escuro (`bg-slate-900`), `backdrop-blur-md`, e borda de precisão (`ring-1 ring-white/10`). Abolição de efeitos "gamer" ou cores super-saturadas globais.
    - **Mini-Diff (Visual Impact Indicator)**: Substituir parágrafos longos por comparativos visuais rápidos (ex: Mini-Histogramas/Sparklines mostrando "Antes vs Depois") para acelerar a decisão do engenheiro.
    - **Comandos**: Botões com estética utilitária. O botão de ação primária (override) deve ter fundo/borda sutis indicando a intenção técnica (ex: `bg-sky-500/5 border-sky-500/30`).

---

## 🚀 INFRAESTRUTURA DE PRODUÇÃO (VPS)

| Componente | Detalhe |
|:---|:---|
| **OS** | Debian 13 (Trixie) - VPS Locaweb |
| **Domínio Principal** | `neonorte-ywara.tech` |
| **URL App** | `https://kurupira.neonorte-ywara.tech` |
| **URL API** | `https://kurupira.neonorte-ywara.tech/api` |
| **Orquestração** | Docker Compose (Backends) + Nginx Host (Proxy/SSL) |
| **SSL** | Certbot (Let's Encrypt) |

---

## 🔄 CHANGELOG

### v0.9.1-beta.1 (2026-05-11) — Engineering Cockpit v3: Regulatory & Orientation Sync
- ✅ **Spec-05 (Fusíveis gPV)**: Cálculo automático e memorial de fusíveis de string (NBR 16690).
- ✅ **Spec-04 (Queda de Tensão CC)**: Cálculo em tempo real de ΔV% por string com inputs de bitola e distância.
- ✅ **Spec-01 (MPPT Ocioso)**: Visibilidade de alocação (X/N MPPTs) e badges de sub-dimensionamento reativos no Hub.
- ✅ **Spec-02 (Azimute Mismatch)**: Detecção de sistemas multi-orientados e mismatch de azimute entre MPPTs.
- ✅ **Universal Geometry**: Migração de Azimute/Inclinação para o `EngineeringSlice` (Projeto Global) com herança por exceção nos MPPTs.

### v0.9.0-beta.2 (2026-05-11) — Catalog Integrity Refactor
- ✅ **DB Defaults**: Implementação de `@default` no schema Prisma para `unifilarSymbolRef`, garantindo integridade sem dependência de lógica na UI.
- ✅ **Migration Strategy**: Sincronização completa de schemas entre Kurupira Core e Sumaúma BFF.

### v0.9.0-beta.1 (2026-05-10) — SemVer Alignment
- ✅ **Versionamento Semântico**: Realinhamento da versão do Kurupira de `6.0.2` para `0.9.0-beta.1`, refletindo corretamente o status de desenvolvimento (Beta) e quebras de API ainda ocorrendo.

### v6.0.1 (2026-05-07) — OIDC Logout Fix

- ✅ **Logout Normalization**: Definição explícita de `postLogoutRedirectUri` no `LogtoConfig` apontando para `window.location.origin`.
- ✅ **SignOut Refactor**: Chamadas de `logtoSignOut()` agora utilizam a configuração padrão do provider para evitar erros de registro de URI no Logto Cloud.

### v6.0.0 (2026-05-07) — Engineering Cockpit: Unified High-Density Navigation

- ✅ **Full Center Canvas**: Remoção definitiva do `RightInspector` e sidebars fixas para maximizar o viewport.
- ✅ **Navigation v6.0**: Introdução de indicadores verticais laterais (3px indigo glow) nas abas de jornada.
- ✅ **Standardized Properties**: Refatoração de `ModuleProperties` e `InverterProperties` para alta densidade técnica.
- ✅ **Stability**: Correção de erros de sintaxe JSX e avisos de dimensões do Recharts.

### v3.9.0 (2026-05-04) — Produção: VPS Deployment + Recharts Fix

- ✅ **Build de Produção**: Resolvida falha de resolução do `react-is` no build do Vite/Rollup (dependência do Recharts).
- ✅ **Nginx Host Proxy**: Migração do Gateway Docker para Nginx nativo no host para suporte otimizado a SSL/Certbot.
- ✅ **Variáveis de Ambiente**: Padronização da `VITE_API_URL` apontando para o endpoint HTTPS de produção.
- ✅ **Segurança**: Bloqueio de login root via SSH e ativação de firewall UFW.

### v3.8.1 (2026-04-18) — Refatoração Radical de Consumo + UI Ghost Scrollbars

- ✅ **Consumo Full-Width**: Remoção da sidebar 75/25 na view de consumo. HUD de kWp Alvo movido para o header.
- ✅ **Premises Bar**: Centralização de todas as variáveis de estudo (Ligação, Tarifa, Média, Crescimento) em uma única barra horizontal.
- ✅ **Ghost Scrollbars**: Implementação global de barras de rolagem minimalistas (6px, slate-800) para redução de ruído visual.
- ✅ **Cleanup**: Remoção do componente redundante `ClimateCorrelationChart.tsx`.
- ⏳ **Arranjo Físico Deferido**: Módulo de desenho de arranjo físico ocultado da UI e removido como gate de progressão; será reativado em fase posterior.

### v3.8.0 (2026-04-16) — Jornada do Integrador: MapCore Multi-Modo + Consumption Refactor

- ✅ **MapCore Multi-Modo**: Criação do `MapCanvasView` wrapper com 3 modos (`placement`, `drawing`, `neutral`) derivados do `activeFocusedBlock`.
- ✅ **MapContextBar**: Nova barra de status contextual `h-8` inferior com métricas reativas por modo.
- ✅ **FocusedBlock `'arrangement'`**: Adicionado ao tipo `FocusedBlock` em `uiStore.ts`.
- ✅ **Aba "Arranjo"**: Adicionada ao `WorkspaceTabs` com ícone `Layers`.
- ✅ **ConsumptionCanvasView Engineering Aesthetic**: Grid 75/25, rodapé com `tabular-nums`, `rounded-sm` global, CTA industrial.
- ✅ **ConsumptionChart**: Barras `radius={0}`, Tooltip industrial em `font-mono`, input `rounded-sm`.

### v3.7.0 (2026-04-15) — Rigor Paramétrico Elétrico + Multi-MPPT Termodinâmico

- ✅ **InverterState.snapshot**: Expandido com `maxInputVoltage`, `min/maxMpptVoltage`, `maxCurrentPerMPPT`.
- ✅ **useElectricalValidation**: Limites do snapshot do inversor; fallback `minHistoricalTemp` → `-5°C` (NEC 690.7).
- ✅ **ElectricalCanvasView**: Abolição de constantes hardcoded.
- ✅ **VoltageRangeChart Multi-MPPT**: Gantt Chart termodinâmico por MPPT. Tick de Voc vermelho ao ultrapassar limite.
