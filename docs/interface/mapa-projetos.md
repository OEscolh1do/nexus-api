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
| 3.3.1 | **"Abrir Dimensionamento"** | Pill emerald com ícone `ArrowUpRight`. Aparece centralizado com animação slide-up no hover do cartão. Click → navega para o Workspace |

### 3.4 Zona de Informações (Área Inferior)

| # | Nome Canônico | Dados |
|---|--------------|-------|
| 3.4.1 | **Nome do Cliente** | Texto principal (bold, branco). Trunca com `…` se longo. Fica emerald no hover |
| 3.4.2 | **Botão Editar** | Ícone `Edit2`, visível apenas no hover. Abre `ProjectQuickEditModal` |
| 3.4.3 | **Potência Meta** | Ícone `Zap` (laranja) + "12.5 kWp" ou "— kWp" se não definida |
| 3.4.4 | **Consumo Médio** | Ícone `Battery` (azul) + "850 kWh" ou "— kWh" se não fornecido |
| 3.4.5 | **Timestamp** | Ícone `Clock` + data formatada (ex: "02 abr. 2026") — baseada em `updatedAt` |

### 3.5 Interações do Cartão

| Ação | Trigger | Efeito |
|------|---------|--------|
| **Click** | Corpo do cartão | `onSelectProject(projectId)` → carrega o projeto e abre o Workspace de Dimensionamento |
| **Hover** | Corpo do cartão | Elevação (-1px translate-y, scale 1.02), borda emerald, sombra emerald. Revela CTA e botão Editar |
| **Enter** | Teclado (foco) | Mesmo efeito do click (acessibilidade) |
| **Click botão ✏️** | Botão Editar | `stopPropagation` + abre `ProjectQuickEditModal` (não navega) |

---

## 4. MODAL: WIZARD DE NOVO PROJETO

> **Componente**: `ProjectInitWizardModal.tsx`  
> **Função**: Formulário para criação de projeto autônomo (Eng-First, sem depender do CRM Iaçã).

### Layout do Modal

```
┌──────────────────────────────────┐
│ 🟢 Novo Projeto Autônomo    [✕]  │  ← Header
│    Kurupira Engineering-First    │
├──────────────────────────────────┤
│                                  │
│  § IDENTIFICAÇÃO E LOCAL         │  ← Seção 1
│  ┌─────────────┬─────────────┐   │
│  │ Cliente *   │ Título Int. │   │
│  └─────────────┴─────────────┘   │
│  ┌─────────────────────┬──────┐  │
│  │ Cidade *            │ UF * │  │
│  └─────────────────────┴──────┘  │
│  ─────────────────────────────   │
│  § INFRAESTRUTURA & FATURA       │  ← Seção 2
│  ┌─────────────┬─────────────┐   │
│  │ Conexão     │ Tarifa R$/  │   │
│  │ Nominal     │ kWh         │   │
│  └─────────────┴─────────────┘   │
│  ┌─ Modo de Consumo ──────────┐  │
│  │ ◉ Média Simplificada       │  │
│  │ ○ Fatura Detalhada (12m)   │  │
│  │ ┌────────────────────────┐ │  │
│  │ │ [input kWh/mês]       │ │  │
│  │ └────────────────────────┘ │  │
│  └────────────────────────────┘  │
├──────────────────────────────────┤
│              [Cancelar] [Lançar] │  ← Footer
└──────────────────────────────────┘
```

### 4.1 Header

| # | Nome Canônico | Função |
|---|--------------|--------|
| 4.1.1 | **Ícone Play** | Badge visual emerald com ícone `Play` (filled) |
| 4.1.2 | **Título "Novo Projeto Autônomo"** | Identifica a ação |
| 4.1.3 | **Subtitle "Engineering-First Flow"** | Indica que é independente do CRM |
| 4.1.4 | **Botão Fechar** | Ícone `X`, desabilitado durante loading |

### 4.2 Seção 1: Identificação e Local

| # | Nome Canônico | Campo | Obrigatório | Placeholder |
|---|--------------|-------|:-----------:|-------------|
| 4.2.1 | **Nome do Cliente** | `clientName` | ✅ | "Ex: Supermercado Central" |
| 4.2.2 | **Título Interno** | `projectName` | ❌ | "Ex: Matriz - Fase 1" |
| 4.2.3 | **Cidade** | `city` | ✅ | "Ex: Manaus" |
| 4.2.4 | **Estado (UF)** | `stateUF` | ✅ (2 letras) | "AM" |

### 4.3 Seção 2: Infraestrutura & Fatura

| # | Nome Canônico | Campo | Tipo | Opções / Default |
|---|--------------|-------|------|------------------|
| 4.3.1 | **Tipo de Conexão Nominal** | `connectionType` | `select` | Monofásico / Bifásico / Trifásico (default: Monofásico) |
| 4.3.2 | **Tarifa Unitária** | `tariffRate` | `number` | R$/kWh (default: 0.92) |

### 4.4 Bloco de Consumo

| # | Nome Canônico | Função |
|---|--------------|--------|
| 4.4.1 | **Radio "Média Simplificada"** | Modo padrão. Exibe um único input numérico para kWh/mês médio |
| 4.4.2 | **Radio "Fatura Detalhada (12 Meses)"** | Modo avançado. Exibe grid 6×2 com 12 inputs mensais (Jan–Dez) |
| 4.4.3 | **Input Média Geral** | Visível no modo "Média". Campo numérico com unidade "kWh/mês" |
| 4.4.4 | **Grid Fatura Mensal** | Visível no modo "Detalhada". 12 mini-cards com label do mês + input numérico |

### 4.5 Alerta de Erro

| # | Nome Canônico | Função |
|---|--------------|--------|
| 4.5.1 | **Banner de Validação** | Box vermelho com ícone `AlertCircle`. Mensagens: "Nome do Cliente é obrigatório", "Insira um consumo médio válido", etc. |

### 4.6 Footer

| # | Nome Canônico | Função |
|---|--------------|--------|
| 4.6.1 | **Botão "Cancelar"** | Fecha o modal sem salvar |
| 4.6.2 | **Botão "Lançar Projeto"** | Valida campos → chama `ProjectService.createStandaloneProject()` → fecha modal → navega ao Workspace. Glow emerald. Mostra spinner durante loading |

### 4.7 Validações

| Regra | Mensagem de Erro |
|-------|-----------------|
| `clientName` vazio | "Nome do Cliente é obrigatório." |
| `city` vazio ou `stateUF` ≠ 2 chars | "Cidade e UF (2 letras) são obrigatórios." |
| Modo Média + consumo ≤ 0 | "Insira um consumo médio válido." |
| Modo Detalhado + todos zeros | "Insira pelo menos um mês de consumo na tabela." |

---

## 5. MODAL: EDIÇÃO RÁPIDA DO PROJETO

> **Componente**: `ProjectQuickEditModal.tsx`  
> **Função**: Edição inline de metadados de um projeto existente (sem abrir o Workspace).

### Layout do Modal

```
┌──────────────────────────────┐
│ Edição Rápida do Projeto [✕] │  ← Header
├──────────────────────────────┤
│                              │
│ Nome do Projeto (Interno)    │
│ [________________________]   │
│                              │
│ Nome do Cliente              │
│ [________________________]   │
│                              │
│ ┌────────────┬─────────────┐ │
│ │ Cidade     │ Estado (UF) │ │
│ └────────────┴─────────────┘ │
│ ┌────────────┬─────────────┐ │
│ │ Consumo    │  Conexão    │ │
│ │ (kWh/mês)  │  Nominal    │ │
│ └────────────┴─────────────┘ │
├──────────────────────────────┤
│       [Cancelar] [Gravar]    │  ← Footer
└──────────────────────────────┘
```

### 5.1 Campos Editáveis

| # | Nome Canônico | Campo | Tipo | Dados de Origem |
|---|--------------|-------|------|-----------------|
| 5.1.1 | **Nome do Projeto** | `projectName` | `text` | `design.name` |
| 5.1.2 | **Nome do Cliente** | `clientName` | `text` | `designData.solar.clientData.clientName` |
| 5.1.3 | **Cidade** | `city` | `text` | `designData.solar.clientData.city` |
| 5.1.4 | **Estado (UF)** | `stateUF` | `text` (2 chars, uppercase) | `designData.solar.clientData.state` |
| 5.1.5 | **Consumo (kWh/mês)** | `consumption` | `number` | `designData.solar.clientData.averageConsumption` |
| 5.1.6 | **Conexão Nominal** | `connectionType` | `select` | Monofásico / Bifásico / Trifásico |

### 5.2 Footer

| # | Nome Canônico | Função |
|---|--------------|--------|
| 5.2.1 | **Botão "Cancelar"** | Fecha o modal sem salvar |
| 5.2.2 | **Botão "Gravar Alterações"** | PATCH via `KurupiraClient.designs.update()`. Glow emerald. Spinner durante salvamento. Após sucesso: fecha modal + recarrega lista |

### 5.3 Comportamento da API

- **Carregamento**: `GET /designs/:id` → preenche os campos com dados existentes
- **Salvamento**: `PATCH /designs/:id` → atualiza `name` + `designData.solar.clientData`
- Auto-cria invoice padrão se não existir, distribuindo o consumo médio uniformemente em 12 meses

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
