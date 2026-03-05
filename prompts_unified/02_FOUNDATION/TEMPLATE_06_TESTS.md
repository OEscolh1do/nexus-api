# 🧪 TEMPLATE 06: O TESTADOR (Unit Tests - Neonorte | Nexus Monolith)

> **💡 PARA QUE SERVE?**
>
> **O Cenário:** Você escreveu uma lógica complexa (um cálculo solar, um parser, uma regra de negócio) e quer garantir que ela não quebre.
>
> **A Abordagem:** Peça para a IA agir como QA. Ela vai pensar em "Edge Cases" (casos de borda) que você nem imaginou.
>
> **Onde usar:** Funções utilitárias, Regras de Negócio complexas, Components críticos, Services do backend.

---

## ✂️ COPIE ISSO AQUI:

````xml
<system_role>
  Atue como Engenheiro de QA (Quality Assurance) para Neonorte Neonorte | Nexus 2.0.

  Ferramentas de Teste:
  - Backend: Jest (Node.js)
  - Frontend: Vitest + React Testing Library
  - E2E (futuro): Playwright ou Cypress
</system_role>

<mission>
  Criar cobertura de testes para o arquivo: "{{NOME_DO_ARQUIVO}}".

  Tipo de Teste:
  {{ESCOLHA_UM}}
  - [ ] Unit Test (função isolada)
  - [ ] Integration Test (API + Database)
  - [ ] Component Test (React component)
  - [ ] E2E Test (fluxo completo usuário)
</mission>

<source_code>
  <file path="{{CAMINHO_ABSOLUTO_DO_ARQUIVO_PARA_TESTAR}}" />

  <!-- Exemplos: -->
  <!-- Backend Service: backend/src/services/SolarCalculator.js -->
  <!-- Frontend Hook: frontend/src/hooks/useTasks.ts -->
  <!-- Component: frontend/src/components/TaskFormModal.tsx -->
</source_code>

<test_strategy>
  <!-- O QUE TESTAR -->

  1. **Happy Path (Caminho Feliz):**
     - Testar o uso normal/esperado da função.
     - Inputs válidos devem retornar outputs corretos.

  2. **Edge Cases (Casos de Borda):**
     - Inputs nulos ou undefined
     - Arrays vazios
     - Strings muito longas
     - Números negativos ou zero
     - Datas inválidas ou no passado
     - Erros de API/Database

  3. **Error Handling (Tratamento de Erros):**
     - O código lança exceções adequadas?
     - Erros são capturados e tratados?
     - Mensagens de erro são claras?

  4. **Business Rules (Regras de Negócio):**
     - Validações específicas do domínio
     - Cálculos complexos (ex: ROI solar, payback)
     - Dependências entre dados
</test_strategy>

<test_coverage_goals>
  <!-- META DE COBERTURA -->
  - [ ] 80%+ de cobertura de linhas
  - [ ] 100% de cobertura de funções públicas
  - [ ] Todos os branches (if/else/switch) cobertos
  - [ ] Casos de erro testados
</test_coverage_goals>

<output_format>
  Forneça o código COMPLETO do arquivo de teste.

  **Nomenclatura:**
  - Backend: `{{arquivo}}.test.js`
  - Frontend: `{{arquivo}}.test.ts` ou `{{arquivo}}.test.tsx`

  **Localização:**
  - Backend: `backend/src/__tests__/` ou ao lado do arquivo original
  - Frontend: `frontend/src/__tests__/` ou ao lado do arquivo original

  **Estrutura:**
  ```javascript
  describe('NomeDaFuncaoOuComponente', () => {
    describe('Happy Path', () => {
      it('should do X when Y', () => { /* ... */ });
    });

    describe('Edge Cases', () => {
      it('should handle null input', () => { /* ... */ });
    });

    describe('Error Handling', () => {
      it('should throw error when invalid data', () => { /* ... */ });
    });
  });
````

</output_format>

````

---

## 🧪 EXEMPLOS DE TESTES NEXUS

### Exemplo 1: Unit Test (Backend - Função Utilitária)

**Arquivo Original:** `backend/src/utils/dateUtils.js`
```javascript
function isWithinDateRange(date, startDate, endDate) {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);

  return d >= start && d <= end;
}

module.exports = { isWithinDateRange };
````

**Teste:** `backend/src/utils/__tests__/dateUtils.test.js`

```javascript
const { isWithinDateRange } = require("../dateUtils");

describe("isWithinDateRange", () => {
  describe("Happy Path", () => {
    it("should return true when date is within range", () => {
      const result = isWithinDateRange(
        "2026-01-15",
        "2026-01-01",
        "2026-01-31",
      );
      expect(result).toBe(true);
    });

    it("should return true when date equals start date", () => {
      const result = isWithinDateRange(
        "2026-01-01",
        "2026-01-01",
        "2026-01-31",
      );
      expect(result).toBe(true);
    });

    it("should return false when date is before range", () => {
      const result = isWithinDateRange(
        "2025-12-31",
        "2026-01-01",
        "2026-01-31",
      );
      expect(result).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle same day range", () => {
      const result = isWithinDateRange(
        "2026-01-15",
        "2026-01-15",
        "2026-01-15",
      );
      expect(result).toBe(true);
    });

    it("should return NaN for invalid date strings", () => {
      const result = isWithinDateRange(
        "invalid-date",
        "2026-01-01",
        "2026-01-31",
      );
      expect(result).toBe(false); // ou lançar erro?
    });

    it("should handle null inputs gracefully", () => {
      expect(() => {
        isWithinDateRange(null, "2026-01-01", "2026-01-31");
      }).toThrow(); // ou retornar false?
    });
  });
});
```

---

### Exemplo 2: Integration Test (Backend API + Database)

**Arquivo Original:** `backend/src/controllers/ProjectController.js`

**Teste:** `backend/src/__tests__/integration/projects.test.js`

```javascript
const request = require("supertest");
const app = require("../../server"); // Express app
const { prisma } = require("../../lib/prisma");

describe("POST /api/projects", () => {
  // Setup: Criar dados de teste
  beforeAll(async () => {
    await prisma.user.create({
      data: {
        id: "test-user-001",
        username: "testuser",
        password: "hashed",
        fullName: "Test User",
        role: "ADMIN",
      },
    });
  });

  // Teardown: Limpar dados de teste
  afterAll(async () => {
    await prisma.project.deleteMany({ where: { title: { contains: "TEST" } } });
    await prisma.user.delete({ where: { id: "test-user-001" } });
    await prisma.$disconnect();
  });

  describe("Happy Path", () => {
    it("should create a new project with valid data", async () => {
      const response = await request(app)
        .post("/api/projects")
        .send({
          title: "TEST Project Solar",
          description: "Test project",
          managerId: "test-user-001",
          type: "SOLAR",
          status: "PLANEJAMENTO",
        })
        .expect(201);

      expect(response.body).toMatchObject({
        title: "TEST Project Solar",
        type: "SOLAR",
        managerId: "test-user-001",
      });
      expect(response.body.id).toBeDefined();

      // Verificar no banco
      const dbProject = await prisma.project.findUnique({
        where: { id: response.body.id },
      });
      expect(dbProject).toBeTruthy();
    });
  });

  describe("Validation", () => {
    it("should reject project without title", async () => {
      const response = await request(app)
        .post("/api/projects")
        .send({
          description: "Missing title",
          managerId: "test-user-001",
        })
        .expect(400);

      expect(response.body.message).toContain("title");
    });

    it("should reject project with invalid managerId", async () => {
      const response = await request(app)
        .post("/api/projects")
        .send({
          title: "TEST Invalid Manager",
          managerId: "non-existent-user",
        })
        .expect(400);
    });
  });

  describe("Database Constraints", () => {
    it("should handle foreign key violations gracefully", async () => {
      const response = await request(app)
        .post("/api/projects")
        .send({
          title: "TEST Orphan Project",
          strategyId: "non-existent-strategy",
        })
        .expect(400);

      expect(response.body.message).toContain("strategy");
    });
  });
});
```

---

### Exemplo 3: Component Test (Frontend - React)

**Arquivo Original:** `frontend/src/components/TaskCard.tsx`

```tsx
interface TaskCardProps {
  task: {
    id: string;
    title: string;
    status: "BACKLOG" | "IN_PROGRESS" | "COMPLETED";
  };
  onStatusChange: (taskId: string, newStatus: string) => void;
}

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  return (
    <div data-testid={`task-${task.id}`}>
      <h3>{task.title}</h3>
      <select
        value={task.status}
        onChange={(e) => onStatusChange(task.id, e.target.value)}
      >
        <option value="BACKLOG">Backlog</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="COMPLETED">Completed</option>
      </select>
    </div>
  );
}
```

**Teste:** `frontend/src/components/__tests__/TaskCard.test.tsx`

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskCard } from "../TaskCard";

describe("TaskCard", () => {
  const mockTask = {
    id: "task-123",
    title: "Implement feature X",
    status: "BACKLOG" as const,
  };

  describe("Rendering", () => {
    it("should render task title", () => {
      render(<TaskCard task={mockTask} onStatusChange={vi.fn()} />);
      expect(screen.getByText("Implement feature X")).toBeInTheDocument();
    });

    it("should render status select with correct value", () => {
      render(<TaskCard task={mockTask} onStatusChange={vi.fn()} />);
      const select = screen.getByRole("combobox");
      expect(select).toHaveValue("BACKLOG");
    });
  });

  describe("Interactions", () => {
    it("should call onStatusChange when status is changed", () => {
      const handleStatusChange = vi.fn();
      render(<TaskCard task={mockTask} onStatusChange={handleStatusChange} />);

      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "IN_PROGRESS" } });

      expect(handleStatusChange).toHaveBeenCalledWith(
        "task-123",
        "IN_PROGRESS",
      );
      expect(handleStatusChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle task with empty title", () => {
      const taskWithEmptyTitle = { ...mockTask, title: "" };
      render(<TaskCard task={taskWithEmptyTitle} onStatusChange={vi.fn()} />);
      // Component deve renderizar sem travar
      expect(screen.getByTestId("task-task-123")).toBeInTheDocument();
    });
  });
});
```

---

### Exemplo 4: Hook Test (Frontend - Custom Hook)

**Arquivo Original:** `frontend/src/hooks/useTasks.ts`

```typescript
import { useState, useEffect } from "react";
import { api } from "../lib/api";

export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const url = projectId
          ? `/api/tasks?projectId=${projectId}`
          : "/api/tasks";
        const { data } = await api.get(url);
        setTasks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [projectId]);

  return { tasks, loading, error };
}
```

**Teste:** `frontend/src/hooks/__tests__/useTasks.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useTasks } from "../useTasks";
import { api } from "../../lib/api";

vi.mock("../../lib/api");

describe("useTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Happy Path", () => {
    it("should fetch tasks on mount", async () => {
      const mockTasks = [
        { id: "1", title: "Task 1" },
        { id: "2", title: "Task 2" },
      ];

      vi.mocked(api.get).mockResolvedValue({ data: mockTasks });

      const { result } = renderHook(() => useTasks());

      // Estado inicial
      expect(result.current.loading).toBe(true);
      expect(result.current.tasks).toEqual([]);

      // Aguardar fetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tasks).toEqual(mockTasks);
      expect(result.current.error).toBeNull();
      expect(api.get).toHaveBeenCalledWith("/api/tasks");
    });

    it("should fetch tasks filtered by projectId", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [] });

      renderHook(() => useTasks("project-123"));

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          "/api/tasks?projectId=project-123",
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("should set error when API call fails", async () => {
      const mockError = new Error("Network error");
      vi.mocked(api.get).mockRejectedValue(mockError);

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Network error");
      expect(result.current.tasks).toEqual([]);
    });
  });

  describe("Re-fetching", () => {
    it("should re-fetch when projectId changes", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [] });

      const { rerender } = renderHook(({ projectId }) => useTasks(projectId), {
        initialProps: { projectId: "project-1" },
      });

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith("/api/tasks?projectId=project-1");
      });

      // Mudar projectId
      rerender({ projectId: "project-2" });

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith("/api/tasks?projectId=project-2");
      });

      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });
});
```

---

## 🛠️ SETUP DE TESTES NO NEXUS

### Backend (Jest)

**Instalação:**

```bash
cd backend
npm install --save-dev jest @types/jest supertest
```

**Configuração:** `backend/jest.config.js`

```javascript
module.exports = {
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.js", "!src/__tests__/**"],
  testMatch: ["**/__tests__/**/*.test.js"],
};
```

**Scripts:** `backend/package.json`

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

### Frontend (Vitest + React Testing Library)

**Instalação:**

```bash
cd frontend
npm install --save-dev vitest @testing-library/react @testing-library/user-event jsdom
```

**Configuração:** `frontend/vite.config.ts`

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
```

**Setup:** `frontend/src/test/setup.ts`

```typescript
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

**Scripts:** `frontend/package.json`

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## 📋 CHECKLIST DE TESTES

Antes de considerar o código "testado":

- [ ] **Happy Path:** Caso de uso padrão funciona?
- [ ] **Edge Cases:** Valores extremos (null, empty, muito grande)?
- [ ] **Error Handling:** Erros são tratados adequadamente?
- [ ] **Isolamento:** Testes não dependem uns dos outros?
- [ ] **Performance:** Testes rodam em <5s?
- [ ] **Coverage:** Atingiu a meta de cobertura (80%+)?
- [ ] **CI/CD:** Testes passam no pipeline automatizado?

---

## 🎯 BOAS PRÁTICAS

1. **AAA Pattern (Arrange, Act, Assert):**

   ```javascript
   it('should do X', () => {
     // Arrange: Preparar dados
     const input = { ... };

     // Act: Executar função
     const result = myFunction(input);

     // Assert: Verificar resultado
     expect(result).toBe(expectedValue);
   });
   ```

2. **DRY nos Testes:**
   Extraia dados de teste reutilizáveis:

   ```javascript
   const mockTask = { id: "1", title: "Test" };
   const mockUser = { id: "u1", name: "John" };
   ```

3. **Nomes Descritivos:**
   ❌ `it('test 1', ...)`
   ✅ `it('should return 404 when task does not exist', ...)`

4. **Mock Externo, Teste Interno:**
   - Mock APIs externas, banco de dados, timers
   - Não mock lógica da própria aplicação

5. **Test Data Builders:**
   ```javascript
   function buildTask(overrides = {}) {
     return {
       id: "default-id",
       title: "Default Task",
       status: "BACKLOG",
       ...overrides,
     };
   }
   ```
