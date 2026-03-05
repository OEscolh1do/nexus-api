# 🗄️ Adicionar Campo a Modelo Existente - Neonorte | Nexus 2.0

> **🎯 Cenário de Uso**
>
> Você precisa adicionar um novo campo a um modelo Prisma existente (ex: adicionar `priority` ao modelo `OperationalTask`).
>
> **⏱️ Tempo Estimado:** 5-10 minutos

---

## ✂️ PROMPT PRÉ-CONFIGURADO

````xml
<system_role>
  Atue como Arquiteto de Banco de Dados para Neonorte Neonorte | Nexus 2.0.

  Stack:
  - ORM: Prisma 5.10+
  - Database: MySQL 8.0
  - Validação: Zod (mandatória)
</system_role>

<mission>
  Adicionar campo "{{NOME_DO_CAMPO}}" ao modelo "{{NOME_DO_MODELO}}" no schema Prisma.

  Exemplo: Adicionar campo `priority` (enum) ao modelo `OperationalTask`.
</mission>

<nexus_context>
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/nexus-monolith/backend/prisma/schema.prisma" />
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/CONTEXT.md" />
</nexus_context>

<field_specification>
  **Nome do Campo:** {{NOME_DO_CAMPO}}
  **Tipo:** {{TIPO_PRISMA}}
  **Obrigatório:** {{SIM/NAO}}
  **Valor Padrão:** {{VALOR_DEFAULT}}
  **Descrição:** {{PARA_QUE_SERVE}}

  <!-- Exemplos de tipos Prisma:
  - String
  - Int, Float
  - Boolean
  - DateTime
  - String (com enum via Zod)
  - Json
  -->
</field_specification>

<execution_protocol>
  1. **Análise do Schema Atual:**
     - Leia o modelo {{NOME_DO_MODELO}} no schema.prisma
     - Verifique relações existentes
     - Identifique índices e constraints

  2. **Modificação do Schema:**
     - Adicione o campo ao modelo
     - Adicione comentário explicativo
     - Se for enum, documente os valores possíveis

  3. **Migração Prisma:**
     - Gere comando de migração:
       ```bash
       cd backend
       npx prisma migrate dev --name add_{{nome_campo}}_to_{{modelo}}
       ```

  4. **Validação Zod (Backend):**
     - Crie/atualize schema Zod em `backend/src/validators/{{modelo}}.js`
     - Exemplo para enum:
       ```javascript
       const updateTaskSchema = z.object({
         priority: z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]).optional()
       });
       ```

  5. **Tipos TypeScript (Frontend):**
     - Atualize interface em `frontend/src/types/{{modelo}}.ts`
     - Exemplo:
       ```typescript
       export interface OperationalTask {
         // ... campos existentes
         priority?: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
       }
       ```

  6. **Atualização de Seed (Opcional):**
     - Se necessário, atualize `backend/prisma/seed.js` com dados de exemplo
</execution_protocol>

<safety_checks>
  - ✅ Campo não quebra relações existentes
  - ✅ Valor padrão é compatível com registros existentes
  - ✅ Validação Zod está sincronizada com schema Prisma
  - ✅ Migração pode ser revertida se necessário
</safety_checks>

<expected_output>
  1. Schema Prisma atualizado com o novo campo
  2. Comando de migração documentado
  3. Schema Zod de validação
  4. Interface TypeScript atualizada
  5. Exemplo de uso no frontend (se aplicável)
</expected_output>
````

---

## 📖 Exemplo Completo: Adicionar Campo `priority` a `OperationalTask`

### 1. Schema Prisma (ANTES)

```prisma
model OperationalTask {
  id                String   @id @default(cuid())
  projectId         String?
  title             String
  description       String?  @db.Text
  status            String   @default("BACKLOG")
  assignedTo        String?
  completionPercent Float    @default(0)
  // ... outros campos
}
```

### 2. Schema Prisma (DEPOIS)

```prisma
model OperationalTask {
  id                String   @id @default(cuid())
  projectId         String?
  title             String
  description       String?  @db.Text
  status            String   @default("BACKLOG")
  priority          String   @default("MEDIA") // Novo campo: BAIXA, MEDIA, ALTA, CRITICA
  assignedTo        String?
  completionPercent Float    @default(0)
  // ... outros campos
}
```

### 3. Comando de Migração

```bash
cd backend
npx prisma migrate dev --name add_priority_to_operational_task
```

### 4. Validação Zod (Backend)

```javascript
// backend/src/validators/task.js
const { z } = require("zod");

const priorityEnum = z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]);

const createTaskSchema = z.object({
  title: z.string().min(3).max(200),
  projectId: z.string().cuid().optional(),
  priority: priorityEnum.default("MEDIA"),
  // ... outros campos
});

const updateTaskSchema = z
  .object({
    priority: priorityEnum.optional(),
    // ... outros campos
  })
  .partial();

module.exports = { createTaskSchema, updateTaskSchema, priorityEnum };
```

### 5. Tipos TypeScript (Frontend)

```typescript
// frontend/src/types/task.ts
export type TaskPriority = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";

export interface OperationalTask {
  id: string;
  title: string;
  status: string;
  priority: TaskPriority;
  // ... outros campos
}
```

### 6. Uso no Frontend (Exemplo)

```tsx
// frontend/src/modules/tasks/TaskFormModal.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  title: z.string().min(3),
  priority: z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]),
});

export function TaskFormModal() {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { priority: "MEDIA" },
  });

  return (
    <form>
      <input {...register("title")} />

      <select {...register("priority")}>
        <option value="BAIXA">🟢 Baixa</option>
        <option value="MEDIA">🟡 Média</option>
        <option value="ALTA">🟠 Alta</option>
        <option value="CRITICA">🔴 Crítica</option>
      </select>

      <button type="submit">Salvar</button>
    </form>
  );
}
```

---

## ✅ Checklist de Verificação

Após executar o prompt, verifique:

- [ ] **Schema Prisma:** Campo adicionado com tipo correto
- [ ] **Migração:** Comando executado sem erros (`npx prisma migrate dev`)
- [ ] **Prisma Client:** Regenerado (`npx prisma generate`)
- [ ] **Validação Zod:** Schema criado/atualizado
- [ ] **Tipos TypeScript:** Interface atualizada
- [ ] **Backend Compila:** `cd backend && npm start` sem erros
- [ ] **Frontend Compila:** `cd frontend && npm run build` sem erros
- [ ] **Teste Manual:** Criar/editar registro com novo campo funciona

---

## 🔗 Templates Relacionados

- **Base:** `00_FOUNDATION/TEMPLATE_01_ARCHITECT.md` (Planejamento)
- **Complementar:** `01_DATABASE/CREATE_NEW_MODEL.md` (Criar modelo do zero)
- **Frontend:** `03_FRONTEND_UI/ADD_FORM_FIELD.md` (Adicionar campo ao formulário)

---

## ⚠️ Casos Especiais

### Campo com Relação (Foreign Key)

```prisma
model OperationalTask {
  // ... campos existentes
  categoryId String?
  category   TaskCategory? @relation(fields: [categoryId], references: [id])

  @@index([categoryId])
}
```

### Campo JSON (Dados Flexíveis)

```prisma
model Project {
  // ... campos existentes
  metadata Json? // Armazena dados variáveis
}
```

**Validação Zod para JSON:**

```javascript
const metadataSchema = z
  .object({
    customField1: z.string().optional(),
    customField2: z.number().optional(),
  })
  .passthrough(); // Permite campos extras

const projectSchema = z.object({
  metadata: metadataSchema.optional(),
});
```

---

## 📝 Notas Importantes

1. **Registros Existentes:** Se o campo for obrigatório (`required`), você DEVE fornecer um valor padrão ou a migração falhará.

2. **Enums no Prisma:** Prisma suporta enums nativos, mas para MySQL recomenda-se usar `String` + validação Zod para flexibilidade.

3. **Performance:** Campos frequentemente filtrados devem ter índice:

   ```prisma
   @@index([priority])
   ```

4. **Auditoria:** Campos críticos podem precisar de log no `AuditLog`:
   ```javascript
   await prisma.auditLog.create({
     data: {
       userId: req.user.id,
       action: "TASK_PRIORITY_CHANGED",
       resourceId: task.id,
       details: JSON.stringify({ oldPriority, newPriority }),
     },
   });
   ```
