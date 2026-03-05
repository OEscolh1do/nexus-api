# 🩺 TEMPLATE 03: O CIRURGIÃO (Refatoração - Neonorte | Nexus Monolith)

> **💡 PARA QUE SERVE?**
>
> **O Cenário:** O código funciona, mas está feio, lento ou ilegível. Você quer limpar a casa sem demolir a estrutura.
>
> **A Regra de Ouro:** "Mude a estrutura interna sem alterar o comportamento externo."
>
> **Onde usar:** Limpeza de código legado, otimização de performance, padronização (Linting), extração de lógica para Services.

---

## ✂️ COPIE ISSO AQUI:

````xml
<system_role>
  Atue como Especialista em Clean Code e Performance para Neonorte | Nexus Monolith.

  Stack:
  - Backend: Node.js, Express, Prisma (foco em query optimization)
  - Frontend: React 19, TypeScript, TailwindCSS (foco em re-renders)

  Mantra: "Legibilidade conta. Performance importa. Segurança é inegociável."
</system_role>

<mission>
  Refatorar o arquivo/componente: "{{NOME_DO_ARQUIVO}}".

  Objetivo Principal:
  {{ESCOLHA_UM}}
  - [ ] Melhorar legibilidade (Clean Code)
  - [ ] Remover duplicação (DRY)
  - [ ] Otimizar renderização (React)
  - [ ] Otimizar queries (Prisma)
  - [ ] Extrair lógica para Service Layer
  - [ ] Substituir `any` por tipos adequados
</mission>

<input_context>
  <target_file>
    <file path="{{CAMINHO_ABSOLUTO_DO_ARQUIVO_ALVO}}" />
    <!-- Ex: backend/src/controllers/ProjectController.js -->
    <!-- Ex: frontend/src/modules/tasks/TaskView.tsx -->
  </target_file>

  <dependencies>
    <!-- Arquivos que usam ou são usados pelo alvo (opcional mas bom para evitar quebra) -->
    <file path="{{CAMINHO_DEPENDENCIA_1}}" />
    <file path="{{CAMINHO_DEPENDENCIA_2}}" />
  </dependencies>

  <architecture_context>
    <!-- Para entender padrões do sistema -->
    <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/CONTEXT.md" />
  </architecture_context>
</input_context>

<refactoring_goals>
  <!-- O QUE DEVE MELHORAR (Marque todos que se aplicam) -->

  **Backend:**
  - [ ] Extrair lógica complexa para Services (`src/services/`).
  - [ ] Otimizar queries Prisma (usar `select`, evitar N+1).
  - [ ] Adicionar transações onde há múltiplas operações.
  - [ ] Tipar corretamente parâmetros e retornos (JSDoc ou TypeScript).
  - [ ] Remover código morto (comentado ou não usado).
  - [ ] Padronizar tratamento de erros (try-catch consistente).

  **Frontend:**
  - [ ] Extrair lógica para Custom Hooks.
  - [ ] Memoizar componentes pesados (`React.memo`, `useMemo`).
  - [ ] Substituir `any` por tipos TypeScript adequados.
  - [ ] Melhorar nomes de variáveis (auto-explicativos).
  - [ ] Separar responsabilidades (Container vs Presentational).
  - [ ] Otimizar re-renders (useCallback para funções passadas como props).

  **Geral:**
  - [ ] {{OUTRO_OBJETIVO_CUSTOMIZADO}}
</refactoring_goals>

<safety_protocols>
  <!-- O QUE NÃO PODE MUDAR -->

  🛡️ **REGRAS DE SEGURANÇA:**
  1. NENHUMA funcionalidade existente pode ser perdida.
  2. A assinatura das funções públicas (props/exports) DEVE permanecer a mesma.
  3. Validações Zod existentes NÃO podem ser removidas.
  4. Teste mentalmente: "Se eu rodar isso agora, vai quebrar quem consome esse arquivo?"

  🛡️ **TESTES PÓS-REFACTOR:**
  - Backend: Servidor deve iniciar sem erros (`npm start`)
  - Frontend: Build deve funcionar (`npm run build`)
  - Comportamento: Testar fluxo manualmente ou via testes automatizados
</safety_protocols>

<output_format>
  1. **Análise Inicial:**
     - Liste os "code smells" encontrados (duplicação, nomenclatura ruim, etc).
     - Explique brevemente o plano de refatoração.

  2. **Código Refatorado:**
     - Forneça o código COMPLETO refatorado (não apenas snippets).
     - Destaque mudanças críticas com comentários `// REFACTOR:`.

  3. **Diff Summary:**
     - Liste em bullet points o que mudou:
       ```
       - Extraído lógica X para `useTaskFilters` hook
       - Substituído `any` por `TaskStatus` em 3 locais
       - Otimizado query Prisma: removido include desnecessário
       ```

  4. **Impacto:**
     - Arquivos que precisam ser revisados (dependências).
     - Ganho estimado de performance/legibilidade.
</output_format>
````

---

## 🎯 EXEMPLOS DE REFATORAÇÃO NEXUS

### 1. Backend: Query Optimization (Prisma)

**❌ ANTES (N+1 Problem):**

```javascript
const projects = await prisma.project.findMany();
for (const project of projects) {
  project.tasks = await prisma.operationalTask.findMany({
    where: { projectId: project.id },
  });
}
```

**✅ DEPOIS (Single Query):**

```javascript
const projects = await prisma.project.findMany({
  include: {
    tasks: {
      select: {
        id: true,
        title: true,
        status: true,
        // Selecione apenas os campos necessários
      },
    },
  },
});
```

---

### 2. Backend: Service Layer Extraction

**❌ ANTES (Lógica no Controller):**

```javascript
// ProjectController.js
app.post("/api/projects", async (req, res) => {
  const project = await prisma.project.create({ data: req.body });

  // Lógica de negócio complexa no controller
  if (project.type === "SOLAR") {
    await prisma.solarProposal.create({
      data: { projectId: project.id /* ... */ },
    });
  }

  await prisma.auditLog.create({
    data: { action: "PROJECT_CREATED", resourceId: project.id },
  });

  res.json(project);
});
```

**✅ DEPOIS (Service Layer):**

```javascript
// services/ProjectService.js
class ProjectService {
  async createProject(data, userId) {
    return await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({ data });

      if (project.type === "SOLAR") {
        await tx.solarProposal.create({
          data: { projectId: project.id /* ... */ },
        });
      }

      await tx.auditLog.create({
        data: {
          action: "PROJECT_CREATED",
          resourceId: project.id,
          userId,
        },
      });

      return project;
    });
  }
}

// ProjectController.js
app.post("/api/projects", async (req, res) => {
  const validated = createProjectSchema.parse(req.body);
  const project = await ProjectService.createProject(validated, req.user.id);
  res.json(project);
});
```

---

### 3. Frontend: Custom Hook Extraction

**❌ ANTES (Lógica misturada no componente):**

```tsx
// TaskView.tsx
export function TaskView() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get("/api/tasks")
      .then((res) => setTasks(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filteredTasks = tasks.filter((t) => {
    if (filter === "ALL") return true;
    return t.status === filter;
  });

  return (
    <div>
      <FilterButtons value={filter} onChange={setFilter} />
      {loading ? <Spinner /> : <TaskList tasks={filteredTasks} />}
    </div>
  );
}
```

**✅ DEPOIS (Hook reutilizável):**

```tsx
// hooks/useTasks.ts
export function useTasks(initialFilter = "ALL") {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState(initialFilter);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get("/api/tasks")
      .then((res) => setTasks(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filteredTasks = useMemo(() => {
    if (filter === "ALL") return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  return { tasks: filteredTasks, filter, setFilter, loading };
}

// TaskView.tsx (mais limpo!)
export function TaskView() {
  const { tasks, filter, setFilter, loading } = useTasks();

  return (
    <div>
      <FilterButtons value={filter} onChange={setFilter} />
      {loading ? <Spinner /> : <TaskList tasks={tasks} />}
    </div>
  );
}
```

---

### 4. Frontend: Performance Optimization

**❌ ANTES (Re-render desnecessário):**

```tsx
function ParentComponent() {
  const [count, setCount] = useState(0);

  // Recriada a cada render!
  const handleClick = () => {
    console.log("clicked");
  };

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      <ExpensiveChild onClick={handleClick} />
    </div>
  );
}
```

**✅ DEPOIS (Com memo e callback):**

```tsx
function ParentComponent() {
  const [count, setCount] = useState(0);

  // Mantém a mesma referência
  const handleClick = useCallback(() => {
    console.log("clicked");
  }, []);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      <ExpensiveChildMemo onClick={handleClick} />
    </div>
  );
}

// Só re-renderiza se props mudarem
const ExpensiveChildMemo = React.memo(ExpensiveChild);
```

---

## 📋 CHECKLIST DE REFATORAÇÃO

Antes de submeter o código refatorado, verifique:

**Clean Code:**

- [ ] Nomes de variáveis/funções são auto-explicativos?
- [ ] Funções têm responsabilidade única (SRP)?
- [ ] Código duplicado foi extraído para funções reutilizáveis?
- [ ] Comentários explicam "porquê", não "o quê"?

**Performance:**

- [ ] Queries Prisma usam `select` para campos necessários?
- [ ] Componentes React usam `memo`/`useMemo`/`useCallback` quando adequado?
- [ ] Loops não fazem queries dentro (N+1 problem)?

**Segurança:**

- [ ] Validações Zod foram mantidas?
- [ ] Transações Prisma foram adicionadas onde necessário?
- [ ] Nenhum dado sensível foi exposto em logs?

**Testing:**

- [ ] Testado manualmente o fluxo afetado?
- [ ] Build funciona sem warnings?
- [ ] Dependências foram atualizadas/notificadas?

---

## 🚨 QUANDO NÃO REFATORAR

Evite refatoração se:

1. **Não há teste de regressão:** Sem testes automatizados ou tempo para testar manualmente, é perigoso.
2. **Deadline apertado:** "Não conserte o que não está quebrado" - deixe para sprint de melhorias.
3. **Código legado crítico:** Se ninguém entende bem o código antigo, documente antes de mexer.
4. **Performance já é adequada:** Otimização prematura é raiz de todo mal (Donald Knuth).
