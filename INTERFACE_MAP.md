# INTERFACE_MAP.md - Mapa de Interface - Sistema NEONORTE NEXUS

> **Última Atualização:** 2026-01-15  
> **Arquiteto:** Tecnologia Neonorte  
> **Versão:** 1.1.0 (Lean CRM)

---

## 📋 VISÃO GERAL

Este documento mapeia **TODA a interface do usuário** do sistema NEXUS, incluindo estruturas de navegação e componentes principais.

---

## 🗺️ MAPA DE NAVEGAÇÃO

```mermaid
graph TB
    START([👤 Usuário acessa aplicação]) --> CHECK{Autenticado?}

    CHECK -->|Não| LOGIN[🔑 /login<br/>LoginPage]
    CHECK -->|Sim| LAYOUT[📐 MainLayout<br/>Sidebar + Outlet]

    LOGIN -->|Credenciais corretas| LAYOUT
    LOGIN -->|Credenciais incorretas| LOGIN

    LAYOUT --> DEFAULT{Rota padrão}
    DEFAULT --> KANBAN

    subgraph "ROTAS COMERCIAIS (SALES, ENGINEER, ADMIN)"
        KANBAN[🎯 /kanban<br/>KanbanBoard<br/>Pipeline SALES/ENGINEERING]
        CLIENTS[👥 /clients<br/>ClientList<br/>Base de Clientes]
        PROFILE[👤 /profile<br/>ProfilePage<br/>Perfil do Usuário]
    end

    subgraph "ROTAS ADMINISTRATIVAS (Apenas ADMIN)"
        DASHBOARD[📊 /dashboard<br/>DashboardPage<br/>Métricas e Gráficos]
        USERS[👥 /admin/users<br/>RegisterUserPage<br/>Gestão de Equipe]
    end

    LAYOUT --> KANBAN
    LAYOUT --> CLIENTS
    LAYOUT --> PROFILE
    LAYOUT --> DASHBOARD
    LAYOUT --> USERS

    KANBAN -.->|Clique no card| PROJECTMODAL[🔍 ProjectModal<br/>Modal Global]
    CLIENTS -.->|Clique na linha| CLIENTMODAL[🔍 ClientDetailModal<br/>Detalhes do Cliente]
    KANBAN -.->|Botão Novo| LEADMODAL[➕ CreateLeadModal<br/>Criar Lead]

    style LOGIN fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    style PROJECTMODAL fill:#fff3e0,stroke:#f57c00,stroke-width:3px
    style DASHBOARD fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style USERS fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
```

---

## 🧭 SIDEBAR - Navegação Principal

### Sidebar.jsx

**Seções:**

#### 1. **Navegação Principal**

- 🎯 **Quadro Kanban** (`/kanban`)
- 👥 **Base de Clientes** (`/clients`)
- 📊 **Dashboard** (`/dashboard`) - ADMIN only

#### 2. **Navegação Admin** (ADMIN only)

- 👥 **Gestão de Equipe** (`/admin/users`)

#### 3. **Sistema**

- 🌙 **Alternar Tema**
- **Perfil do Usuário**

---

## 📄 PÁGINAS PRINCIPAIS

### 1. 🔑 LoginPage - Autenticação

**Rota:** `/login`

### 2. 🎯 KanbanBoard - Pipeline de Projetos

**Rota:** `/kanban`

**Pipelines:**

- **COMERCIAL:** Contact -> Proposal -> Budget -> Waiting -> Approved/Rejected
- **ENGENHARIA:** Ready -> Execution -> Review -> Done/Closed

**Modais:**

- `ProjectModal` (Detalhes)
- `CreateLeadModal` (Novo Lead)

### 3. 👥 ClientList - Base de Clientes

**Rota:** `/clients`

- Lista com busca e filtros.
- Abre `ClientDetailModal`.

### 4. 📊 DashboardPage - Métricas (ADMIN)

**Rota:** `/dashboard`

- KPIs: Projetos Totais, Pipeline, Conversão.
- Gráficos de Status.

### 5. 👥 RegisterUserPage - Gestão de Equipe (ADMIN)

**Rota:** `/admin/users`

- CRUD de usuários.

---

## 🪟 MODAIS E OVERLAYS

### ProjectModal - Modal Detalhado de Projeto

**Estrutura Simplificada (Lean):**

```
┌──────────────────────────────────────────────┐
│ [Visão Geral] [Anexos]                    🗑️ │
├──────────────────────────────────────────────┤
│                                              │
│  (Conteúdo da aba ativa)                     │
│                                              │
└──────────────────────────────────────────────┘
```

#### **Aba 1: Visão Geral**

- **Dados do Projeto:** Título, Cliente, Status, Valor (Input manual).
- **Dados Técnicos (Opcional):** Consumo médio (Input manual), Localização.
- **Timeline:** Histórico de atividades (`ActivityLog`).
- **Notas:** Adicionar comentários.

#### **Aba 2: Anexos**

- **Upload:** Enviar arquivos (PDF, Imagens).
- **Lista:** Visualizar e excluir anexos.

---

### CreateLeadModal

- Cria Lead selecionando cliente existente ou cadastrando novo.

### ClientDetailModal

- Edita dados cadastrais do cliente (Nome, Email, Telefone, Endereço).
- Visualiza lista de projetos do cliente.

---

## 🎨 DESIGN SYSTEM

### Paleta de Cores (Tailwind/Neon)

- Background: `#0a0a0b`
- Surface: `#141416`
- Primary: `#ffffff`
- Accents: Neon Purple (`#a78bfa`), Neon Green (`#10b981`)
