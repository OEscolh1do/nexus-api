# 🔗 Adicionar Relação Entre Modelos - Neonorte | Nexus 2.0

> **🎯 Cenário de Uso**
>
> Você precisa criar uma relação entre dois modelos Prisma existentes (1:1, 1:N, N:M).
>
> **⏱️ Tempo Estimado:** 15-25 minutos

---

## 📖 Tipos de Relações

### 1:1 (One-to-One)

Exemplo: `Project` ↔ `SolarProposal` (um projeto tem uma proposta)

### 1:N (One-to-Many)

Exemplo: `Project` → `OperationalTask[]` (um projeto tem várias tarefas)

### N:M (Many-to-Many)

Exemplo: `User` ↔ `Project` (usuários participam de vários projetos)

---

## ✂️ PROMPT PRÉ-CONFIGURADO

````xml
<system_role>
  Atue como Database Architect especializado em Prisma ORM.

  Stack:
  - Prisma 5.10+
  - MySQL 8.0
</system_role>

<mission>
  Adicionar relação entre modelos: {{MODELO_A}} ↔ {{MODELO_B}}

  Exemplo: "Adicionar relação 1:N entre Project e Comment"
</mission>

<nexus_context>
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/nexus-monolith/backend/prisma/schema.prisma" />
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/CONTEXT.md" />
</nexus_context>

<relation_specification>
  **Modelo A:** {{MODELO_A}}
  **Modelo B:** {{MODELO_B}}
  **Tipo de Relação:** {{1:1|1:N|N:M}}
  **Direção:** {{A_TEM_B|B_TEM_A|BIDIRECIONAL}}

  **Comportamento onDelete:**
  - {{CASCADE|SET_NULL|RESTRICT}}

  **Opcional:** {{SIM|NAO}}
</relation_specification>

<execution_protocol>
  1. **Analisar Schema Atual:**
     - Verificar modelos existentes
     - Identificar campos relacionados

  2. **Adicionar Campos de Relação:**
     - Foreign key no modelo filho
     - Relação no modelo pai

  3. **Configurar Comportamento:**
     - onDelete (Cascade, SetNull, Restrict)
     - onUpdate (opcional)

  4. **Adicionar Índices:**
     - @@index em foreign keys

  5. **Criar Migração:**
     ```bash
     npx prisma migrate dev --name add_relation_{{nome}}
     ```

  6. **Atualizar Tipos:**
     ```bash
     npx prisma generate
     ```
</execution_protocol>

<expected_output>
  1. Schema Prisma atualizado
  2. Migração criada
  3. Tipos TypeScript atualizados
  4. Exemplo de query com include
</expected_output>
````

---

## 📝 Implementação por Tipo de Relação

### 1. Relação 1:1 (One-to-One)

**Cenário:** `Project` ↔ `SolarProposal` (um projeto pode ter uma proposta solar)

```prisma
// ANTES
model Project {
  id    String @id @default(cuid())
  title String
  // ... outros campos
}

model SolarProposal {
  id         String @id @default(cuid())
  clientName String
  // ... outros campos
}

// DEPOIS
model Project {
  id          String         @id @default(cuid())
  title       String
  proposalId  String?        @unique  // Foreign key (opcional)

  // Relação
  proposal    SolarProposal? @relation(fields: [proposalId], references: [id], onDelete: SetNull)

  // ... outros campos
}

model SolarProposal {
  id         String   @id @default(cuid())
  clientName String

  // Relação inversa
  project    Project?

  // ... outros campos
}
```

**Migração:**

```bash
cd backend
npx prisma migrate dev --name add_project_solar_proposal_relation
```

**Uso no Código:**

```javascript
// Criar projeto com proposta
const project = await prisma.project.create({
  data: {
    title: "Projeto Solar Residencial",
    proposal: {
      create: {
        clientName: "João Silva",
        systemSize: 10.5,
        // ... outros campos
      },
    },
  },
  include: {
    proposal: true,
  },
});

// Buscar projeto com proposta
const projectWithProposal = await prisma.project.findUnique({
  where: { id: "xxx" },
  include: {
    proposal: true,
  },
});
```

---

### 2. Relação 1:N (One-to-Many)

**Cenário:** `Project` → `Comment[]` (um projeto tem vários comentários)

```prisma
// ANTES
model Project {
  id    String @id @default(cuid())
  title String
}

// Criar novo modelo Comment
model Comment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  authorId  String
  createdAt DateTime @default(now())
}

// DEPOIS
model Project {
  id       String    @id @default(cuid())
  title    String

  // Relação 1:N
  comments Comment[]
}

model Comment {
  id        String   @id @default(cuid())
  projectId String   // Foreign key
  content   String   @db.Text
  authorId  String
  createdAt DateTime @default(now())

  // Relações
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id])

  // Índices
  @@index([projectId])
  @@index([authorId])
  @@index([createdAt])
}

model User {
  // ... campos existentes

  // Relação inversa
  comments Comment[]
}
```

**Migração:**

```bash
npx prisma migrate dev --name add_project_comments
```

**Uso no Código:**

```javascript
// Criar comentário
const comment = await prisma.comment.create({
  data: {
    projectId: "project-id",
    authorId: "user-id",
    content: "Ótimo progresso!",
  },
});

// Buscar projeto com comentários
const projectWithComments = await prisma.project.findUnique({
  where: { id: "xxx" },
  include: {
    comments: {
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    },
  },
});

// Contar comentários
const projectWithCount = await prisma.project.findUnique({
  where: { id: "xxx" },
  include: {
    _count: {
      select: {
        comments: true,
      },
    },
  },
});
```

---

### 3. Relação N:M (Many-to-Many)

**Cenário:** `User` ↔ `Project` (usuários participam de vários projetos)

#### Opção A: Relação Implícita (Prisma gerencia tabela intermediária)

```prisma
model User {
  id       String    @id @default(cuid())
  fullName String

  // Relação N:M
  projects Project[]
}

model Project {
  id    String @id @default(cuid())
  title String

  // Relação N:M inversa
  members User[]
}
```

**Uso:**

```javascript
// Adicionar usuário ao projeto
await prisma.project.update({
  where: { id: "project-id" },
  data: {
    members: {
      connect: { id: "user-id" },
    },
  },
});

// Buscar projetos do usuário
const userWithProjects = await prisma.user.findUnique({
  where: { id: "user-id" },
  include: {
    projects: true,
  },
});
```

#### Opção B: Relação Explícita (Tabela intermediária customizada)

```prisma
model User {
  id       String             @id @default(cuid())
  fullName String

  // Relação através de tabela intermediária
  projectMemberships ProjectMember[]
}

model Project {
  id    String          @id @default(cuid())
  title String

  // Relação através de tabela intermediária
  members ProjectMember[]
}

// Tabela intermediária customizada
model ProjectMember {
  id        String   @id @default(cuid())
  userId    String
  projectId String
  role      String   @default("MEMBER") // OWNER, ADMIN, MEMBER
  joinedAt  DateTime @default(now())

  // Relações
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Índices
  @@unique([userId, projectId]) // Evita duplicatas
  @@index([userId])
  @@index([projectId])
}
```

**Uso:**

```javascript
// Adicionar membro com role
await prisma.projectMember.create({
  data: {
    userId: "user-id",
    projectId: "project-id",
    role: "ADMIN",
  },
});

// Buscar projetos com membros
const projectWithMembers = await prisma.project.findUnique({
  where: { id: "project-id" },
  include: {
    members: {
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    },
  },
});

// Verificar se usuário é membro
const isMember = await prisma.projectMember.findUnique({
  where: {
    userId_projectId: {
      userId: "user-id",
      projectId: "project-id",
    },
  },
});
```

---

## ⚙️ Comportamentos onDelete

### CASCADE

Deleta registros relacionados automaticamente.

```prisma
project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
```

**Exemplo:** Ao deletar `Project`, todos os `Comment` são deletados.

### SET NULL

Define foreign key como `null`.

```prisma
proposal SolarProposal? @relation(fields: [proposalId], references: [id], onDelete: SetNull)
```

**Exemplo:** Ao deletar `SolarProposal`, `Project.proposalId` vira `null`.

### RESTRICT

Impede deletar se houver registros relacionados.

```prisma
author User @relation(fields: [authorId], references: [id], onDelete: Restrict)
```

**Exemplo:** Não pode deletar `User` se tiver `Comment`.

---

## ✅ Checklist de Verificação

- [ ] **Schema Atualizado:** Relações adicionadas em ambos os modelos
- [ ] **Foreign Keys:** Campos criados corretamente
- [ ] **onDelete:** Comportamento definido
- [ ] **Índices:** Adicionados em foreign keys
- [ ] **Migração:** Executada sem erros
- [ ] **Prisma Generate:** Tipos atualizados
- [ ] **Queries Testadas:** Include funcionando
- [ ] **Dados Existentes:** Migração não quebrou dados

---

## 🔗 Templates Relacionados

- **Base:** `01_DATABASE/ADD_FIELD_TO_MODEL.md`
- **Modelo:** `01_DATABASE/CREATE_NEW_MODEL.md`
- **Backend:** `02_BACKEND_API/CREATE_MODULE_CONTROLLER.md`

---

## ⚠️ Armadilhas Comuns

### ❌ Não Fazer

1. **Esquecer relação inversa**

   ```prisma
   // ❌ Incompleto
   model Project {
     comments Comment[]
   }
   // Falta adicionar em Comment!
   ```

2. **Não adicionar índice**

   ```prisma
   // ❌ Sem índice (lento!)
   model Comment {
     projectId String
     project Project @relation(...)
   }
   ```

3. **onDelete errado**
   ```prisma
   // ❌ Cascade pode deletar dados importantes!
   manager User @relation(..., onDelete: Cascade)
   ```

### ✅ Fazer

1. **Sempre adicionar índice em FK**

   ```prisma
   @@index([projectId])
   ```

2. **Escolher onDelete apropriado**
   - Cascade: Dados dependentes (comentários, logs)
   - SetNull: Referências opcionais
   - Restrict: Dados críticos

3. **Testar migração em dev primeiro**
   ```bash
   npx prisma migrate dev
   # Verificar se funcionou
   npx prisma migrate deploy # Produção
   ```
