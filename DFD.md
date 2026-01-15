# DFD.md - Data Flow Diagrams - Sistema NEONORTE NEXUS

> **Última Atualização:** 2026-01-15  
> **Arquiteto:** Tecnologia Neonorte

---

## 📊 VISÃO GERAL

Este documento apresenta os **Diagramas de Fluxo de Dados (DFD)** do sistema NEXUS, visualizando como os dados transitam entre Cliente, Frontend, Backend e Banco de Dados. Os diagramas foram criados usando **Mermaid**.

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
        DB[(🗄️ PostgreSQL)]
        FS[📁 FileSystem<br/>uploads/]
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
    CONTROLLERS -->|Upload| FS

    style MIDDLEWARE fill:#f44336,stroke:#c62828,stroke-width:3px,color:#fff
    style DB fill:#9c27b0,stroke:#6a1b9a,stroke-width:3px,color:#fff
```

---

## 🔐 FLUXO 1: AUTENTICAÇÃO JWT

```mermaid
sequenceDiagram
    actor User as 👤 Usuário
    participant Login as 🔑 LoginPage.jsx
    participant Axios as 🌐 Axios
    participant AuthRoute as 📍 /auth/login
    participant AuthCtrl as 🎮 authController
    participant Prisma as 🔗 Prisma
    participant DB as 🗄️ PostgreSQL
    participant Zustand as 📦 useAuthStore

    User->>Login: Digita email/senha
    Login->>Axios: POST /api/auth/login
    Axios->>AuthRoute: { email, password }
    AuthRoute->>AuthCtrl: login(req, res)
    AuthCtrl->>Prisma: findUnique({ email })
    Prisma->>DB: SELECT * FROM User WHERE email = ?
    DB-->>Prisma: { id, email, password_hash, role }
    Prisma-->>AuthCtrl: user

    alt Senha Correta
        AuthCtrl->>AuthCtrl: bcrypt.compare(senha, hash)
        AuthCtrl->>AuthCtrl: jwt.sign({ id, email, role }, SECRET)
        AuthCtrl-->>AuthRoute: { token, user }
        AuthRoute-->>Axios: 200 OK
        Axios-->>Login: success
        Login->>Zustand: login(token, user)
        Zustand->>Zustand: localStorage.setItem('auth-storage')
        Login->>User: Redireciona /kanban
    else Senha Incorreta
        AuthCtrl-->>AuthRoute: { error: 'Credenciais inválidas' }
        AuthRoute-->>Axios: 401 Unauthorized
        Axios-->>Login: error
        Login->>User: Exibe mensagem de erro
    end

    Note over Zustand: Token armazenado<br/>para próximas requisições
```

---

## 📋 FLUXO 2: CRIAÇÃO DE LEAD

```mermaid
sequenceDiagram
    actor User as 👤 Usuário SALES
    participant Modal as 📝 CreateLeadModal.jsx
    participant API as 🌐 POST /api/leads
    participant Middleware as 🔐 authenticateToken
    participant Handler as 🎮 POST Handler
    participant Prisma as 🔗 Prisma ORM
    participant DB as 🗄️ PostgreSQL
    participant Kanban as 📊 KanbanBoard

    User->>Modal: Preenche dados do lead
    Note over Modal: clientId (opcional)<br/>name, email, phone<br/>description

    Modal->>API: POST { clientId?, name, email, phone, description }
    API->>Middleware: Valida JWT

    alt Token Válido
        Middleware->>Handler: req.user = { id, role }

        alt Cliente Novo (sem clientId)
            Handler->>Prisma: client.findFirst({ email })
            Prisma->>DB: SELECT * FROM Client WHERE email = ?
            DB-->>Prisma: null (não existe)
            Prisma-->>Handler: null

            Handler->>Prisma: client.create({ name, email, phone })
            Prisma->>DB: INSERT INTO Client
            DB-->>Prisma: { id: "new_client_id" }
            Prisma-->>Handler: newClient
            Handler->>Handler: finalClientId = newClient.id
        else Cliente Existente (com clientId)
            Handler->>Prisma: client.findUnique({ id: clientId })
            Prisma->>DB: SELECT * FROM Client WHERE id = ?
            DB-->>Prisma: { id, name }
            Prisma-->>Handler: existingClient
            Handler->>Handler: finalClientId = clientId
        end

        Handler->>Prisma: project.aggregate({ _max: { rank } })
        Prisma->>DB: SELECT MAX(rank) FROM Project
        DB-->>Prisma: { _max: { rank: 5000 } }

        Handler->>Prisma: project.create({...})
        Note over Prisma: title: "Projeto Lead - Nome Cliente"<br/>status: CONTACT<br/>rank: 6000<br/>activities: { create: {...} }
        Prisma->>DB: BEGIN TRANSACTION<br/>INSERT INTO Project<br/>INSERT INTO ActivityLog<br/>COMMIT
        DB-->>Prisma: { id, title, status, client }
        Prisma-->>Handler: newProject

        Handler-->>API: 201 Created { client, project }
        API-->>Modal: success
        Modal->>Kanban: Atualiza estado (refetch ou push local)
        Kanban->>User: Exibe novo card na coluna "Contato"
    else Token Inválido
        Middleware-->>API: 403 Forbidden
        API-->>Modal: error
        Modal->>User: "Sessão expirada"
    end
```

---

## 🎯 FLUXO 3: KANBAN DRAG & DROP

```mermaid
sequenceDiagram
    actor User as 👤 Usuário
    participant Kanban as 📊 KanbanBoard.jsx
    participant DnD as 🎨 @hello-pangea/dnd
    participant State as 📦 Local State
    participant API as 🌐 PUT /api/projects/:id
    participant Backend as 🎮 Backend Handler
    participant DB as 🗄️ PostgreSQL

    User->>Kanban: Arrasta card "Proj-123"<br/>de CONTACT → BUDGET
    Kanban->>DnD: onDragEnd(result)
    DnD->>Kanban: { source, destination, draggableId }

    Kanban->>State: Atualiza estado local (otimista)
    Note over State: Remove de columnsData['CONTACT']<br/>Adiciona em columnsData['BUDGET']<br/>Recalcula ranks

    Kanban->>User: UI atualizada INSTANTANEAMENTE

    par Persistência Backend
        Kanban->>API: PUT /api/projects/Proj-123<br/>{ status: 'BUDGET', rank: 2500 }
        API->>Backend: Valida JWT + atualiza
        Backend->>DB: UPDATE Project<br/>SET status='BUDGET', rank=2500<br/>WHERE id='Proj-123'
        Backend->>DB: INSERT INTO ActivityLog<br/>(type='SYSTEM', action='Status Alterado')
        DB-->>Backend: success
        Backend-->>API: 200 OK
        API-->>Kanban: confirmação
    end

    alt Erro de Rede
        API-->>Kanban: 500 Internal Error
        Kanban->>State: ROLLBACK estado local
        Kanban->>User: "Erro ao mover card"
    end
```

---

## 📤 FLUXO 4: UPLOAD DE ARQUIVOS

```mermaid
sequenceDiagram
    actor User as 👤 Usuário
    participant Modal as 📋 ProjectModal.jsx
    participant Form as 📎 Input File
    participant API as 🌐 POST /api/projects/:id/attachments
    participant Multer as 📦 Multer Middleware
    participant Handler as 🎮 Upload Handler
    participant FS as 📁 uploads/ (FileSystem)
    participant Prisma as 🔗 Prisma
    participant DB as 🗄️ PostgreSQL

    User->>Modal: Clica "Anexar Arquivo"
    Modal->>Form: Seleciona arquivo (ex: conta_luz.pdf)
    Form->>User: Exibe preview
    User->>Form: Confirma upload

    Form->>API: POST multipart/form-data<br/>{ file: Binary }
    API->>Multer: Intercepta upload

    Multer->>Multer: Valida tamanho (< 10MB)

    alt Arquivo válido
        Multer->>Multer: Gera nome único<br/>timestamp-random.pdf
        Multer->>FS: Salva em ./uploads/
        FS-->>Multer: success
        Multer->>Handler: req.file = { filename, mimetype, ... }

        Handler->>Prisma: attachment.create({...})
        Note over Prisma: fileName: "conta_luz.pdf"<br/>filePath: "1736789234-123456789.pdf"<br/>fileType: "application/pdf"<br/>projectId: "proj_123"
        Prisma->>DB: INSERT INTO Attachment
        DB-->>Prisma: { id, fileName, createdAt }
        Prisma-->>Handler: attachment

        Handler-->>API: 200 OK { id, fileName }
        API-->>Modal: success
        Modal->>User: "Arquivo anexado com sucesso!"
    else Arquivo muito grande
        Multer-->>API: 413 Payload Too Large
        API-->>Modal: error
        Modal->>User: "Arquivo excede 10MB"
    end
```

---

## 🔄 FLUXO 5: SINCRONIZAÇÃO DE ESTADO (Zustand + LocalStorage)

```mermaid
graph TB
    subgraph "Primeiro Acesso"
        A[👤 Usuário abre site] --> B[⚛️ React inicializa]
        B --> C[📦 useAuthStore carrega]
        C --> D{localStorage tem<br/>'auth-storage'?}
        D -->|Não| E[token = null<br/>user = null]
        D -->|Sim| F[Lê JSON do storage]
        F --> G[Hidrata estado Zustand]
        G --> H[token ✅<br/>user ✅]
    end

    subgraph "Login"
        I[🔑 LoginPage] --> J[POST /api/auth/login]
        J --> K[Backend retorna token]
        K --> L[Zustand.login token, user]
        L --> M[Zustand middleware 'persist']
        M --> N[localStorage.setItem<br/>'auth-storage', JSON]
    end

    subgraph "Logout"
        O[👤 Clica Sair] --> P[Zustand.logout ]
        P --> Q[token = null<br/>user = null]
        Q --> R[localStorage.removeItem<br/>'auth-storage']
        R --> S[Redireciona /login]
    end

    subgraph "Requisições HTTP"
        T[🌐 Axios interceptor] --> U{Zustand tem token?}
        U -->|Sim| V[Header:<br/>Authorization: Bearer token]
        U -->|Não| W[Sem header Auth]
        V --> X[Backend valida JWT]
        W --> Y[Backend retorna 401]
    end

    E --> I
    H --> T

    style H fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    style N fill:#bbdefb,stroke:#1565c0,stroke-width:2px
    style R fill:#ffccbc,stroke:#d84315,stroke-width:2px
```

---

## 🗺️ MAPA DE ENTIDADES E RELACIONAMENTOS (ERD)

```mermaid
erDiagram
    USER ||--o{ ACTIVITYLOG : cria
    CLIENT ||--o{ PROJECT : possui
    CLIENT ||--o{ ATTACHMENT : anexa
    PROJECT ||--o{ ACTIVITYLOG : registra
    PROJECT ||--o{ ATTACHMENT : anexa
    PROJECT ||--o{ CONSUMERUNIT : tem
    LOCATION ||--o{ IRRADIATIONDATA : contém

    USER {
        cuid id PK
        string email UK
        string name
        string password_hash
        enum role
        datetime createdAt
    }

    CLIENT {
        cuid id PK
        string name
        string email
        string phone
        string cpf_cnpj
        string zip
        string city
        string state
        json contractAccounts
    }

    PROJECT {
        cuid id PK
        string clientId FK
        string title
        enum status
        float rank
        float monthlyUsage
        json consumptionHistory
        string location
        float roofArea
        float price
    }

    CONSUMERUNIT {
        cuid id PK
        string projectId FK
        string code
        bool isGenerator
        float averageAvg
        float availabilityFee
    }

    ACTIVITYLOG {
        cuid id PK
        string projectId FK
        string userId FK
        string type
        string action
        datetime createdAt
    }

    ATTACHMENT {
        cuid id PK
        string fileName
        string filePath
        string projectId FK
        string clientId FK
    }

    LOCATION {
        cuid id PK
        string city UK
        string state
    }

    IRRADIATIONDATA {
        cuid id PK
        string locationId FK
        float irradiation
    }
```

---

## 🎭 DIAGRAMA DE ESTADOS DO PROJETO

```mermaid
stateDiagram-v2
    [*] --> CONTACT : Lead criado

    CONTACT --> BUDGET : Projeto qualificado
    CONTACT --> REJECTED : Cliente desistiu

    BUDGET --> WAITING : Proposta enviada
    BUDGET --> REJECTED : Orçamento recusado

    WAITING --> APPROVED : Cliente aprovou
    WAITING --> REJECTED : Negociação falhou
    WAITING --> BUDGET : Requer ajuste

    APPROVED --> READY : Enviado para Engenharia

    READY --> EXECUTION : Projeto iniciado

    EXECUTION --> REVIEW : Instalação concluída
    EXECUTION --> READY : Pausado temporariamente

    REVIEW --> DONE : Vistoria aprovada
    REVIEW --> EXECUTION : Correções necessárias

    DONE --> CLOSED : Arquivado
    REJECTED --> CLOSED : Arquivado

    CLOSED --> [*]
```

---

## ⚡ FLUXO COMPLETO SIMPLIFICADO

```mermaid
flowchart TD
    START([👤 Usuário acessa /kanban]) --> LOGIN{Autenticado?}
    LOGIN -->|Não| REDIR[Redireciona /login]
    LOGIN -->|Sim| LOAD[Carrega projetos<br/>GET /api/projects]

    LOAD --> KANBAN[Exibe Kanban Board]
    KANBAN --> ACTION{Ação do usuário}

    ACTION -->|Novo Lead| MODAL1[CreateLeadModal]
    MODAL1 --> POST1[POST /api/leads]
    POST1 --> DB1[(Cria Client + Project)]
    DB1 --> REFRESH1[Atualiza UI]

    ACTION -->|Abrir Projeto| MODAL2[ProjectModal]
    MODAL2 --> VIEW[Exibe dados do projeto e anexos]
    VIEW --> UPLOAD[Upload de Arquivos]

    ACTION -->|Mover Card| DRAG[Drag & Drop]
    DRAG --> UPDATE[PUT /api/projects/:id<br/>{ status, rank }]
    UPDATE --> DB2[(Atualiza Project)]
    DB2 --> REFRESH2[Atualiza UI]

    REFRESH1 --> KANBAN
    REFRESH2 --> KANBAN
    UPLOAD --> MODAL2

    style DB1 fill:#9c27b0,stroke:#6a1b9a,stroke-width:2px,color:#fff
    style DB2 fill:#9c27b0,stroke:#6a1b9a,stroke-width:2px,color:#fff
```
