# 👷 TEMPLATE 02: O ENGENHEIRO (Mão na Massa - Neonorte | Nexus Monolith)

> **💡 PARA O SEU CÉREBRO (ADHD FRIENDLY)**
>
> **O Momento:** Você já rodou o **Template 01**, a IA gerou um plano lindo (`implementation_plan.md`) e você disse "Ok, pode fazer".
>
> **O Perigo:** Se você só disser "Faça", a IA pode esquecer as regras no meio do caminho ou fazer tudo de qualquer jeito. 😵‍💫
>
> **A Solução:** Este template é o "Capataz". Ele pega o plano aprovado e garante que a IA siga cada passo sem desviar, mantendo a qualidade.
>
> **Como Usar:**
>
> 1. Só use DEPOIS de ter um plano aprovado.
> 2. Copie, preencha as `{{CHAVES}}` e mande ver. 🚀

---

## ✂️ COPIE ISSO AQUI:

````xml
<mission>
  <!-- O COMANDO FINAL -->
  Executar o plano de implementação aprovado para "{{NOME_DA_FEATURE}}".
  Contexto: Sistema Neonorte Neonorte | Nexus 2.0 (Backend Express/Prisma + Frontend React 19/Vite).
</mission>

<execution_protocol>
  <!-- A ORDEM DAS COISAS (Não deixe a IA pular etapas) -->

  <step_1_database>
    <!-- PRIORIDADE MÁXIMA: Database primeiro -->
    Se houver migração de banco:

    1. Ajuste `backend/prisma/schema.prisma`.
    2. Documente as mudanças nos comentários do schema.
    3. Rode a migração:
       ```bash
       cd backend
       npx prisma migrate dev --name {{nome_descritivo_da_migration}}
       ```
    4. Atualize `prisma/seed.js` se necessário (para popular dados de teste).
    5. Regenere o Prisma Client:
       ```bash
       npx prisma generate
       ```
  </step_1_database>

  <step_2_backend>
    <!-- LÓGICA DE NEGÓCIO -->
    1. **Services** (`backend/src/services/`):
       - Crie/atualize camadas de serviço para lógica complexa.
       - Use transações Prisma para operações multi-tabela:
         ```javascript
         await prisma.$transaction([
           prisma.model1.create({ data }),
           prisma.model2.update({ where, data })
         ]);
         ```

    2. **Controllers** (`backend/src/controllers/`):
       - Se precisar lógica customizada além do Universal CRUD.
       - Sempre valide com Zod ANTES de tocar no banco.

    3. **Validação Zod** (OBRIGATÓRIO):
       - Crie schemas em `backend/src/validators/{{recurso}}.js`.
       - Exemplo:
         ```javascript
         const { z } = require('zod');
         const createTaskSchema = z.object({
           title: z.string().min(3),
           projectId: z.string().cuid()
         });
         ```

    4. **Rotas** (`backend/src/server.js`):
       - Se o Universal Controller não for suficiente, adicione rotas customizadas.
       - Sempre use middleware de validação Zod.
  </step_2_backend>

  <step_3_frontend>
    <!-- UI E EXPERIÊNCIA DO USUÁRIO -->
    1. **Tipos TypeScript** (frontend/src/types/):
       - Atualize interfaces ANTES de criar componentes.
       - Sincronize com os modelos Prisma do backend.

    2. **Componentes UI**:
       - Use Shadcn/UI components da `frontend/src/components/ui/`.
       - Siga o padrão existente (ex: `TaskFormModal.tsx`).
       - Sempre implemente estados:
         - `isLoading` (skeleton ou spinner)
         - `error` (toast de erro ou mensagem inline)
         - `success` (feedback visual)

    3. **Validação Frontend** (React Hook Form + Zod):
       ```typescript
       import { useForm } from 'react-hook-form';
       import { zodResolver } from '@hookform/resolvers/zod';

       const schema = z.object({ /* ... */ });
       const { register, handleSubmit, formState: { errors } } = useForm({
         resolver: zodResolver(schema)
       });
       ```

    4. **API Integration** (`frontend/src/lib/api.ts`):
       - Use o cliente Axios configurado.
       - Trate erros de rede e 4xx/5xx adequadamente.
       - Exemplo:
         ```typescript
         try {
           const { data } = await api.post('/api/tasks', payload);
           toast.success('Tarefa criada!');
         } catch (err) {
           toast.error(err.response?.data?.message || 'Erro desconhecido');
         }
         ```
  </step_3_frontend>

  <step_4_integration>
    <!-- TESTE O FLUXO COMPLETO -->
    Garanta que a comunicação Client <-> Server está fluida.

    Verifique:
    1. Frontend envia dados no formato correto (Zod valida).
    2. Backend processa e responde com status HTTP adequado.
    3. Dados persistem corretamente no MySQL.
    4. UI atualiza adequadamente após sucesso/erro.

    Ponto Crítico de Integração: {{PONTO_CRITICO_INTEGRACAO}}
  </step_4_integration>

  <step_5_documentation>
    <!-- DEIXE RASTROS PARA O FUTURO -->
    1. Atualize `INTERFACE_MAP.md` se houver nova rota/view.
    2. Adicione comentários JSDoc em funções complexas.
    3. Gere um `walkthrough.md` com:
       - Resumo das mudanças feitas
       - Screenshots/GIFs (se UI)
       - Comandos para testar localmente
       - Diagrama Mermaid do fluxo (se aplicável)
  </step_5_documentation>

</execution_protocol>

<red_lines>
  <!-- AS REGRAS DE OURO (Para a IA não esquecer) -->

  🔴 **SEGURANÇA:**
  - NÃO remova validações Zod existentes.
  - NÃO exponha senhas/tokens em logs ou código.
  - NÃO permita SQL Injection (sempre use Prisma ORM).

  🔴 **QUALIDADE:**
  - NÃO deixe `console.log` perdidos no código.
  - NÃO use `any` em TypeScript sem justificativa.
  - NÃO quebre a build (`npm run build` deve funcionar).

  🔴 **ARQUITETURA:**
  - NÃO misture lógica de negócio no componente React.
  - NÃO faça queries diretas ao BD no Controller (use Services).
  - NÃO crie endpoints REST fora do padrão sem documentar.

  🔴 **ESPECÍFICO DO NEXUS:**
  - {{OUTRA_RESTRICAO_ESPECIFICA}}
</red_lines>

<final_checklist>
  <!-- ANTES DE DAR POR CONCLUÍDO -->
  Antes de marcar como "feito", confirme:

  - [ ] Backend compila sem erros (`cd backend && npm start`)
  - [ ] Frontend compila sem erros (`cd frontend && npm run build`)
  - [ ] Migrações aplicadas (`npx prisma migrate status`)
  - [ ] Zod valida corretamente (teste com dados inválidos)
  - [ ] UI renderiza em diferentes estados (loading, error, success)
  - [ ] Documentação atualizada (INTERFACE_MAP.md + walkthrough.md)
  - [ ] Testado manualmente o fluxo completo
</final_checklist>
````

---

## 🛠️ COMANDOS ÚTEIS PARA DESENVOLVIMENTO

### Backend

```bash
# Iniciar servidor de desenvolvimento
cd backend
npm run dev

# Aplicar pending migrations
npx prisma migrate dev

# Resetar banco (CUIDADO: apaga dados!)
npx prisma migrate reset

# Abrir Prisma Studio (GUI do banco)
npx prisma studio

# Popular banco com dados de teste
node prisma/seed.js
```

### Frontend

```bash
# Iniciar dev server
cd frontend
npm run dev

# Build de produção
npm run build

# Preview da build
npm run preview

# Lint
npm run lint
```

### Full Stack

```bash
# Iniciar tudo via Docker Compose
docker-compose up -d

# Ver logs do backend
docker logs nexus_backend -f

# Ver logs do frontend
docker logs nexus_frontend -f
```

---

## 📂 ESTRUTURA DE ARQUIVOS PADRÃO

### Novo Módulo (ex: Inventário)

```
backend/
└── src/
    ├── controllers/
    │   └── InventoryController.js   # Lógica customizada
    ├── services/
    │   └── InventoryService.js      # Camada de dados
    └── validators/
        └── inventory.js              # Schemas Zod

frontend/
└── src/
    ├── modules/
    │   └── inventory/
    │       ├── InventoryView.tsx    # View principal
    │       ├── InventoryTable.tsx   # Listagem
    │       └── InventoryModal.tsx   # Form de criação/edição
    ├── types/
    │   └── inventory.ts             # Interfaces TypeScript
    └── lib/
        └── api/
            └── inventory.ts          # Cliente API
```

---

## ⚡ PADRÕES DE CÓDIGO NEXUS

### Backend: Transaction Pattern

```javascript
// ❌ ERRADO: Sem transação (pode ficar inconsistente)
await prisma.project.create({ data: projectData });
await prisma.operationalTask.create({ data: taskData });

// ✅ CORRETO: Tudo-ou-nada
await prisma.$transaction([
  prisma.project.create({ data: projectData }),
  prisma.operationalTask.create({ data: taskData }),
]);
```

### Frontend: Error Handling

```typescript
// ❌ ERRADO: Erro silencioso
const data = await api.post("/api/tasks", payload);

// ✅ CORRETO: Try-catch com feedback
try {
  const { data } = await api.post("/api/tasks", payload);
  toast.success("Tarefa criada com sucesso!");
  onSuccess(data);
} catch (error) {
  const message = error.response?.data?.message || "Erro ao criar tarefa";
  toast.error(message);
  console.error("Task creation failed:", error);
}
```

### Validação Zod (Backend)

```javascript
// validators/task.js
const createTaskSchema = z.object({
  title: z.string().min(3).max(200),
  projectId: z.string().cuid().optional(),
  assignedTo: z.string().cuid().optional(),
  startDate: z.string().datetime().optional(),
  priority: z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]).default("MEDIA"),
});

// controller
app.post("/api/tasks", async (req, res) => {
  try {
    const validated = createTaskSchema.parse(req.body);
    const task = await prisma.operationalTask.create({ data: validated });
    res.json(task);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Validação falhou", errors: err.errors });
    }
    res.status(500).json({ message: "Erro interno" });
  }
});
```

---

## 🎯 EXEMPLO COMPLETO

**Cenário:** Implementar sistema de comentários em tarefas.

````xml
<mission>
  Executar plano para "Sistema de Comentários em Tarefas Operacionais".
</mission>

<step_1_database>
  Modelo criado no schema.prisma:
  ```prisma
  model TaskComment {
    id        String   @id @default(cuid())
    taskId    String
    authorId  String
    content   String   @db.Text
    createdAt DateTime @default(now())

    task   OperationalTask @relation(fields: [taskId], references: [id], onDelete: Cascade)
    author User            @relation(fields: [authorId], references: [id])

    @@index([taskId])
    @@index([authorId])
  }
````

Migração: `npx prisma migrate dev --name add_task_comments`
</step_1_database>

<step_2_backend>
Validação Zod criada em `validators/taskComment.js`:

```javascript
const createCommentSchema = z.object({
  taskId: z.string().cuid(),
  content: z.string().min(1).max(2000),
});
```

Rota customizada em `server.js`:

```javascript
app.post("/api/tasks/:taskId/comments", authenticate, async (req, res) => {
  const validated = createCommentSchema.parse({
    ...req.body,
    taskId: req.params.taskId,
  });

  const comment = await prisma.taskComment.create({
    data: { ...validated, authorId: req.user.id },
    include: { author: { select: { fullName: true } } },
  });

  res.json(comment);
});
```

</step_2_backend>

<!-- Continua com step_3_frontend, step_4_integration, step_5_documentation -->

```

```
