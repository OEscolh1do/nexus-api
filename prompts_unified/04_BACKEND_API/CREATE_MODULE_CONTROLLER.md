# 🎮 Criar Controller Modular - Neonorte | Nexus 2.0

> **🎯 Cenário de Uso**
>
> Você precisa criar um controller modular seguindo o padrão do Neonorte | Nexus (OpsController, StrategyController, CommercialController).
>
> **⏱️ Tempo Estimado:** 30-40 minutos

---

## 📖 Exemplo Real: OpsController

O Neonorte | Nexus usa controllers modulares para organizar endpoints por domínio de negócio.

---

## ✂️ PROMPT PRÉ-CONFIGURADO

````xml
<system_role>
  Atue como Backend Engineer especializado em arquitetura modular.

  Stack:
  - Node.js 18+ / Express.js
  - Prisma ORM
  - Zod (validação)
</system_role>

<mission>
  Criar controller modular para: {{NOME_DO_MODULO}}

  Exemplo: "Criar HRController para gerenciar férias e ponto"
</mission>

<nexus_context>
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/nexus-monolith/backend/src/modules/{{modulo}}/" />
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/nexus-monolith/backend/src/server.js" />
  <reference path="backend/src/modules/ops/ops.controller.js" description="Exemplo de controller" />
</nexus_context>

<controller_specification>
  **Nome do Controller:** {{Nome}}Controller
  **Modelo Prisma:** {{NomeDoModelo}}
  **Endpoints:**
  - GET /api/v2/{{modulo}}/{{recursos}} - Listar todos
  - GET /api/v2/{{modulo}}/{{recursos}}/:id - Buscar por ID
  - POST /api/v2/{{modulo}}/{{recursos}} - Criar
  - PUT /api/v2/{{modulo}}/{{recursos}}/:id - Atualizar
  - DELETE /api/v2/{{modulo}}/{{recursos}}/:id - Deletar

  **Endpoints Customizados:**
  - {{METODO}} {{ROTA}} - {{DESCRICAO}}
</controller_specification>

<execution_protocol>
  1. **Criar Estrutura de Diretórios:**
     ```
     backend/src/modules/{{modulo}}/
     ├── {{modulo}}.controller.js
     ├── {{modulo}}.service.js (opcional)
     └── schemas/
         └── {{modulo}}.schemas.js
     ```

  2. **Criar Controller:**
     - Classe com métodos estáticos
     - CRUD completo
     - Tratamento de erros
     - Validação Zod

  3. **Registrar Rotas no server.js:**
     - Importar controller
     - Definir rotas
     - Aplicar middleware de autenticação

  4. **Criar Schemas Zod (Opcional):**
     - Schema de criação
     - Schema de atualização

  5. **Testar Endpoints:**
     - Postman/cURL
     - Verificar validação
     - Verificar erros
</execution_protocol>

<expected_output>
  1. Controller completo com CRUD
  2. Rotas registradas no server.js
  3. Schemas Zod (se aplicável)
  4. Exemplos de request/response
  5. Testes manuais documentados
</expected_output>
````

---

## 📝 Implementação Passo-a-Passo

### 1. Estrutura de Diretórios

```bash
backend/src/modules/hr/
├── hr.controller.js
├── hr.service.js
└── schemas/
    └── hr.schemas.js
```

### 2. Controller Completo

```javascript
// backend/src/modules/hr/hr.controller.js
const { PrismaClient } = require("@prisma/client");
const {
  createLeaveSchema,
  updateLeaveSchema,
} = require("./schemas/hr.schemas");
const { z } = require("zod");

const prisma = new PrismaClient();

class HRController {
  /**
   * GET /api/v2/hr/leaves
   * Lista todas as solicitações de férias
   */
  static async getAllLeaves(req, res) {
    try {
      const { status, requesterId } = req.query;

      const where = {};
      if (status) where.status = status;
      if (requesterId) where.requesterId = requesterId;

      const leaves = await prisma.hRLeave.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              fullName: true,
            },
          },
          approver: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({ success: true, data: leaves });
    } catch (error) {
      console.error("Error fetching leaves:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/v2/hr/leaves/:id
   * Busca solicitação de férias por ID
   */
  static async getLeaveById(req, res) {
    try {
      const { id } = req.params;

      const leave = await prisma.hRLeave.findUnique({
        where: { id },
        include: {
          requester: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          approver: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      if (!leave) {
        return res.status(404).json({
          success: false,
          error: "Solicitação não encontrada",
        });
      }

      res.json({ success: true, data: leave });
    } catch (error) {
      console.error("Error fetching leave:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/v2/hr/leaves
   * Cria nova solicitação de férias
   */
  static async createLeave(req, res) {
    try {
      // Validar dados
      const validated = createLeaveSchema.parse(req.body);

      // Verificar se usuário existe
      const requester = await prisma.user.findUnique({
        where: { id: validated.requesterId },
      });

      if (!requester) {
        return res.status(400).json({
          success: false,
          error: "Solicitante não encontrado",
        });
      }

      // Criar solicitação
      const leave = await prisma.hRLeave.create({
        data: {
          ...validated,
          status: "PENDENTE",
        },
        include: {
          requester: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      res.status(201).json({ success: true, data: leave });
    } catch (error) {
      console.error("Error creating leave:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validação falhou",
          details: error.errors,
        });
      }

      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PUT /api/v2/hr/leaves/:id
   * Atualiza solicitação de férias
   */
  static async updateLeave(req, res) {
    try {
      const { id } = req.params;

      // Validar dados
      const validated = updateLeaveSchema.parse(req.body);

      // Verificar se existe
      const existing = await prisma.hRLeave.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: "Solicitação não encontrada",
        });
      }

      // Atualizar
      const updated = await prisma.hRLeave.update({
        where: { id },
        data: validated,
        include: {
          requester: {
            select: {
              id: true,
              fullName: true,
            },
          },
          approver: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      console.error("Error updating leave:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validação falhou",
          details: error.errors,
        });
      }

      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/v2/hr/leaves/:id
   * Deleta solicitação de férias
   */
  static async deleteLeave(req, res) {
    try {
      const { id } = req.params;

      // Verificar se existe
      const existing = await prisma.hRLeave.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: "Solicitação não encontrada",
        });
      }

      // Verificar se pode deletar (ex: não pode deletar se já aprovado)
      if (existing.status === "APROVADO") {
        return res.status(400).json({
          success: false,
          error: "Não é possível deletar solicitação aprovada",
        });
      }

      await prisma.hRLeave.delete({
        where: { id },
      });

      res.json({ success: true, message: "Solicitação deletada" });
    } catch (error) {
      console.error("Error deleting leave:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PATCH /api/v2/hr/leaves/:id/approve
   * Aprovar solicitação de férias (endpoint customizado)
   */
  static async approveLeave(req, res) {
    try {
      const { id } = req.params;
      const approverId = req.user.id; // Do middleware de autenticação

      // Verificar se existe
      const leave = await prisma.hRLeave.findUnique({
        where: { id },
      });

      if (!leave) {
        return res.status(404).json({
          success: false,
          error: "Solicitação não encontrada",
        });
      }

      // Verificar se já foi processada
      if (leave.status !== "PENDENTE") {
        return res.status(400).json({
          success: false,
          error: "Solicitação já foi processada",
        });
      }

      // Aprovar
      const approved = await prisma.hRLeave.update({
        where: { id },
        data: {
          status: "APROVADO",
          approverId,
        },
        include: {
          requester: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          approver: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      // TODO: Enviar notificação ao solicitante

      res.json({ success: true, data: approved });
    } catch (error) {
      console.error("Error approving leave:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PATCH /api/v2/hr/leaves/:id/reject
   * Rejeitar solicitação de férias (endpoint customizado)
   */
  static async rejectLeave(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const approverId = req.user.id;

      const leave = await prisma.hRLeave.findUnique({
        where: { id },
      });

      if (!leave) {
        return res.status(404).json({
          success: false,
          error: "Solicitação não encontrada",
        });
      }

      if (leave.status !== "PENDENTE") {
        return res.status(400).json({
          success: false,
          error: "Solicitação já foi processada",
        });
      }

      const rejected = await prisma.hRLeave.update({
        where: { id },
        data: {
          status: "REJEITADO",
          approverId,
          reason: reason || "Sem justificativa",
        },
        include: {
          requester: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          approver: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      res.json({ success: true, data: rejected });
    } catch (error) {
      console.error("Error rejecting leave:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = HRController;
```

### 3. Schemas Zod

```javascript
// backend/src/modules/hr/schemas/hr.schemas.js
const { z } = require("zod");

const createLeaveSchema = z
  .object({
    type: z.enum(["FERIAS", "LICENCA", "ATESTADO"]),
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()),
    requesterId: z.string().cuid(),
    reason: z.string().max(500).optional(),
    description: z.string().max(1000).optional(),
    destination: z.string().max(200).optional(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "Data de fim deve ser posterior à data de início",
    path: ["endDate"],
  });

const updateLeaveSchema = createLeaveSchema.partial();

module.exports = {
  createLeaveSchema,
  updateLeaveSchema,
};
```

### 4. Registrar Rotas no server.js

```javascript
// backend/src/server.js
const HRController = require("./modules/hr/hr.controller");

// HR Routes
app.get("/api/v2/hr/leaves", authenticateToken, HRController.getAllLeaves);
app.get("/api/v2/hr/leaves/:id", authenticateToken, HRController.getLeaveById);
app.post("/api/v2/hr/leaves", authenticateToken, HRController.createLeave);
app.put("/api/v2/hr/leaves/:id", authenticateToken, HRController.updateLeave);
app.delete(
  "/api/v2/hr/leaves/:id",
  authenticateToken,
  HRController.deleteLeave,
);

// Custom endpoints
app.patch(
  "/api/v2/hr/leaves/:id/approve",
  authenticateToken,
  HRController.approveLeave,
);
app.patch(
  "/api/v2/hr/leaves/:id/reject",
  authenticateToken,
  HRController.rejectLeave,
);
```

---

## ✅ Checklist de Verificação

- [ ] **Controller:** Classe criada com métodos estáticos
- [ ] **CRUD Completo:** GET, POST, PUT, DELETE
- [ ] **Validação Zod:** Schemas criados e aplicados
- [ ] **Tratamento de Erros:** Try-catch em todos os métodos
- [ ] **Includes:** Relações Prisma populadas
- [ ] **Rotas Registradas:** server.js atualizado
- [ ] **Autenticação:** Middleware aplicado
- [ ] **Testes Manuais:** Postman/cURL executados
- [ ] **Documentação:** JSDoc nos métodos

---

## 🔗 Templates Relacionados

- **Validação:** `02_BACKEND_API/ADD_ZOD_VALIDATION.md`
- **Service:** `02_BACKEND_API/CREATE_SERVICE_LAYER.md`
- **Endpoint:** `02_BACKEND_API/CREATE_CUSTOM_ENDPOINT.md`
