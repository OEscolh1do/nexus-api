# 🔌 Criar Endpoint Customizado - Neonorte | Nexus 2.0

> **🎯 Cenário de Uso**
>
> Você precisa criar um endpoint REST customizado fora do Universal CRUD (ex: `/api/tasks/:id/complete` para marcar tarefa como concluída com lógica específica).
>
> **⏱️ Tempo Estimado:** 10-15 minutos

---

## ✂️ PROMPT PRÉ-CONFIGURADO

```xml
<system_role>
  Atue como Engenheiro Backend para Neonorte Neonorte | Nexus 2.0.

  Stack:
  - Framework: Express.js 5.x
  - ORM: Prisma 5.10+
  - Validação: Zod (mandatória)
  - Segurança: JWT authentication, transações atômicas
</system_role>

<mission>
  Criar endpoint customizado: {{METODO_HTTP}} {{ROTA}}

  Exemplo: POST /api/tasks/:id/complete (marcar tarefa como concluída)
</mission>

<nexus_context>
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/nexus-monolith/backend/src/server.js" />
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/nexus-monolith/backend/prisma/schema.prisma" />
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/CONTEXT.md" />
</nexus_context>

<endpoint_specification>
  **Método HTTP:** {{GET|POST|PUT|PATCH|DELETE}}
  **Rota:** {{ROTA_COMPLETA}}
  **Autenticação:** {{SIM/NAO}}
  **Autorização:** {{ROLES_PERMITIDOS}}

  **Parâmetros:**
  - Path: {{PARAMETROS_PATH}}
  - Query: {{PARAMETROS_QUERY}}
  - Body: {{CAMPOS_BODY}}

  **Lógica de Negócio:**
  - {{REGRA_1}}
  - {{REGRA_2}}
  - {{REGRA_3}}

  **Resposta Esperada:**
  - Sucesso ({{STATUS_CODE}}): {{ESTRUTURA_RESPOSTA}}
  - Erro ({{STATUS_CODE}}): {{MENSAGEM_ERRO}}
</endpoint_specification>

<execution_protocol>
  1. **Criar Validador Zod:**
     - Arquivo: `backend/src/validators/{{recurso}}.js`
     - Schema para request body/params

  2. **Implementar Endpoint:**
     - Localização: `backend/src/server.js` (ou controller customizado)
     - Middleware de autenticação (se necessário)
     - Validação Zod
     - Lógica de negócio
     - Tratamento de erros

  3. **Usar Transações (se aplicável):**
     - Operações multi-tabela DEVEM usar `prisma.$transaction`

  4. **Documentar Endpoint:**
     - Comentário JSDoc no código
     - Atualizar `INTERFACE_MAP.md` (se for rota de UI)

  5. **Testar:**
     - Teste manual via Postman/cURL
     - Verificar validação Zod com dados inválidos
     - Verificar tratamento de erros
</execution_protocol>

<safety_checks>
  - ✅ Validação Zod implementada
  - ✅ Autenticação/Autorização configurada
  - ✅ Transações usadas para operações multi-tabela
  - ✅ Erros retornam status HTTP apropriado
  - ✅ Dados sensíveis não são expostos em logs
  - ✅ SQL Injection prevenido (Prisma ORM)
</safety_checks>

<expected_output>
  1. Schema Zod de validação
  2. Código do endpoint completo
  3. Exemplo de request (cURL)
  4. Exemplo de response (JSON)
  5. Documentação de erros possíveis
  6. Teste manual documentado
</expected_output>
```

---

## 📖 Exemplo Completo: POST /api/tasks/:id/complete

### Cenário

Marcar tarefa como concluída, atualizando:

- Status para "COMPLETED"
- `completionPercent` para 100
- Registrar no `AuditLog`
- Verificar se todas as subtarefas (checklist) estão completas

### 1. Validador Zod

```javascript
// backend/src/validators/task.js
const { z } = require("zod");

const completeTaskSchema = z.object({
  notes: z.string().max(500).optional(), // Notas opcionais ao completar
});

module.exports = {
  completeTaskSchema,
  // ... outros schemas
};
```

### 2. Endpoint no Backend

```javascript
// backend/src/server.js
const { completeTaskSchema } = require("./validators/task");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * @route POST /api/tasks/:id/complete
 * @desc Marca tarefa como concluída
 * @access Autenticado (ADMIN, COORDENACAO, ou assignee)
 */
app.post("/api/tasks/:id/complete", authenticate, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    // Validar body
    const validated = completeTaskSchema.parse(req.body);

    // Buscar tarefa
    const task = await prisma.operationalTask.findUnique({
      where: { id: taskId },
      include: {
        checklists: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    // Verificar autorização
    const isAssignee = task.assignedTo === userId;
    const isAdmin = req.user.role === "ADMIN";
    const isCoord = req.user.role === "COORDENACAO";

    if (!isAssignee && !isAdmin && !isCoord) {
      return res.status(403).json({
        message: "Você não tem permissão para completar esta tarefa",
      });
    }

    // Verificar se todas as subtarefas estão completas
    const allChecklistsComplete = task.checklists.every((checklist) =>
      checklist.items.every((item) => item.isCompleted),
    );

    if (!allChecklistsComplete) {
      return res.status(400).json({
        message:
          "Complete todos os itens do checklist antes de finalizar a tarefa",
      });
    }

    // Atualizar tarefa + criar audit log (transação atômica)
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar tarefa
      const updatedTask = await tx.operationalTask.update({
        where: { id: taskId },
        data: {
          status: "COMPLETED",
          completionPercent: 100,
          updatedAt: new Date(),
        },
      });

      // Registrar auditoria
      await tx.auditLog.create({
        data: {
          userId: userId,
          action: "TASK_COMPLETED",
          entity: "OperationalTask",
          resourceId: taskId,
          details: JSON.stringify({
            notes: validated.notes,
            completedBy: req.user.fullName,
          }),
        },
      });

      return updatedTask;
    });

    res.json({
      message: "Tarefa concluída com sucesso",
      task: result,
    });
  } catch (error) {
    console.error("Error completing task:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validação falhou",
        errors: error.errors,
      });
    }

    res.status(500).json({
      message: "Erro ao completar tarefa",
      error: error.message,
    });
  }
});
```

### 3. Teste com cURL

```bash
# Sucesso
curl -X POST http://localhost:3000/api/tasks/clx123abc/complete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Tarefa concluída conforme planejado"
  }'

# Response 200:
{
  "message": "Tarefa concluída com sucesso",
  "task": {
    "id": "clx123abc",
    "title": "Implementar feature X",
    "status": "COMPLETED",
    "completionPercent": 100,
    "updatedAt": "2026-01-25T15:30:00Z"
  }
}

# Erro: Checklist incompleto
# Response 400:
{
  "message": "Complete todos os itens do checklist antes de finalizar a tarefa"
}

# Erro: Não autorizado
# Response 403:
{
  "message": "Você não tem permissão para completar esta tarefa"
}
```

### 4. Cliente API (Frontend)

```typescript
// frontend/src/lib/api/tasks.ts
import { api } from "../api";

export const taskAPI = {
  async complete(taskId: string, notes?: string) {
    const { data } = await api.post(`/api/tasks/${taskId}/complete`, {
      notes,
    });
    return data;
  },
};
```

### 5. Uso no Frontend

```tsx
// frontend/src/modules/tasks/TaskCard.tsx
import { taskAPI } from "@/lib/api/tasks";
import { toast } from "sonner";

export function TaskCard({ task, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    try {
      setLoading(true);
      await taskAPI.complete(task.id, "Concluído via interface");
      toast.success("Tarefa concluída!");
      onUpdate(); // Recarregar lista
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao completar tarefa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>{task.title}</h3>
      <button
        onClick={handleComplete}
        disabled={loading || task.status === "COMPLETED"}
      >
        {loading ? "Processando..." : "Marcar como Concluída"}
      </button>
    </div>
  );
}
```

---

## ✅ Checklist de Verificação

- [ ] **Validação Zod:** Schema criado e aplicado
- [ ] **Autenticação:** Middleware `authenticate` aplicado
- [ ] **Autorização:** Verificação de permissões implementada
- [ ] **Lógica de Negócio:** Regras específicas implementadas
- [ ] **Transação:** Operações multi-tabela em `$transaction`
- [ ] **Tratamento de Erros:** Try-catch com status HTTP apropriados
- [ ] **Teste Manual:** Testado com Postman/cURL
- [ ] **Teste de Validação:** Testado com dados inválidos
- [ ] **Teste de Autorização:** Testado com usuário sem permissão
- [ ] **Documentação:** Comentário JSDoc adicionado

---

## 🔗 Templates Relacionados

- **Base:** `00_FOUNDATION/TEMPLATE_02_ENGINEER.md`
- **Validação:** `02_BACKEND_API/ADD_ZOD_VALIDATION.md`
- **Database:** `01_DATABASE/CREATE_NEW_MODEL.md`
- **Frontend:** `03_FRONTEND_UI/CREATE_CRUD_VIEW.md`

---

## ⚠️ Padrões Importantes

### Middleware de Autenticação

```javascript
// backend/src/middleware/authenticate.js
const jwt = require("jsonwebtoken");

async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Token não fornecido" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token inválido" });
  }
}

module.exports = { authenticate };
```

### Middleware de Autorização (RBAC)

```javascript
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Você não tem permissão para acessar este recurso",
      });
    }

    next();
  };
}

// Uso:
app.delete(
  "/api/projects/:id",
  authenticate,
  authorize("ADMIN", "COORDENACAO"),
  async (req, res) => {
    // Apenas ADMIN e COORDENACAO podem deletar projetos
  },
);
```

### Tratamento de Erros Prisma

```javascript
const { Prisma } = require("@prisma/client");

app.post("/api/resource", async (req, res) => {
  try {
    // ... lógica
  } catch (error) {
    // Erro de validação Zod
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validação falhou",
        errors: error.errors,
      });
    }

    // Erros Prisma conhecidos
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint violation
      if (error.code === "P2002") {
        return res.status(400).json({
          message: "Registro duplicado",
          field: error.meta?.target,
        });
      }

      // Foreign key constraint failed
      if (error.code === "P2003") {
        return res.status(400).json({
          message: "Referência inválida",
        });
      }

      // Record not found
      if (error.code === "P2025") {
        return res.status(404).json({
          message: "Registro não encontrado",
        });
      }
    }

    // Erro genérico
    console.error("Unexpected error:", error);
    res.status(500).json({
      message: "Erro interno do servidor",
    });
  }
});
```

### Paginação

```javascript
app.get("/api/tasks", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    prisma.operationalTask.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.operationalTask.count(),
  ]);

  res.json({
    data: tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
```
