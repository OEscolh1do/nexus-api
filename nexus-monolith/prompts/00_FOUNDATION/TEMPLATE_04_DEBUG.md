# 🕵️ TEMPLATE 04: O DETETIVE (Debugging - Neonorte | Nexus Monolith)

> **💡 PARA QUE SERVE?**
>
> **O Cenário:** Algo quebrou. Você tem um erro 500, uma tela branca ou um comportamento bizarro.
>
> **A Abordagem:** Em vez de pedir "arruma isso", você dá as pistas (logs, contexto) e pede para a IA investigar a cena do crime.
>
> **Onde usar:** Erros de console, falhas de API, comportamentos inesperados de UI, problemas de migração Prisma.

---

## ✂️ COPIE ISSO AQUI:

````xml
<system_role>
  Atue como Engenheiro de Confiabilidade de Site (SRE) e Especialista em Debugging.

  Sistema: Neonorte Neonorte | Nexus 2.0
  - Backend: Express + Prisma + MySQL
  - Frontend: React 19 + Vite

  Método: Análise de Causa Raiz (RCA - Root Cause Analysis).
</system_role>

<incident_report>
  <symptoms>
    <!-- DESCREVA O ERRO -->
    **O que está acontecendo:**
    {{EX: "Ao clicar em 'Salvar Tarefa', a tela congela e aparece erro 500"}}

    **Mensagem de Erro (Cole aqui):**
    ```
    {{COLE_O_ERRO_DO_CONSOLE_NAVEGADOR_OU_TERMINAL_BACKEND}}

    Exemplo:
    Error: Prisma Error P2002: Unique constraint failed on the fields: (`code`)
    ```

    **Quando começou:**
    {{EX: "Depois de adicionar validação Zod no campo 'code'"}}

    **Frequência:**
    {{EX: "Sempre / Intermitente / Só em produção"}}
  </symptoms>

  <environment>
    <!-- CONTEXTO TÉCNICO -->
    **Onde está rodando:**
    - [ ] Ambiente local (Docker)
    - [ ] Servidor de produção (Hostinger)
    - [ ] Ambos

    **Versões relevantes:**
    - Node.js: {{VERSAO}}
    - Prisma: {{VERSAO}}
    - MySQL: {{VERSAO}}
  </environment>

  <suspected_files>
    <!-- ONDE VOCÊ ACHA QUE ESTÁ O ERRO -->
    <file path="{{CAMINHO_ABSOLUTO_ARQUIVO_1}}" />
    <file path="{{CAMINHO_ABSOLUTO_ARQUIVO_2}}" />

    <!-- Exemplos comuns de lugares para investigar: -->
    <!-- Backend: backend/src/server.js, backend/src/controllers/ -->
    <!-- Frontend: frontend/src/modules/{{modulo}}/{{componente}}.tsx -->
    <!-- Database: backend/prisma/schema.prisma -->
  </suspected_files>

  <recent_changes>
    <!-- O QUE MUDOU RECENTEMENTE? (Bugs geralmente nascem aqui) -->
    - {{EX: "Implementamos a feature de prioridades nas tarefas"}}
    - {{EX: "Atualizamos a lib axios de 1.12 para 1.13"}}
    - {{EX: "Adicionamos validação Zod no endpoint /api/projects"}}

    <!-- Se não mudou nada, especifique: -->
    - [ ] Nenhuma mudança recente (bug espontâneo)
  </recent_changes>

  <reproduction_steps>
    <!-- COMO REPRODUZIR O ERRO (Passo a passo) -->
    1. {{EX: "Login no sistema com usuário admin"}}
    2. {{EX: "Navegar para Gestão de Tarefas"}}
    3. {{EX: "Clicar em 'Nova Tarefa'"}}
    4. {{EX: "Preencher formulário e clicar em 'Salvar'"}}
    5. **ERRO:** {{EX: "500 Internal Server Error"}}
  </reproduction_steps>
</incident_report>

<investigation_protocol>
  <!-- O QUE A IA DEVE FAZER -->

  1. **ANÁLISE (Deep Think):**
     - Leia os arquivos suspeitos.
     - Analise o stack trace do erro.
     - Identifique o ponto de falha exato.
     - Explique por que o erro está acontecendo (raciocínio lógico detalhado).

  2. **HIPÓTESE (Causa Raiz):**
     - Qual a provável causa raiz?
       * Erro de validação Zod?
       * Constraint de banco violada?
       * Referência nula/undefined?
       * Race condition?
       * Query Prisma malformada?

  3. **CORREÇÃO (Fix):**
     - Forneça o código corrigido COMPLETO.
     - Explique a mudança linha por linha.
     - Se houver múltiplas soluções, liste pros e contras.

  4. **PREVENÇÃO (Safeguards):**
     - Como evitar que isso aconteça de novo?
       * Adicionar validação Zod extra?
       * Melhorar tratamento de erros (try-catch)?
       * Adicionar índice único no banco?
       * Criar teste automatizado?

  5. **VERIFICAÇÃO (Como testar o fix):**
     - Comandos para rodar localmente.
     - Checklist de testes manuais.
</investigation_protocol>

<debugging_tools>
  <!-- FERRAMENTAS DISPONÍVEIS NO NEXUS -->

  **Backend (Node.js/Express):**
  - Console logs: `console.error('DEBUG:', variavel);`
  - Prisma Studio: `npx prisma studio` (visualizar dados)
  - Prisma logs: Adicionar `log: ['query', 'error']` no PrismaClient

  **Frontend (React):**
  - React DevTools (Browser Extension)
  - Console logs: `console.log('STATE:', state);`
  - Network tab (verificar request/response)

  **Database (MySQL):**
  - Logs de erro: `docker logs nexus_db`
  - Query direta: Conectar via MySQL Workbench ou Prisma Studio

  **Docker:**
  - Ver logs: `docker logs nexus_backend -f`
  - Acessar container: `docker exec -it nexus_backend bash`
</debugging_tools>
````

---

## 🔍 EXEMPLOS DE DEBUGGING NEXUS

### Exemplo 1: Erro 500 - Unique Constraint Failed

**❌ ERRO:**

```
PrismaClientKnownRequestError:
Unique constraint failed on the constraint: `Strategy_code_key`
```

**🔬 INVESTIGAÇÃO:**

```javascript
// backend/src/controllers/StrategyController.js
app.post("/api/strategies", async (req, res) => {
  const strategy = await prisma.strategy.create({
    data: req.body, // ⚠️ PROBLEMA: não valida se 'code' já existe
  });
});
```

**✅ CORREÇÃO:**

```javascript
app.post("/api/strategies", async (req, res) => {
  try {
    // Validação Zod primeiro
    const validated = createStrategySchema.parse(req.body);

    // Verificar se code já existe
    const existing = await prisma.strategy.findUnique({
      where: { code: validated.code },
    });

    if (existing) {
      return res.status(400).json({
        message: "Código já existe. Escolha outro.",
      });
    }

    const strategy = await prisma.strategy.create({ data: validated });
    res.json(strategy);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return res.status(400).json({ message: "Código duplicado" });
      }
    }
    res.status(500).json({ message: "Erro interno", error: err.message });
  }
});
```

**🛡️ PREVENÇÃO:**

- Sempre valide unicidade ANTES de tentar criar.
- Use try-catch para capturar erros Prisma específicos.
- Adicione feedback claro ao usuário.

---

### Exemplo 2: Tela Branca no Frontend

**❌ SINTOMAS:**

- Tela fica completamente branca
- Console mostra: `TypeError: Cannot read property 'map' of undefined`

**🔬 INVESTIGAÇÃO:**

```tsx
// frontend/src/modules/tasks/TaskView.tsx
export function TaskView() {
  const [tasks, setTasks] = useState();

  useEffect(() => {
    api.get("/api/tasks").then((res) => setTasks(res.data));
  }, []);

  return (
    <div>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
      {/* ⚠️ PROBLEMA: tasks é undefined no primeiro render */}
    </div>
  );
}
```

**✅ CORREÇÃO:**

```tsx
export function TaskView() {
  const [tasks, setTasks] = useState<Task[]>([]); // Estado inicial vazio
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get("/api/tasks")
      .then((res) => setTasks(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (tasks.length === 0) return <EmptyState />;

  return (
    <div>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
```

**🛡️ PREVENÇÃO:**

- Sempre inicialize estados de array com `[]`, não `undefined`.
- Implemente estados de loading, error e empty.
- Use TypeScript para evitar erros de tipo.

---

### Exemplo 3: Query Prisma Lenta

**❌ SINTOMAS:**

- Dashboard demora 10+ segundos para carregar
- Backend logs mostram queries múltiplas

**🔬 INVESTIGAÇÃO:**

```javascript
// backend/src/services/DashboardService.js
async getDashboardData() {
  const strategies = await prisma.strategy.findMany();

  // ⚠️ N+1 PROBLEM: Query para cada estratégia
  for (const strategy of strategies) {
    strategy.projects = await prisma.project.findMany({
      where: { strategyId: strategy.id }
    });

    for (const project of strategy.projects) {
      project.tasks = await prisma.operationalTask.findMany({
        where: { projectId: project.id }
      });
    }
  }

  return strategies;
}
```

**✅ CORREÇÃO:**

```javascript
async getDashboardData() {
  // Single query com nested includes
  const strategies = await prisma.strategy.findMany({
    include: {
      projects: {
        include: {
          tasks: {
            select: {
              id: true,
              title: true,
              status: true
              // Selecione apenas campos necessários
            }
          }
        }
      },
      keyResults: true
    }
  });

  return strategies;
}
```

**🛡️ PREVENÇÃO:**

- Use `include` e `select` para evitar N+1.
- Ative Prisma query logs para detectar queries duplicadas:
  ```javascript
  const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });
  ```
- Monitore tempo de resposta das APIs.

---

## 🚨 ERROS COMUNS NEXUS

### Backend

| Erro                               | Causa Provável                                    | Solução                                |
| ---------------------------------- | ------------------------------------------------- | -------------------------------------- |
| `P2002: Unique constraint failed`  | Tentando criar registro com campo único duplicado | Validar unicidade antes de criar       |
| `P2025: Record not found`          | Tentando atualizar/deletar registro inexistente   | Verificar existência antes da operação |
| `Cannot reach database server`     | MySQL não está rodando ou URL inválida            | `docker-compose up -d mysql`           |
| `Module not found: @prisma/client` | Prisma Client não foi gerado                      | `npx prisma generate`                  |
| `Zod validation failed`            | Input não passou na validação                     | Revisar schema Zod                     |

### Frontend

| Erro                                  | Causa Provável             | Solução                                       |
| ------------------------------------- | -------------------------- | --------------------------------------------- |
| `Cannot read property X of undefined` | Estado não inicializado    | Usar optional chaining `?.` ou estado inicial |
| `Too many re-renders`                 | setState dentro do render  | Mover para useEffect ou useCallback           |
| `Network Error`                       | Backend não está rodando   | Verificar `http://localhost:3000`             |
| `CORS error`                          | Backend não permite origem | Configurar CORS em `server.js`                |

---

## 📋 CHECKLIST DE DEBUGGING

Antes de pedir ajuda à IA, tente:

- [ ] Reproduzir o erro de forma consistente?
- [ ] Ler a mensagem de erro completa (stack trace)?
- [ ] Verificar logs do backend (`docker logs nexus_backend`)?
- [ ] Inspecionar Network tab no navegador (request/response)?
- [ ] Verificar se banco de dados está rodando (`docker ps`)?
- [ ] Testar em modo incógnito (cache/cookies)?
- [ ] Reverter última mudança (git) e testar?

Se tentou tudo acima e não resolveu, use este template! 🔧
