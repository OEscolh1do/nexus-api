# CONTEXT.md - Sistema NEONORTE NEXUS

> **Última Atualização:** 2026-01-15  
> **Arquiteto:** Tecnologia Neonorte  
> **Versão do Sistema:** 1.1.0 (Lean CRM)

---

## 📋 VISÃO GERAL

**NEXUS** é um sistema **CRM/ERP** especializado em projetos de **energia solar fotovoltaica**, desenvolvido pela **Neonorte Tecnologia**. O sistema foca no gerenciamento simplificado do ciclo de vendas e acompanhamento de projetos, eliminando complexidades de dimensionamento automático em favor de dados inputados manualmente.

### Domínio de Negócio

- **Setor:** Energia Renovável (Geração Distribuída Solar)
- **Usuários:** Equipe comercial (SALES), engenheiros (ENGINEER), administradores (ADMIN)
- **Objetivo:** Gestão de pipeline comercial, cadastro de clientes, acompanhamento de obras e centralização de documentos.

---

## 🏗️ ARQUITETURA DO SISTEMA

### Stack Tecnológico

#### **Backend**

- **Runtime:** Node.js (TypeScript)
- **Framework:** Express.js 5.x
- **ORM:** Prisma 6.18.0
- **Banco de Dados:** MySQL (Compatível com Shared Hosting)
- **Autenticação:** JWT (jsonwebtoken 9.0.3)
- **Upload de Arquivos:** Multer 2.0.2
- **Segurança:** bcryptjs 3.0.3, CORS habilitado

#### **Frontend**

- **Framework:** React 19.1.1
- **Build Tool:** Vite 7.1.7
- **Roteamento:** React Router DOM 7.9.5
- **Estado Global:** Zustand 5.0.8 (com persist middleware)
- **UI/Styling:** Tailwind CSS 3.4.17
- **Gráficos:** Recharts 3.5.1
- **Ícones:** Lucide React 0.553.0
- **Drag & Drop:** @dnd-kit/\* 6.3.1
- **HTTP Client:** Axios 1.13.1

### Padrões Arquiteturais

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)                      │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐   │
│  │  Zustand   │  │   Axios    │  │  React Router DOM   │   │
│  │  (State)   │  │  (HTTP)    │  │    (Routing)        │   │
│  └────────────┘  └────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ HTTPS/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express API)                     │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐   │
│  │    JWT     │  │  Multer    │  │   CRUD Controllers  │   │
│  │ Middleware │  │  (Upload)  │  │                     │   │
│  └────────────┘  └────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ Prisma ORM
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                        │
│      (8 Models: User, Client, Project, ActivityLog...)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ SCHEMA DE BANCO DE DADOS

### Models Principais

#### **1. User** (Sistema de Autenticação)

```prisma
model User {
  id         String   @id @default(cuid())
  email      String   @unique
  name       String
  password   String   // bcrypt hash
  avatar     String?
  role       UserRole @default(SALES)  // SALES | ENGINEER | ADMIN
}
```

#### **2. Client** (Cadastro de Clientes)

```prisma
model Client {
  id               String   @id @default(cuid())
  name             String
  email            String?
  phone            String?
  cpf_cnpj         String?
  // Endereço completo
  zip              String?
  street           String?
  number           String?
  neighborhood     String?
  city             String?
  state            String?
  // Contas Contrato (JSON: [{ uc, type }])
  contractAccounts Json?
  projects         Project[]
  attachments      Attachment[]
}
```

#### **3. Project** (Core do Sistema - Projetos Solares)

```prisma
model Project {
  id                 String        @id @default(cuid())
  title              String
  description        String?
  status             ProjectStatus @default(LEAD)
  pipeline           String        @default("SALES")
  rank               Float?        // Para ordenação Kanban

  // Cliente vinculado
  clientId           String
  client             Client        @relation(...)

  // DADOS TÉCNICOS BÁSICOS
  monthlyUsage       Float?        // Consumo médio mensal (kWh)
  consumptionHistory Json?         // Histórico 12 meses
  location           String?       // Cidade
  roofType           String?       // Tipo de telhado
  orientation        String?       // NORTE, SUL...
  roofArea           Float?        // m²

  // COMERCIAL SIMPLIFICADO
  price              Float?        // Investimento total
  energyTariff       Float?        // R$/kWh

  // Relacionamentos
  activities         ActivityLog[]
  attachments        Attachment[]
  units              ConsumerUnit[]
}
```

#### **4. ConsumerUnit** (Unidades Consumidoras)

```prisma
model ConsumerUnit {
  id              String   @id @default(cuid())
  code            String   // Número UC
  isGenerator     Boolean  @default(false)
  averageAvg      Float?   // kWh médio
  titular         String?
  group           String?  // A, B
  meterNumber     String?
  availabilityFee Float?   // 30, 50, 100 kWh
  voltage         String?  // "127/220"
  concessionaire  String?  // "Equatorial"
  projectId       String
  project         Project  @relation(...)
}
```

#### **5. ActivityLog** (Auditoria e Timeline)

```prisma
model ActivityLog {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(...)
  type      String   // "SYSTEM", "NOTE", "STATUS_CHANGE"
  action    String   // "Lead Criado", "Nota Adicionada"
  details   String?
  userId    String?
  user      User?    @relation(...)
  createdAt DateTime @default(now())
}
```

#### **6. Attachment** (Upload de Arquivos)

```prisma
model Attachment {
  id        String   @id @default(cuid())
  fileName  String
  filePath  String   // Nome único no sistema
  fileType  String   // MIME type

  // Pode estar vinculado a Projeto OU Cliente
  projectId String?
  project   Project? @relation(...)
  clientId  String?
  client    Client?  @relation(...)

  createdAt DateTime @default(now())
}
```

#### **7. Location & IrradiationData** (Dados de Irradiação Solar)

```prisma
model Location {
  id          String            @id @default(cuid())
  city        String            @unique
  state       String
  irradiation IrradiationData[]
}

model IrradiationData {
  id          String   @id @default(cuid())
  month       Int      // 1-12
  irradiation Float    // kWh/m²/dia
  locationId  String
  location    Location @relation(...)

  @@unique([locationId, month])
}
```

### Enums

```prisma
enum UserRole {
  SALES      // Equipe comercial
  ENGINEER   // Engenheiros
  ADMIN      // Administradores
}

enum ProjectStatus {
  // PIPELINE COMERCIAL
  LEAD         // Legado
  VISIT        // Legado
  PROPOSAL     // Legado
  NEGOTIATION  // Legado
  CONTACT      // 1. Primeiro Contato
  BUDGET       // 2. Proposta & Orçamento
  WAITING      // 3. Aguardando Aprovação
  APPROVED     // 4. Aprovado → Vai para Engenharia
  REJECTED     // 5. Arquivado

  // PIPELINE ENGENHARIA
  READY        // 1. Aguardando Início
  EXECUTION    // 2. Em Andamento
  REVIEW       // 3. Vistoria
  DONE         // 4. Concluído

  CLOSED       // Fechado (Final/Legado)
}
```

---

## 🛣️ ROTAS DA API

### **Autenticação** (`/routes/auth.js`)

- `POST /api/auth/login` - Autentica usuário (retorna JWT)
- `POST /api/auth/register` - Cadastra novo usuário (apenas ADMIN)

### **Dashboard** (`/routes/dashboard.js`)

- `GET /api/dashboard/stats` - Estatísticas gerais (total projetos, valor pipeline, conversão)
- `GET /api/dashboard/recent-projects` - Projetos recentes
- `GET /api/dashboard/users` - Lista usuários do sistema

### **Mobile** (`/routes/mobile.js`)

- `POST /mobile/lead` - Cadastro simplificado de lead via App
- `POST /mobile/simulate` - Simulação simplificada (mock/desativada)

### **Projetos** (Inline em `index.js`)

- `GET /api/projects` - Lista projetos com cliente
- `GET /api/projects/:id` - Busca projeto único (com units, activities)
- `POST /api/leads` - Cria lead (cliente novo ou existente)
- `PUT /api/projects/:id` - Atualiza projeto
- `DELETE /api/projects/:id` - Remove projeto (**com exclusão em cascata manual**)

### **Clientes**

- `GET /api/clients` - Lista clientes agrupados
- `GET /api/clients/:id` - Busca cliente único
- `PUT /api/clients/:id` - Atualiza cliente
- `DELETE /api/clients/:id` - Remove cliente

### **Anexos**

- `POST /api/projects/:id/attachments` - Upload de arquivo (projeto)
- `GET /api/projects/:id/attachments` - Lista anexos do projeto
- `DELETE /api/attachments/:id` - Remove anexo
- `POST /api/clients/:id/attachments` - Upload de arquivo (cliente)

### **Atividades (Timeline)**

- `GET /api/projects/:id/activities` - Lista atividades do projeto
- `POST /api/projects/:id/activities` - Adiciona nota
- `PUT /api/activities/:activityId` - Edita nota

### **Unidades Consumidoras**

- `POST /api/projects/:id/units` - Adiciona UC ao projeto
- `DELETE /api/units/:unitId` - Remove UC

---

## 🔐 SEGURANÇA

### Autenticação

- **Método:** JWT (JSON Web Token)
- **Secret:** `process.env.JWT_SECRET`
- **Middleware:** `authenticateToken(req, res, next)`
- **Payload do Token:** `id`, `email`, `role`

### Upload de Arquivos

- **Limite:** 10 MB por arquivo
- **Storage:** `./uploads/` (filesystem local)
- **Sanitização:** Nome único (timestamp + random)

### CORS

- **Status:** Habilitado sem restrições (`cors()`). Ideal restringir em produção.

---

## ⚛️ FRONTEND - ESTRUTURA

### Roteamento (`App.jsx`)

#### Rotas Públicas

- `/login` - Página de autenticação

#### Rotas Protegidas

**Comerciais (SALES, ENGINEER, ADMIN):**

- `/kanban` - Kanban Board (pipeline de projetos)
- `/clients` - Lista de clientes
- `/profile` - Perfil do usuário

**Administrativas (ADMIN apenas):**

- `/dashboard` - Dashboard de métricas
- `/admin/users` - Gerenciamento de usuários

### Features Modulares

```
src/features/
├── admin/
│   └── UserManagement (Create/Edit/List)
├── authentication/
│   └── LoginPage.jsx
├── client-list/
│   └── ClientList, ClientDetailModal
├── dashboard/
│   └── DashboardPage.jsx
├── kanban-board/
│   ├── DraggableCard.jsx         // Card do projeto
│   ├── KanbanBoard.jsx           // Board principal
│   ├── ProjectModal.jsx          // Modal detalhado (Visão Geral, Anexos)
└── profile/
    └── ProfilePage.jsx
```

### Estado Global (Zustand)

- `useAuthStore.js`: Token e User Data (persistido no localStorage)
- `useThemeStore.js`: Tema Light/Dark

---

## 📊 FLUXOS DE DADOS CRÍTICOS

### 1. Criação de Lead → Projeto

```
1. Frontend: CreateLeadModal envia POST /api/leads
2. Backend:
   a. Valida/Cria Client
   b. Cria Project vinculado com status=CONTACT
   c. Gera ActivityLog "Lead Criado"
3. Frontend: Atualiza Kanban Board com novo card
```

### 2. Upload de Arquivos

```
1. Frontend: ProjectModal clica "Anexar Arquivo"
2. Backend: Multer valida tamanho (<10MB) e salva em disco
3. Backend: Registra Attachment no banco vinculado ao Project/Client
4. Frontend: Atualiza lista de anexos
```

### 3. Kanban Drag & Drop

```
1. Frontend: Usuário arrasta card
2. Frontend: Atualização otimista da UI (Zustand/Local State)
3. Backend: PUT /api/projects/:id com novo status/rank
4. Backend: Atualiza DB e gera log de atividade
```

---

## 🚨 PONTOS DE ATENÇÃO (DEBT TÉCNICO)

### 🔴 CRÍTICO - SEGURANÇA

1. **JWT Secret Hardcoded (Resolvido em Prod, alerta para Dev)**

   - Garantir `JWT_SECRET` forte no `.env` em produção.

2. **CORS Sem Restrição**

   - `app.use(cors())` permite qualquer origem.
   - **Ação:** `cors({ origin: process.env.ALLOWED_ORIGINS })`

3. **Upload Sem Validação de Tipo Rígida**
   - Multer aceita apenas extensão, ideal validar magic bytes.

### 🟡 MÉDIO - ARQUITETURA

4. **Exclusão Manual de Dependências**

   - Rota `DELETE /api/projects/:id` apaga manualmente registros filhos.
   - **Ação:** Migrar para `onDelete: Cascade` no schema Prisma.

5. **Filesystem Local para Uploads**
   - Arquivos ficam em `./uploads`. Se o servidor morrer ou for efêmero (ex: Heroku/Render sem disco persistente), arquivos somem.
   - **Ação:** Migrar para S3/R2 para produção escalável.

---

## 🚀 DEPLOY E AMBIENTE

### Produção (Hospedagem Compartilhada)

- **Backend:** Node.js App (hPanel) conectado ao MySQL.
- **Frontend:** Arquivos estáticos em `/public_html/nexus`.
- **Database:** MySQL 8.0 (Porta 3306 na Hostinger, 3307 Local).
