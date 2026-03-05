# 🛡️ Adicionar Validação Zod - Neonorte | Nexus 2.0

> **🎯 Cenário de Uso**
>
> Você precisa adicionar ou melhorar validação Zod em um endpoint existente que não tem validação adequada.
>
> **⏱️ Tempo Estimado:** 5-10 minutos

---

## ✂️ PROMPT PRÉ-CONFIGURADO

```xml
<system_role>
  Atue como Especialista em Segurança para Neonorte Neonorte | Nexus 2.0.

  Princípio: "Paranoia Ativa" - TODA entrada de dados DEVE ser validada.
  Biblioteca: Zod 4.x (validação mandatória)
</system_role>

<mission>
  Adicionar validação Zod ao endpoint: {{METODO}} {{ROTA}}

  Exemplo: Adicionar validação ao endpoint POST /api/projects
</mission>

<nexus_context>
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/nexus-monolith/backend/src/server.js" />
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/nexus-monolith/backend/prisma/schema.prisma" />
</nexus_context>

<validation_specification>
  **Endpoint:** {{METODO}} {{ROTA}}
  **Modelo Prisma:** {{NOME_DO_MODELO}}

  **Campos a Validar:**
  - {{CAMPO_1}}: {{TIPO}} - {{REGRAS_VALIDACAO}}
  - {{CAMPO_2}}: {{TIPO}} - {{REGRAS_VALIDACAO}}
  - {{CAMPO_3}}: {{TIPO}} - {{REGRAS_VALIDACAO}}

  **Regras de Negócio:**
  - {{REGRA_1}}
  - {{REGRA_2}}
</validation_specification>

<execution_protocol>
  1. **Criar/Atualizar Validador:**
     - Arquivo: `backend/src/validators/{{recurso}}.js`
     - Importar Zod: `const { z } = require('zod');`

  2. **Definir Schema Zod:**
     - Tipos básicos: `z.string()`, `z.number()`, `z.boolean()`, `z.date()`
     - Validações: `.min()`, `.max()`, `.email()`, `.url()`, `.regex()`
     - Opcionais: `.optional()`, `.nullable()`
     - Defaults: `.default(valor)`
     - Enums: `z.enum(['VALOR1', 'VALOR2'])`

  3. **Aplicar no Endpoint:**
     - Importar schema no `server.js`
     - Usar `schema.parse(req.body)` dentro de try-catch
     - Retornar erro 400 com detalhes se validação falhar

  4. **Testar Validação:**
     - Testar com dados válidos (deve passar)
     - Testar com dados inválidos (deve retornar 400)
     - Verificar mensagens de erro são claras
</execution_protocol>

<safety_checks>
  - ✅ Todos os campos obrigatórios são validados
  - ✅ Tipos de dados estão corretos
  - ✅ Limites (min/max) são razoáveis
  - ✅ Enums correspondem aos valores do Prisma
  - ✅ Mensagens de erro são claras para o usuário
  - ✅ Campos sensíveis (senha) têm validação extra
</safety_checks>

<expected_output>
  1. Schema Zod completo
  2. Endpoint atualizado com validação
  3. Exemplo de request válido
  4. Exemplo de request inválido + erro retornado
  5. Testes de validação documentados
</expected_output>
```

---

## 📖 Exemplo Completo: Validar POST /api/projects

### 1. Schema Prisma (Referência)

```prisma
model Project {
  id                 String   @id @default(cuid())
  strategyId         String?
  managerId          String?
  title              String
  description        String?  @db.Text
  progressPercentage Float    @default(0)
  status             String   @default("PLANEJAMENTO")
  type               String   @default("GENERIC")
  startDate          DateTime?
  endDate            DateTime?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

### 2. Validador Zod

```javascript
// backend/src/validators/project.js
const { z } = require("zod");

// Enum de status (sincronizado com regras de negócio)
const projectStatusEnum = z.enum([
  "PLANEJAMENTO",
  "ATIVO",
  "PAUSADO",
  "CONCLUIDO",
  "CANCELADO",
]);

// Enum de tipo
const projectTypeEnum = z.enum([
  "GENERIC",
  "SOLAR",
  "INFRASTRUCTURE",
  "SOFTWARE",
]);

// Schema para criação de projeto
const createProjectSchema = z
  .object({
    title: z
      .string()
      .min(3, "Título deve ter no mínimo 3 caracteres")
      .max(200, "Título muito longo"),

    description: z.string().max(5000, "Descrição muito longa").optional(),

    strategyId: z.string().cuid("ID de estratégia inválido").optional(),

    managerId: z.string().cuid("ID de gerente inválido").optional(),

    type: projectTypeEnum.default("GENERIC"),

    status: projectStatusEnum.default("PLANEJAMENTO"),

    startDate: z
      .string()
      .datetime("Data de início inválida")
      .optional()
      .or(z.date()),

    endDate: z
      .string()
      .datetime("Data de fim inválida")
      .optional()
      .or(z.date()),

    progressPercentage: z
      .number()
      .min(0, "Progresso não pode ser negativo")
      .max(100, "Progresso não pode exceder 100%")
      .default(0),
  })
  .refine(
    (data) => {
      // Validação customizada: endDate deve ser após startDate
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: "Data de fim deve ser posterior à data de início",
      path: ["endDate"],
    },
  );

// Schema para atualização (todos os campos opcionais)
const updateProjectSchema = createProjectSchema.partial();

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  projectStatusEnum,
  projectTypeEnum,
};
```

### 3. Endpoint com Validação

```javascript
// backend/src/server.js
const {
  createProjectSchema,
  updateProjectSchema,
} = require("./validators/project");
const { PrismaClient } = require("@prisma/client");
const { z } = require("zod");
const prisma = new PrismaClient();

// CREATE
app.post("/api/projects", authenticate, async (req, res) => {
  try {
    // Validar request body
    const validated = createProjectSchema.parse(req.body);

    // Verificar se strategyId existe (se fornecido)
    if (validated.strategyId) {
      const strategyExists = await prisma.strategy.findUnique({
        where: { id: validated.strategyId },
      });

      if (!strategyExists) {
        return res.status(400).json({
          message: "Estratégia não encontrada",
        });
      }
    }

    // Verificar se managerId existe (se fornecido)
    if (validated.managerId) {
      const managerExists = await prisma.user.findUnique({
        where: { id: validated.managerId },
      });

      if (!managerExists) {
        return res.status(400).json({
          message: "Gerente não encontrado",
        });
      }
    }

    // Criar projeto
    const project = await prisma.project.create({
      data: validated,
    });

    res.status(201).json(project);
  } catch (error) {
    // Erro de validação Zod
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validação falhou",
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    console.error("Error creating project:", error);
    res.status(500).json({
      message: "Erro ao criar projeto",
    });
  }
});

// UPDATE
app.put("/api/projects/:id", authenticate, async (req, res) => {
  try {
    const validated = updateProjectSchema.parse(req.body);

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: validated,
    });

    res.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validação falhou",
        errors: error.errors,
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Projeto não encontrado",
      });
    }

    res.status(500).json({
      message: "Erro ao atualizar projeto",
    });
  }
});
```

### 4. Testes de Validação

```bash
# ✅ Request VÁLIDO
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Projeto Solar Residencial",
    "description": "Instalação de sistema fotovoltaico 10kWp",
    "type": "SOLAR",
    "startDate": "2026-02-01T00:00:00Z",
    "endDate": "2026-03-15T00:00:00Z"
  }'

# Response 201:
{
  "id": "clx123abc",
  "title": "Projeto Solar Residencial",
  "type": "SOLAR",
  "status": "PLANEJAMENTO",
  "progressPercentage": 0,
  ...
}

# ❌ Request INVÁLIDO: Título muito curto
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AB"
  }'

# Response 400:
{
  "message": "Validação falhou",
  "errors": [
    {
      "field": "title",
      "message": "Título deve ter no mínimo 3 caracteres"
    }
  ]
}

# ❌ Request INVÁLIDO: endDate antes de startDate
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Projeto Teste",
    "startDate": "2026-03-01T00:00:00Z",
    "endDate": "2026-02-01T00:00:00Z"
  }'

# Response 400:
{
  "message": "Validação falhou",
  "errors": [
    {
      "field": "endDate",
      "message": "Data de fim deve ser posterior à data de início"
    }
  ]
}

# ❌ Request INVÁLIDO: Tipo inválido
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Projeto Teste",
    "type": "INVALID_TYPE"
  }'

# Response 400:
{
  "message": "Validação falhou",
  "errors": [
    {
      "field": "type",
      "message": "Invalid enum value. Expected 'GENERIC' | 'SOLAR' | 'INFRASTRUCTURE' | 'SOFTWARE', received 'INVALID_TYPE'"
    }
  ]
}
```

---

## ✅ Checklist de Verificação

- [ ] **Schema Zod:** Criado com todos os campos
- [ ] **Tipos:** Correspondem ao schema Prisma
- [ ] **Validações:** Min/max, email, regex aplicados
- [ ] **Enums:** Sincronizados com valores do Prisma
- [ ] **Mensagens de Erro:** Claras e em português
- [ ] **Validações Customizadas:** `.refine()` para regras complexas
- [ ] **Endpoint:** Usa `schema.parse()` em try-catch
- [ ] **Teste Válido:** Request válido retorna 201/200
- [ ] **Teste Inválido:** Request inválido retorna 400 com detalhes
- [ ] **Documentação:** Comentários JSDoc adicionados

---

## 🔗 Templates Relacionados

- **Base:** `00_FOUNDATION/TEMPLATE_02_ENGINEER.md`
- **Endpoint:** `02_BACKEND_API/CREATE_CUSTOM_ENDPOINT.md`
- **Database:** `01_DATABASE/ADD_FIELD_TO_MODEL.md`

---

## ⚠️ Validações Avançadas

### Validação de Email

```javascript
const userSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase().trim(),
});
```

### Validação de Senha

```javascript
const passwordSchema = z
  .string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número")
  .regex(/[^A-Za-z0-9]/, "Senha deve conter pelo menos um caractere especial");
```

### Validação de CPF/CNPJ

```javascript
function validarCPF(cpf) {
  // Lógica de validação de CPF
  return true; // ou false
}

const clienteSchema = z.object({
  cpf: z
    .string()
    .regex(/^\d{11}$/, "CPF deve conter 11 dígitos")
    .refine(validarCPF, "CPF inválido"),
});
```

### Validação Condicional

```javascript
const projectSchema = z
  .object({
    type: z.enum(["SOLAR", "GENERIC"]),
    details: z.string().optional(),
  })
  .refine(
    (data) => {
      // Se tipo for SOLAR, details é obrigatório
      if (data.type === "SOLAR") {
        return !!data.details;
      }
      return true;
    },
    {
      message: "Projetos solares devem ter detalhes técnicos",
      path: ["details"],
    },
  );
```

### Validação de Arrays

```javascript
const taskSchema = z.object({
  tags: z
    .array(z.string())
    .min(1, "Adicione pelo menos uma tag")
    .max(10, "Máximo de 10 tags"),

  assignees: z.array(z.string().cuid()).optional(),
});
```

### Validação de Objetos Aninhados

```javascript
const addressSchema = z.object({
  street: z.string(),
  number: z.string(),
  city: z.string(),
  state: z.string().length(2, "Estado deve ter 2 caracteres"),
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
});

const clientSchema = z.object({
  name: z.string(),
  address: addressSchema,
});
```

### Transformações

```javascript
const projectSchema = z.object({
  title: z
    .string()
    .trim() // Remove espaços
    .transform((val) => val.toUpperCase()), // Converte para maiúsculas

  budget: z.string().transform((val) => parseFloat(val.replace(",", "."))), // "1.500,50" -> 1500.50
});
```
