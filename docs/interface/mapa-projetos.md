# Mapa de Interface — Projetos (Hub / Explorador de Projetos)

> **Objetivo**: Estabelecer terminologia unificada entre engenheiro e agente.  
> Cada elemento é descrito com seu **nome canônico**, **localização**, **função** e **componente React** correspondente.

---

## Visão Geral do Layout

```
┌──────────────────────────────────────────────────────────┐
│                    HEADER STRIP                          │
│  [Título + Contagem]                  [+ Novo Projeto]   │
│  [🔍 Campo de Busca]                    [⚙ Filtros]     │
│  [chips: Todos | Rascunho | Em Progresso | Revisão | …]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│      ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐ │
│      │ Card 1  │  │ Card 2  │  │ Card 3  │  │Card 4  │ │
│      │         │  │         │  │         │  │        │ │
│      └─────────┘  └─────────┘  └─────────┘  └────────┘ │
│      ┌─────────┐  ┌─────────┐                           │
│      │ Card 5  │  │ Card 6  │          …                │
│      └─────────┘  └─────────┘                           │
│                                                          │
│                 GRID DE PROJETOS                         │
│              (scroll vertical infinito)                  │
└──────────────────────────────────────────────────────────┘
```

---

## 1. HEADER STRIP (Barra Superior)

> **Componente**: `ProjectExplorer.tsx` (inline)  
> **Função**: Navegação, busca e filtros de projetos.

### 1.1 Setor de Título

| # | Nome Canônico | Função |
|---|--------------|--------|
| 1.1.1 | **Título "Explorador de Projetos"** | Identifica a tela como hub principal de projetos |
| 1.1.2 | **Contagem de Resultados** | Ex: "12 projetos encontrados" — atualiza em tempo real com filtros |

### 1.2 Botão de Ação Principal

| # | Nome Canônico | Ícone | Função |
|---|--------------|-------|--------|
| 1.2.1 | **Botão "Novo Projeto"** | `Plus` | Abre o modal `ProjectInitWizardModal` (Wizard de Criação) |

### 1.3 Barra de Busca

| # | Nome Canônico | Tipo | Função |
|---|--------------|------|--------|
| 1.3.1 | **Campo de Busca** | `input text` | Filtra projetos por nome do cliente, cidade ou status. Busca em tempo real (in-memory, <100ms) |
| 1.3.2 | **Toggle de Filtros** | `button` (`SlidersHorizontal`) | Expande/recolhe a barra de Chips de Status |

### 1.4 Chips de Filtro por Status

> Visíveis apenas quando o Toggle de Filtros está ativo.

| # | Nome Canônico | Valor | Cor |
|---|--------------|-------|-----|
| 1.4.1 | **Chip "Todos"** | `ALL` | Emerald (quando ativo) |
| 1.4.2 | **Chip "Rascunho"** | `DRAFT` | Slate |
| 1.4.3 | **Chip "Em Progresso"** | `IN_PROGRESS` | Roxo (neonorte-lightPurple) |
| 1.4.4 | **Chip "Revisão"** | `REVIEW` | Amber |
| 1.4.5 | **Chip "Aprovado"** | `APPROVED` | Verde (neonorte-green) |

---

## 2. GRID DE PROJETOS (Área Scrollável)

> **Componente**: `ProjectExplorer.tsx` (inline grid)  
> **Função**: Exibe os projetos como cartões visuais responsivos.

### 2.1 Estados do Grid

| # | Estado | Condição | Visual |
|---|--------|----------|--------|
| 2.1.1 | **Estado Carregando** | `loading === true` | Spinner `Loader2` animado + texto "Carregando Projetos..." |
| 2.1.2 | **Estado Vazio** | `filteredProjects.length === 0` | Ícone `FolderOpen` + mensagem "Nenhum projeto encontrado" |
| 2.1.3 | **Estado com Dados** | Projetos encontrados | Grid responsivo: 1 col (mobile), 2 col (sm), 3 col (lg), 4 col (xl) |

---

## 3. PROJECT CARD (Cartão do Projeto)

> **Componente**: `ProjectCardComponent` (inline em `ProjectExplorer.tsx`)  
> **Função**: Unidade visual de cada projeto. Paradigma "Visual-First": o telhado é o destaque, não o texto.

### Anatomia do Cartão

```
┌────────────────────────────┐
│  [Status Badge]      ⬆ TR │  ← Thumbnail Area
│                            │
│   ◉ Generative Pattern     │  ← Padrão gerado deterministicamente
│     (ou Mapa Satélite)     │     baseado no hash do nome
│                            │
│  [📍 Cidade, UF]    ⬇ BL │
│  ══ hover: "Abrir Dim." ══ │  ← CTA flutuante
├────────────────────────────┤
│  Nome do Cliente    [✏️]   │  ← Info + botão Editar
│ ─────────────────────────  │
│  ⚡ 12.5 kWp   🔋 850 kWh │  ← Specs Grid
│  🕐 02 abr. 2026          │  ← Timestamp
└────────────────────────────┘
```

### 3.1 Zona de Thumbnail (Área Superior)

| # | Nome Canônico | Função |
|---|--------------|--------|
| 3.1.1 | **Thumbnail Satélite** | Imagem estática do OpenStreetMap (zoom 18, nível de telhado). Exibida se lat/lng disponíveis |
| 3.1.2 | **Padrão Generativo** | Grid 5×4 de células acesas/apagadas, determinado por hash do nome do cliente. Substitui o thumbnail quando lat/lng não disponíveis |
| 3.1.3 | **Gradiente de Status** | Degradê colorido no fundo, varia por status (slate=rascunho, blue=progresso, amber=revisão, emerald=aprovado) |

### 3.2 Badges Sobrepostos

| # | Nome Canônico | Posição | Dados |
|---|--------------|---------|-------|
| 3.2.1 | **Badge de Status** | Topo direito | Dot pulsante + label (ex: "●  Em Progresso") |
| 3.2.2 | **Badge de Localização** | Inferior esquerdo | Ícone `MapPin` + "Cidade, UF" ou "Local não definido" |

### 3.3 CTA de Hover

| # | Nome Canônico | Função |
|---|--------------|--------|
| 3.3.1 | **"Abrir Dimensionamento"** | Pill emerald com ícone `ArrowUpRight`. Aparece centralizado com animação slide-up no hover do cartão. Click → abre o `SiteContextModal` para prévia espacial antes do Workspace. |

### 3.4 Zona de Informações (Área Inferior)

| # | Nome Canônico | Dados |
|---|--------------|-------|
| 3.4.1 | **Nome do Cliente** | Texto principal (bold, branco). Trunca com `…` se longo. Fica emerald no hover |
| 3.4.2 | **Botão Editar** | Ícone `Edit2`. Abre `ProjectFormModal` no modo de Edição. |
| 3.4.3 | **Potência Meta** | Ícone `Zap` (laranja) + "12.5 kWp" ou "— kWp" se não definida |
| 3.4.4 | **Consumo Médio** | Ícone `Battery` (azul) + "850 kWh" ou "— kWh" se não fornecido |
| 3.4.5 | **Timestamp** | Ícone `Clock` + data formatada baseado em `updatedAt` |

### 3.5 Interações do Cartão

| Ação | Trigger | Efeito |
|------|---------|--------|
| **Click** | Corpo do cartão | Aciona `setContextProjectId` → abre a vista `SiteContextModal`. |
| **Hover** | Corpo do cartão | Elevação (-1px translate-y), borda/sombra emerald. Revela CTA e botão Editar. |
| **Enter** | Teclado (foco) | Mesmo efeito do click. |
| **Click botão ✏️** | Botão Editar | `stopPropagation` + aciona modal de edição (`ProjectFormModal`). |

---

## 4. MODAL UNIFICADO (PROJECT FORM MODAL)

> **Componente**: `ProjectFormModal.tsx`  
> **Função**: Modal dinâmico unificado que mesclou a Criação (Wizard) e a Edição Rápida.  
> **Diferencial**: Integra mini-mapa interativo Leaflet nativamente para extração de lat/lng via clique.

### 4.1 Layout e Seções

1. **Seção 1: Identificação e Local**
   - Nome do Cliente e Nome Interno (Opcional).
   - Endereço completo com suporte em tempo real a requisições automáticas a API do ViaCEP (auto-preenchimento de Logradouro, Bairro, Cidade, UF e pinagem via texto).
2. **Seção 2: Mapa Interativo (Pinagem Geográfica)**
   - Viewport Leaflet. Permite pinar a localização exata ou usar busca textual via Nominatim (OSM).
   - Botão "Localização Atual" que solicita permissão de Geolocation da máquina/celular.
   - Inputs espelhados e reativos de Latitude/Longitude.
3. **Seção 3: Infraestrutura & Fatura**
   - Conexão Nominal e Tarifa Unitária R$/kWh.
   - Alternância de consumo: "Média Simplificada" vs "Fatura Detalhada". O modo Detalhado exibe matriz de 12 inputs mensais permitindo variação da curva de sazonalidade.

### 4.2 Modos do Componente

- **Modo CREATE (`projectId = null`)**: Botão de salvar assume estado "Lançar Projeto" (Ícone `Play` verde/emerald), efetuando POST. Navega posteriormente ao painel.
- **Modo EDIT (`projectId = string`)**: Input preenchido pós `GET /designs/:id`; botão passa a "Gravar Alterações" (Ícone `Save` azul), rodando um PATCH no db.

---

## 5. MODAL DE CONTEXTO (SITE CONTEXT MODAL)

> **Componente**: `SiteContextModal.tsx`  
> **Função**: Vista Split-View sobreposta. É a parada intermediária entre o clique no Hub e o Carregamento Pesado da Tela de Engenharia. Evidencia leitura técnica 360º em modo read-only.

### 5.1 Elementos da Interface

- **Lado Esquerdo: Localização**
  - Preview espacial em grid com coordenadas da implantação (`lat`, `lng`).
  - Grade de Data-Chips: Endereço, Nome, Tensão, Ligação Elétrica.
- **Lado Direito: Perfil de Carga (Gráfico)**
  - Gráfico BarChart customizado. Reflete a variação dos 12 meses, calculando proporção baseada na barra de maior montante.
  - Pico destacado com gradiente divergente (`orange-500`).
  - Painéis informativos: Consumo Médio da matriz, Mês correspondente ao pico, valor da tarifa R$/kWh vigente.

### 5.2 Ação Primária
- **Botão "Dimensionar Projeto"**: O real engatilho de roteamento. Dispara o `onDimensionar(id)` que, em background e sem travamentos visuais bruscos, transiciona o usuário do Hub para o `CenterCanvas` / Workspace WebGL principal.

---

## Glossário Específico do Hub

| Termo | Significado |
|-------|-------------|
| **Hub** | Tela de Explorador de Projetos — porta de entrada do Kurupira |
| **Card** | Cartão visual representando um projeto na grid |
| **Wizard** | Modal de criação step-by-step (atualmente single-step) |
| **Quick Edit** | Modal de edição rápida sem abrir o workspace |
| **Projeto Autônomo** | Projeto criado diretamente no Kurupira, sem dependência do CRM Iaçã |
| **Engineering-First** | Paradigma onde o engenheiro inicia o projeto, não o comercial |
| **Visual-First** | Paradigma onde o thumbnail do telhado é o elemento de destaque, não texto tabular |
| **Generative Pattern** | Padrão visual gerado deterministicamente a partir do hash do nome, usado como placeholder de thumbnail |
