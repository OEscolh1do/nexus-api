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
│ OUTLINER │       (Mapa + WebGL)     │    INSPECTOR       │
│          │                          │                    │
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

### 1.2 Setor Central — Paleta de Ferramentas

| # | Nome Canônico | Atalho | Função |
|---|--------------|--------|--------|
| 1.2.1 | **Ferramenta Selecionar** | `V` | Cursor padrão. Seleciona elementos no mapa e na árvore |
| 1.2.2 | **Ferramenta Polígono** | `P` | Desenha polígonos de telhado sobre o mapa (GeoJSON) |
| 1.2.3 | **Ferramenta Medir** | `M` | Mede distância entre dois pontos no mapa |
| 1.2.4 | **Ferramenta Módulos** | `L` | Posiciona módulos fotovoltaicos sobre polígonos de telhado |

### 1.3 Setor Centro-Direita — Widgets de KPI

| # | Nome Canônico | Métrica | Descrição |
|---|--------------|---------|-----------|
| 1.3.1 | **Widget Potência DC** | `kWp` | Soma da potência pico de todos os módulos do projeto |
| 1.3.2 | **Widget FDI** | `DC/AC ratio` | Fator de Dimensionamento do Inversor (razão potência DC / potência AC nominal). Ideal: 1.0–1.3x |
| 1.3.3 | **Widget Performance** | `PR %` | Performance Ratio — rendimento líquido após todas as perdas |

### 1.4 Setor Direito — Validação e Ações

| # | Nome Canônico | Função |
|---|--------------|--------|
| 1.4.1 | **Diretrizes de Projeto** | Popover com contagem mínima de módulos para atingir meta, área e peso no telhado |
| 1.4.2 | **Health Check** | Indicador de saúde do sistema (verde/amarelo/vermelho pulsante). Popover detalha: FDI, Voc, Isc e sincronia físico-lógica |
| 1.4.3 | **Fluxo de Aprovação** | Dropdown com estados `Rascunho (Destravado)` e `Aprovado (Travado)`. Aprovação com erros elétricos exige confirmação |
| 1.4.4 | **Desfazer / Refazer** | Undo/Redo via Zundo temporal store. Atalhos: `Ctrl+Z` / `Ctrl+Shift+Z` |
| 1.4.5 | **Exportar API** | Captura o viewport, salva o design no backend e redireciona ao módulo de Proposta |

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

### 2.3 Interações

| Ação | Trigger | Efeito |
|------|---------|--------|
| Click | Nó da árvore | Seleciona o elemento → abre Properties Drawer à direita |
| Right-click | Nó inversor/módulo | Menu de contexto com "Duplicar" e "Deletar" |
| `Delete` / `Backspace` | Nó selecionado | Remove o inversor/módulo selecionado |
| `Ctrl+D` | Nó inversor selecionado | Duplica o inversor com nova ID e MPPTs vazios |
| Hover | Botão lixeira (inline) | Aparece ícone de delete ao lado do nó |
| Drag & Drop | String → MPPT | Reatribui uma string para outro MPPT |

---

## 3. CENTER CANVAS (Viewport de Mapa)

> **Componente**: `CenterCanvas.tsx` + `MapCore.tsx` + `WebGLOverlay.tsx`  
> **Função**: Área de renderização principal (~70% da tela). Motor híbrido Leaflet (2D) + WebGL (3D).

### 3.1 Camadas

| # | Nome Canônico | Motor | Função |
|---|--------------|-------|--------|
| 3.1.1 | **Mapa Base** | Leaflet (OpenStreetMap/Satélite) | Navegação geográfica, zoom, pan |
| 3.1.2 | **Polígonos de Telhado** | Leaflet Polygons | Áreas desenhadas pelo engenheiro representando seções do telhado |
| 3.1.3 | **Módulos Colocados** | Leaflet Markers / Canvas | Painéis fotovoltaicos posicionados sobre os polígonos |
| 3.1.4 | **WebGL Overlay** | React Three Fiber (R3F) | Camada 3D transparente sobre o mapa — visualização avançada futura |

### 3.2 HUDs Flutuantes

| # | Nome Canônico | Posição | Função |
|---|--------------|---------|--------|
| 3.2.1 | **Indicador de Ferramenta** | Inferior esquerdo | Mostra a ferramenta ativa com ícone e label |
| 3.2.2 | **Gráfico de Tensão (Voltage Range Chart)** | Inferior centro | Aparece quando uma String é selecionada. Mostra Vmp, Voc e limites MPPT |

---

## 4. RIGHT INSPECTOR (Painel de Dados e Configurações)

> **Componente**: `RightInspector.tsx`  
> **Função**: Exibe dados contextuais do projeto (sempre visível) e controles de engenharia.

### 4.1 Seção: Cliente

| # | Nome Canônico | Dados |
|---|--------------|-------|
| 4.1.1 | **Nome** | Nome do cliente (injetado via Modal ou M2M) |
| 4.1.2 | **Cidade** | Município e estado |
| 4.1.3 | **Endereço** | Logradouro completo |

### 4.2 Seção: Localização

| # | Dado | Formato |
|---|------|---------|
| 4.2.1 | **Latitude** | Graus decimais (ex: -6.0723°) |
| 4.2.2 | **Longitude** | Graus decimais (ex: -49.9128°) |
| 4.2.3 | **Área Disponível** | Metros quadrados (m²) |

### 4.3 Seção: Clima

| # | Dado | Fonte |
|---|------|-------|
| 4.3.1 | **Temperatura Média** | API climática ou manual |
| 4.3.2 | **Fonte dos Dados** | Label da estação meteorológica |
| 4.3.3 | **Local** | Nome da estação de referência |

### 4.4 Seção: Geração vs Consumo

| # | Nome Canônico | Tipo | Descrição |
|---|--------------|------|-----------|
| 4.4.1 | **Gráfico de Barras** | Recharts BarChart | 12 barras (uma por mês) comparando consumo (laranja) × geração estimada (turquesa) |
| 4.4.2 | **Cobertura (%)** | Badge | Percentual de cobertura da geração sobre consumo |
| 4.4.3 | **Consumo Médio** | Label | kWh/mês médio calculado das faturas |
| 4.4.4 | **Geração Estimada** | Label | kWh/mês estimado via `kWp × HSP × 30 × PR` |

### 4.5 Seção: FDI (Micro-Dashboard)

| # | Nome Canônico | Descrição |
|---|--------------|-----------|
| 4.5.1 | **Percentual FDI** | Razão DC/AC × 100 (ex: 113.5%) |
| 4.5.2 | **Status Badge** | "Ideal" (verde), "Oversized AC" (amarelo) ou "Clipping Anual" (vermelho) |

### 4.6 Seção: Energia (Consumo)

| # | Nome Canônico | Descrição |
|---|--------------|-----------|
| 4.6.1 | **Grid Mensal** | 12 campos editáveis (Jan–Dez) com consumo em kWh/mês |
| 4.6.2 | **Consumo Calculado** | Média dos 12 meses |
| 4.6.3 | **Tarifa R$/kWh** | Valor da tarifa de energia |

### 4.7 Seção: Irradiação CRESESB (HSP)

| # | Nome Canônico | Descrição |
|---|--------------|-----------|
| 4.7.1 | **Seletor de Cidade** | Dropdown com cidades do banco CRESESB |
| 4.7.2 | **Grid Mensal HSP** | 12 valores de Hora Solar Pico (kWh/m²/dia) por mês |
| 4.7.3 | **Média Anual** | Média das 12 leituras de HSP |
| 4.7.4 | **Fonte** | Nome da cidade/estação selecionada |

### 4.8 Seção: Perdas do Sistema

| # | Nome Canônico | Key (store) | Default | Tipo | Descrição |
|---|--------------|-------------|---------|------|-----------|
| 4.8.1 | **Orientação** | `orientation` | 3.0% | Perda | Desvio do azimute ideal |
| 4.8.2 | **Inclinação** | `inclination` | 4.0% | Perda | Desvio da inclinação ideal (latitude) |
| 4.8.3 | **Sombreamento** | `shading` | 3.0% | Perda | Sombras próximas (árvores, chaminés) |
| 4.8.4 | **Horizonte** | `horizon` | 2.0% | Perda | Sombreamento do horizonte distante |
| 4.8.5 | **Temperatura** | `temperature` | 4.4% | Perda | Aquecimento das células |
| 4.8.6 | **Sujeira** | `soiling` | 5.0% | Perda | Acúmulo de poeira e detritos |
| 4.8.7 | **Mismatch** | `mismatch` | 1.5% | Perda | Diferença de potência entre módulos |
| 4.8.8 | **Cabos CC** | `dcCable` | 0.5% | Perda | Queda de tensão em cabos DC |
| 4.8.9 | **Cabos CA** | `acCable` | 1.0% | Perda | Queda de tensão em cabos AC |
| 4.8.10 | **Eficiência Inv.** | `inverterEfficiency` | 98.0% | Eficiência | Rendimento de conversão DC→AC |

> **Controle**: Cada perda tem um **input numérico** (controle primário, clicável) e um **slider** (ajuste rápido). `Enter` confirma. `onFocus` seleciona tudo.

| # | Nome Canônico | Descrição |
|---|--------------|-----------|
| 4.8.R | **Botão Reset** | Restaura todas as perdas aos valores default |
| 4.8.PR | **Badge PR** | Performance Ratio calculado em tempo real a partir das perdas. Cor: verde (≥80%), azul (75-80%), amarelo (<75%) |

### 4.9 Seção: Termodinâmica Local

| # | Nome Canônico | Key (store) | Range | Descrição |
|---|--------------|-------------|-------|-----------|
| 4.9.1 | **Temperatura Mínima Histórica** | `minHistoricalTemp` | -20°C a 30°C | Menor temperatura registrada na região. Afeta cálculo de Voc máximo (NEC 690.7) |
| 4.9.2 | **Coeficiente de Voc** | `vocTempCoefficient` | -0.5 a 0 %/°C | Coeficiente térmico de tensão de circuito aberto do módulo |

---

## 5. PROPERTIES DRAWER (Gaveta de Propriedades)

> **Componente**: `PropertiesDrawer.tsx` → delega para sub-componentes por tipo  
> **Função**: Aparece sobre o Inspector quando um elemento é selecionado no Outliner ou no Canvas.

### 5.1 Propriedades do Inversor

> **Componente**: `InverterProperties.tsx`

| # | Nome Canônico | Dado | Origem |
|---|--------------|------|--------|
| 5.1.1 | **Fabricante** | ex: "PHB Solar" | `solarStore.inverter.manufacturer` |
| 5.1.2 | **Modelo** | ex: "PHB35KS-MT" | `solarStore.inverter.model` |
| 5.1.3 | **Potência** | ex: "35kW" | `solarStore.inverter.nominalPower` |
| 5.1.4 | **Eficiência** | ex: "98.6%" | `solarStore.inverter.maxEfficiency` |
| 5.1.5 | **Conexão** | "Trifásico" | `solarStore.inverter.connectionType` |
| 5.1.6 | **V máx. entrada** | ex: "800V" | `solarStore.inverter.maxInputVoltage` |
| 5.1.7 | **V mín. entrada** | ex: "200V" | `solarStore.inverter.minInputVoltage` |
| 5.1.8 | **I máx. entrada** | ex: "30A" | `solarStore.inverter.maxInputCurrent` |
| 5.1.9 | **V saída** | ex: "220V" | `solarStore.inverter.outputVoltage` |
| 5.1.10 | **I máx. saída** | ex: "96A" | `solarStore.inverter.maxOutputCurrent` |
| 5.1.11 | **Quantidade** | Editável | `solarStore.inverter.quantity` |
| 5.1.12 | **Painel MPPT** | Cards por MPPT | `useTechStore.mpptConfigs[]` |

### 5.2 Propriedades do Módulo

> **Componente**: `ModuleProperties.tsx`

| # | Nome Canônico | Dado |
|---|--------------|------|
| 5.2.1 | **Fabricante** | "DMEGC" |
| 5.2.2 | **Modelo** | "DM610G12RT-B66HSW" |
| 5.2.3 | **Potência** | "610 Wp" |
| 5.2.4 | **Eficiência** | "22.6%" |
| 5.2.5 | **Dimensões** | "2382×1134×30mm" |
| 5.2.6 | **Peso** | "32.3 kg" |
| 5.2.7 | **Quantidade** | Editável |
| 5.2.8 | **Parâmetros Elétricos** | Vmp, Imp, Voc, Isc |

### 5.3 Propriedades da String

> **Componente**: `StringProperties.tsx`

| # | Nome Canônico | Dado |
|---|--------------|------|
| 5.3.1 | **Inversor vinculado** | Modelo do inversor pai |
| 5.3.2 | **MPPT** | Número do MPPT |
| 5.3.3 | **Módulos/String** | Contagem de módulos em série |
| 5.3.4 | **Status elétrico** | OK / Warning / Error (Voc, Isc) |

---

## 6. DIÁLOGOS MODAIS

### 6.1 InverterCatalogDialog

> **Componente**: `InverterCatalogDialog.tsx`  
> **Função**: Catálogo visual de inversores disponíveis no banco de dados. O engenheiro filtra e adiciona ao projeto.

| # | Filtro | Tipo |
|---|--------|------|
| 6.1.1 | **Busca por modelo** | Texto livre |
| 6.1.2 | **Potência mín/máx** | Range numérico (kW) |
| 6.1.3 | **Marca** | Select com brands do banco |
| 6.1.4 | **Fase** | Monofásico / Trifásico |
| 6.1.5 | **MPPTs mínimos** | Numérico |

### 6.2 ModuleCatalogDialog

> **Componente**: `ModuleCatalogDialog.tsx`  
> **Função**: Catálogo visual de módulos fotovoltaicos disponíveis.

### 6.3 ClientDataModal

> **Componente**: `ClientDataModal.tsx`  
> **Função**: Formulário de dados do cliente (nome, endereço, localização, consumo médio, tarifa).

---

## Glossário de Termos Técnicos

| Termo | Sigla | Significado |
|-------|-------|-------------|
| **kWp** | — | Kilowatt-pico. Potência máxima DC do conjunto de módulos em condições STC |
| **FDI** | — | Fator de Dimensionamento do Inversor. Razão entre potência DC e potência AC nominal |
| **PR** | — | Performance Ratio. Rendimento global do sistema (0-100%) |
| **HSP** | — | Hora Solar Pico. Irradiação diária equivalente em kWh/m²/dia |
| **MPPT** | — | Maximum Power Point Tracker. Circuito do inversor que otimiza a extração de energia |
| **Voc** | — | Tensão de Circuito Aberto. Tensão máxima do módulo (sem carga) |
| **Vmp** | — | Tensão no Ponto de Máxima Potência |
| **Isc** | — | Corrente de Curto-Circuito. Corrente máxima do módulo |
| **Imp** | — | Corrente no Ponto de Máxima Potência |
| **NEC 690.7** | — | Norma americana para cálculo de tensão máxima considerando temperatura |
| **CRESESB** | — | Centro de Referência para Energia Solar e Eólica (base de dados de irradiação) |
| **STC** | — | Standard Test Conditions (25°C, 1000 W/m², AM 1.5) |
