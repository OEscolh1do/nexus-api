# Mapa de Interface — Dimensionamento (Workspace de Engenharia)

> **Objetivo**: Estabelecer terminologia unificada entre engenheiro e agente.  
> Cada elemento é descrito com seu **nome canônico**, **localização**, **função** e **componente React** correspondente.

---

## Visão Geral do Layout

```
┌──────────────────────────────────────────────────────────┐
│                     TOP RIBBON                           │
├──────────┬──────────────────────────┬────────────────────┤
│          │                          │                    │
│   LEFT   │      CENTER CANVAS       │      RIGHT         │
│ OUTLINER │(Mapa, Simulação, Site...)│    INSPECTOR       │
│          │                          │    (Minimapa)      │
│          │                          ├────────────────────┤
│          │                          │   PROPERTIES       │
│          │                          │   DRAWER (*)       │
├──────────┴──────────────────────────┴────────────────────┤
└──────────────────────────────────────────────────────────┘

(*) O Properties Drawer aparece sobre o Inspector quando um elemento é selecionado.
```

---

## 1. TOP RIBBON (Barra de Comandos)

> **Componente**: `TopRibbon.tsx`  
> **Função**: Barra horizontal fixa no topo. Acesso O(1) aos comandos globais do workspace.

### 1.1 Setor Esquerdo — Navegação e Contexto

| # | Nome Canônico | Ícone | Função |
|---|--------------|-------|--------|
| 1.1.1 | **Botão Voltar ao Hub** | `LayoutDashboard` | Retorna ao Explorador de Projetos (Hub) |
| 1.1.2 | **Botão Cliente** | `User` | Abre o Modal de Dados do Cliente (nome, cidade, lat/lng, consumo) |
| 1.1.3 | **Toggle Outliner** | `PanelLeftClose` / `PanelLeftOpen` | Mostra/oculta o painel LeftOutliner |
| 1.1.4 | **Toggle Inspector** | `PanelRightClose` / `PanelRightOpen` | Mostra/oculta o painel RightInspector |

### 1.2 Setor Central — Widgets de KPI

| # | Nome Canônico | Métrica | Descrição |
|---|--------------|---------|-----------|
| 1.2.1 | **Widget Potência DC** | `kWp` | Soma da potência pico de todos os módulos do projeto |
| 1.2.2 | **Widget FDI** | `DC/AC ratio` | Fator de Dimensionamento do Inversor (razão potência DC / potência AC nominal). Ideal: 1.0–1.3x |
| 1.2.3 | **Widget Performance** | `PR %` | Performance Ratio — rendimento líquido após todas as perdas |

### 1.3 Setor Direito — Validação e Ações

| # | Nome Canônico | Função |
|---|--------------|--------|
| 1.3.1 | **Diretrizes de Projeto** | Popover com contagem mínima de módulos para atingir meta, área e peso no telhado |
| 1.3.2 | **Fluxo de Aprovação** | Dropdown com estados `Rascunho (Destravado)` e `Aprovado (Travado)` |
| 1.3.3 | **Desfazer / Refazer** | Undo/Redo via Zundo temporal store. Atalhos: `Ctrl+Z` / `Ctrl+Shift+Z` |
| 1.3.4 | **Exportar API** | Captura o viewport, salva o design no backend e redireciona ao módulo de Proposta |

---

## 2. LEFT OUTLINER (Árvore de Topologia)

> **Componente**: `LeftOutliner.tsx`  
> **Função**: Visualizar e gerenciar a hierarquia elétrica do sistema fotovoltaico.

### Estrutura da Árvore

```
📂 Topologia
├── ⚡ Inversor PHB35KS-MT (1x)
│   ├── 🔌 MPPT 1
│   │   ├── 🔗 String 1 (12 módulos)
│   │   └── 🔗 String 2 (12 módulos)
│   ├── 🔌 MPPT 2
│   └── …
├── 📦 Módulos (DMEGC 610W) — 24 unid.
└── 📍 Áreas (Telhado Norte) — 3 polígonos
```

### 2.1 Cabeçalho

| # | Nome Canônico | Função |
|---|--------------|--------|
| 2.1.1 | **Título "Topologia"** | Identificação do painel como árvore de componentes |
| 2.1.2 | **Botão Adicionar Inversor** | Abre o `InverterCatalogDialog` — catálogo visual de inversores do banco |
| 2.1.3 | **Botão Adicionar Módulo** | Abre o `ModuleCatalogDialog` — catálogo visual de módulos do banco |

### 2.2 Nós da Árvore

| Tipo de Nó | Ícone | Selecionável | Arrastável | Excluível | Duplicável |
|-----------|-------|:----------:|:---------:|:--------:|:---------:|
| **Inversor** | `Cpu` | ✅ | ❌ | ✅ | ✅ (`Ctrl+D`) |
| **MPPT** | `Cable` | ✅ | ❌ | ❌ | ❌ |
| **String** | `Link2`/`Unlink` | ✅ | ✅ | ❌ | ❌ |
| **Módulo** (catálogo) | `Package` | ✅ | ❌ | ✅ | ❌ |
| **Área** (telhado) | `MapPin` | ✅ | ❌ | ❌ | ❌ |
| **Módulo Colocado** | `Sun` | ✅ | ✅ | ❌ | ❌ |

---

## 3. CENTER CANVAS (Views Dimensionais)

> **Componente**: `CenterCanvas.tsx` -> injeta dinamicamente as **CanvasViews** via arquitetura polimórfica (Slot Vazio Polimórfico).
> **Função**: Área vital de renderização principal (~70% da tela). Trânsito entre visualização gráfica (Mapa 2D/3D) e Dashboards de Engenharia sem desmontar contextos subjacentes.

O `CenterCanvas` hospeda painéis analíticos robustos, eliminando as antigas tabs estreitas do `RightInspector`.

### 3.1 Arquitetura Geográfica (`MapCore.tsx`)
A visão nativa. Motor híbrido Leaflet (2D) + WebGL/React Three Fiber (3D).
*   **Floating Map Tools (Toolbar CAD)**: Esquerda. Polígono, Régua, Módulos (UX-003).
*   **Camadas**: Mapa Base, Polígonos, Módulos 3D (R3F).
*   *Nota*: No modo Portal (quando outra view assume o canvas), o MapCore é minimizado e teletransportado para o `RightInspector`.

### 3.2 Dossiê de Implantação (`SiteCanvasView.tsx`)
Substitui o antigo painel lateral "Site". Foco: Inteligência Local.
*   **V-Card Identificação**: Cliente, Contrato, Conexão e Distribuidora.
*   **Weather Dashboard**: Widgets estéticos de Clima (Temperatura Média Anual, Janela Solar, Umidade) consumidos da API de irradiação.
*   **Prancheta Geo**: Coordenadas exatas e Checklist rápido de "Restrições de Telhado".

### 3.3 Dashboard de Simulação Energética (`SimulationCanvasView.tsx`)
Painel em 3-faixas semânticas que substitui o antigo gráfico lateral (UX-005 a UX-009).
*   **Faixa 1 — Visão Geral & Guia de Dimensionamento (KPIs)**: Pílulas de consumo, geração, cobertura e potência mínima baseada na resolução normativa ANEEL.
*   **Faixa 2 — Tabs Analíticas**: Exibe **apenas um** gráfico por vez: `Composição` (BarChart Mensal W-Full), `Cumulativo` (AreaChart balanço anual), `Curva Diária` (Bell curve paramétrica baseada na temperatura e HSP), `Tabela`.
*   **Faixa 3 — Acordeão Colapsável**: Grid de inputs mensais (HSP CRESESB e Consumo Faturado) + Motor "Waterfall de Perdas". Mantido oculto por padrão.

### 3.4 Laboratório Elétrico (`ElectricalCanvasView.tsx`)
Foco: Dimensionamento paramétrico de proteção e condutores.
*   **Queda de Tensão AC**: Parametrizador de cabos elétricos (bitola, distância, corrente) e indicador termodinâmico de risco de queda.
*   **Mock Termodinâmico Voc**: Gráfico visual iterativo demonstrando o aumento da tensão de circuito aberto (Voc) operando no inverno (`minHistoricalTemp`) guiado pelas normas de limite (NEC 690.7).

---

## 4. RIGHT INSPECTOR (Painel de Propriedades e Teleporte)

> **Componente**: `RightInspector.tsx`  
> **Função**: Relegado especificamente para gerenciar interações e abrigar o Portal do Minimapa, sem menus poluentes. A estrutura de pilhas foi substituída pelos novos Canvas (UX-004 e UX-008). 

### 4.1 Minimapa (Portal Docking)
*   **Target Div**: Receptáculo do evento `createPortal`. Minimiza o mapa inteiro do CanvasCenter para manter a ciência posicional espacial quando se navega pelos Dashboards (Ex: `SimulationCanvasView`).
*   **Poka-Yoke Inercial**: Eventos limitam pans aleatórios quando o mapa está ancorado aqui, retornando-o a res. Total ao apertar `[↗]`.

---

## 5. PROPERTIES DRAWER (Gaveta de Propriedades)

> **Componente**: `PropertiesDrawer.tsx` → `InverterProperties`, `ModuleProperties`, `StringProperties`
> **Função**: UI Interativa e flutuante ancorada à direita (acima do Minimapa). Renderiza apenas quando um componente elétrico físico é ativo na árvore Tópica (LeftOutliner) ou no Mapa Base.

| Componente Alvo | Dados Críticos Apresentados |
|-----------------|---------------------------|
| **Inversor** | V_max ENTRADA, limites MPPT e Tensão em tempo real dos rastreadores. |
| **Módulos** | Dimensões Físicas X/Y, Specs térmicas, Voc/STC, Corrente Imp. | 
| **Strings** | Gráficos visuais (VoltageRangeChart) avaliando limiar DC Input X MPPT range, advertências de Clipping e contagem limitante. |

---

## 6. DIÁLOGOS MODAIS

### 6.1 InverterCatalogDialog
Catálogo visual de inversores disponíveis. O engenheiro filtra (Trifásico/Monofásico, Range Potência, Marca) e adiciona ao TopOutline. Modela `InverterState`.

### 6.2 ModuleCatalogDialog
Catálogo visual de painéis de captação. Similar na UI. Importante para o mock do "Area calculation" baseado em suas dimensões `x, y`.

### 6.3 ClientDataModal
Formulário inicial. Define a cidade do projeto -> Aciona Fetch Cresesb (HSP/Irradiação) -> Injeta em `SimulationCanvasView`.

---

## Glossário de Termos Técnicos

| Termo | Sigla | Significado |
|-------|-------|-------------|
| **kWp** | — | Kilowatt-pico. Potência máxima DC do conjunto de módulos em condições STC |
| **FDI** | — | Fator de Dimensionamento do Inversor. Razão entre potência DC e potência AC nominal |
| **PR** | — | Performance Ratio. Rendimento global do sistema compensando o "Waterfall de Perdas"|
| **HSP** | — | Hora Solar Pico. Irradiação diária equivalente em kWh/m²/dia (CRESESB) |
| **MPPT** | — | Maximum Power Point Tracker. Canais lógicos de input do inversor |
| **Voc** | — | Tensão Aberta. Cuidado redobrado atrelado a coeficientes Frios (NEC 690.7) |
| **STC** | — | Standard Test Conditions (25°C, 1000 W/m², AM 1.5) |
