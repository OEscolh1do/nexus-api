# 🗄️ Criar Novo Modelo Prisma - Neonorte | Nexus 2.0

> **🎯 Cenário de Uso**
>
> Você precisa criar um modelo completamente novo no schema Prisma (ex: `TaskComment` para comentários em tarefas).
>
> **⏱️ Tempo Estimado:** 10-15 minutos

---

## ✂️ PROMPT PRÉ-CONFIGURADO

````xml
<system_role>
  Atue como Arquiteto de Banco de Dados para Neonorte Neonorte | Nexus 2.0.

  Stack:
  - ORM: Prisma 5.10+
  - Database: MySQL 8.0
  - Padrões: CUID para IDs, timestamps automáticos, soft delete opcional
</system_role>

<mission>
  Criar novo modelo "{{NOME_DO_MODELO}}" no schema Prisma.

  Exemplo: Criar modelo `TaskComment` para sistema de comentários em tarefas.
</mission>

<nexus_context>
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/nexus-monolith/backend/prisma/schema.prisma" />
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/CONTEXT.md" />
</nexus_context>

<model_specification>
  **Nome do Modelo:** {{NOME_DO_MODELO}}
  **Propósito:** {{PARA_QUE_SERVE}}

  **Campos Principais:**
  - {{CAMPO_1}}: {{TIPO}} - {{DESCRICAO}}
  - {{CAMPO_2}}: {{TIPO}} - {{DESCRICAO}}
  - {{CAMPO_3}}: {{TIPO}} - {{DESCRICAO}}

  **Relações:**
  - Pertence a: {{MODELO_PAI}} (ex: TaskComment pertence a OperationalTask)
  - Tem muitos: {{MODELO_FILHO}} (opcional)

  **Regras de Negócio:**
  - {{REGRA_1}}
  - {{REGRA_2}}
</model_specification>

<execution_protocol>
  1. **Análise de Dependências:**
     - Identifique modelos relacionados no schema.prisma
     - Verifique se relações inversas precisam ser adicionadas

  2. **Criação do Modelo:**
     - Adicione modelo ao schema.prisma
     - Inclua campos padrão: `id`, `createdAt`, `updatedAt`
     - Configure relações com `@relation` e `onDelete`
     - Adicione índices para campos frequentemente consultados

  3. **Migração Prisma:**
     ```bash
     cd backend
     npx prisma migrate dev --name create_{{nome_modelo_snake_case}}
     npx prisma generate
     ```

  4. **Validação Zod (Backend):**
     - Crie `backend/src/validators/{{modelo}}.js`
     - Schemas: `create{{Modelo}}Schema`, `update{{Modelo}}Schema`

  5. **Tipos TypeScript (Frontend):**
     - Crie `frontend/src/types/{{modelo}}.ts`
     - Exporte interface principal

  6. **Seed Data (Opcional):**
     - Adicione dados de exemplo em `backend/prisma/seed.js`

  7. **Universal CRUD (Automático):**
     - Endpoints REST são criados automaticamente:
       - GET /api/{{modelos}}
       - POST /api/{{modelos}}
       - PUT /api/{{modelos}}/:id
       - DELETE /api/{{modelos}}/:id
</execution_protocol>

<safety_checks>
  - ✅ Modelo não duplica funcionalidade existente
  - ✅ Relações têm `onDelete` apropriado (Cascade, SetNull, Restrict)
  - ✅ Índices em foreign keys e campos de busca
  - ✅ Campos obrigatórios têm valores padrão ou são nullable
  - ✅ Nome do modelo segue PascalCase (ex: TaskComment, não task_comment)
</safety_checks>

<expected_output>
  1. Modelo Prisma completo com relações
  2. Comandos de migração documentados
  3. Schemas Zod de validação (create + update)
  4. Interface TypeScript
  5. Exemplo de uso (create + read)
  6. Documentação de endpoints REST gerados
</expected_output>
````

---

## 📖 Exemplo Completo: Criar Modelo `TaskComment`

### 1. Schema Prisma

```prisma
model TaskComment {
  id        String   @id @default(cuid())
  taskId    String
  authorId  String
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt

  // Relações
  task   OperationalTask @relation(fields: [taskId], references: [id], onDelete: Cascade)
  author User            @relation(fields: [authorId], references: [id])

  // Índices para performance
  @@index([taskId])
  @@index([authorId])
  @@index([createdAt])
}
```

**Atualizar modelo relacionado:**

```prisma
model OperationalTask {
  // ... campos existentes

  // Adicionar relação inversa
  comments TaskComment[]
}

model User {
  // ... campos existentes

  // Adicionar relação inversa
  taskComments TaskComment[]
}
```

### 2. Migração

```bash
cd backend
npx prisma migrate dev --name create_task_comment
npx prisma generate
```

### 3. Validação Zod (Backend)

```javascript
// backend/src/validators/taskComment.js
const { z } = require("zod");

const createTaskCommentSchema = z.object({
  taskId: z.string().cuid(),
  content: z
    .string()
    .min(1, "Comentário não pode ser vazio")
    .max(2000, "Comentário muito longo"),
  // authorId será extraído do token JWT, não do body
});

const updateTaskCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

module.exports = {
  createTaskCommentSchema,
  updateTaskCommentSchema,
};
```

### 4. Tipos TypeScript (Frontend)

```typescript
// frontend/src/types/taskComment.ts
export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;

  // Relações populadas (opcional)
  author?: {
    id: string;
    fullName: string;
  };
}

export interface CreateTaskCommentDTO {
  taskId: string;
  content: string;
}

export interface UpdateTaskCommentDTO {
  content: string;
}
```

### 5. Endpoint Customizado (Backend)

```javascript
// backend/src/server.js
const { createTaskCommentSchema } = require("./validators/taskComment");

// Endpoint customizado para criar comentário (com autenticação)
app.post("/api/tasks/:taskId/comments", authenticate, async (req, res) => {
  try {
    const validated = createTaskCommentSchema.parse({
      ...req.body,
      taskId: req.params.taskId,
    });

    const comment = await prisma.taskComment.create({
      data: {
        ...validated,
        authorId: req.user.id, // Do token JWT
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Validação falhou", errors: error.errors });
    }
    res.status(500).json({ message: "Erro ao criar comentário" });
  }
});

// Listar comentários de uma tarefa
app.get("/api/tasks/:taskId/comments", async (req, res) => {
  const comments = await prisma.taskComment.findMany({
    where: { taskId: req.params.taskId },
    include: {
      author: {
        select: { id: true, fullName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(comments);
});
```

### 6. Cliente API (Frontend)

```typescript
// frontend/src/lib/api/taskComments.ts
import { api } from "../api";
import type { TaskComment, CreateTaskCommentDTO } from "@/types/taskComment";

export const taskCommentAPI = {
  async getByTask(taskId: string): Promise<TaskComment[]> {
    const { data } = await api.get(`/api/tasks/${taskId}/comments`);
    return data;
  },

  async create(
    taskId: string,
    dto: CreateTaskCommentDTO,
  ): Promise<TaskComment> {
    const { data } = await api.post(`/api/tasks/${taskId}/comments`, dto);
    return data;
  },

  async update(commentId: string, content: string): Promise<TaskComment> {
    const { data } = await api.put(`/api/taskComments/${commentId}`, {
      content,
    });
    return data;
  },

  async delete(commentId: string): Promise<void> {
    await api.delete(`/api/taskComments/${commentId}`);
  },
};
```

### 7. Componente React (Frontend)

```tsx
// frontend/src/components/TaskCommentList.tsx
import { useEffect, useState } from "react";
import { taskCommentAPI } from "@/lib/api/taskComments";
import type { TaskComment } from "@/types/taskComment";

interface Props {
  taskId: string;
}

export function TaskCommentList({ taskId }: Props) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskCommentAPI
      .getByTask(taskId)
      .then(setComments)
      .finally(() => setLoading(false));
  }, [taskId]);

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Comentários ({comments.length})</h3>

      {comments.map((comment) => (
        <div key={comment.id} className="border-l-2 pl-4">
          <div className="flex justify-between">
            <span className="font-medium">{comment.author?.fullName}</span>
            <span className="text-sm text-gray-500">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="mt-1">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## ✅ Checklist de Verificação

- [ ] **Schema Prisma:** Modelo criado com todos os campos
- [ ] **Relações:** Configuradas em ambos os lados (modelo + modelo relacionado)
- [ ] **Índices:** Adicionados em foreign keys e campos de busca
- [ ] **Migração:** Executada sem erros
- [ ] **Prisma Client:** Regenerado
- [ ] **Validação Zod:** Schemas create + update criados
- [ ] **Tipos TypeScript:** Interface exportada
- [ ] **Endpoints:** Testados via Postman/cURL
- [ ] **Frontend:** Componente de exemplo funciona

---

## 🔗 Templates Relacionados

- **Base:** `00_FOUNDATION/TEMPLATE_01_ARCHITECT.md`
- **Complementar:** `02_BACKEND_API/CREATE_CUSTOM_ENDPOINT.md`
- **Frontend:** `03_FRONTEND_UI/CREATE_CRUD_VIEW.md`

---

## ⚠️ Decisões Importantes

### `onDelete` Behavior

```prisma
// Cascade: Deleta comentários quando tarefa é deletada
task OperationalTask @relation(fields: [taskId], references: [id], onDelete: Cascade)

// SetNull: Define authorId como null se usuário for deletado
author User @relation(fields: [authorId], references: [id], onDelete: SetNull)

// Restrict: Impede deletar usuário se tiver comentários
author User @relation(fields: [authorId], references: [id], onDelete: Restrict)
```

### Soft Delete (Opcional)

```prisma
model TaskComment {
  // ... campos existentes
  deletedAt DateTime?

  @@index([deletedAt])
}
```

**Query com soft delete:**

```javascript
const activeComments = await prisma.taskComment.findMany({
  where: {
    taskId: "xxx",
    deletedAt: null, // Apenas não deletados
  },
});
```

### Auditoria Automática

```javascript
// Middleware Prisma para auditoria
prisma.$use(async (params, next) => {
  if (params.model === "TaskComment" && params.action === "create") {
    await prisma.auditLog.create({
      data: {
        action: "COMMENT_CREATED",
        entity: "TaskComment",
        resourceId: params.args.data.taskId,
        userId: params.args.data.authorId,
      },
    });
  }

  return next(params);
});
```
