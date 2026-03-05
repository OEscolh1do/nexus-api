# DFD.md - Data Flow Diagrams - Sistema NEONORTE NEXUS

> **Última Atualização:** 2026-01-23
> **Arquiteto:** Antigravity AI
> **Status:** Atualizado Pós-Purge

---

## 📊 VISÃO GERAL

Este documento apresenta os **Diagramas de Fluxo de Dados (DFD)** do sistema NEXUS, visualizando como os dados transitam entre Cliente, Frontend, Backend e Banco de Dados.

---

## 🏗️ ARQUITETURA GERAL DO SISTEMA

```mermaid
graph TB
    subgraph "CLIENTE"
        USER[👤 Usuário<br/>SALES/ENGINEER/ADMIN]
    end

    subgraph "FRONTEND - React SPA"
        UI[🖥️ Interface React]
        ZUSTAND[📦 Zustand Store<br/>Auth + Theme]
        AXIOS[🌐 Axios HTTP Client]
        ROUTER[🛣️ React Router]
    end

    subgraph "BACKEND - Express API"
        MIDDLEWARE[🔐 JWT Middleware<br/>authenticateToken]
        ROUTES[📍 Rotas Express]
        CONTROLLERS[🎮 Controllers]
    end

    subgraph "PERSISTÊNCIA"
        PRISMA[🔗 Prisma ORM]
        DB[(🗄️ MySQL)]
    end

    USER -->|Login/Interação| UI
    UI <-->|Estado Global| ZUSTAND
    UI -->|Navegação| ROUTER
    UI -->|HTTP Requests| AXIOS
    AXIOS -->|REST API| MIDDLEWARE
    MIDDLEWARE -->|Valida Token| ROUTES
    ROUTES --> CONTROLLERS
    CONTROLLERS <-->|Queries| PRISMA
    PRISMA <-->|SQL| DB

    style MIDDLEWARE fill:#f44336,stroke:#c62828,stroke-width:3px,color:#fff
    style DB fill:#9c27b0,stroke:#6a1b9a,stroke-width:3px,color:#fff
```

---

## 🔐 FLUXO 1: AUTENTICAÇÃO JWT

```mermaid
sequenceDiagram
    actor User as 👤 Usuário
    participant Login as 🔑 LoginPage.tsx
    participant Axios as 🌐 Axios
    participant AuthRoute as 📍 /auth/login
    participant Server as 🎮 Server.js
    participant Prisma as 🔗 Prisma
    participant DB as 🗄️ MySQL
    participant AuthCtx as 📦 AuthContext

    User->>Login: Digita email/senha
    Login->>Axios: POST /auth/login
    Axios->>AuthRoute: { username, password }
    AuthRoute->>Server: Verificação
    Server->>Prisma: user.findUnique({ username })
    Prisma->>DB: SELECT * FROM User WHERE username = ?
    DB-->>Prisma: { id, username, password, role }
    Prisma-->>Server: user

    alt Senha Correta
        Server->>Server: Valida senha
        Server-->>AuthRoute: { token, user }
        AuthRoute-->>Axios: 200 OK
        Axios-->>Login: success
        Login->>AuthCtx: login(token, user)
        Login->>User: Redireciona /dashboard
    else Senha Incorreta
        Server-->>AuthRoute: { error: 'Credenciais inválidas' }
        AuthRoute-->>Axios: 401 Unauthorized
        Axios-->>Login: error
        Login->>User: Exibe mensagem de erro
    end
```

---

## 🎯 FLUXO 2: GESTÃO DE PROJETOS (KANBAN)

```mermaid
sequenceDiagram
    actor User as 👤 Usuário
    participant Kanban as 📊 KanbanView.tsx
    participant DnD as 🎨 @hello-pangea/dnd
    participant API as 🌐 PUT /api/projects/:id
    participant Backend as 🎮 Server.js
    participant DB as 🗄️ MySQL

    User->>Kanban: Arrasta card "Proj-123"<br/>de PLANEJAMENTO → ATIVO
    Kanban->>DnD: onDragEnd(result)

    Kanban->>User: UI atualizada (Otimista)

    par Persistência Backend
        Kanban->>API: PUT /api/projects/Proj-123<br/>{ status: 'ATIVO' }
        API->>Backend: Valida JWT + atualiza
        Backend->>DB: UPDATE Project<br/>SET status='ATIVO'<br/>WHERE id='Proj-123'

        opt Auditoria
           Backend->>DB: INSERT INTO AuditLog
        end

        DB-->>Backend: success
        Backend-->>API: 200 OK
    end

    alt Erro de Rede
        API-->>Kanban: 500 Internal Error
        Kanban->>Kanban: Reverte UI
        Kanban->>User: "Erro ao mover card"
    end
```

---

## 🗺️ MAPA DE ENTIDADES REAL (ERD)

```mermaid
erDiagram
    USER ||--o{ AUDITLOG : gera
    STRATEGY ||--o{ PROJECT : agrupa
    STRATEGY ||--o{ KEYRESULT : mede
    PROJECT ||--o{ TASK : contem
    TASK ||--o{ CHECKLIST : possui
    TASK ||--o{ TASKDEPENDENCY : depende
    ORGUNIT ||--o{ USER : aloca

    USER {
        cuid id PK
        string username
        string role
        string orgUnitId FK
    }

    STRATEGY {
        cuid id PK
        string title
        string type
        bool isActive
    }

    PROJECT {
        cuid id PK
        string title
        string status
        json details
        string strategyId FK
        string managerId FK
    }

    TASK {
        cuid id PK
        string title
        string status
        string projectId FK
        string assignedTo FK
    }

    AUDITLOG {
        cuid id PK
        string action
        json before
        json after
    }
```

---

## 🎭 DIAGRAMA DE ESTADOS DO PROJETO

```mermaid
stateDiagram-v2
    [*] --> PLANEJAMENTO : Projeto Criado

    PLANEJAMENTO --> ATIVO : Início Execução
    PLANEJAMENTO --> CANCELADO : Desistência

    ATIVO --> PAUSADO : Bloqueio
    ATIVO --> CONCLUIDO : Entrega Final

    PAUSADO --> ATIVO : Retomada

    CONCLUIDO --> [*]
```
